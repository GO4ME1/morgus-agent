"""
E2B Sandbox Manager
Manages code execution in E2B sandboxes
"""
import os
from typing import Dict, Any, Optional
from e2b_code_interpreter.code_interpreter_sync import Sandbox as CodeInterpreter

class E2BSandboxManager:
    """Manages E2B sandbox instances for code execution"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("E2B_API_KEY")
        if not self.api_key:
            raise ValueError("E2B_API_KEY must be set in environment or passed to constructor")
        
        self.active_sandboxes: Dict[str, CodeInterpreter] = {}
    
    def create_sandbox(self, task_id: str) -> CodeInterpreter:
        """Create a new E2B sandbox for a task"""
        if task_id in self.active_sandboxes:
            return self.active_sandboxes[task_id]
        
        sandbox = CodeInterpreter(api_key=self.api_key)
        self.active_sandboxes[task_id] = sandbox
        return sandbox
    
    def get_sandbox(self, task_id: str) -> Optional[CodeInterpreter]:
        """Get an existing sandbox"""
        return self.active_sandboxes.get(task_id)
    
    def execute_code(self, task_id: str, code: str, language: str = "python") -> Dict[str, Any]:
        """Execute code in the sandbox"""
        sandbox = self.get_sandbox(task_id)
        if not sandbox:
            sandbox = self.create_sandbox(task_id)
        
        try:
            # Execute the code
            execution = sandbox.notebook.exec_cell(code)
            
            # Collect results
            results = {
                "success": not execution.error,
                "output": [],
                "error": None
            }
            
            # Process output
            if execution.results:
                for result in execution.results:
                    if hasattr(result, 'text'):
                        results["output"].append({"type": "text", "content": result.text})
                    elif hasattr(result, 'png'):
                        results["output"].append({"type": "image", "content": result.png})
                    elif hasattr(result, 'html'):
                        results["output"].append({"type": "html", "content": result.html})
            
            # Process logs (stdout/stderr)
            if execution.logs:
                if execution.logs.stdout:
                    for line in execution.logs.stdout:
                        results["output"].append({"type": "stdout", "content": line})
                if execution.logs.stderr:
                    for line in execution.logs.stderr:
                        results["output"].append({"type": "stderr", "content": line})
            
            # Process error
            if execution.error:
                results["error"] = {
                    "name": execution.error.name,
                    "value": execution.error.value,
                    "traceback": execution.error.traceback
                }
            
            return results
            
        except Exception as e:
            return {
                "success": False,
                "output": [],
                "error": {"name": "ExecutionError", "value": str(e), "traceback": ""}
            }
    
    def run_shell_command(self, task_id: str, command: str) -> Dict[str, Any]:
        """Run a shell command in the sandbox"""
        sandbox = self.get_sandbox(task_id)
        if not sandbox:
            sandbox = self.create_sandbox(task_id)
        
        try:
            # Use process to run shell commands
            process = sandbox.process.start(command)
            process.wait()
            
            return {
                "success": process.exit_code == 0,
                "exit_code": process.exit_code,
                "stdout": process.output.stdout,
                "stderr": process.output.stderr
            }
        except Exception as e:
            return {
                "success": False,
                "exit_code": -1,
                "stdout": "",
                "stderr": str(e)
            }
    
    def write_file(self, task_id: str, path: str, content: str) -> bool:
        """Write a file to the sandbox filesystem"""
        sandbox = self.get_sandbox(task_id)
        if not sandbox:
            sandbox = self.create_sandbox(task_id)
        
        try:
            sandbox.filesystem.write(path, content)
            return True
        except Exception:
            return False
    
    def read_file(self, task_id: str, path: str) -> Optional[str]:
        """Read a file from the sandbox filesystem"""
        sandbox = self.get_sandbox(task_id)
        if not sandbox:
            return None
        
        try:
            return sandbox.filesystem.read(path)
        except Exception:
            return None
    
    def list_files(self, task_id: str, path: str = "/") -> list:
        """List files in a directory"""
        sandbox = self.get_sandbox(task_id)
        if not sandbox:
            return []
        
        try:
            return sandbox.filesystem.list(path)
        except Exception:
            return []
    
    def cleanup_sandbox(self, task_id: str):
        """Clean up and close a sandbox"""
        sandbox = self.active_sandboxes.pop(task_id, None)
        if sandbox:
            try:
                sandbox.close()
            except Exception:
                pass
    
    def cleanup_all(self):
        """Clean up all active sandboxes"""
        for task_id in list(self.active_sandboxes.keys()):
            self.cleanup_sandbox(task_id)
