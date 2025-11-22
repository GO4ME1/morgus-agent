"""
Git operation tools for Morgus.
"""
from typing import Any, Dict
from .base import Tool
from docker.models.containers import Container
import logging

logger = logging.getLogger(__name__)


class GitInitTool(Tool):
    """Tool for initializing a git repository."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "git_init"
    
    @property
    def description(self) -> str:
        return "Initialize a git repository in the current directory"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        }
    
    def execute(self) -> str:
        exit_code, stdout, stderr = self.sandbox_manager.exec_command(
            self.container,
            "git init && git config user.name 'Morgus Agent' && git config user.email 'morgus@go4me.ai'"
        )
        
        if exit_code == 0:
            return "Git repository initialized successfully"
        else:
            return f"Error initializing git: {stderr}"


class GitAddTool(Tool):
    """Tool for staging files."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "git_add"
    
    @property
    def description(self) -> str:
        return "Stage all changes for commit"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {},
                    "required": []
                }
            }
        }
    
    def execute(self) -> str:
        exit_code, stdout, stderr = self.sandbox_manager.exec_command(
            self.container,
            "git add ."
        )
        
        if exit_code == 0:
            return "All changes staged successfully"
        else:
            return f"Error staging changes: {stderr}"


class GitCommitTool(Tool):
    """Tool for committing changes."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "git_commit"
    
    @property
    def description(self) -> str:
        return "Commit staged changes with a message"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "message": {
                            "type": "string",
                            "description": "Commit message"
                        }
                    },
                    "required": ["message"]
                }
            }
        }
    
    def execute(self, message: str) -> str:
        # Escape message for shell
        escaped_message = message.replace("'", "'\\''")
        
        exit_code, stdout, stderr = self.sandbox_manager.exec_command(
            self.container,
            f"git commit -m '{escaped_message}'"
        )
        
        if exit_code == 0:
            return f"Committed successfully: {message}"
        else:
            return f"Error committing: {stderr}"


class GitPushTool(Tool):
    """Tool for pushing to remote."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "git_push"
    
    @property
    def description(self) -> str:
        return "Push commits to a remote repository"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "remote": {
                            "type": "string",
                            "description": "Remote name (default: origin)",
                            "default": "origin"
                        },
                        "branch": {
                            "type": "string",
                            "description": "Branch name (default: main)",
                            "default": "main"
                        }
                    },
                    "required": []
                }
            }
        }
    
    def execute(self, remote: str = "origin", branch: str = "main") -> str:
        exit_code, stdout, stderr = self.sandbox_manager.exec_command(
            self.container,
            f"git push {remote} {branch}"
        )
        
        if exit_code == 0:
            return f"Pushed to {remote}/{branch} successfully"
        else:
            return f"Error pushing: {stderr}"


class GitTools:
    """Collection of git operation tools."""
    
    @staticmethod
    def create_tools(sandbox_manager, container: Container) -> list:
        """Create all git tools."""
        return [
            GitInitTool(sandbox_manager, container),
            GitAddTool(sandbox_manager, container),
            GitCommitTool(sandbox_manager, container),
            GitPushTool(sandbox_manager, container)
        ]
