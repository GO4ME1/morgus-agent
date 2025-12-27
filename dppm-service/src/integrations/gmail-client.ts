/**
 * Gmail API Client
 * Free forever, unlimited emails
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  labels: string[];
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  cc?: string;
  bcc?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}

export class GmailClient {
  private oauth2Client: OAuth2Client;
  private gmail: any;

  constructor(config: {
    accessToken: string;
    refreshToken: string;
    clientId?: string;
    clientSecret?: string;
  }) {
    const clientId = config.clientId || process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = config.clientSecret || process.env.GOOGLE_CLIENT_SECRET!;

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'http://localhost:3000/auth/google/callback'
    );

    this.oauth2Client.setCredentials({
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Send an email
   */
  async sendEmail(options: SendEmailOptions): Promise<{ id: string; threadId: string }> {
    try {
      const message = this.createMessage(options);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      return {
        id: response.data.id,
        threadId: response.data.threadId,
      };
    } catch (error: any) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Get inbox messages
   */
  async getInbox(maxResults: number = 10): Promise<GmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
        maxResults,
      });

      const messages = response.data.messages || [];
      
      // Fetch full message details
      const fullMessages = await Promise.all(
        messages.map((msg: any) => this.getMessage(msg.id))
      );

      return fullMessages;
    } catch (error: any) {
      throw new Error(`Failed to get inbox: ${error.message}`);
    }
  }

  /**
   * Get a single message by ID
   */
  async getMessage(messageId: string): Promise<GmailMessage> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return this.parseMessage(response.data);
    } catch (error: any) {
      throw new Error(`Failed to get message: ${error.message}`);
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, maxResults: number = 10): Promise<GmailMessage[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      const messages = response.data.messages || [];
      
      const fullMessages = await Promise.all(
        messages.map((msg: any) => this.getMessage(msg.id))
      );

      return fullMessages;
    } catch (error: any) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }
  }

  /**
   * Reply to a message
   */
  async replyToMessage(
    messageId: string,
    body: string,
    html?: string
  ): Promise<{ id: string; threadId: string }> {
    try {
      // Get original message to extract thread ID and headers
      const original = await this.getMessage(messageId);

      const message = this.createMessage({
        to: original.from,
        subject: `Re: ${original.subject}`,
        body,
        html,
      });

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
          threadId: original.threadId,
        },
      });

      return {
        id: response.data.id,
        threadId: response.data.threadId,
      };
    } catch (error: any) {
      throw new Error(`Failed to reply: ${error.message}`);
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to mark as read: ${error.message}`);
    }
  }

  /**
   * Mark message as unread
   */
  async markAsUnread(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: ['UNREAD'],
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to mark as unread: ${error.message}`);
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.delete({
        userId: 'me',
        id: messageId,
      });
    } catch (error: any) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.gmail.users.labels.get({
        userId: 'me',
        id: 'INBOX',
      });

      return response.data.messagesUnread || 0;
    } catch (error: any) {
      throw new Error(`Failed to get unread count: ${error.message}`);
    }
  }

  /**
   * Create RFC 2822 formatted message
   */
  private createMessage(options: SendEmailOptions): string {
    const lines: string[] = [];

    lines.push(`To: ${options.to}`);
    if (options.cc) lines.push(`Cc: ${options.cc}`);
    if (options.bcc) lines.push(`Bcc: ${options.bcc}`);
    lines.push(`Subject: ${options.subject}`);
    lines.push('MIME-Version: 1.0');

    if (options.html) {
      // Multipart message with HTML
      const boundary = `boundary_${Date.now()}`;
      lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
      lines.push('');
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/plain; charset="UTF-8"');
      lines.push('');
      lines.push(options.body);
      lines.push('');
      lines.push(`--${boundary}`);
      lines.push('Content-Type: text/html; charset="UTF-8"');
      lines.push('');
      lines.push(options.html);
      lines.push('');
      lines.push(`--${boundary}--`);
    } else {
      // Plain text only
      lines.push('Content-Type: text/plain; charset="UTF-8"');
      lines.push('');
      lines.push(options.body);
    }

    const message = lines.join('\r\n');
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Parse Gmail message format
   */
  private parseMessage(data: any): GmailMessage {
    const headers = data.payload.headers;
    const getHeader = (name: string) => {
      const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    // Extract body
    let body = '';
    if (data.payload.body.data) {
      body = Buffer.from(data.payload.body.data, 'base64').toString('utf-8');
    } else if (data.payload.parts) {
      // Multipart message
      const textPart = data.payload.parts.find((part: any) => part.mimeType === 'text/plain');
      if (textPart && textPart.body.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }

    return {
      id: data.id,
      threadId: data.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      body,
      date: new Date(parseInt(data.internalDate)),
      labels: data.labelIds || [],
    };
  }
}

/**
 * Helper function to get Google OAuth URL
 */
export function getGoogleAuthUrl(
  clientId: string,
  redirectUri: string,
  state: string
): string {
  const oauth2Client = new google.auth.OAuth2(clientId, '', redirectUri);

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent',
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const { tokens } = await oauth2Client.getToken(code);

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
    };
  } catch (error: any) {
    throw new Error(`Failed to exchange code: ${error.message}`);
  }
}
