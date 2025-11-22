"""
Supabase database client for Morgus.
"""
from typing import Any, Dict, List, Optional
from supabase import create_client, Client
from config import Config
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class DatabaseClient:
    """Client for interacting with Supabase database."""
    
    def __init__(self):
        self.client: Client = create_client(
            Config.SUPABASE_URL,
            Config.SUPABASE_SERVICE_KEY
        )
    
    # Task operations
    
    def create_task(
        self,
        title: str,
        description: str,
        model: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new task.
        
        Args:
            title: Task title
            description: Task description/goal
            model: Model to use (optional)
            
        Returns:
            Created task record
        """
        try:
            data = {
                "title": title,
                "description": description,
                "status": "pending",
                "phase": "RESEARCH",
                "model": model or Config.DEFAULT_MODEL,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            response = self.client.table("tasks").insert(data).execute()
            return response.data[0] if response.data else None
        
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            raise
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get a task by ID."""
        try:
            response = self.client.table("tasks").select("*").eq("id", task_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to get task {task_id}: {e}")
            return None
    
    def update_task(
        self,
        task_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update a task.
        
        Args:
            task_id: Task ID
            updates: Dict of fields to update
            
        Returns:
            Updated task record
        """
        try:
            updates["updated_at"] = datetime.utcnow().isoformat()
            response = self.client.table("tasks").update(updates).eq("id", task_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Failed to update task {task_id}: {e}")
            raise
    
    def get_pending_tasks(self) -> List[Dict[str, Any]]:
        """Get all pending tasks."""
        try:
            response = self.client.table("tasks").select("*").eq("status", "pending").execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Failed to get pending tasks: {e}")
            return []
    
    # Task step operations
    
    def add_task_step(
        self,
        task_id: str,
        phase: str,
        step_type: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Add a step to a task's execution log.
        
        Args:
            task_id: Task ID
            phase: Current phase (RESEARCH, PLAN, BUILD, EXECUTE, FINALIZE)
            step_type: Type of step (e.g., "PLAN", "TOOL_CALL", "RESULT")
            content: Step content/description
            metadata: Optional metadata dict
            
        Returns:
            Created step record
        """
        try:
            data = {
                "task_id": task_id,
                "phase": phase,
                "type": step_type,
                "content": content,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.client.table("task_steps").insert(data).execute()
            return response.data[0] if response.data else None
        
        except Exception as e:
            logger.error(f"Failed to add task step: {e}")
            raise
    
    def get_task_steps(self, task_id: str) -> List[Dict[str, Any]]:
        """Get all steps for a task."""
        try:
            response = (
                self.client.table("task_steps")
                .select("*")
                .eq("task_id", task_id)
                .order("created_at")
                .execute()
            )
            return response.data or []
        except Exception as e:
            logger.error(f"Failed to get task steps for {task_id}: {e}")
            return []
    
    # Artifact operations
    
    def add_artifact(
        self,
        task_id: str,
        artifact_type: str,
        name: str,
        url: Optional[str] = None,
        path: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Add an artifact (output) for a task.
        
        Args:
            task_id: Task ID
            artifact_type: Type (e.g., "deployment", "repository", "file")
            name: Artifact name
            url: Optional URL
            path: Optional file path
            metadata: Optional metadata
            
        Returns:
            Created artifact record
        """
        try:
            data = {
                "task_id": task_id,
                "type": artifact_type,
                "name": name,
                "url": url,
                "path": path,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.client.table("artifacts").insert(data).execute()
            return response.data[0] if response.data else None
        
        except Exception as e:
            logger.error(f"Failed to add artifact: {e}")
            raise
    
    def get_task_artifacts(self, task_id: str) -> List[Dict[str, Any]]:
        """Get all artifacts for a task."""
        try:
            response = (
                self.client.table("artifacts")
                .select("*")
                .eq("task_id", task_id)
                .execute()
            )
            return response.data or []
        except Exception as e:
            logger.error(f"Failed to get artifacts for {task_id}: {e}")
            return []
    
    # Knowledge base operations (for future vector memory)
    
    def store_knowledge(
        self,
        content: str,
        embedding: List[float],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Store knowledge with vector embedding.
        
        Args:
            content: Text content
            embedding: Vector embedding
            metadata: Optional metadata
            
        Returns:
            Created knowledge record
        """
        try:
            data = {
                "content": content,
                "embedding": embedding,
                "metadata": metadata or {},
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.client.table("knowledge").insert(data).execute()
            return response.data[0] if response.data else None
        
        except Exception as e:
            logger.error(f"Failed to store knowledge: {e}")
            raise
    
    def search_knowledge(
        self,
        query_embedding: List[float],
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search knowledge base using vector similarity.
        
        Args:
            query_embedding: Query vector
            limit: Maximum results to return
            
        Returns:
            List of matching knowledge records
        """
        # This would use pgvector similarity search
        # For now, placeholder implementation
        try:
            # TODO: Implement vector similarity search with pgvector
            # response = self.client.rpc('match_knowledge', {
            #     'query_embedding': query_embedding,
            #     'match_threshold': 0.7,
            #     'match_count': limit
            # }).execute()
            # return response.data or []
            return []
        except Exception as e:
            logger.error(f"Failed to search knowledge: {e}")
            return []
