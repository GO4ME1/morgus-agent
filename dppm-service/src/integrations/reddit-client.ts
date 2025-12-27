/**
 * Reddit API Client
 * Free forever, 60 requests/minute
 */

import axios from 'axios';

export interface RedditPost {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  score: number;
  num_comments: number;
  url: string;
  selftext: string;
  created_utc: number;
  permalink: string;
}

export interface RedditComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  permalink: string;
}

export class RedditClient {
  private accessToken: string;
  private refreshToken: string;
  private clientId: string;
  private clientSecret: string;
  private userAgent: string = 'Morgus/1.0';

  constructor(config: {
    accessToken: string;
    refreshToken: string;
    clientId?: string;
    clientSecret?: string;
  }) {
    this.accessToken = config.accessToken;
    this.refreshToken = config.refreshToken;
    this.clientId = config.clientId || process.env.REDDIT_CLIENT_ID!;
    this.clientSecret = config.clientSecret || process.env.REDDIT_CLIENT_SECRET!;
  }

  /**
   * Get hot posts from a subreddit
   */
  async getHotPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
    try {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/hot`,
        {
          params: { limit },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': this.userAgent,
          },
        }
      );

      return response.data.data.children.map((child: any) => this.formatPost(child.data));
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, refresh and retry
        await this.refreshAccessToken();
        return this.getHotPosts(subreddit, limit);
      }
      throw new Error(`Failed to get hot posts: ${error.message}`);
    }
  }

  /**
   * Get new posts from a subreddit
   */
  async getNewPosts(subreddit: string, limit: number = 25): Promise<RedditPost[]> {
    try {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/new`,
        {
          params: { limit },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': this.userAgent,
          },
        }
      );

      return response.data.data.children.map((child: any) => this.formatPost(child.data));
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.getNewPosts(subreddit, limit);
      }
      throw new Error(`Failed to get new posts: ${error.message}`);
    }
  }

  /**
   * Search posts in a subreddit
   */
  async searchPosts(
    subreddit: string,
    query: string,
    limit: number = 25
  ): Promise<RedditPost[]> {
    try {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/search`,
        {
          params: {
            q: query,
            restrict_sr: true,
            limit,
          },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': this.userAgent,
          },
        }
      );

      return response.data.data.children.map((child: any) => this.formatPost(child.data));
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.searchPosts(subreddit, query, limit);
      }
      throw new Error(`Failed to search posts: ${error.message}`);
    }
  }

  /**
   * Get comments from a post
   */
  async getComments(subreddit: string, postId: string): Promise<RedditComment[]> {
    try {
      const response = await axios.get(
        `https://oauth.reddit.com/r/${subreddit}/comments/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': this.userAgent,
          },
        }
      );

      // Reddit returns [post, comments] array
      const commentsListing = response.data[1];
      return this.flattenComments(commentsListing.data.children);
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.getComments(subreddit, postId);
      }
      throw new Error(`Failed to get comments: ${error.message}`);
    }
  }

  /**
   * Submit a text post to a subreddit
   */
  async submitPost(
    subreddit: string,
    title: string,
    text: string
  ): Promise<{ id: string; url: string }> {
    try {
      const response = await axios.post(
        'https://oauth.reddit.com/api/submit',
        {
          sr: subreddit,
          kind: 'self',
          title,
          text,
          api_type: 'json',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': this.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data.json.data;
      return {
        id: data.id,
        url: data.url,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.submitPost(subreddit, title, text);
      }
      throw new Error(`Failed to submit post: ${error.message}`);
    }
  }

  /**
   * Comment on a post
   */
  async commentOnPost(
    postFullname: string,
    text: string
  ): Promise<{ id: string; permalink: string }> {
    try {
      const response = await axios.post(
        'https://oauth.reddit.com/api/comment',
        {
          thing_id: postFullname,
          text,
          api_type: 'json',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': this.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const data = response.data.json.data.things[0].data;
      return {
        id: data.id,
        permalink: data.permalink,
      };
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.commentOnPost(postFullname, text);
      }
      throw new Error(`Failed to comment: ${error.message}`);
    }
  }

  /**
   * Upvote a post or comment
   */
  async upvote(fullname: string): Promise<void> {
    try {
      await axios.post(
        'https://oauth.reddit.com/api/vote',
        {
          id: fullname,
          dir: 1, // 1 = upvote, 0 = unvote, -1 = downvote
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': this.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.upvote(fullname);
      }
      throw new Error(`Failed to upvote: ${error.message}`);
    }
  }

  /**
   * Get user's profile
   */
  async getUserProfile(username: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://oauth.reddit.com/user/${username}/about`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'User-Agent': this.userAgent,
          },
        }
      );

      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.getUserProfile(username);
      }
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post(
        'https://www.reddit.com/api/v1/access_token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
        }),
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
          headers: {
            'User-Agent': this.userAgent,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      
      // TODO: Store new access token in database
      console.log('[Reddit] Access token refreshed');
    } catch (error: any) {
      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Format post data
   */
  private formatPost(data: any): RedditPost {
    return {
      id: data.id,
      title: data.title,
      author: data.author,
      subreddit: data.subreddit,
      score: data.score,
      num_comments: data.num_comments,
      url: data.url,
      selftext: data.selftext,
      created_utc: data.created_utc,
      permalink: `https://reddit.com${data.permalink}`,
    };
  }

  /**
   * Flatten nested comments
   */
  private flattenComments(children: any[]): RedditComment[] {
    const comments: RedditComment[] = [];

    for (const child of children) {
      if (child.kind === 't1') {
        // This is a comment
        const data = child.data;
        comments.push({
          id: data.id,
          author: data.author,
          body: data.body,
          score: data.score,
          created_utc: data.created_utc,
          permalink: `https://reddit.com${data.permalink}`,
        });

        // Recursively get replies
        if (data.replies && data.replies.data) {
          comments.push(...this.flattenComments(data.replies.data.children));
        }
      }
    }

    return comments;
  }
}

/**
 * Helper function to get Reddit OAuth URL
 */
export function getRedditAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const scopes = [
    'identity',
    'read',
    'submit',
    'vote',
    'mysubreddits',
    'privatemessages',
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    state,
    redirect_uri: redirectUri,
    duration: 'permanent',
    scope: scopes.join(' '),
  });

  return `https://www.reddit.com/api/v1/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeRedditCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const response = await axios.post(
      'https://www.reddit.com/api/v1/access_token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          'User-Agent': 'Morgus/1.0',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  } catch (error: any) {
    throw new Error(`Failed to exchange code: ${error.message}`);
  }
}
