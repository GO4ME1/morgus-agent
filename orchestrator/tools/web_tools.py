"""
Web search and fetch tools for Morgus.
"""
from typing import Any, Dict
from .base import Tool
import requests
from bs4 import BeautifulSoup
import logging
from config import Config

logger = logging.getLogger(__name__)


class SearchWebTool(Tool):
    """Tool for searching the web."""
    
    @property
    def name(self) -> str:
        return "search_web"
    
    @property
    def description(self) -> str:
        return "Search the web for information. Returns a list of search results with titles and snippets."
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query"
                        },
                        "num_results": {
                            "type": "integer",
                            "description": "Number of results to return (default: 5)",
                            "default": 5
                        }
                    },
                    "required": ["query"]
                }
            }
        }
    
    def execute(self, query: str, num_results: int = 5) -> str:
        try:
            # Try Bing Search API if available
            if Config.BING_SEARCH_API_KEY:
                return self._search_bing(query, num_results)
            # Try Google Custom Search API if available
            elif Config.GOOGLE_SEARCH_API_KEY and Config.GOOGLE_SEARCH_ENGINE_ID:
                return self._search_google(query, num_results)
            else:
                return "Error: No search API configured. Please set BING_SEARCH_API_KEY or GOOGLE_SEARCH_API_KEY."
        
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return f"Error: Search failed - {str(e)}"
    
    def _search_bing(self, query: str, num_results: int) -> str:
        """Search using Bing Search API."""
        url = "https://api.bing.microsoft.com/v7.0/search"
        headers = {"Ocp-Apim-Subscription-Key": Config.BING_SEARCH_API_KEY}
        params = {"q": query, "count": num_results}
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        results = []
        
        for item in data.get("webPages", {}).get("value", [])[:num_results]:
            results.append(f"Title: {item['name']}\nURL: {item['url']}\nSnippet: {item['snippet']}\n")
        
        return "\n".join(results) if results else "No results found"
    
    def _search_google(self, query: str, num_results: int) -> str:
        """Search using Google Custom Search API."""
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": Config.GOOGLE_SEARCH_API_KEY,
            "cx": Config.GOOGLE_SEARCH_ENGINE_ID,
            "q": query,
            "num": num_results
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        results = []
        
        for item in data.get("items", [])[:num_results]:
            results.append(f"Title: {item['title']}\nURL: {item['link']}\nSnippet: {item.get('snippet', '')}\n")
        
        return "\n".join(results) if results else "No results found"


class FetchURLTool(Tool):
    """Tool for fetching and parsing web pages."""
    
    @property
    def name(self) -> str:
        return "fetch_url"
    
    @property
    def description(self) -> str:
        return "Fetch and extract text content from a URL"
    
    def get_schema(self) -> Dict[str, Any]:
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": {
                            "type": "string",
                            "description": "URL to fetch"
                        }
                    },
                    "required": ["url"]
                }
            }
        }
    
    def execute(self, url: str) -> str:
        try:
            # Validate URL domain if needed
            # TODO: Add domain whitelist check
            
            headers = {
                "User-Agent": "Mozilla/5.0 (compatible; MorgusBot/1.0)"
            }
            
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.content, "html.parser")
            
            # Remove script and style elements
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
            
            # Get text
            text = soup.get_text(separator="\n", strip=True)
            
            # Clean up whitespace
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            text = "\n".join(lines)
            
            # Truncate if too long
            if len(text) > 8000:
                text = text[:8000] + f"\n\n... (truncated, total {len(text)} chars)"
            
            return text
        
        except Exception as e:
            logger.error(f"Failed to fetch URL {url}: {e}")
            return f"Error: Failed to fetch URL - {str(e)}"


class WebTools:
    """Collection of web-related tools."""
    
    @staticmethod
    def create_tools() -> list:
        """Create all web tools."""
        return [
            SearchWebTool(),
            FetchURLTool()
        ]
