/**
 * NotebookLM API Client
 * 
 * Frontend service for interacting with NotebookLM
 * Uses iframe communication or direct API calls
 */

import { NOTEBOOKLM_CONFIG } from '../config/notebooklm';

export interface NotebookLMMessage {
  type: 'add_source' | 'chat' | 'get_insights';
  notebookId: string;
  content?: string;
  sourceUrl?: string;
  sourceType?: 'text' | 'url' | 'pdf';
}

export interface NotebookSource {
  id: string;
  type: 'text' | 'url' | 'pdf';
  title: string;
  content: string;
  addedAt: Date;
}

export interface Notebook {
  id: string;
  name: string;
  sourceCount: number;
  type: 'personal' | 'shared' | 'public';
  createdAt: Date;
}

export interface NotebookLMResponse {
  success: boolean;
  data?: NotebookSource;
  error?: string;
}

class NotebookLMService {
  private apiBaseUrl: string;

  constructor() {
    // Use DPPM service as proxy to NotebookLM
    this.apiBaseUrl = process.env.REACT_APP_DPPM_URL || 'https://morgus-deploy.fly.dev';
  }

  /**
   * Add content to a notebook as a source
   */
  async addToNotebook(notebookId: string, content: string, title?: string): Promise<NotebookLMResponse> {
    try {
      // For now, store locally and open NotebookLM in new tab
      // Later: Use API when available
      
      const source: NotebookSource = {
        id: `source-${Date.now()}`,
        type: 'text' as const,
        title: title || 'Chat Message',
        content,
        addedAt: new Date()
      };

      // Store in localStorage
      const key = `notebook_${notebookId}_sources`;
      const stored = localStorage.getItem(key);
      const sources: NotebookSource[] = stored ? JSON.parse(stored) : [];
      sources.push(source);
      localStorage.setItem(key, JSON.stringify(sources));

      // Open NotebookLM to manually add
      const url = `${NOTEBOOKLM_CONFIG.baseUrl}/notebook/${notebookId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(content);
      
      // Show notification
      alert(`Content copied to clipboard! Opening NotebookLM...\n\nPaste it into your notebook.`);
      
      // Open NotebookLM
      window.open(url, '_blank');

      return {
        success: true,
        data: source
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to add to notebook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get insights from a notebook
   */
  async getInsights(notebookId: string, query?: string): Promise<string> {
    try {
      // For now, open NotebookLM and prompt user
      const url = `${NOTEBOOKLM_CONFIG.baseUrl}/notebook/${notebookId}`;
      
      
      if (query) {
        await navigator.clipboard.writeText(query);
        alert(`Question copied to clipboard! Opening NotebookLM...\n\nPaste it into the chat.`);
      }
      
      window.open(url, '_blank');
      
      return 'NotebookLM opened. Please ask your question there and copy the response back to Morgus.';
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Failed to get insights:', error);
      throw error;
    }
  }

  /**
   * Chat with a notebook (future: direct API integration)
   */
  async chat(notebookId: string, message: string): Promise<string> {
    try {
      // Try to use DPPM service if available
      const response = await fetch(`${this.apiBaseUrl}/api/notebooklm/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notebookId,
          message
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response || data.data;
      }

      // Fallback: Open NotebookLM
      return await this.getInsights(notebookId, message);
    } catch (err) {
      console.error('Chat failed, falling back to manual:', err);
      return await this.getInsights(notebookId, message);
    }
  }

  /**
   * Get sources from a notebook
   */
  async getSources(notebookId: string): Promise<NotebookSource[]> {
    try {
      const key = `notebook_${notebookId}_sources`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Failed to get sources:', err);
      return [];
    }
  }

  /**
   * Open notebook in NotebookLM
   */
  openNotebook(notebookId: string): void {
    const url = `${NOTEBOOKLM_CONFIG.baseUrl}/notebook/${notebookId}`;
    window.open(url, '_blank');
  }

  /**
   * Get list of notebooks
   */
  getNotebooks(): Notebook[] {
    try {
      const key = 'notebooklm_notebooks';
      const stored = localStorage.getItem(key);
      const notebooks: Notebook[] = stored ? JSON.parse(stored) : [];
      
      // Add default notebook if none exist
      if (notebooks.length === 0) {
        const defaultNotebook: Notebook = {
          id: NOTEBOOKLM_CONFIG.defaultNotebookId,
          name: 'Morgus Conversations',
          sourceCount: 0,
          type: 'personal' as const,
          createdAt: new Date()
        };
        notebooks.push(defaultNotebook);
        localStorage.setItem(key, JSON.stringify(notebooks));
      }
      
      return notebooks;
    } catch (err) {
      console.error('Failed to get notebooks:', err);
      return [];
    }
  }

  /**
   * Create a new notebook
   */
  createNotebook(name: string, type: 'personal' | 'shared' | 'public' = 'personal'): Notebook {
    try {
      const notebook: Notebook = {
        id: `notebook-${Date.now()}`,
        name,
        sourceCount: 0,
        type,
        createdAt: new Date()
      };
      
      const key = 'notebooklm_notebooks';
      const stored = localStorage.getItem(key);
      const notebooks: Notebook[] = stored ? JSON.parse(stored) : [];
      notebooks.push(notebook);
      localStorage.setItem(key, JSON.stringify(notebooks));
      
      return notebook;
    } catch (err) {
      console.error('Failed to create notebook:', err);
      throw err;
    }
  }

  /**
   * Get primary notebook ID
   */
  getPrimaryNotebookId(): string {
    const notebooks = this.getNotebooks();
    return notebooks.length > 0 ? notebooks[0].id : NOTEBOOKLM_CONFIG.defaultNotebookId;
  }

  /**
   * Add message to notebook (convenience method)
   */
  async addMessageToNotebook(notebookId: string, content: string): Promise<void> {
    await this.addToNotebook(notebookId, content);
  }

  /**
   * Check if NotebookLM integration is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/notebooklm/status`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.isRunning && data.isHealthy;
      }
      
      return false;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const notebookLMService = new NotebookLMService();

// Helper functions
export async function addMessageToNotebook(
  messageContent: string,
  notebookId: string,
  messageTitle?: string
): Promise<void> {
  const result = await notebookLMService.addToNotebook(notebookId, messageContent, messageTitle);
  if (!result.success) {
    throw new Error(result.error || 'Failed to add to notebook');
  }
}

export async function getNotebookInsights(
  notebookId: string,
  query?: string
): Promise<string> {
  return await notebookLMService.getInsights(notebookId, query);
}

export async function chatWithNotebook(
  notebookId: string,
  message: string
): Promise<string> {
  return await notebookLMService.chat(notebookId, message);
}
