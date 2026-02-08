"""
Main entry point for the Store Assistant AI Agent.
"""

import argparse
import sys
import os
from pathlib import Path


# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.assistant.store_assistant import StoreAssistant
from src.models.llm_handler import LLMHandler
from src.rag.retrieval import RetrievalSystem
from src.rag.embeddings import EmbeddingModel
from src.products.product_manager import ProductManager
from src.orders.order_manager import OrderManager
from src.audio.text_to_speech import TextToSpeech
from src.chat.chat_interface import ChatInterface
import yaml

def load_config(config_path: str = "config/config.yaml"):
    """Load configuration from YAML file."""
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            return yaml.safe_load(f)
    return {}


def create_assistant(config: dict) -> StoreAssistant:
    """Create and configure Store Assistant."""
    # LLM Handler
    llm_config = config.get('llm', {})
    llm_handler = LLMHandler(
        model_type=llm_config.get('model_type', 'openai'),
        model_name=llm_config.get('model_name'),
        api_key=llm_config.get('api_key'),
        base_url=llm_config.get('base_url'),
        temperature=llm_config.get('temperature', 0.7),
        max_tokens=llm_config.get('max_tokens')
    )
    
    # RAG System
    rag_config = config.get('rag', {})

    # Embeddings (now defaulting to Ollama local embeddings)
    embedding_model = EmbeddingModel(
        model_name=rag_config.get('embedding_model', 'mxbai-embed-large'),
        provider=rag_config.get('embedding_provider', 'ollama'),
        base_url=llm_config.get('base_url'),
    )

    retrieval_system = RetrievalSystem(
        embedding_model=embedding_model,
        top_k=rag_config.get('top_k', 5),
        vector_store_type=rag_config.get('vector_store_type', 'chroma'),
        persist_dir=rag_config.get('persist_dir'),
        collection_name=rag_config.get('collection_name', 'store_assistant')
    )
    
    # Product Manager
    products_config = config.get('products', {})
    product_manager = ProductManager(
        products_file=products_config.get('data_file')
    )
    
    # Order Manager
    orders_config = config.get('orders', {})
    order_manager = OrderManager(
        orders_file=orders_config.get('data_file')
    )
    
    # TTS (optional)
    audio_config = config.get('audio', {})
    tts = None
    if audio_config.get('enable_audio', True):
        try:
            tts = TextToSpeech(
                engine=audio_config.get('tts_engine', 'pyttsx3'),
                voice=audio_config.get('tts_voice'),
                rate=audio_config.get('tts_rate', 150)
            )
        except Exception as e:
            print(f"Warning: Could not initialize TTS: {e}")
    
    # Assistant
    assistant_config = config.get('assistant', {})
    assistant = StoreAssistant(
        llm_handler=llm_handler,
        retrieval_system=retrieval_system,
        product_manager=product_manager,
        order_manager=order_manager,
        tts=tts,
        use_rag=assistant_config.get('use_rag', True)
    )
    
    return assistant


def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Store Assistant AI Agent")
    parser.add_argument(
        '--config',
        type=str,
        default='config/config.yaml',
        help='Path to configuration file'
    )
    parser.add_argument(
        '--mode',
        type=str,
        default='chat',
        choices=['chat', 'audio', 'both'],
        help='Interaction mode'
    )
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Create assistant
    print("Initializing Store Assistant...")
    assistant = create_assistant(config)
    print("Store Assistant ready!\n")
    
    # Set up message handler
    def handle_message(message: str) -> str:
        use_audio = args.mode in ['audio', 'both']
        return assistant.process_message(message, use_audio=use_audio)
    
    # Start chat interface
    if args.mode in ['chat', 'both']:
        chat = ChatInterface(on_message=handle_message)
        chat.start_chat()
    else:
        # Audio-only mode (future implementation)
        print("Audio-only mode not yet fully implemented. Please use 'chat' or 'both' mode.")
        sys.exit(1)


if __name__ == "__main__":
    main()
