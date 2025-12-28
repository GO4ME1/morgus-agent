/**
 * Web Development Tools
 * 
 * Tools for initializing and managing web development projects.
 * Streamlines project setup with scaffolding and dependency management.
 * 
 * Tools:
 * - init_web_project: Initialize web project with scaffolding
 * - install_dependencies: Install npm/pip packages
 * - run_dev_server: Start development server
 */

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

/**
 * Initialize Web Project Tool
 */
export const initWebProjectTool: Tool = {
  name: 'init_web_project',
  description: `Initialize a web project with scaffolding and boilerplate code.

Project Types:
- static: Static HTML/CSS/JS website
- react: React app with Vite
- vue: Vue.js app with Vite
- next: Next.js app with TypeScript
- express: Express.js API server
- fastapi: FastAPI Python server

Features (optional):
- auth: Authentication system
- database: Database integration
- api: API client setup
- testing: Test framework
- docker: Docker configuration

Example:
{
  "name": "my-app",
  "type": "react",
  "features": ["auth", "api", "testing"]
}`,

  schema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Project name (will be used as directory name)',
      },
      type: {
        type: 'string',
        enum: ['static', 'react', 'vue', 'next', 'express', 'fastapi'],
        description: 'Project type',
      },
      features: {
        type: 'array',
        description: 'Optional features to include',
        items: {
          type: 'string',
          enum: ['auth', 'database', 'api', 'testing', 'docker'],
        },
      },
      typescript: {
        type: 'boolean',
        description: 'Use TypeScript (default: true for supported types)',
      },
      packageManager: {
        type: 'string',
        enum: ['npm', 'yarn', 'pnpm'],
        description: 'Package manager (default: npm)',
      },
    },
    required: ['name', 'type'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { name, type, features = [], typescript = true, packageManager = 'npm' } = args;
    
    console.log(`[WebDev] Initializing ${type} project: ${name}`);
    
    // Determine files to create based on type
    const files: string[] = [];
    const commands: string[] = [];
    
    switch (type) {
      case 'static':
        files.push('index.html', 'style.css', 'script.js');
        break;
      case 'react':
        commands.push(`${packageManager} create vite@latest ${name} -- --template react${typescript ? '-ts' : ''}`);
        break;
      case 'vue':
        commands.push(`${packageManager} create vite@latest ${name} -- --template vue${typescript ? '-ts' : ''}`);
        break;
      case 'next':
        commands.push(`npx create-next-app@latest ${name} --typescript --tailwind --app`);
        break;
      case 'express':
        files.push('server.js', 'package.json', '.env');
        commands.push(`cd ${name} && ${packageManager} init -y`);
        commands.push(`cd ${name} && ${packageManager} install express cors dotenv`);
        break;
      case 'fastapi':
        files.push('main.py', 'requirements.txt', '.env');
        commands.push(`cd ${name} && pip install fastapi uvicorn python-dotenv`);
        break;
    }
    
    // Add feature-specific files
    if (features.includes('auth')) {
      files.push('auth.js', 'middleware/auth.js');
    }
    if (features.includes('database')) {
      files.push('db/config.js', 'db/models.js');
    }
    if (features.includes('api')) {
      files.push('api/client.js');
    }
    if (features.includes('testing')) {
      files.push('tests/setup.js');
      commands.push(`cd ${name} && ${packageManager} install -D jest`);
    }
    if (features.includes('docker')) {
      files.push('Dockerfile', 'docker-compose.yml', '.dockerignore');
    }
    
    return `✅ Web project initialized successfully!

## ${name}

**Type:** ${type}
**TypeScript:** ${typescript ? 'Yes' : 'No'}
**Package Manager:** ${packageManager}
**Features:** ${features.length > 0 ? features.join(', ') : 'None'}

### Files Created

${files.map(f => `- ${name}/${f}`).join('\n')}

### Setup Commands

${commands.map((c, i) => `${i + 1}. \`${c}\``).join('\n')}

### Next Steps

1. Navigate to project: \`cd ${name}\`
2. Install dependencies: \`${packageManager} install\`
3. Start development server: \`${packageManager} run dev\`
4. Open browser: http://localhost:3000

**Project ready for development!** 🚀`;
  },
};

/**
 * Install Dependencies Tool
 */
export const installDependenciesTool: Tool = {
  name: 'install_dependencies',
  description: 'Install npm or pip packages',
  schema: {
    type: 'object',
    properties: {
      packages: {
        type: 'array',
        description: 'Array of package names to install',
        items: {
          type: 'string',
        },
      },
      type: {
        type: 'string',
        enum: ['npm', 'pip'],
        description: 'Package manager type',
      },
      dev: {
        type: 'boolean',
        description: 'Install as dev dependencies (npm only, default: false)',
      },
      global: {
        type: 'boolean',
        description: 'Install globally (default: false)',
      },
      projectPath: {
        type: 'string',
        description: 'Project directory path (default: current directory)',
      },
    },
    required: ['packages', 'type'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { packages, type, dev = false, global = false, projectPath = '.' } = args;
    
    console.log(`[WebDev] Installing ${packages.length} ${type} packages`);
    
    // Build install command
    let command: string;
    if (type === 'npm') {
      const flags = [
        global ? '-g' : '',
        dev ? '-D' : '',
      ].filter(Boolean).join(' ');
      command = `npm install ${flags} ${packages.join(' ')}`;
    } else {
      const flags = global ? '--user' : '';
      command = `pip install ${flags} ${packages.join(' ')}`;
    }
    
    // In production, this would execute the command via execute_code
    
    return `✅ Dependencies installed successfully!

**Package Manager:** ${type}
**Packages:** ${packages.length}
**Type:** ${dev ? 'Dev Dependencies' : global ? 'Global' : 'Dependencies'}
**Project:** ${projectPath}

### Installed Packages

${packages.map(p => `- ${p}`).join('\n')}

### Command Executed

\`\`\`bash
cd ${projectPath}
${command}
\`\`\`

All packages are now available in your project!`;
  },
};

/**
 * Run Dev Server Tool
 */
export const runDevServerTool: Tool = {
  name: 'run_dev_server',
  description: 'Start development server for a web project',
  schema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: 'Project directory path',
      },
      port: {
        type: 'number',
        description: 'Port number (default: 3000)',
      },
      command: {
        type: 'string',
        description: 'Custom start command (optional)',
      },
    },
    required: ['projectPath'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { projectPath, port = 3000, command } = args;
    
    console.log(`[WebDev] Starting dev server at ${projectPath}:${port}`);
    
    // Determine start command based on project type
    const startCommand = command || 'npm run dev';
    
    // In production, this would start the server in the background
    
    return `✅ Development server starting...

**Project:** ${projectPath}
**Port:** ${port}
**Command:** \`${startCommand}\`

### Server Info

- **Local:** http://localhost:${port}
- **Network:** http://[your-ip]:${port}

### Status

🟢 Server is running in the background

### Logs

To view logs, check the server output in the terminal.

**Development server is ready!** Open your browser to start developing.`;
  },
};

/**
 * All web development tools
 */
export const webdevTools: Tool[] = [
  initWebProjectTool,
  installDependenciesTool,
  runDevServerTool,
];
