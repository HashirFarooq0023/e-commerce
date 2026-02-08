"""
Vector store module for storing and retrieving embeddings.
Supports multiple vector database backends (FAISS, ChromaDB, etc.)
"""

from typing import List, Dict, Optional, Tuple
import numpy as np
import json
import os
from pathlib import Path


class VectorStore:
    """Vector store for similarity search."""
    
    def __init__(self, store_type: str = "chroma", persist_dir: Optional[str] = None, collection_name: str = "store_assistant"):
        """
        Initialize vector store.
        
        Args:
            store_type: Type of vector store ("faiss" or "chroma")
            persist_dir: Directory to persist the vector store
            collection_name: Name of the ChromaDB collection (for ChromaDB only)
        """
        self.store_type = store_type
        self.persist_dir = persist_dir or "data/vector_store"
        self.collection_name = collection_name
        self._index = None
        self._client = None
        self._collection = None
        self._metadata = []
        self._embeddings = []
        Path(self.persist_dir).mkdir(parents=True, exist_ok=True)
        
        # Initialize ChromaDB if selected
        if self.store_type == "chroma":
            self._initialize_chroma()
        
    def _initialize_chroma(self):
        """Initialize ChromaDB client and collection."""
        try:
            import chromadb
            from chromadb.config import Settings
            
            # Initialize ChromaDB client with persistence
            self._client = chromadb.PersistentClient(
                path=self.persist_dir,
                settings=Settings(anonymized_telemetry=False)
            )
            
            # Get or create collection
            try:
                self._collection = self._client.get_collection(name=self.collection_name)
            except Exception:
                # Collection doesn't exist, create it
                self._collection = self._client.create_collection(
                    name=self.collection_name,
                    metadata={"description": "Store Assistant RAG collection"}
                )
        except ImportError:
            raise ImportError("ChromaDB is required. Install with: pip install chromadb")
    
    def _load_faiss(self, dimension: int):
        """Load FAISS index."""
        try:
            import faiss
            self._index = faiss.IndexFlatL2(dimension)
        except ImportError:
            raise ImportError("FAISS is required. Install with: pip install faiss-cpu")
    
    def add_documents(
        self, 
        embeddings: np.ndarray, 
        documents: List[Dict],
        ids: Optional[List[str]] = None
    ):
        """
        Add documents and their embeddings to the vector store.
        
        Args:
            embeddings: Array of document embeddings
            documents: List of document dictionaries with metadata
            ids: Optional list of document IDs
        """
        if embeddings.shape[0] != len(documents):
            raise ValueError("Number of embeddings must match number of documents")
        
        if self.store_type == "chroma":
            # Use ChromaDB
            if self._collection is None:
                self._initialize_chroma()
            
            # Prepare data for ChromaDB
            if ids is None:
                ids = [doc.get('id', str(i)) for i, doc in enumerate(documents)]
            
            texts = [doc.get('text', doc.get('content', '')) for doc in documents]
            
            # Convert embeddings to list format for ChromaDB
            embeddings_list = embeddings.tolist()
            
            # Prepare metadata (remove 'text' and 'content' as they're stored separately)
            metadatas = []
            for doc in documents:
                metadata = {k: v for k, v in doc.items() if k not in ['text', 'content', 'id']}
                metadatas.append(metadata)
            
            # Add to ChromaDB collection
            self._collection.add(
                embeddings=embeddings_list,
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
        else:
            # Use FAISS (fallback)
            if self._index is None:
                self._load_faiss(embeddings.shape[1])
            
            # Add to FAISS index
            self._index.add(embeddings.astype('float32'))
            
            # Store metadata
            for i, doc in enumerate(documents):
                doc_with_id = doc.copy()
                if ids:
                    doc_with_id['id'] = ids[i]
                else:
                    doc_with_id['id'] = str(len(self._metadata))
                self._metadata.append(doc_with_id)
                self._embeddings.append(embeddings[i])
    
    def search(
        self, 
        query_embedding: np.ndarray, 
        k: int = 5
    ) -> List[Dict]:
        """
        Search for similar documents.
        
        Args:
            query_embedding: Query embedding vector
            k: Number of top results to return
            
        Returns:
            List of similar documents with scores
        """
        if self.store_type == "chroma":
            # Use ChromaDB
            if self._collection is None:
                return []
            
            # Convert embedding to list format
            query_embedding_list = query_embedding.tolist() if isinstance(query_embedding, np.ndarray) else query_embedding
            
            # Search in ChromaDB
            results = self._collection.query(
                query_embeddings=[query_embedding_list],
                n_results=k
            )
            
            # Format results to match expected format
            formatted_results = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    doc_id = results['ids'][0][i]
                    doc_text = results['documents'][0][i] if results['documents'] and i < len(results['documents'][0]) else ""
                    metadata = results['metadatas'][0][i] if results['metadatas'] and i < len(results['metadatas'][0]) else {}
                    distance = results['distances'][0][i] if results['distances'] and i < len(results['distances'][0]) else 0.0
                    
                    result_dict = {
                        'id': doc_id,
                        'text': doc_text,
                        **metadata,
                        'score': float(distance),
                        'distance': float(distance)
                    }
                    formatted_results.append(result_dict)
            
            return formatted_results
        else:
            # Use FAISS (fallback)
            if self._index is None or self._index.ntotal == 0:
                return []
            
            query_embedding = query_embedding.reshape(1, -1).astype('float32')
            
            # Search in FAISS
            distances, indices = self._index.search(query_embedding, k)
            
            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(self._metadata):
                    result = self._metadata[idx].copy()
                    result['score'] = float(distances[0][i])
                    result['distance'] = float(distances[0][i])
                    results.append(result)
            
            return results
    
    def save(self, path: Optional[str] = None):
        """Save vector store to disk."""
        # ChromaDB persists automatically, no need to save explicitly
        if self.store_type == "chroma":
            return
        
        # FAISS save (fallback)
        path = path or os.path.join(self.persist_dir, "vector_store")
        
        # Save FAISS index
        if self._index is not None:
            import faiss
            faiss.write_index(self._index, f"{path}.index")
        
        # Save metadata
        with open(f"{path}_metadata.json", 'w') as f:
            json.dump(self._metadata, f, indent=2)
    
    def load(self, path: Optional[str] = None):
        """Load vector store from disk."""
        # ChromaDB loads automatically when initialized
        if self.store_type == "chroma":
            self._initialize_chroma()
            return
        
        # FAISS load (fallback)
        path = path or os.path.join(self.persist_dir, "vector_store")
        
        # Load FAISS index
        try:
            import faiss
            index_path = f"{path}.index"
            if os.path.exists(index_path):
                self._index = faiss.read_index(index_path)
        except Exception as e:
            print(f"Warning: Could not load FAISS index: {e}")
        
        # Load metadata
        metadata_path = f"{path}_metadata.json"
        if os.path.exists(metadata_path):
            with open(metadata_path, 'r') as f:
                self._metadata = json.load(f)

