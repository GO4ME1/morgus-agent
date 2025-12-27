/**
 * YouTube Data API v3 Client
 * Free: 10,000 quota units/day (~100 searches)
 */

import { google } from 'googleapis';

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: Date;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  duration: string;
  tags: string[];
  url: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  thumbnailUrl: string;
  url: string;
}

export interface YouTubeComment {
  id: string;
  authorDisplayName: string;
  authorChannelId: string;
  textDisplay: string;
  likeCount: number;
  publishedAt: Date;
}

export class YouTubeClient {
  private youtube: any;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY!;
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.apiKey,
    });
  }

  /**
   * Search for videos
   */
  async searchVideos(
    query: string,
    maxResults: number = 10,
    options?: {
      order?: 'relevance' | 'date' | 'viewCount' | 'rating';
      publishedAfter?: Date;
      publishedBefore?: Date;
      videoDuration?: 'short' | 'medium' | 'long';
    }
  ): Promise<YouTubeVideo[]> {
    try {
      const searchParams: any = {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults,
        order: options?.order || 'relevance',
      };

      if (options?.publishedAfter) {
        searchParams.publishedAfter = options.publishedAfter.toISOString();
      }
      if (options?.publishedBefore) {
        searchParams.publishedBefore = options.publishedBefore.toISOString();
      }
      if (options?.videoDuration) {
        searchParams.videoDuration = options.videoDuration;
      }

      const response = await this.youtube.search.list(searchParams);

      const videoIds = response.data.items.map((item: any) => item.id.videoId);
      
      // Get full video details
      return this.getVideosByIds(videoIds);
    } catch (error: any) {
      throw new Error(`Failed to search videos: ${error.message}`);
    }
  }

  /**
   * Get video details by IDs
   */
  async getVideosByIds(videoIds: string[]): Promise<YouTubeVideo[]> {
    try {
      const response = await this.youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        id: videoIds.join(','),
      });

      return response.data.items.map((item: any) => this.formatVideo(item));
    } catch (error: any) {
      throw new Error(`Failed to get videos: ${error.message}`);
    }
  }

  /**
   * Get video by ID
   */
  async getVideo(videoId: string): Promise<YouTubeVideo> {
    const videos = await this.getVideosByIds([videoId]);
    if (videos.length === 0) {
      throw new Error('Video not found');
    }
    return videos[0];
  }

  /**
   * Get trending videos
   */
  async getTrendingVideos(
    maxResults: number = 10,
    regionCode: string = 'US'
  ): Promise<YouTubeVideo[]> {
    try {
      const response = await this.youtube.videos.list({
        part: 'snippet,statistics,contentDetails',
        chart: 'mostPopular',
        regionCode,
        maxResults,
      });

      return response.data.items.map((item: any) => this.formatVideo(item));
    } catch (error: any) {
      throw new Error(`Failed to get trending videos: ${error.message}`);
    }
  }

  /**
   * Get channel details
   */
  async getChannel(channelId: string): Promise<YouTubeChannel> {
    try {
      const response = await this.youtube.channels.list({
        part: 'snippet,statistics',
        id: channelId,
      });

      if (response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      return this.formatChannel(response.data.items[0]);
    } catch (error: any) {
      throw new Error(`Failed to get channel: ${error.message}`);
    }
  }

  /**
   * Search for channels
   */
  async searchChannels(query: string, maxResults: number = 10): Promise<YouTubeChannel[]> {
    try {
      const response = await this.youtube.search.list({
        part: 'snippet',
        q: query,
        type: 'channel',
        maxResults,
      });

      const channelIds = response.data.items.map((item: any) => item.id.channelId);
      
      // Get full channel details
      const channelsResponse = await this.youtube.channels.list({
        part: 'snippet,statistics',
        id: channelIds.join(','),
      });

      return channelsResponse.data.items.map((item: any) => this.formatChannel(item));
    } catch (error: any) {
      throw new Error(`Failed to search channels: ${error.message}`);
    }
  }

  /**
   * Get channel videos
   */
  async getChannelVideos(
    channelId: string,
    maxResults: number = 10
  ): Promise<YouTubeVideo[]> {
    try {
      // First, get the channel's uploads playlist ID
      const channelResponse = await this.youtube.channels.list({
        part: 'contentDetails',
        id: channelId,
      });

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

      // Get videos from the uploads playlist
      const playlistResponse = await this.youtube.playlistItems.list({
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults,
      });

      const videoIds = playlistResponse.data.items.map((item: any) => item.snippet.resourceId.videoId);
      
      return this.getVideosByIds(videoIds);
    } catch (error: any) {
      throw new Error(`Failed to get channel videos: ${error.message}`);
    }
  }

  /**
   * Get video comments
   */
  async getVideoComments(
    videoId: string,
    maxResults: number = 20
  ): Promise<YouTubeComment[]> {
    try {
      const response = await this.youtube.commentThreads.list({
        part: 'snippet',
        videoId,
        maxResults,
        order: 'relevance',
      });

      return response.data.items.map((item: any) => {
        const comment = item.snippet.topLevelComment.snippet;
        return {
          id: item.id,
          authorDisplayName: comment.authorDisplayName,
          authorChannelId: comment.authorChannelId.value,
          textDisplay: comment.textDisplay,
          likeCount: comment.likeCount,
          publishedAt: new Date(comment.publishedAt),
        };
      });
    } catch (error: any) {
      throw new Error(`Failed to get comments: ${error.message}`);
    }
  }

  /**
   * Get related videos
   */
  async getRelatedVideos(videoId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
    try {
      const response = await this.youtube.search.list({
        part: 'snippet',
        relatedToVideoId: videoId,
        type: 'video',
        maxResults,
      });

      const videoIds = response.data.items.map((item: any) => item.id.videoId);
      
      return this.getVideosByIds(videoIds);
    } catch (error: any) {
      throw new Error(`Failed to get related videos: ${error.message}`);
    }
  }

  /**
   * Get video statistics
   */
  async getVideoStats(videoId: string): Promise<{
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }> {
    try {
      const response = await this.youtube.videos.list({
        part: 'statistics',
        id: videoId,
      });

      const stats = response.data.items[0].statistics;
      return {
        viewCount: parseInt(stats.viewCount || '0'),
        likeCount: parseInt(stats.likeCount || '0'),
        commentCount: parseInt(stats.commentCount || '0'),
      };
    } catch (error: any) {
      throw new Error(`Failed to get video stats: ${error.message}`);
    }
  }

  /**
   * Format video data
   */
  private formatVideo(item: any): YouTubeVideo {
    const snippet = item.snippet;
    const statistics = item.statistics || {};
    const contentDetails = item.contentDetails || {};

    return {
      id: item.id,
      title: snippet.title,
      description: snippet.description,
      channelId: snippet.channelId,
      channelTitle: snippet.channelTitle,
      publishedAt: new Date(snippet.publishedAt),
      thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
      viewCount: parseInt(statistics.viewCount || '0'),
      likeCount: parseInt(statistics.likeCount || '0'),
      commentCount: parseInt(statistics.commentCount || '0'),
      duration: contentDetails.duration || '',
      tags: snippet.tags || [],
      url: `https://www.youtube.com/watch?v=${item.id}`,
    };
  }

  /**
   * Format channel data
   */
  private formatChannel(item: any): YouTubeChannel {
    const snippet = item.snippet;
    const statistics = item.statistics;

    return {
      id: item.id,
      title: snippet.title,
      description: snippet.description,
      subscriberCount: parseInt(statistics.subscriberCount || '0'),
      videoCount: parseInt(statistics.videoCount || '0'),
      viewCount: parseInt(statistics.viewCount || '0'),
      thumbnailUrl: snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
      url: `https://www.youtube.com/channel/${item.id}`,
    };
  }
}

/**
 * Parse ISO 8601 duration to seconds
 */
export function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(duration: string): string {
  const seconds = parseDuration(duration);
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
