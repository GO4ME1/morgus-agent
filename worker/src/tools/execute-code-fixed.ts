import { Tool } from './base';

interface ExecuteCodeArgs {
  code: string;
  language?: 'python' | 'javascript' | 'bash';
  timeout?: number;
}

export class ExecuteCodeTool extends Tool<ExecuteCodeArgs> {
  name = 'execute_code';
  description = `Execute code in a secure E2B sandbox. Supports Python, JavaScript, and Bash.
Use this to:
- Run Python scripts for data processing, API calls, file operations
- Execute shell commands for system operations
- Deploy websites using Wrangler CLI

The sandbox has internet access and common packages pre-installed.
Files created in the sandbox are temporary and will be deleted after execution.`;

  schema = {
    type: 'object' as const,
    properties: {
      code: {
        type: 'string',
        description: 'The code to execute',
      },
      language: {
        type: 'string',
        enum: ['python', 'javascript', 'bash'],
        description: 'Programming language (default: python)',
      },
      timeout: {
        type: 'number',
        description: 'Execution timeout in seconds (default: 300)',
      },
    },
    required: ['code'],
  };

  async execute(args: ExecuteCodeArgs, env: any): Promise<string> {
    const { code, language = 'python', timeout = 300 } = args;
    
    const apiKey = env.E2B_API_KEY;
    if (!apiKey) {
      return 'Error: E2B_API_KEY not configured';
    }

    try {
      // Step 1: Create sandbox
      console.log('[E2B] Creating sandbox...');
      const createResponse = await fetch('https://api.e2b.app/sandboxes', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: 'base', // Use base template with common tools
          timeout: timeout * 1000, // Convert to milliseconds
          envVars: {
            CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN || '',
            CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID || '',
          },
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('[E2B] Create sandbox failed:', error);
        return `Error creating sandbox: ${error}`;
      }

      const sandbox = await createResponse.json();
      const sandboxId = sandbox.sandboxID;
      const sandboxDomain = sandbox.clientID; // This is the domain for the sandbox
      
      console.log(`[E2B] Sandbox created: ${sandboxId}`);

      try {
        // Step 2: Execute code via envd API
        // The envd API is at https://{port}-{sandboxID}.{domain}
        // For command execution, we use the Connect RPC protocol
        const envdUrl = `https://49983-${sandboxId}.${sandboxDomain || 'e2b.app'}`;
        
        console.log(`[E2B] Executing code in sandbox...`);
        
        // Prepare the command based on language
        let command: string;
        if (language === 'python') {
          command = `python3 -c ${JSON.stringify(code)}`;
        } else if (language === 'javascript') {
          command = `node -e ${JSON.stringify(code)}`;
        } else {
          command = code;
        }

        // Use the Connect RPC protocol to execute the command
        // This is a simplified version - the full SDK uses protobuf
        const execResponse = await fetch(`${envdUrl}/process.Process/Start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cmd: command,
            envVars: {
              CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN || '',
              CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID || '',
            },
          }),
        });

        if (!execResponse.ok) {
          const error = await execResponse.text();
          console.error('[E2B] Execute failed:', error);
          return `Error executing code: ${error}`;
        }

        const result = await execResponse.json();
        console.log('[E2B] Execution completed');
        
        return JSON.stringify({
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          exitCode: result.exitCode || 0,
        }, null, 2);

      } finally {
        // Step 3: Clean up - kill the sandbox
        console.log('[E2B] Cleaning up sandbox...');
        await fetch(`https://api.e2b.app/sandboxes/${sandboxId}`, {
          method: 'DELETE',
          headers: {
            'X-API-KEY': apiKey,
          },
        }).catch(err => console.error('[E2B] Cleanup failed:', err));
      }

    } catch (error: any) {
      console.error('[E2B] Error:', error);
      return `Error: ${error.message || error}`;
    }
  }
}
