"""
RepoChat Backend - LLM Service
Handles both local (LM Studio) and cloud (Hugging Face) LLM providers.
"""
from openai import OpenAI
from typing import Generator, Optional
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    """Unified LLM service supporting local and cloud providers."""
    
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.client = self._init_client()
    
    def _init_client(self) -> OpenAI:
        """Initialize OpenAI-compatible client."""
        if self.provider == "local":
            return OpenAI(
                base_url=settings.LLM_BASE_URL,
                api_key="not-needed"
            )
        else:
            # Hugging Face or OpenAI compatible
            return OpenAI(
                base_url="https://api-inference.huggingface.co/v1",
                api_key=settings.HUGGINGFACEHUB_API_TOKEN or ""
            )
    
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        stream: bool = False
    ) -> str | Generator[str, None, None]:
        """
        Generate response from LLM.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system instructions
            stream: Whether to stream the response
            
        Returns:
            Complete response string or generator for streaming
        """
        messages = []
        
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})
        
        try:
            if stream:
                return self._stream_response(messages)
            else:
                return self._complete_response(messages)
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise
    
    def _complete_response(self, messages: list) -> str:
        """Get complete response."""
        response = self.client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS
        )
        return response.choices[0].message.content or ""
    
    def _stream_response(self, messages: list) -> Generator[str, None, None]:
        """Stream response tokens."""
        stream = self.client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=messages,
            temperature=settings.LLM_TEMPERATURE,
            max_tokens=settings.LLM_MAX_TOKENS,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def health_check(self) -> dict:
        """Check if LLM service is available."""
        try:
            response = self.generate("Say 'OK' in one word.", stream=False)
            return {"status": "healthy", "provider": self.provider}
        except Exception as e:
            return {"status": "unhealthy", "provider": self.provider, "error": str(e)}


# Singleton instance
llm_service = LLMService()
