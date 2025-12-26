import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Configure Supabase client with explicit session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Persist session in localStorage
    autoRefreshToken: true, // Automatically refresh tokens
    detectSessionInUrl: true, // Detect OAuth redirects
    storage: localStorage, // Explicitly use localStorage
  }
});

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'waiting_for_input';
  phase: 'RESEARCH' | 'PLAN' | 'BUILD' | 'EXECUTE' | 'FINALIZE';
  model: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface TaskStep {
  id: string;
  task_id: string;
  phase: string;
  type: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface Artifact {
  id: string;
  task_id: string;
  type: string;
  name: string;
  url?: string;
  path?: string;
  metadata: Record<string, any>;
  created_at: string;
}
