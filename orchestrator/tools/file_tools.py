"""
File operation tools for Morgus.
"""
from typing import Any, Dict
from .base import Tool
from docker.models.containers import Container
import logging

logger = logging.getLogger(__name__)


class FileReadTool(Tool):
    """Tool for reading file contents."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "file_read"
    
    @property
    def description(self) -> str:
        return "Read the contents of a file from the project workspace"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the file (relative to project root)"
                        }
                    },
                    "required": ["path"]
                }
            }
        }
    
    def execute(self, path: str) -> str:
        content = self.sandbox_manager.read_file(self.container, path)
        if content is None:
            return f"Error: Could not read file {path}"
        
        # Truncate very long files
        if len(content) > 10000:
            return content[:10000] + f"\n\n... (truncated, total {len(content)} chars)"
        
        return content


class FileWriteTool(Tool):
    """Tool for writing file contents."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "file_write"
    
    @property
    def description(self) -> str:
        return "Create or overwrite a file with given content"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the file (relative to project root)"
                        },
                        "content": {
                            "type": "string",
                            "description": "Content to write to the file"
                        }
                    },
                    "required": ["path", "content"]
                }
            }
        }
    
    def execute(self, path: str, content: str) -> str:
        success = self.sandbox_manager.write_file(self.container, path, content)
        if success:
            return f"Successfully wrote {len(content)} characters to {path}"
        else:
            return f"Error: Failed to write to {path}"


class FileListTool(Tool):
    """Tool for listing files in a directory."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "file_list"
    
    @property
    def description(self) -> str:
        return "List files and directories in a given path"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Directory path (default: current directory)",
                            "default": "."
                        }
                    },
                    "required": []
                }
            }
        }
    
    def execute(self, path: str = ".") -> str:
        listing = self.sandbox_manager.list_files(self.container, path)
        if listing is None:
            return f"Error: Could not list directory {path}"
        return listing


class FileTools:
    """Collection of file operation tools."""
    
    @staticmethod
    def create_tools(sandbox_manager, container: Container) -> list:
        """Create all file tools."""
        return [
            FileReadTool(sandbox_manager, container),
            FileWriteTool(sandbox_manager, container),
            FileListTool(sandbox_manager, container)
        ]
