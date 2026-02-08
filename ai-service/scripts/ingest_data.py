"""
Unified Master Ingestion Script
Ingests Product data (MySQL) and Training data (JSON) into ChromaDB.
"""

import os
import json
import mysql.connector
from pathlib import Path
from typing import List, Dict, Any

from langchain_chroma import Chroma
from langchain_ollama import OllamaEmbeddings
from langchain_core.documents import Document

# --- CONFIGURATION ---
VECTOR_STORE_PATH = "data/vector_store"
COLLECTION_NAME = "store_assistant"
# We use mxbai for the DATABASE because it is better at searching than Llama3
EMBEDDING_MODEL = "mxbai-embed-large" 

def get_mysql_connection():
    """Create a MySQL connection."""
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "ecommerce_db"),
    )

def fetch_products() -> List[Dict[str, Any]]:
    """Fetch all products from MySQL."""
    conn = get_mysql_connection()
    try:
        # We fetch exactly the columns you specified
        query = """
            SELECT id, name, category, price, stock, rating, image, images, description 
            FROM products
        """
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        rows = cursor.fetchall()
        cursor.close()
        return rows
    except Exception as e:
        print(f"❌ Error fetching products: {e}")
        return []
    finally:
        conn.close()

def products_to_documents(rows: List[Dict[str, Any]]) -> List[Document]:
    """Convert product rows into LangChain Documents."""
    documents = []
    for data in rows:
        # 1. Extract Fields (Handling potential NULLs)
        name = data.get("name") or "Untitled Product"
        category = data.get("category") or "Uncategorized"
        price = float(data.get("price") or 0.0)
        description = data.get("description") or ""
        stock = int(data.get("stock") or 0)
        rating = float(data.get("rating") or 0.0)
        image = data.get("image") or ""
        
        # 2. Build Searchable Text (The "Content" the AI reads)
        # We include the ID here so the AI knows the product ID if needed
        page_content = (
            f"Product Name: {name}\n"
            f"Category: {category}\n"
            f"Price: {price} PKR\n"
            f"Description: {description}\n"
            f"Stock Status: {'In Stock' if stock > 0 else 'Out of Stock'}"
        )

        # 3. Build Metadata (The "Hidden Data" for your Frontend)
        # We save image, rating, and ID here so you can show the card later
        metadata = {
            "id": str(data.get("id", "")),
            "name": name,     
            "price": price,
            "category": category,
            "stock": stock,
            "rating": rating,
            "image": image,        
            "type": "product"
        }

        documents.append(Document(page_content=page_content, metadata=metadata))
    return documents

def load_training_data(json_path: Path) -> List[Document]:
    """Load training examples from JSON."""
    if not json_path.exists():
        print(f"⚠️ Warning: Training data file not found at {json_path}")
        return []
        
    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
        
    documents = []
    for idx, ex in enumerate(data):
        content = f"User: {ex.get('input', '')}\nAssistant: {ex.get('output', '')}"
        meta = {
            "id": f"train_{idx}",
            "type": "training_example"
        }
        documents.append(Document(page_content=content, metadata=meta))
    return documents

def main():
    base_dir = Path(__file__).parent.parent
    
    # 1. Setup Paths
    vector_store_dir = base_dir / VECTOR_STORE_PATH
    training_json = base_dir / "src" / "chat" / "training_data.json"
    
    # 2. Load Data
    print(f"🚀 Starting Ingestion using {EMBEDDING_MODEL}...")
    
    products = fetch_products()
    if not products:
        print("❌ No products found in MySQL! Make sure XAMPP is running.")
        return

    product_docs = products_to_documents(products)
    print(f"📦 Loaded {len(product_docs)} products from MySQL.")
    
    training_docs = load_training_data(training_json)
    print(f"📚 Loaded {len(training_docs)} training examples.")
    
    all_docs = product_docs + training_docs
    
    # 3. Initialize ChromaDB & Embeddings
    print("🧠 Generating embeddings (this may take a moment)...")
    embeddings = OllamaEmbeddings(model=EMBEDDING_MODEL)
    
    # Delete old DB to avoid duplicates
    if vector_store_dir.exists():
        import shutil
        try:
            shutil.rmtree(vector_store_dir)
            print("🗑️  Cleared old vector store.")
        except:
            pass

    vector_store = Chroma.from_documents(
        documents=all_docs,
        embedding=embeddings,
        persist_directory=str(vector_store_dir),
        collection_name=COLLECTION_NAME
    )
    
    print(f"✅ Success! Ingested {len(all_docs)} items into {VECTOR_STORE_PATH}")

if __name__ == "__main__":
    main()