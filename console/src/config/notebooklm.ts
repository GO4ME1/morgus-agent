/**
 * NotebookLM Configuration
 * 
 * Configuration for Google NotebookLM integration
 */

export const NOTEBOOKLM_CONFIG = {
  // Default notebook ID (can be overridden per user)
  defaultNotebookId: 'f3d3d717-6658-4d5b-9570-49c709a7d0fd',
  
  // NotebookLM base URL
  baseUrl: 'https://notebooklm.google.com',
  
  // Feature flags
  features: {
    multipleNotebooks: true,
    audioOverview: true,
    sourceManagement: true,
    studyGuides: true
  }
};

export interface Notebook {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  sourceCount: number;
}

export interface NotebookSource {
  id: string;
  type: 'url' | 'pdf' | 'text' | 'youtube';
  title: string;
  url?: string;
  content?: string;
  addedAt: Date;
}
