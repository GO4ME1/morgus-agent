/**
 * GitHub Pages Deployment Service
 * Deploys static websites to GitHub Pages
 */

import { Octokit } from '@octokit/rest';

export interface GitHubDeployRequest {
  projectName: string;
  files: Array<{ path: string; content: string }>;
  githubToken: string;
  owner?: string; // GitHub username/org, defaults to token owner
}

export interface GitHubDeployResponse {
  success: boolean;
  url: string;
  repoUrl: string;
  error?: string;
}

export async function deployToGitHubPages(request: GitHubDeployRequest): Promise<GitHubDeployResponse> {
  const { projectName, files, githubToken, owner } = request;
  
  console.log('[GITHUB] Starting deployment for:', projectName);
  console.log('[GITHUB] Files:', files.length);
  
  const octokit = new Octokit({ auth: githubToken });
  
  try {
    // Get authenticated user if owner not specified
    let repoOwner = owner;
    if (!repoOwner) {
      const { data: user } = await octokit.users.getAuthenticated();
      repoOwner = user.login;
    }
    
    const repoName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    // Step 1: Check if repo exists, create if not
    let repoExists = false;
    try {
      await octokit.repos.get({ owner: repoOwner, repo: repoName });
      repoExists = true;
      console.log('[GITHUB] Repository exists:', repoName);
    } catch (error: any) {
      if (error.status === 404) {
        console.log('[GITHUB] Creating new repository:', repoName);
        await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: `Landing page: ${projectName}`,
          homepage: `https://${repoOwner}.github.io/${repoName}`,
          auto_init: true,
          private: false,
        });
        // Wait for repo to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw error;
      }
    }
    
    // Step 2: Get the default branch SHA
    const { data: ref } = await octokit.git.getRef({
      owner: repoOwner,
      repo: repoName,
      ref: 'heads/main',
    }).catch(async () => {
      // Try 'master' if 'main' doesn't exist
      return octokit.git.getRef({
        owner: repoOwner,
        repo: repoName,
        ref: 'heads/master',
      });
    });
    
    const baseSha = ref.object.sha;
    
    // Step 3: Create blobs for each file
    console.log('[GITHUB] Creating file blobs...');
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner: repoOwner,
          repo: repoName,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });
        return {
          path: file.path.startsWith('/') ? file.path.slice(1) : file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );
    
    // Step 4: Create tree
    console.log('[GITHUB] Creating tree...');
    const { data: tree } = await octokit.git.createTree({
      owner: repoOwner,
      repo: repoName,
      base_tree: baseSha,
      tree: blobs,
    });
    
    // Step 5: Create commit
    console.log('[GITHUB] Creating commit...');
    const { data: commit } = await octokit.git.createCommit({
      owner: repoOwner,
      repo: repoName,
      message: `Deploy: ${new Date().toISOString()}`,
      tree: tree.sha,
      parents: [baseSha],
    });
    
    // Step 6: Update reference
    console.log('[GITHUB] Updating reference...');
    await octokit.git.updateRef({
      owner: repoOwner,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
    }).catch(async () => {
      // Try 'master' if 'main' doesn't exist
      return octokit.git.updateRef({
        owner: repoOwner,
        repo: repoName,
        ref: 'heads/master',
        sha: commit.sha,
      });
    });
    
    // Step 7: Enable GitHub Pages if not already enabled
    console.log('[GITHUB] Enabling GitHub Pages...');
    try {
      await octokit.repos.createPagesSite({
        owner: repoOwner,
        repo: repoName,
        source: {
          branch: 'main',
          path: '/',
        },
      });
    } catch (error: any) {
      // Pages might already be enabled, that's fine
      if (!error.message?.includes('already enabled')) {
        console.log('[GITHUB] Pages enable note:', error.message);
      }
    }
    
    const pagesUrl = `https://${repoOwner}.github.io/${repoName}`;
    const repoUrl = `https://github.com/${repoOwner}/${repoName}`;
    
    console.log('[GITHUB] Deployment successful!');
    console.log('[GITHUB] Pages URL:', pagesUrl);
    
    return {
      success: true,
      url: pagesUrl,
      repoUrl,
    };
    
  } catch (error: any) {
    console.error('[GITHUB] Deployment failed:', error.message);
    return {
      success: false,
      url: '',
      repoUrl: '',
      error: error.message,
    };
  }
}
