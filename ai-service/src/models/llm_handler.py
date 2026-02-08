"""
LLM handler for the Store Assistant.

This implementation is focused on local Ollama (e.g. llama3) but keeps the
interface flexible so it can be extended to other providers if needed.
"""

from typing import List, Dict, Optional

from langchain_core.prompts import PromptTemplate  # type: ignore

try:
    # Preferred import style
    from langchain_ollama.llms import OllamaLLM  # type: ignore
except ImportError:  # pragma: no cover - fallback for older versions
    from langchain_ollama import OllamaLLM  # type: ignore


class LLMHandler:
    """Wrapper around the underlying LLM (Ollama by default)."""

    def __init__(
        self,
        model_type: str = "ollama",
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
    ):
        """
        Initialize LLM handler.

        Args:
            model_type:  "ollama" (default). Hooks are left for "openai"/"anthropic" if added later.
            model_name:  Underlying model name (e.g. "llama3" / "llama3.2").
            api_key:     Not used for Ollama (kept for API compatibility).
            base_url:    Ollama base URL (default http://localhost:11434).
            temperature: Sampling temperature.
            max_tokens:  Max tokens / num_predict for Ollama.
        """
        self.model_type = model_type or "ollama"
        # Default to llama3.2 since that's what you have locally
        self.model_name = model_name or "llama3.2"
        self.api_key = api_key
        self.base_url = base_url or "http://localhost:11434"
        self.temperature = temperature
        self.max_tokens = max_tokens or 1000

        # Currently we only implement the Ollama backend
        if self.model_type != "ollama":
            raise ValueError(
                f"Only 'ollama' model_type is implemented in this project right now; "
                f"got '{self.model_type}'."
            )

        self._llm = OllamaLLM(
            model=self.model_name,
            base_url=self.base_url,
            temperature=self.temperature,
            num_predict=self.max_tokens,
        )

   # Basic generation
    
    def generate(self, prompt: str) -> str:
        """Generate a plain response for a prompt."""
        return self._llm.invoke(prompt)

    
    # RAG-style generation with context


    def generate_with_context(
        self,
        query: str,
        context: Optional[List[Dict]] = None,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Generate a response given a query and retrieved context.

        Args:
            query:         User question.
            context:       List of dicts with at least a "text" field.
            system_prompt: High-level system instructions for the assistant.

        Returns:
            Generated response string.
        """
        system_prompt = system_prompt or (
            "You are a helpful store assistant. Answer clearly and concisely."
        )

        context = context or []
        context_texts: List[str] = []
        for item in context:
            text = item.get("text") or item.get("content") or ""
            if text:
                context_texts.append(text)

        joined_context = "\n\n".join(context_texts).strip()

        rag_template = """{system_prompt}

Context Information:
{context}

Question: {query}

Answer based on the context above. If the context is not sufficient, say so explicitly,
and do not make up product details or orders that are not present.
"""

        prompt_template = PromptTemplate(
            input_variables=["system_prompt", "context", "query"],
            template=rag_template,
        )

        final_prompt = prompt_template.format(
            system_prompt=system_prompt,
            context=joined_context or "No additional context was provided.",
            query=query,
        )

        return self._llm.invoke(final_prompt)