"""
LLM integration and model router for Morgus.
"""
import json
from typing import Any, Dict, List, Optional, Union
from openai import OpenAI
from config import Config
import logging

logger = logging.getLogger(__name__)


class ModelRouter:
    """Routes LLM requests to appropriate models based on task type."""
    
    def __init__(self):
        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)
        self.default_model = Config.DEFAULT_MODEL
        self.code_model = Config.CODE_MODEL
    
    def select_model(self, phase: str, task_type: Optional[str] = None) -> str:
        """
        Select appropriate model based on phase and task type.
        
        Args:
            phase: Current task phase (RESEARCH, PLAN, BUILD, EXECUTE, FINALIZE)
            task_type: Optional task type hint
            
        Returns:
            Model identifier string
        """
        # For BUILD phase with heavy coding, use specialized model if available
        if phase == "BUILD" and self.code_model != self.default_model:
            return self.code_model
        
        # Default to general model for all other phases
        return self.default_model
    
    def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        tools: Optional[List[Dict]] = None,
        tool_choice: Optional[Union[str, Dict]] = None
    ) -> Dict[str, Any]:
        """
        Make a chat completion request.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model to use (defaults to default_model)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            tools: Optional list of tool definitions
            tool_choice: Optional tool choice strategy
            
        Returns:
            Response dict from OpenAI API
        """
        model = model or self.default_model
        temperature = temperature if temperature is not None else Config.TEMPERATURE
        max_tokens = max_tokens or Config.MAX_TOKENS
        
        try:
            kwargs = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            if tools:
                kwargs["tools"] = tools
                if tool_choice:
                    kwargs["tool_choice"] = tool_choice
            
            response = self.client.chat.completions.create(**kwargs)
            
            return {
                "content": response.choices[0].message.content,
                "tool_calls": getattr(response.choices[0].message, "tool_calls", None),
                "finish_reason": response.choices[0].finish_reason,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
        
        except Exception as e:
            logger.error(f"LLM request failed: {str(e)}")
            raise


class LLMOrchestrator:
    """Main LLM orchestrator for Morgus agent."""
    
    def __init__(self):
        self.router = ModelRouter()
        self.conversation_history: List[Dict[str, str]] = []
        self.system_prompt = self._build_system_prompt()
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt that defines Morgus's role and capabilities."""
        return """You are Morgus, an autonomous AI agent that takes high-level goals and delivers complete, working solutions.

Your capabilities include:
- Analyzing requirements and gathering information
- Creating detailed implementation plans
- Writing and debugging code
- Executing commands and running tests
- Deploying applications to production
- Managing version control with git

You operate in a structured 5-phase workflow:

1. RESEARCH: Gather information, understand requirements, explore existing solutions
2. PLAN: Break down the goal into actionable sub-tasks with clear steps
3. BUILD: Generate code, configuration files, and other artifacts
4. EXECUTE: Test the solution and deploy it to production
5. FINALIZE: Clean up, commit to git, and report results

Available tools:
- file_read(path): Read file contents
- file_write(path, content): Create or overwrite a file
- file_append(path, content): Append to a file
- file_modify(search, replace): Search and replace in a file
- file_list(dir): List files in a directory
- shell_exec(command): Execute a shell command
- git_init(): Initialize git repository
- git_add(): Stage all changes
- git_commit(message): Commit changes
- git_push(remote, branch): Push to remote
- search_web(query): Search the web for information
- fetch_url(url): Fetch and parse a webpage
- cloudflare_deploy(project_path): Deploy to Cloudflare Pages
- notify_user(message): Send a progress update to the user
- ask_user(question, options): Ask the user for input

Security rules:
- Only use provided tools - never attempt to access the host system directly
- All file operations are restricted to the project directory
- Shell commands are validated against a whitelist
- Never expose or log API keys or secrets
- If a command might be dangerous, ask the user for confirmation

Best practices:
- Think step-by-step and explain your reasoning
- Test code before deploying
- Handle errors gracefully and retry when appropriate
- Keep the user informed of progress
- Commit code with clear, descriptive messages
- Clean up temporary files and resources

When you receive a task, analyze it carefully, devise a plan, and execute it autonomously. Use tools as needed and provide clear updates on your progress."""
    
    def reset_conversation(self):
        """Reset conversation history."""
        self.conversation_history = []
    
    def add_message(self, role: str, content: str):
        """Add a message to conversation history."""
        self.conversation_history.append({"role": role, "content": content})
    
    def get_completion(
        self,
        user_message: str,
        phase: str,
        tools: Optional[List[Dict]] = None,
        include_history: bool = True
    ) -> Dict[str, Any]:
        """
        Get a completion from the LLM.
        
        Args:
            user_message: The user's message or prompt
            phase: Current task phase
            tools: Optional list of available tools
            include_history: Whether to include conversation history
            
        Returns:
            Response dict from the model
        """
        # Build messages
        messages = [{"role": "system", "content": self.system_prompt}]
        
        if include_history:
            messages.extend(self.conversation_history)
        
        messages.append({"role": "user", "content": user_message})
        
        # Select appropriate model
        model = self.router.select_model(phase)
        
        # Get completion
        response = self.router.chat_completion(
            messages=messages,
            model=model,
            tools=tools,
            tool_choice="auto" if tools else None
        )
        
        # Update history
        self.add_message("user", user_message)
        if response["content"]:
            self.add_message("assistant", response["content"])
        
        return response
    
    def parse_tool_calls(self, response: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Parse tool calls from LLM response.
        
        Args:
            response: Response dict from get_completion
            
        Returns:
            List of tool call dicts with 'name' and 'arguments'
        """
        tool_calls = response.get("tool_calls")
        if not tool_calls:
            return []
        
        parsed_calls = []
        for call in tool_calls:
            try:
                parsed_calls.append({
                    "id": call.id,
                    "name": call.function.name,
                    "arguments": json.loads(call.function.arguments)
                })
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse tool arguments: {e}")
                continue
        
        return parsed_calls
    
    def add_tool_result(self, tool_call_id: str, result: str):
        """Add a tool execution result to conversation history."""
        self.conversation_history.append({
            "role": "tool",
            "tool_call_id": tool_call_id,
            "content": result
        })
