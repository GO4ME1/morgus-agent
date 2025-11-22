"""
User interaction tools for Morgus.
"""
from typing import Any, Dict
from .base import Tool
import logging

logger = logging.getLogger(__name__)


class NotifyUserTool(Tool):
    """Tool for sending notifications to the user."""
    
    def __init__(self, db_client, task_id: str):
        self.db_client = db_client
        self.task_id = task_id
    
    @property
    def name(self) -> str:
        return "notify_user"
    
    @property
    def description(self) -> str:
        return "Send a progress update or notification to the user"
    
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
                            "description": "Message to send to the user"
                        }
                    },
                    "required": ["message"]
                }
            }
        }
    
    def execute(self, message: str) -> str:
        try:
            # Log as a task step
            self.db_client.add_task_step(
                task_id=self.task_id,
                phase="NOTIFICATION",
                step_type="USER_NOTIFICATION",
                content=message
            )
            
            logger.info(f"User notification: {message}")
            return "Notification sent to user"
        
        except Exception as e:
            logger.error(f"Failed to send notification: {e}")
            return f"Error: Failed to send notification - {str(e)}"


class AskUserTool(Tool):
    """Tool for asking the user a question."""
    
    def __init__(self, db_client, task_id: str):
        self.db_client = db_client
        self.task_id = task_id
    
    @property
    def name(self) -> str:
        return "ask_user"
    
    @property
    def description(self) -> str:
        return "Ask the user a question and wait for their response"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "question": {
                            "type": "string",
                            "description": "Question to ask the user"
                        },
                        "options": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Optional list of predefined options"
                        }
                    },
                    "required": ["question"]
                }
            }
        }
    
    def execute(self, question: str, options: list = None) -> str:
        try:
            # Update task status to waiting for input
            self.db_client.update_task(
                task_id=self.task_id,
                updates={"status": "waiting_for_input"}
            )
            
            # Log the question as a task step
            metadata = {"options": options} if options else {}
            self.db_client.add_task_step(
                task_id=self.task_id,
                phase="USER_INPUT",
                step_type="USER_QUESTION",
                content=question,
                metadata=metadata
            )
            
            logger.info(f"Waiting for user input: {question}")
            
            # In a real implementation, this would pause execution
            # and wait for user response via the web UI
            # For now, return a placeholder
            return "User input requested. Task paused awaiting response."
        
        except Exception as e:
            logger.error(f"Failed to ask user: {e}")
            return f"Error: Failed to ask user - {str(e)}"


class UserTools:
    """Collection of user interaction tools."""
    
    @staticmethod
    def create_tools(db_client, task_id: str) -> list:
        """Create all user interaction tools."""
        return [
            NotifyUserTool(db_client, task_id),
            AskUserTool(db_client, task_id)
        ]
