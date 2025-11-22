"""
Docker sandbox manager for secure code execution.
"""
import docker
from docker.models.containers import Container
from typing import Dict, Optional, Tuple
import logging
import tempfile
import os
from config import Config

logger = logging.getLogger(__name__)


class SandboxManager:
    """Manages Docker containers for sandboxed code execution."""
    
    def __init__(self):
        try:
            self.docker_client = docker.from_env()
        except Exception as e:
            logger.error(f"Failed to initialize Docker client: {e}")
            raise
    
    def create_sandbox(self, task_id: str, working_dir: Optional[str] = None) -> Container:
        """
        Create a new sandbox container for a task.
        
        Args:
            task_id: Unique task identifier
            working_dir: Optional host directory to mount
            
        Returns:
            Docker container object
        """
        try:
            # Create or use working directory
            if not working_dir:
                working_dir = tempfile.mkdtemp(prefix=f"morgus_task_{task_id}_")
            
            # Container configuration
            container_name = f"morgus_sandbox_{task_id}"
            
            # Environment variables (without secrets)
            environment = {
                "TASK_ID": task_id,
                "DEBIAN_FRONTEND": "noninteractive"
            }
            
            # Create container
            container = self.docker_client.containers.run(
                image=Config.SANDBOX_IMAGE,
                name=container_name,
                detach=True,
                remove=False,  # We'll remove manually after cleanup
                working_dir="/workspace",
                volumes={
                    working_dir: {"bind": "/workspace", "mode": "rw"}
                },
                environment=environment,
                mem_limit=Config.SANDBOX_MEMORY_LIMIT,
                cpu_quota=int(float(Config.SANDBOX_CPU_LIMIT) * 100000),
                network_mode="bridge",  # Isolated network
                security_opt=["no-new-privileges"],
                cap_drop=["ALL"],  # Drop all capabilities
                cap_add=["CHOWN", "DAC_OVERRIDE", "FOWNER", "SETGID", "SETUID"],
                read_only=False,  # Need write access to workspace
                command="tail -f /dev/null"  # Keep container running
            )
            
            logger.info(f"Created sandbox container {container_name}")
            return container
        
        except Exception as e:
            logger.error(f"Failed to create sandbox: {e}")
            raise
    
    def exec_command(
        self,
        container: Container,
        command: str,
        timeout: Optional[int] = None
    ) -> Tuple[int, str, str]:
        """
        Execute a command in the sandbox.
        
        Args:
            container: Docker container
            command: Command to execute
            timeout: Optional timeout in seconds
            
        Returns:
            Tuple of (exit_code, stdout, stderr)
        """
        timeout = timeout or Config.SANDBOX_TIMEOUT
        
        try:
            # Validate command
            if not self._is_command_allowed(command):
                raise ValueError(f"Command not allowed: {command}")
            
            # Execute command
            exec_result = container.exec_run(
                cmd=f"/bin/bash -c '{command}'",
                workdir="/workspace",
                demux=True,
                environment={}
            )
            
            exit_code = exec_result.exit_code
            stdout = exec_result.output[0].decode() if exec_result.output[0] else ""
            stderr = exec_result.output[1].decode() if exec_result.output[1] else ""
            
            logger.info(f"Command executed: {command[:100]}... (exit: {exit_code})")
            
            return exit_code, stdout, stderr
        
        except Exception as e:
            logger.error(f"Command execution failed: {e}")
            return 1, "", str(e)
    
    def _is_command_allowed(self, command: str) -> bool:
        """
        Check if a command is allowed based on whitelist/blacklist.
        
        Args:
            command: Command string to validate
            
        Returns:
            True if allowed, False otherwise
        """
        # Check for blocked commands
        for blocked in Config.BLOCKED_COMMANDS:
            if blocked in command.lower():
                logger.warning(f"Blocked command detected: {blocked}")
                return False
        
        # Extract first word (the actual command)
        cmd_parts = command.strip().split()
        if not cmd_parts:
            return False
        
        first_cmd = cmd_parts[0].split("/")[-1]  # Handle paths like /usr/bin/node
        
        # Check if command is in allowed list
        if first_cmd not in Config.ALLOWED_COMMANDS:
            logger.warning(f"Command not in whitelist: {first_cmd}")
            return False
        
        return True
    
    def read_file(self, container: Container, file_path: str) -> Optional[str]:
        """
        Read a file from the sandbox.
        
        Args:
            container: Docker container
            file_path: Path to file (relative to /workspace)
            
        Returns:
            File contents or None if error
        """
        try:
            # Validate path (prevent directory traversal)
            if ".." in file_path or file_path.startswith("/"):
                raise ValueError("Invalid file path")
            
            exit_code, stdout, stderr = self.exec_command(
                container,
                f"cat {file_path}"
            )
            
            if exit_code == 0:
                return stdout
            else:
                logger.error(f"Failed to read file {file_path}: {stderr}")
                return None
        
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return None
    
    def write_file(
        self,
        container: Container,
        file_path: str,
        content: str
    ) -> bool:
        """
        Write content to a file in the sandbox.
        
        Args:
            container: Docker container
            file_path: Path to file (relative to /workspace)
            content: Content to write
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Validate path
            if ".." in file_path or file_path.startswith("/"):
                raise ValueError("Invalid file path")
            
            # Escape content for shell
            escaped_content = content.replace("'", "'\\''")
            
            # Create directory if needed
            dir_path = os.path.dirname(file_path)
            if dir_path:
                self.exec_command(container, f"mkdir -p {dir_path}")
            
            # Write file
            exit_code, stdout, stderr = self.exec_command(
                container,
                f"cat > {file_path} << 'MORGUS_EOF'\n{escaped_content}\nMORGUS_EOF"
            )
            
            return exit_code == 0
        
        except Exception as e:
            logger.error(f"Error writing file: {e}")
            return False
    
    def list_files(self, container: Container, directory: str = ".") -> Optional[str]:
        """
        List files in a directory.
        
        Args:
            container: Docker container
            directory: Directory path
            
        Returns:
            File listing or None if error
        """
        try:
            exit_code, stdout, stderr = self.exec_command(
                container,
                f"ls -la {directory}"
            )
            
            if exit_code == 0:
                return stdout
            else:
                return None
        
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return None
    
    def cleanup_sandbox(self, container: Container):
        """
        Stop and remove a sandbox container.
        
        Args:
            container: Docker container to clean up
        """
        try:
            container.stop(timeout=10)
            container.remove()
            logger.info(f"Cleaned up sandbox container {container.name}")
        except Exception as e:
            logger.error(f"Error cleaning up sandbox: {e}")
    
    def build_sandbox_image(self) -> bool:
        """
        Build the sandbox Docker image.
        
        Returns:
            True if successful, False otherwise
        """
        try:
            dockerfile_path = os.path.join(
                os.path.dirname(__file__),
                "..",
                "docker"
            )
            
            logger.info("Building sandbox image...")
            image, build_logs = self.docker_client.images.build(
                path=dockerfile_path,
                tag=Config.SANDBOX_IMAGE,
                rm=True
            )
            
            for log in build_logs:
                if "stream" in log:
                    logger.debug(log["stream"].strip())
            
            logger.info(f"Successfully built sandbox image: {Config.SANDBOX_IMAGE}")
            return True
        
        except Exception as e:
            logger.error(f"Failed to build sandbox image: {e}")
            return False
