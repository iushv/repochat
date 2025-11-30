from typing import Any, List, Optional, Dict
from langchain_core.language_models.llms import LLM
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
from openai import OpenAI

class LocalLLM(LLM):
    """
    Local LLM wrapper for LM Studio or any OpenAI-compatible local server.
    
    LM Studio runs at http://localhost:1234/v1 by default.
    """
    base_url: str = "http://localhost:1234/v1"
    model: str = "local-model"
    client: Any = None

    def __init__(self, base_url: str = "http://localhost:1234/v1", model: str = "local-model", **kwargs):
        super().__init__(base_url=base_url, model=model, **kwargs)
        self.client = OpenAI(base_url=base_url, api_key="not-needed")

    @property
    def _llm_type(self) -> str:
        return "local_llm"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=512,
                stop=stop or ["\nObservation:", "Observation:"]
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {e}"

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        return {"base_url": self.base_url, "model": self.model}
