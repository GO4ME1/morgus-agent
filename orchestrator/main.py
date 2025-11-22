"""
Main orchestrator for Morgus autonomous agent system.
"""
import logging
import time
from typing import Dict, Any, Optional
from config import Config
from llm import LLMOrchestrator
from database import DatabaseClient
from sandbox import SandboxManager
from tools import ToolRegistry, FileTools, ShellTools, GitTools, WebTools, DeployTools, UserTools

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class TaskPhase:
    """Task lifecycle phases."""
    RESEARCH = "RESEARCH"
    PLAN = "PLAN"
    BUILD = "BUILD"
    EXECUTE = "EXECUTE"
    FINALIZE = "FINALIZE"


class TaskOrchestrator:
    """Main orchestrator for executing tasks."""
    
    def __init__(self):
        self.llm = LLMOrchestrator()
        self.db = DatabaseClient()
        self.sandbox_manager = SandboxManager()
        self.current_task_id: Optional[str] = None
        self.current_container = None
        self.tool_registry = ToolRegistry()
    
    def execute_task(self, task_id: str) -> bool:
        """
        Execute a task through all phases.
        
        Args:
            task_id: Task ID to execute
            
        Returns:
            True if successful, False otherwise
        """
        self.current_task_id = task_id
        
        try:
            # Get task details
            task = self.db.get_task(task_id)
            if not task:
                logger.error(f"Task {task_id} not found")
                return False
            
            logger.info(f"Starting task {task_id}: {task['title']}")
            
            # Update task status
            self.db.update_task(task_id, {"status": "running"})
            
            # Create sandbox
            self.current_container = self.sandbox_manager.create_sandbox(task_id)
            
            # Register tools
            self._register_tools()
            
            # Reset LLM conversation
            self.llm.reset_conversation()
            
            # Execute phases
            phases = [
                TaskPhase.RESEARCH,
                TaskPhase.PLAN,
                TaskPhase.BUILD,
                TaskPhase.EXECUTE,
                TaskPhase.FINALIZE
            ]
            
            for phase in phases:
                logger.info(f"Entering phase: {phase}")
                self.db.update_task(task_id, {"phase": phase})
                
                success = self._execute_phase(task, phase)
                
                if not success:
                    logger.error(f"Phase {phase} failed")
                    self.db.update_task(task_id, {"status": "error"})
                    return False
            
            # Mark task as completed
            self.db.update_task(task_id, {
                "status": "completed",
                "phase": "FINALIZE"
            })
            
            logger.info(f"Task {task_id} completed successfully")
            return True
        
        except Exception as e:
            logger.error(f"Task execution failed: {e}", exc_info=True)
            self.db.update_task(task_id, {"status": "error"})
            return False
        
        finally:
            # Cleanup sandbox
            if self.current_container:
                self.sandbox_manager.cleanup_sandbox(self.current_container)
    
    def _register_tools(self):
        """Register all available tools."""
        # File tools
        for tool in FileTools.create_tools(self.sandbox_manager, self.current_container):
            self.tool_registry.register(tool)
        
        # Shell tools
        for tool in ShellTools.create_tools(self.sandbox_manager, self.current_container):
            self.tool_registry.register(tool)
        
        # Git tools
        for tool in GitTools.create_tools(self.sandbox_manager, self.current_container):
            self.tool_registry.register(tool)
        
        # Web tools
        for tool in WebTools.create_tools():
            self.tool_registry.register(tool)
        
        # Deploy tools
        for tool in DeployTools.create_tools(self.sandbox_manager, self.current_container):
            self.tool_registry.register(tool)
        
        # User tools
        for tool in UserTools.create_tools(self.db, self.current_task_id):
            self.tool_registry.register(tool)
    
    def _execute_phase(self, task: Dict[str, Any], phase: str) -> bool:
        """
        Execute a single phase of the task.
        
        Args:
            task: Task dict
            phase: Phase name
            
        Returns:
            True if successful, False otherwise
        """
        # Build phase-specific prompt
        prompt = self._build_phase_prompt(task, phase)
        
        # Log phase start
        self.db.add_task_step(
            task_id=self.current_task_id,
            phase=phase,
            step_type="PHASE_START",
            content=f"Starting {phase} phase"
        )
        
        # Execute agent loop for this phase
        iteration = 0
        max_iterations = Config.MAX_ITERATIONS
        
        while iteration < max_iterations:
            iteration += 1
            logger.info(f"Phase {phase}, iteration {iteration}")
            
            # Get LLM response
            response = self.llm.get_completion(
                user_message=prompt if iteration == 1 else "Continue with the task.",
                phase=phase,
                tools=self.tool_registry.get_all_schemas()
            )
            
            # Log LLM response
            if response.get("content"):
                self.db.add_task_step(
                    task_id=self.current_task_id,
                    phase=phase,
                    step_type="LLM_RESPONSE",
                    content=response["content"]
                )
            
            # Check for tool calls
            tool_calls = self.llm.parse_tool_calls(response)
            
            if not tool_calls:
                # No tool calls, check if phase is complete
                if self._is_phase_complete(response, phase):
                    logger.info(f"Phase {phase} completed")
                    self.db.add_task_step(
                        task_id=self.current_task_id,
                        phase=phase,
                        step_type="PHASE_COMPLETE",
                        content=f"{phase} phase completed"
                    )
                    return True
                
                # Continue iteration
                continue
            
            # Execute tool calls
            for tool_call in tool_calls:
                tool_name = tool_call["name"]
                tool_args = tool_call["arguments"]
                
                logger.info(f"Executing tool: {tool_name}")
                
                # Log tool call
                self.db.add_task_step(
                    task_id=self.current_task_id,
                    phase=phase,
                    step_type="TOOL_CALL",
                    content=f"Tool: {tool_name}",
                    metadata={"arguments": tool_args}
                )
                
                # Execute tool
                result = self.tool_registry.execute_tool(tool_name, tool_args)
                
                # Log tool result
                self.db.add_task_step(
                    task_id=self.current_task_id,
                    phase=phase,
                    step_type="TOOL_RESULT",
                    content=result[:1000]  # Truncate for DB
                )
                
                # Add result to LLM context
                self.llm.add_tool_result(tool_call["id"], result)
        
        # Max iterations reached
        logger.warning(f"Phase {phase} reached max iterations")
        return False
    
    def _build_phase_prompt(self, task: Dict[str, Any], phase: str) -> str:
        """Build a prompt for a specific phase."""
        base_prompt = f"""Task: {task['title']}
Description: {task['description']}

Current Phase: {phase}
"""
        
        if phase == TaskPhase.RESEARCH:
            return base_prompt + """
Your goal in this phase is to gather information and understand the requirements.

Actions to take:
1. Search for relevant information, libraries, frameworks, or examples
2. Fetch documentation or tutorials if needed
3. Summarize your findings and identify the best approach

Use the search_web and fetch_url tools to gather information.
When you have enough information, explain your findings and move to the next phase.
"""
        
        elif phase == TaskPhase.PLAN:
            return base_prompt + """
Your goal in this phase is to create a detailed implementation plan.

Actions to take:
1. Break down the task into concrete sub-tasks
2. Identify required files, dependencies, and configurations
3. Outline the step-by-step implementation approach
4. Consider potential challenges and how to address them

Provide a clear, numbered plan that you will follow in the BUILD phase.
"""
        
        elif phase == TaskPhase.BUILD:
            return base_prompt + """
Your goal in this phase is to implement the solution.

Actions to take:
1. Initialize project structure (git, package.json, etc.)
2. Create all necessary files and write code
3. Install dependencies
4. Test code as you go (run builds, check for errors)
5. Fix any issues that arise

Use file_write, shell_exec, and git tools to build the project.
Iterate until the solution is complete and working.
"""
        
        elif phase == TaskPhase.EXECUTE:
            return base_prompt + """
Your goal in this phase is to test and deploy the solution.

Actions to take:
1. Run tests or verify the application works
2. Build the production version if needed
3. Deploy to Cloudflare Pages using cloudflare_deploy
4. Verify the deployment is successful
5. Save the deployment URL as an artifact

Use shell_exec for testing and cloudflare_deploy for deployment.
"""
        
        elif phase == TaskPhase.FINALIZE:
            return base_prompt + """
Your goal in this phase is to wrap up the task.

Actions to take:
1. Commit all changes to git
2. Push to remote repository if configured
3. Summarize what was accomplished
4. Report final results to the user

Use git tools to commit and push code.
Use notify_user to send a final summary.
"""
        
        return base_prompt
    
    def _is_phase_complete(self, response: Dict[str, Any], phase: str) -> bool:
        """
        Check if a phase is complete based on LLM response.
        
        Args:
            response: LLM response dict
            phase: Current phase
            
        Returns:
            True if phase is complete
        """
        content = response.get("content", "").lower()
        
        # Look for completion indicators
        completion_phrases = [
            "phase complete",
            "moving to next phase",
            "ready to proceed",
            f"{phase.lower()} is complete",
            "finished with",
            "completed successfully"
        ]
        
        return any(phrase in content for phrase in completion_phrases)


class OrchestratorService:
    """Service that polls for pending tasks and executes them."""
    
    def __init__(self):
        self.db = DatabaseClient()
        self.orchestrator = TaskOrchestrator()
    
    def run(self):
        """Main service loop."""
        logger.info("Morgus Orchestrator Service started")
        
        while True:
            try:
                # Get pending tasks
                pending_tasks = self.db.get_pending_tasks()
                
                for task in pending_tasks:
                    task_id = task["id"]
                    logger.info(f"Found pending task: {task_id}")
                    
                    # Execute task
                    self.orchestrator.execute_task(task_id)
                
                # Sleep before next poll
                time.sleep(5)
            
            except KeyboardInterrupt:
                logger.info("Shutting down orchestrator service")
                break
            
            except Exception as e:
                logger.error(f"Error in orchestrator service: {e}", exc_info=True)
                time.sleep(10)


def main():
    """Main entry point."""
    service = OrchestratorService()
    service.run()


if __name__ == "__main__":
    main()
