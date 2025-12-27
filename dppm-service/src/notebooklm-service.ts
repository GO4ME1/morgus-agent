/**
 * NotebookLM Integration Service for Morgus
 * 
 * This service integrates Google NotebookLM via the notebooklm-mcp server
 * to provide AI-powered research, study guides, and knowledge management.
 * 
 * Uses the khengyun/notebooklm-mcp Python MCP server via child process.
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface NotebookLMConfig {
  notebookId?: string;
  headless?: boolean;
  timeout?: number;
  profileDir?: string;
  pythonEnvPath?: string; // Path to Python virtual environment
}

export interface NotebookLMMessage {
  message: string;
  waitForResponse?: boolean;
  timeout?: number;
}

export interface NotebookLMResponse {
  success: boolean;
  response?: string;
  error?: string;
  timestamp: number;
}

export class NotebookLMService extends EventEmitter {
  private mcpProcess: ChildProcess | null = null;
  private config: NotebookLMConfig;
  private isReady: boolean = false;
  private messageQueue: Array<{ message: string; resolve: Function; reject: Function }> = [];

  constructor(config: NotebookLMConfig = {}) {
    super();
    this.config = {
      headless: true,
      timeout: 30,
      profileDir: './chrome_profile_notebooklm',
      pythonEnvPath: '/home/ubuntu/notebooklm-env',
      ...config
    };
  }

  /**
   * Start the NotebookLM MCP server
   */
  async start(): Promise<void> {
    if (this.mcpProcess) {
      console.log('NotebookLM MCP server already running');
      return;
    }

    console.log('Starting NotebookLM MCP server...');

    const pythonPath = `${this.config.pythonEnvPath}/bin/python`;
    const args = [
      '-m', 'notebooklm_mcp.cli',
      '--config', 'notebooklm-config.json',
      'server',
      '--transport', 'stdio'
    ];

    this.mcpProcess = spawn(pythonPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NOTEBOOKLM_HEADLESS: this.config.headless ? 'true' : 'false',
        NOTEBOOKLM_TIMEOUT: String(this.config.timeout)
      }
    });

    // Handle stdout (MCP protocol messages)
    this.mcpProcess.stdout?.on('data', (data) => {
      const message = data.toString();
      console.log('[NotebookLM MCP] stdout:', message);
      
      // Check if server is ready
      if (message.includes('Server started') || message.includes('ready')) {
        this.isReady = true;
        this.emit('ready');
      }

      // Try to parse JSON-RPC responses
      try {
        const lines = message.split('\n').filter(l => l.trim());
        for (const line of lines) {
          const response = JSON.parse(line);
          this.handleMCPResponse(response);
        }
      } catch (e) {
        // Not JSON, ignore
      }
    });

    // Handle stderr (logs and errors)
    this.mcpProcess.stderr?.on('data', (data) => {
      console.error('[NotebookLM MCP] stderr:', data.toString());
    });

    // Handle process exit
    this.mcpProcess.on('exit', (code) => {
      console.log(`NotebookLM MCP server exited with code ${code}`);
      this.isReady = false;
      this.mcpProcess = null;
      this.emit('exit', code);
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('NotebookLM MCP server failed to start within timeout'));
      }, 30000);

      this.once('ready', () => {
        clearTimeout(timeout);
        resolve(undefined);
      });

      this.once('exit', (code) => {
        clearTimeout(timeout);
        reject(new Error(`NotebookLM MCP server exited with code ${code}`));
      });
    });

    console.log('NotebookLM MCP server started successfully');
  }

  /**
   * Stop the NotebookLM MCP server
   */
  async stop(): Promise<void> {
    if (!this.mcpProcess) {
      return;
    }

    console.log('Stopping NotebookLM MCP server...');
    
    this.mcpProcess.kill('SIGTERM');
    
    // Wait for process to exit
    await new Promise((resolve) => {
      if (!this.mcpProcess) {
        resolve(undefined);
        return;
      }

      this.mcpProcess.once('exit', () => {
        resolve(undefined);
      });

      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.mcpProcess) {
          this.mcpProcess.kill('SIGKILL');
        }
        resolve(undefined);
      }, 5000);
    });

    this.mcpProcess = null;
    this.isReady = false;
    console.log('NotebookLM MCP server stopped');
  }

  /**
   * Send a chat message to NotebookLM
   */
  async chat(message: string, options: { timeout?: number } = {}): Promise<NotebookLMResponse> {
    if (!this.isReady || !this.mcpProcess) {
      throw new Error('NotebookLM MCP server not ready');
    }

    const requestId = Date.now();
    const timeout = options.timeout || this.config.timeout || 30;

    // Create JSON-RPC request
    const request = {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: 'chat_with_notebook',
        arguments: {
          message,
          notebook_id: this.config.notebookId
        }
      }
    };

    // Send request to MCP server
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`NotebookLM chat timeout after ${timeout}s`));
      }, timeout * 1000);

      // Store in queue
      this.messageQueue.push({
        message: JSON.stringify(request),
        resolve: (response: any) => {
          clearTimeout(timeoutId);
          resolve({
            success: true,
            response: response.result?.content?.[0]?.text || JSON.stringify(response.result),
            timestamp: Date.now()
          });
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      // Write to stdin
      this.mcpProcess?.stdin?.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * Get server health status
   */
  async healthcheck(): Promise<boolean> {
    if (!this.isReady || !this.mcpProcess) {
      return false;
    }

    try {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'healthcheck',
          arguments: {}
        }
      };

      this.mcpProcess.stdin?.write(JSON.stringify(request) + '\n');
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Handle MCP protocol responses
   */
  private handleMCPResponse(response: any): void {
    if (!response.id) {
      return;
    }

    // Find matching request in queue
    const index = this.messageQueue.findIndex(item => {
      try {
        const req = JSON.parse(item.message);
        return req.id === response.id;
      } catch {
        return false;
      }
    });

    if (index === -1) {
      return;
    }

    const { resolve, reject } = this.messageQueue[index];
    this.messageQueue.splice(index, 1);

    if (response.error) {
      reject(new Error(response.error.message || 'NotebookLM MCP error'));
    } else {
      resolve(response);
    }
  }

  /**
   * Check if server is running
   */
  isRunning(): boolean {
    return this.isReady && this.mcpProcess !== null;
  }
}

/**
 * Singleton instance for easy access
 */
let notebookLMInstance: NotebookLMService | null = null;

export function getNotebookLMService(config?: NotebookLMConfig): NotebookLMService {
  if (!notebookLMInstance) {
    notebookLMInstance = new NotebookLMService(config);
  }
  return notebookLMInstance;
}

export async function startNotebookLM(config?: NotebookLMConfig): Promise<NotebookLMService> {
  const service = getNotebookLMService(config);
  if (!service.isRunning()) {
    await service.start();
  }
  return service;
}

export async function stopNotebookLM(): Promise<void> {
  if (notebookLMInstance) {
    await notebookLMInstance.stop();
    notebookLMInstance = null;
  }
}
