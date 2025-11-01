"""
LLM Client Wrappers for DeepSeek and MiniMax
Provides unified interface for different LLM providers
"""

import asyncio
import json
from typing import AsyncGenerator, List, Dict, Any, Optional, Union
import httpx
from loguru import logger
from config import settings


class DeepSeekClient:
    """DeepSeek API Client with OpenAI-compatible interface"""
    
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.model = settings.DEEPSEEK_MODEL
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=60.0,
        )
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = None,
        max_tokens: int = None,
        stream: bool = False,
    ) -> Union[Dict[str, Any], AsyncGenerator[str, None]]:
        """
        Send chat completion request to DeepSeek
        """
        temperature = temperature or settings.DEFAULT_TEMPERATURE
        max_tokens = max_tokens or settings.DEFAULT_MAX_TOKENS
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }
        
        try:
            if stream:
                return self._stream_completion(payload)
            else:
                response = await self.client.post("/v1/chat/completions", json=payload)
                response.raise_for_status()
                result = response.json()
                return result
        except Exception as e:
            logger.error(f"DeepSeek API error: {e}")
            raise
    
    async def _stream_completion(self, payload: Dict) -> AsyncGenerator[str, None]:
        """Stream chat completion response"""
        try:
            async with self.client.stream("POST", "/v1/chat/completions", json=payload) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            if "choices" in chunk and len(chunk["choices"]) > 0:
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            logger.error(f"DeepSeek streaming error: {e}")
            raise
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


class MiniMaxClient:
    """MiniMax API Client"""
    
    def __init__(self):
        self.api_key = settings.MINIMAX_API_KEY
        self.base_url = settings.MINIMAX_BASE_URL
        self.model = settings.MINIMAX_MODEL
        self.group_id = self._extract_group_id()
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=60.0,
        )
    
    def _extract_group_id(self) -> str:
        """Extract GroupID from JWT token (simplified)"""
        # For simplicity, using a default group ID
        # In production, properly decode the JWT
        return "1983817541167883107"
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = None,
        max_tokens: int = None,
        stream: bool = False,
    ) -> Union[Dict[str, Any], AsyncGenerator[str, None]]:
        """
        Send chat completion request to MiniMax
        """
        temperature = temperature or settings.DEFAULT_TEMPERATURE
        max_tokens = max_tokens or settings.DEFAULT_MAX_TOKENS
        
        # Convert OpenAI format to MiniMax format
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream,
        }
        
        try:
            if stream:
                return self._stream_completion(payload)
            else:
                response = await self.client.post(
                    f"/text/chatcompletion_v2?GroupId={self.group_id}",
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                return result
        except Exception as e:
            logger.error(f"MiniMax API error: {e}")
            raise
    
    async def _stream_completion(self, payload: Dict) -> AsyncGenerator[str, None]:
        """Stream chat completion response"""
        try:
            async with self.client.stream(
                "POST",
                f"/text/chatcompletion_v2?GroupId={self.group_id}",
                json=payload
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            if "choices" in chunk and len(chunk["choices"]) > 0:
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                        except json.JSONDecodeError:
                            continue
        except Exception as e:
            logger.error(f"MiniMax streaming error: {e}")
            raise
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global LLM client instances
_deepseek_client: Optional[DeepSeekClient] = None
_minimax_client: Optional[MiniMaxClient] = None


def get_deepseek_client() -> DeepSeekClient:
    """Get or create DeepSeek client singleton"""
    global _deepseek_client
    if _deepseek_client is None:
        _deepseek_client = DeepSeekClient()
    return _deepseek_client


def get_minimax_client() -> MiniMaxClient:
    """Get or create MiniMax client singleton"""
    global _minimax_client
    if _minimax_client is None:
        _minimax_client = MiniMaxClient()
    return _minimax_client


async def close_llm_clients():
    """Close all LLM clients"""
    global _deepseek_client, _minimax_client
    if _deepseek_client:
        await _deepseek_client.close()
    if _minimax_client:
        await _minimax_client.close()

