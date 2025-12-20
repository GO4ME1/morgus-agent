# GitHub Operations Skill

## Overview
This skill guides GitHub CLI operations for repository management, commits, pull requests, and collaboration.

## Prerequisites
- GitHub CLI (gh) is pre-installed
- Authentication is configured

## Common Operations

### Repository Operations
```bash
# Clone a repository
gh repo clone owner/repo

# Create a new repository
gh repo create repo-name --public --description "Description"

# Fork a repository
gh repo fork owner/repo

# View repository info
gh repo view owner/repo
```

### Issue Management
```bash
# List issues
gh issue list

# Create an issue
gh issue create --title "Bug report" --body "Description"

# Close an issue
gh issue close 123

# View an issue
gh issue view 123
```

### Pull Requests
```bash
# Create a PR
gh pr create --title "Feature" --body "Description"

# List PRs
gh pr list

# Merge a PR
gh pr merge 123

# Review a PR
gh pr review 123 --approve
```

### Workflow Operations
```bash
# List workflows
gh workflow list

# Run a workflow
gh workflow run workflow.yml

# View workflow runs
gh run list
```

## Best Practices
1. Always check current branch before operations
2. Use descriptive commit messages
3. Create feature branches for changes
4. Review changes before pushing
5. Use PR templates when available

## Error Handling
- Check authentication: `gh auth status`
- Verify repository access
- Handle rate limits gracefully
