"""
Base classes for Morgus tools.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class Tool(ABC):
    """Base class for all Morgus tools."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Tool name."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Tool description."""
        pass
    
    @abstractmethod
    def get_schema(self) -> Dict[str, Any]:
        """
        Get OpenAI function calling schema for this tool.
        
        Returns:
            Dict with 'type', 'function' containing name, description, parameters
        """
        pass
    
    @abstractmethod
    def execute(self, **kwargs) -> str:
        """
        Execute the tool with given arguments.
        
        Args:
            **kwargs: Tool-specific arguments
            
        Returns:
            String result of tool execution
        """
        pass


class ToolRegistry:
    """Registry for managing available tools."""
    
    def __init__(self):
        self.tools: Dict[str, Tool] = {}
    
    def register(self, tool: Tool):
        """Register a tool."""
        self.tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def get_tool(self, name: str) -> Optional[Tool]:
        """Get a tool by name."""
        return self.tools.get(name)
    
    def get_all_schemas(self) -> List[Dict[str, Any]]:
        """Get OpenAI schemas for all registered tools."""
        return [tool.get_schema() for tool in self.tools.values()]
    
    def execute_tool(self, name: str, arguments: Dict[str, Any]) -> str:
        """
        Execute a tool by name with arguments.
        
        Args:
            name: Tool name
            arguments: Tool arguments dict
            
        Returns:
            Tool execution result
        """
        tool = self.get_tool(name)
        if not tool:
            return f"Error: Tool '{name}' not found"
        
        try:
            result = tool.execute(**arguments)
            logger.info(f"Tool {name} executed successfully")
            return result
        except Exception as e:
            error_msg = f"Error executing tool {name}: {str(e)}"
            logger.error(error_msg)
            return error_msg
