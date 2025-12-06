/**
 * GitHub Integration Service for Morgus
 * 
 * Implements two modes:
 * 1. User GitHub Mode - Users can connect their own repos
 * 2. Self-Dev Mode - Morgus can modify its own repo (internal only)
 */

export interface GitHubConfig {
  userToken?: string; // User's GitHub token
  selfDevToken?: string; // Morgus internal token (server-side only)
  selfDevMode?: boolean; // Enable self-development mode
}

export interface GitHubToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * User GitHub Tools - Available to all users
 */
export const USER_GITHUB_TOOLS: GitHubToolSchema[] = [
  {
    name: 'user_github_clone',
    description: `Clone a user's authorized GitHub repository.
    
    Security: Only works with repos the user has explicitly connected.`,
    parameters: {
      type: 'object',
      properties: {
        repo_url: {
          type: 'string',
          description: 'GitHub repository URL (e.g., https://github.com/user/repo)',
        },
        branch: {
          type: 'string',
          description: 'Branch to clone (default: main)',
        },
      },
      required: ['repo_url'],
    },
  },
  {
    name: 'user_github_create_branch',
    description: `Create a new branch in the user's repository.
    
    Always create branches for changes - never commit directly to main.`,
    parameters: {
      type: 'object',
      properties: {
        branch_name: {
          type: 'string',
          description: 'Name for the new branch (e.g., feature/add-login)',
        },
      },
      required: ['branch_name'],
    },
  },
  {
    name: 'user_github_commit_all',
    description: `Commit all changes in the working directory.
    
    Creates a clean commit with a descriptive message.`,
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message describing the changes',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'user_github_push',
    description: `Push commits to the remote repository.
    
    Pushes the current branch to GitHub.`,
    parameters: {
      type: 'object',
      properties: {
        branch_name: {
          type: 'string',
          description: 'Branch to push',
        },
      },
      required: ['branch_name'],
    },
  },
  {
    name: 'user_github_open_pr',
    description: `Open a Pull Request for review.
    
    Creates a PR from the current branch to main.`,
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'PR title',
        },
        body: {
          type: 'string',
          description: 'PR description with details of changes',
        },
      },
      required: ['title', 'body'],
    },
  },
];

/**
 * Self-Dev GitHub Tools - Internal only, NOT available to users
 */
export const SELF_DEV_GITHUB_TOOLS: GitHubToolSchema[] = [
  {
    name: 'morgus_clone_core_repo',
    description: `Clone Morgus core repository for self-development.
    
    ⚠️ INTERNAL ONLY - Not available to public users.
    
    Used when Morgus needs to modify its own codebase.`,
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'morgus_create_branch',
    description: `Create a branch in Morgus core repo.
    
    ⚠️ INTERNAL ONLY - Never push directly to main.`,
    parameters: {
      type: 'object',
      properties: {
        branch_name: {
          type: 'string',
          description: 'Branch name (e.g., self-dev/improve-moe)',
        },
      },
      required: ['branch_name'],
    },
  },
  {
    name: 'morgus_commit_core_changes',
    description: `Commit changes to Morgus core repo.
    
    ⚠️ INTERNAL ONLY - Must run tests before committing.`,
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Commit message',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'morgus_push_core_branch',
    description: `Push Morgus core branch to remote.
    
    ⚠️ INTERNAL ONLY`,
    parameters: {
      type: 'object',
      properties: {
        branch_name: {
          type: 'string',
          description: 'Branch to push',
        },
      },
      required: ['branch_name'],
    },
  },
  {
    name: 'morgus_open_core_pr',
    description: `Open PR for Morgus core changes.
    
    ⚠️ INTERNAL ONLY - Must include REPORT.md explaining all changes.`,
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'PR title',
        },
        body: {
          type: 'string',
          description: 'PR description with detailed explanation',
        },
      },
      required: ['title', 'body'],
    },
  },
];

/**
 * GitHub Service Implementation
 */
export class GitHubService {
  private config: GitHubConfig;
  private workingDir: string = '/tmp/github-workspace';

  constructor(config: GitHubConfig) {
    this.config = config;
  }

  /**
   * Get available GitHub tools based on mode
   */
  getAvailableTools(): GitHubToolSchema[] {
    const tools = [...USER_GITHUB_TOOLS];
    
    // Only add self-dev tools if explicitly enabled
    if (this.config.selfDevMode && this.config.selfDevToken) {
      tools.push(...SELF_DEV_GITHUB_TOOLS);
    }
    
    return tools;
  }

  /**
   * Execute a GitHub tool
   */
  async executeTool(toolName: string, args: Record<string, any>): Promise<string> {
    // User GitHub tools
    if (toolName === 'user_github_clone') {
      return this.userGitHubClone(args.repo_url, args.branch);
    }
    if (toolName === 'user_github_create_branch') {
      return this.userGitHubCreateBranch(args.branch_name);
    }
    if (toolName === 'user_github_commit_all') {
      return this.userGitHubCommitAll(args.message);
    }
    if (toolName === 'user_github_push') {
      return this.userGitHubPush(args.branch_name);
    }
    if (toolName === 'user_github_open_pr') {
      return this.userGitHubOpenPR(args.title, args.body);
    }

    // Self-dev tools (only if enabled)
    if (this.config.selfDevMode && this.config.selfDevToken) {
      if (toolName === 'morgus_clone_core_repo') {
        return this.morgusCloneCoreRepo();
      }
      if (toolName === 'morgus_create_branch') {
        return this.morgusCreateBranch(args.branch_name);
      }
      if (toolName === 'morgus_commit_core_changes') {
        return this.morgusCommitCoreChanges(args.message);
      }
      if (toolName === 'morgus_push_core_branch') {
        return this.morgusPushCoreBranch(args.branch_name);
      }
      if (toolName === 'morgus_open_core_pr') {
        return this.morgusOpenCorePR(args.title, args.body);
      }
    }

    throw new Error(`Unknown or unauthorized GitHub tool: ${toolName}`);
  }

  // User GitHub tool implementations
  private async userGitHubClone(repoUrl: string, branch?: string): Promise<string> {
    // TODO: Implement using GitHub API or git CLI
    return `Cloned ${repoUrl} (branch: ${branch || 'main'}) to ${this.workingDir}`;
  }

  private async userGitHubCreateBranch(branchName: string): Promise<string> {
    // TODO: Implement
    return `Created branch: ${branchName}`;
  }

  private async userGitHubCommitAll(message: string): Promise<string> {
    // TODO: Implement
    return `Committed changes: ${message}`;
  }

  private async userGitHubPush(branchName: string): Promise<string> {
    // TODO: Implement
    return `Pushed branch: ${branchName}`;
  }

  private async userGitHubOpenPR(title: string, body: string): Promise<string> {
    // TODO: Implement using GitHub API
    return `Opened PR: ${title}`;
  }

  // Self-dev tool implementations
  private async morgusCloneCoreRepo(): Promise<string> {
    // TODO: Implement - clone morgus-agent repo
    return `Cloned Morgus core repo to ${this.workingDir}`;
  }

  private async morgusCreateBranch(branchName: string): Promise<string> {
    // TODO: Implement
    return `Created Morgus core branch: ${branchName}`;
  }

  private async morgusCommitCoreChanges(message: string): Promise<string> {
    // TODO: Implement - must run tests first
    return `Committed Morgus core changes: ${message}`;
  }

  private async morgusPushCoreBranch(branchName: string): Promise<string> {
    // TODO: Implement
    return `Pushed Morgus core branch: ${branchName}`;
  }

  private async morgusOpenCorePR(title: string, body: string): Promise<string> {
    // TODO: Implement - must include REPORT.md
    return `Opened Morgus core PR: ${title}`;
  }
}
