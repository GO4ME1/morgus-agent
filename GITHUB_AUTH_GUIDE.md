# GitHub CLI Authentication Guide for Morgus

## Issue
GitHub CLI (`gh`) requires authentication to perform operations like cloning repos, creating PRs, etc.

## Error Message
```
Error executing code: 500 - {"success":false,"error":"Execution failed","message":"Command failed: bash script.sh\nTo get started with GitHub CLI, please run: gh auth login\nAlternatively, populate the GH_TOKEN environment variable with a GitHub API authentication token\n"}
```

## Solution Options

### Option 1: Set GH_TOKEN Environment Variable (Recommended)

1. **Create GitHub Personal Access Token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Select scopes:
     - `repo` (Full control of private repositories)
     - `workflow` (Update GitHub Action workflows)
     - `read:org` (Read org and team membership)
   - Copy the token

2. **Add to Fly.io Service:**
   ```bash
   flyctl secrets set GH_TOKEN="ghp_your_token_here" -a morgus-deploy
   ```

3. **Update Dockerfile to use GH_TOKEN:**
   The GitHub CLI will automatically use the `GH_TOKEN` environment variable if set.

### Option 2: Use GitHub App (More Secure)

For production use, consider using a GitHub App instead of personal access tokens:
- More granular permissions
- Better audit logging
- Can be installed per-repository

## Current Status

**GitHub CLI is installed** in the Fly.io container:
- ✅ `gh` version 2.83.1
- ✅ `git` version 2.39.5

**But authentication is NOT configured:**
- ❌ No GH_TOKEN set
- ❌ No gh auth login performed

## What Works Without Authentication

- Public repository operations (read-only)
- Git operations (clone, pull) for public repos

## What Requires Authentication

- Clone private repositories
- Create pull requests
- Create issues
- Fork repositories
- Manage GitHub Actions
- Access organization data

## Recommended Action

**For Morgus users:**

When a user asks Morgus to perform GitHub operations, Morgus should:

1. **Check if operation requires auth** (e.g., cloning private repo, creating PR)

2. **If auth required, respond with:**
   ```
   To perform GitHub operations, I need a GitHub token. Here's how to set it up:

   1. Create a GitHub Personal Access Token:
      - Go to https://github.com/settings/tokens
      - Click "Generate new token (classic)"
      - Select scopes: repo, workflow
      - Copy the token

   2. Provide the token to me, and I'll configure it for future operations.

   Alternatively, for public repositories, I can perform read-only operations without authentication.
   ```

3. **For public repos:** Proceed without authentication

4. **For private repos:** Request user to provide GH_TOKEN

## Example Commands

### Without Authentication (Public Repos):
```bash
# Clone public repo
gh repo clone facebook/react

# View public repo info
gh repo view vercel/next.js
```

### With Authentication Required:
```bash
# Clone private repo
gh repo clone myorg/private-repo

# Create PR
gh pr create --title "Fix bug" --body "Description"

# Create issue
gh issue create --title "Bug report"
```

## Security Notes

- **Never commit tokens to code**
- **Use environment variables** for tokens
- **Rotate tokens regularly**
- **Use minimal required scopes**
- **Consider GitHub Apps** for production

## Implementation Status

- ✅ GitHub CLI installed
- ✅ Git installed
- ❌ Authentication not configured (by design - user should provide)
- ✅ Code execution environment ready

## Next Steps

1. Update Morgus system prompt to explain GitHub auth requirements
2. Add helper function to check if GH_TOKEN is set
3. Provide clear error messages when auth is needed
4. Consider adding a `/configure-github` endpoint for users to set their token
