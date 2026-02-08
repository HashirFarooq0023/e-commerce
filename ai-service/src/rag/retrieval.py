"""
Retrieval module for RAG system.
Handles document retrieval using vector similarity search.
"""

from typing import List, Dict, Optional
import numpy as np
from .embeddings import EmbeddingModel
from .vector_store import VectorStore


class RetrievalSystem:
    """Retrieval system for RAG."""
    
    def __init__(
        self,
        embedding_model: Optional[EmbeddingModel] = None,
        vector_store: Optional[VectorStore] = None,
        top_k: int = 5,
        vector_store_type: str = "chroma",
        persist_dir: Optional[str] = None,
        collection_name: str = "store_assistant"
    ):
        """
        Initialize retrieval system.
        
        Args:
            embedding_model: Embedding model instance
            vector_store: Vector store instance (if None, creates one)
            top_k: Number of top results to retrieve
            vector_store_type: Type of vector store ("chroma" or "faiss")
            persist_dir: Directory to persist vector store
            collection_name: Name of ChromaDB collection
        """
        self.embedding_model = embedding_model or EmbeddingModel()
        self.vector_store = vector_store or VectorStore(
            store_type=vector_store_type,
            persist_dir=persist_dir,
            collection_name=collection_name
        )
        self.top_k = top_k
    
    def retrieve(self, query: str, top_k: Optional[int] = None) -> List[Dict]:
        """
        Retrieve relevant documents for a query.
        
        Args:
            query: User query
            top_k: Number of results to return (overrides default)
            
        Returns:
            List of retrieved documents with metadata
        """
        top_k = top_k or self.top_k
        
        # Generate query embedding
        query_embedding = self.embedding_model.embed_text(query)
        
        # Search vector store
        results = self.vector_store.search(query_embedding, k=top_k)
        
        return results
    
    def add_documents(self, documents: List[Dict], texts: Optional[List[str]] = None):
        """
        Add documents to the retrieval system.
        
        Args:
            documents: List of document dictionaries with 'text' and metadata
            texts: Optional list of text content (if not in documents)
        """
        if texts is None:
            texts = [doc.get('text', doc.get('content', '')) for doc in documents]
        
        # Generate embeddings
        embeddings = self.embedding_model.embed_batch(texts)
        
        # Add to vector store
        ids = [doc.get('id', str(i)) for i, doc in enumerate(documents)]
        self.vector_store.add_documents(embeddings, documents, ids)
    
    def save(self, path: Optional[str] = None):
        """Save retrieval system."""
        self.vector_store.save(path)
    
    def load(self, path: Optional[str] = None):
        """Load retrieval system."""
        self.vector_store.load(path)

