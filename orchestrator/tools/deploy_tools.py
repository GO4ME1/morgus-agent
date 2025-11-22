"""
Deployment tools for Morgus (Cloudflare Pages/Workers).
"""
from typing import Any, Dict
from .base import Tool
from docker.models.containers import Container
import logging

logger = logging.getLogger(__name__)


class CloudflareDeployTool(Tool):
    """Tool for deploying to Cloudflare Pages."""
    
    def __init__(self, sandbox_manager, container: Container):
        self.sandbox_manager = sandbox_manager
        self.container = container
    
    @property
    def name(self) -> str:
        return "cloudflare_deploy"
    
    @property
    def description(self) -> str:
        return "Deploy a static site or application to Cloudflare Pages using Wrangler"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "directory": {
                            "type": "string",
                            "description": "Directory containing the built site (e.g., 'dist', 'build', '.')",
                            "default": "dist"
                        },
                        "project_name": {
                            "type": "string",
                            "description": "Cloudflare Pages project name (optional, uses default if not provided)"
                        }
                    },
                    "required": ["directory"]
                }
            }
        }
    
    def execute(self, directory: str = "dist", project_name: str = None) -> str:
        try:
            from config import Config
            
            # Use default project name if not provided
            if not project_name:
                project_name = Config.CLOUDFLARE_PROJECT_NAME
            
            # Build wrangler command
            # Note: CLOUDFLARE_API_TOKEN should be set in container environment
            command = f"npx wrangler pages publish {directory} --project-name={project_name}"
            
            exit_code, stdout, stderr = self.sandbox_manager.exec_command(
                self.container,
                command,
                timeout=180  # 3 minutes for deployment
            )
            
            if exit_code == 0:
                # Try to extract URL from output
                url = None
                for line in stdout.split("\n"):
                    if "https://" in line and "pages.dev" in line:
                        # Extract URL
                        parts = line.split("https://")
                        if len(parts) > 1:
                            url = "https://" + parts[1].split()[0]
                            break
                
                result = f"Deployment successful!\n"
                if url:
                    result += f"URL: {url}\n"
                result += f"\nOutput:\n{stdout}"
                
                return result
            else:
                return f"Deployment failed.\nError: {stderr}\nOutput: {stdout}"
        
        except Exception as e:
            logger.error(f"Deployment failed: {e}")
            return f"Error: Deployment failed - {str(e)}"


class DeployTools:
    """Collection of deployment tools."""
    
    @staticmethod
    def create_tools(sandbox_manager, container: Container) -> list:
        """Create all deployment tools."""
        return [
            CloudflareDeployTool(sandbox_manager, container)
        ]
