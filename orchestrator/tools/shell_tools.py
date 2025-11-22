"""
Shell execution tools for Morgus.
"""
from typing import Any, Dict
from .base import Tool
from docker.models.containers import Container
import logging

logger = logging.getLogger(__name__)


class ShellExecTool(Tool):
    """Tool for executing shell commands."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "shell_exec"
    
    @property
    def description(self) -> str:
        return "Execute a shell command in the sandbox environment. Returns stdout, stderr, and exit code."
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "Shell command to execute"
                        },
                        "timeout": {
                            "type": "integer",
                            "description": "Optional timeout in seconds (default: 300)",
                            "default": 300
                        }
                    },
                    "required": ["command"]
                }
            }
        }
    
    def execute(self, command: str, timeout: int = 300) -> str:
        exit_code, stdout, stderr = self.sandbox_manager.exec_command(
            self.container,
            command,
            timeout=timeout
        )
        
        result = f"Exit code: {exit_code}\n"
        
        if stdout:
            result += f"\nStdout:\n{stdout}"
        
        if stderr:
            result += f"\nStderr:\n{stderr}"
        
        # Truncate very long output
        if len(result) > 5000:
            result = result[:5000] + f"\n\n... (truncated, total {len(result)} chars)"
        
        return result


class ShellTools:
    """Collection of shell execution tools."""
    
    @staticmethod
    def create_tools(sandbox_manager, container: Container) -> list:
        """Create all shell tools."""
        return [
            ShellExecTool(sandbox_manager, container)
        ]
