from typing import Any, List, Optional, Dict
from langchain_core.language_models.llms import LLM
from langchain_core.callbacks.manager import CallbackManagerForLLMRun
from huggingface_hub import InferenceClient
import os

class CustomHFLLM(LLM):
    repo_id: str
    token: str
    client: Any = None

    def __init__(self, repo_id: str, token: str, **kwargs):
        super().__init__(repo_id=repo_id, token=token, **kwargs)
        self.client = InferenceClient(model=repo_id, token=token)

    @property
    def _llm_type(self) -> str:
        return "custom_hf_chat"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        messages = [{"role": "user", "content": prompt}]
        
        # Add stop sequences to prevent hallucination
        stop_sequences = stop or ["\nObservation:", "Observation:"]
        
        try:
            response = self.client.chat_completion(
                messages, 
                max_tokens=256,  # Reduced to prevent long hallucinations
                temperature=0.1,
                top_p=0.95,
                stop=stop_sequences
            )
            content = response.choices[0].message.content
            return content
        except Exception as e:
            return f"Error: {e}"

    @property
    def _identifying_params(self) -> Dict[str, Any]:
        return {"repo_id": self.repo_id}
