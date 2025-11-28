"""
Morgus Agent API Server
FastAPI server for the Morgus autonomous agent system
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

from database import DatabaseClient
from sandbox_e2b import E2BSandboxManager
from llm import ModelRouter as LLMClient

# Load environment variables
load_dotenv()

app = FastAPI(title="Morgus Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
db = DatabaseClient()
sandbox_manager = E2BSandboxManager()
llm = LLMClient()

class TaskCreate(BaseModel):
    title: str
    description: str
    user_id: Optional[str] = "default"

class CodeExecute(BaseModel):
    task_id: str
    code: str
    language: str = "python"

@app.get("/")
async def root():
    return {
        "message": "Morgus Agent API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/tasks")
async def create_task(task: TaskCreate):
    """Create a new task"""
    try:
        task_data = db.create_task(
            title=task.title,
            description=task.description
        )
        return task_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks")
async def list_tasks(user_id: str = "default", limit: int = 50):
    """List all tasks for a user"""
    try:
        tasks = db.get_tasks(user_id=user_id, limit=limit)
        return {"tasks": tasks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Get a specific task"""
    try:
        task = db.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        return task
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{task_id}/steps")
async def get_task_steps(task_id: str):
    """Get all steps for a task"""
    try:
        steps = db.get_task_steps(task_id)
        return {"steps": steps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/execute")
async def execute_code(request: CodeExecute):
    """Execute code in a sandbox"""
    try:
        result = sandbox_manager.execute_code(
            task_id=request.task_id,
            code=request.code,
            language=request.language
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sandbox/{task_id}/cleanup")
async def cleanup_sandbox(task_id: str):
    """Clean up a sandbox"""
    try:
        sandbox_manager.cleanup_sandbox(task_id)
        return {"message": "Sandbox cleaned up successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(message: str, task_id: Optional[str] = None):
    """Send a message to the LLM"""
    try:
        response = llm.chat(message, task_id=task_id)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
