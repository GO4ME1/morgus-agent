"""
Configuration management for Morgus orchestrator.
"""
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Central configuration for Morgus system."""
    
    # OpenAI Configuration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gpt-4")
    CODE_MODEL: str = os.getenv("CODE_MODEL", "gpt-4")  # Can be specialized later
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "4096"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    
    # Cloudflare Configuration
    CLOUDFLARE_API_TOKEN: str = os.getenv("CLOUDFLARE_API_TOKEN", "")
    CLOUDFLARE_ACCOUNT_ID: str = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
    CLOUDFLARE_PROJECT_NAME: str = os.getenv("CLOUDFLARE_PROJECT_NAME", "morgus-deploy")
    
    # GitHub Configuration
    GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN")
    GITHUB_REPO_URL: Optional[str] = os.getenv("GITHUB_REPO_URL")
    
    # Search Configuration
    BING_SEARCH_API_KEY: Optional[str] = os.getenv("BING_SEARCH_API_KEY")
    GOOGLE_SEARCH_API_KEY: Optional[str] = os.getenv("GOOGLE_SEARCH_API_KEY")
    GOOGLE_SEARCH_ENGINE_ID: Optional[str] = os.getenv("GOOGLE_SEARCH_ENGINE_ID")
    
    # Sandbox Configuration
    SANDBOX_IMAGE: str = os.getenv("SANDBOX_IMAGE", "morgus-sandbox:latest")
    SANDBOX_TIMEOUT: int = int(os.getenv("SANDBOX_TIMEOUT", "300"))  # 5 minutes
    SANDBOX_MEMORY_LIMIT: str = os.getenv("SANDBOX_MEMORY_LIMIT", "2g")
    SANDBOX_CPU_LIMIT: str = os.getenv("SANDBOX_CPU_LIMIT", "2.0")
    SANDBOX_DISK_LIMIT: str = os.getenv("SANDBOX_DISK_LIMIT", "10g")
    
    # Security Configuration
    ALLOWED_COMMANDS: list = [
        "npm", "node", "pnpm", "yarn",
        "python", "python3", "pip", "pip3",
        "git", "gcc", "g++", "make",
        "wrangler", "npx", "tsc",
        "ls", "cat", "echo", "mkdir", "cd", "pwd",
        "cp", "mv", "rm", "touch", "chmod",
        "grep", "find", "sed", "awk"
    ]
    
    BLOCKED_COMMANDS: list = [
        "sudo", "su", "passwd", "useradd", "usermod",
        "fdisk", "mkfs", "mount", "umount",
        "iptables", "netstat", "ifconfig",
        "reboot", "shutdown", "init"
    ]
    
    ALLOWED_DOMAINS: list = [
        "github.com", "npmjs.com", "pypi.org",
        "cloudflare.com", "supabase.co",
        "openai.com", "googleapis.com",
        "stackoverflow.com", "developer.mozilla.org"
    ]
    
    # Task Configuration
    MAX_ITERATIONS: int = int(os.getenv("MAX_ITERATIONS", "50"))
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @classmethod
    def validate(cls) -> bool:
        """Validate required configuration."""
        required = [
            ("OPENAI_API_KEY", cls.OPENAI_API_KEY),
            ("SUPABASE_URL", cls.SUPABASE_URL),
            ("SUPABASE_SERVICE_KEY", cls.SUPABASE_SERVICE_KEY),
        ]
        
        missing = [name for name, value in required if not value]
        
        if missing:
            raise ValueError(f"Missing required configuration: {', '.join(missing)}")
        
        return True


# Validate on import
Config.validate()
