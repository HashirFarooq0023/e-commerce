"""
Embedding module for RAG system.
Now uses local Ollama embeddings by default (e.g. mxbai-embed-large),
with an optional fallback to sentence-transformers if desired.
"""

from typing import List, Optional
import os

import numpy as np


class EmbeddingModel:
    """Embedding model wrapper for RAG.

    By default this uses Ollama's local embedding API via the `ollama` Python
    package and an embedding model such as `mxbai-embed-large`.

    You can still use sentence-transformers by setting provider="sentence-transformers".
    """

    def __init__(
        self,
        model_name: str = "mxbai-embed-large",
        provider: str = "ollama",
        base_url: Optional[str] = None,
    ):
        """
        Initialize embedding model.

        Args:
            model_name: Name of the embedding model to use.
                        For Ollama, e.g. "mxbai-embed-large".
                        For sentence-transformers, e.g. "sentence-transformers/all-MiniLM-L6-v2".
            provider:   "ollama" (default) or "sentence-transformers".
            base_url:   Ollama base URL, defaults to http://localhost:11434.
        """
        self.model_name = model_name
        self.provider = provider or "ollama"
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

        self._ollama_client = None
        self._st_model = None

    # ---------------------------------------------------------------------
    # Provider initialisation helpers
    # ---------------------------------------------------------------------
    def _ensure_ollama_client(self):
        if self._ollama_client is None:
            try:
                import ollama  # type: ignore
            except ImportError as exc:
                raise ImportError(
                    "The 'ollama' Python package is required for Ollama embeddings. "
                    "Install it with: pip install ollama"
                ) from exc

            # The official client doesn't need explicit base_url here; it will
            # use OLLAMA_HOST env var if set. We keep base_url mainly for
            # future custom HTTP usage.
            self._ollama_client = ollama

    def _ensure_sentence_transformers_model(self):
        if self._st_model is None:
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore
            except ImportError as exc:
                raise ImportError(
                    "sentence-transformers is required for Hugging Face embeddings.\n"
                    "Install with: pip install sentence-transformers"
                ) from exc

            self._st_model = SentenceTransformer(self.model_name)

    # ---------------------------------------------------------------------
    # Public API
    # ---------------------------------------------------------------------
    def embed_text(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text.

        Args:
            text: Input text to embed.

        Returns:
            Embedding vector as numpy array.
        """
        if self.provider == "sentence-transformers":
            self._ensure_sentence_transformers_model()
            embedding = self._st_model.encode(text, convert_to_numpy=True)
            return embedding

        # Default: Ollama embeddings
        self._ensure_ollama_client()
        response = self._ollama_client.embed(
            model=self.model_name,
            input=text,
        )
        embeddings = response.get("embeddings")

        # The API returns either a single vector or a list of vectors.
        if isinstance(embeddings, list) and embeddings and isinstance(embeddings[0], list):
            vector = embeddings[0]
        else:
            vector = embeddings

        return np.asarray(vector, dtype=np.float32)

    def embed_batch(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a batch of texts.

        Args:
            texts: List of texts to embed.

        Returns:
            Array of embedding vectors (shape: [len(texts), dim]).
        """
        if self.provider == "sentence-transformers":
            self._ensure_sentence_transformers_model()
            embeddings = self._st_model.encode(
                texts,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            return embeddings

        # Default: Ollama embeddings
        self._ensure_ollama_client()
        response = self._ollama_client.embed(
            model=self.model_name,
            input=texts,
        )
        embeddings = response.get("embeddings", [])
        return np.asarray(embeddings, dtype=np.float32)

    def get_embedding_dimension(self) -> int:
        """Get the dimension of embeddings."""
        dummy_embedding = self.embed_text("dummy")
        return int(dummy_embedding.shape[0])

