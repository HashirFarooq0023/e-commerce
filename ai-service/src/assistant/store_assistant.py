"""
Main Store Assistant that integrates RAG, fine-tuning, and all components.
"""

from typing import Optional, Dict, List
import re

# NOTE: If you get import errors, ensure these paths exist. 
from ..rag.retrieval import RetrievalSystem
from ..models.llm_handler import LLMHandler
from ..products.product_manager import ProductManager
from ..orders.order_manager import OrderManager
from ..orders.order_schema import Order, OrderItem, OrderStatus
from ..audio.text_to_speech import TextToSpeech
from .conversation_manager import ConversationManager, ConversationState


class StoreAssistant:
    """Main Store Assistant AI agent."""
    
    def __init__(
        self,
        llm_handler: Optional[LLMHandler] = None,
        retrieval_system: Optional[RetrievalSystem] = None,
        product_manager: Optional[ProductManager] = None,
        order_manager: Optional[OrderManager] = None,
        tts: Optional[TextToSpeech] = None,
        use_rag: bool = True,
        store_name: str = "our store"  # <--- 1. NEW VARIABLE (Change default name here)
    ):
        self.llm_handler = llm_handler or LLMHandler()
        self.retrieval_system = retrieval_system or RetrievalSystem()
        self.product_manager = product_manager or ProductManager()
        self.order_manager = order_manager or OrderManager()
        self.tts = tts
        self.use_rag = use_rag
        self.store_name = store_name # Store it for later use
        self.conversation_manager = ConversationManager()
        self.current_order: Optional[Order] = None
        
        # Initialize product catalog in RAG system
        self._index_products()

    # --- FIXED METHOD: Now accepts 'use_audio' ---
    def process_message(self, query: str, use_audio: bool = False) -> str:
        """
        Simplified entry point for main.py to get a string response.
        """
        # We pass the use_audio flag down to the internal logic
        result = self.process_user_message(query, session_id="default_user", use_audio=use_audio)
        return result.get("response", "I'm sorry, I couldn't generate a response.")
    # ----------------------------------------------------
    
    def _index_products(self):
        """Index products in RAG system for retrieval."""
        products = self.product_manager.products
        documents = []
        for product in products:
            doc_text = (
                f"Product: {product.get('name')}\n"
                f"Description: {product.get('description')}\n"
                f"Category: {product.get('category')}\n"
                f"Price: ${product.get('price'):.2f}"
            )
            documents.append({
                "text": doc_text,
                "product_id": product.get('id'),
                "name": product.get('name'),
                "category": product.get('category'),
                "type": "product"
            })
        
        if documents:
            self.retrieval_system.add_documents(documents)
    
    def process_user_message(self, user_message: str, session_id: str = "guest", use_audio: bool = False) -> dict:
        """
        Process user message and return structured data (Text + Products).
        """
        # 1. Handle Greetings (Quick Return)
        greetings = ["hi", "hello", "salam", "assalam", "hey", "start"]
        if any(g.lower() in user_message.lower() for g in greetings) and len(user_message.split()) < 3:
            return {
                "response": f"Aslam u Alaikum! 👋 Welcome to {self.store_name}. Main apki kya madad kar sakti hoon?",
                "products": [], # No products for greeting
                "action": None
            }

        self._update_conversation_state(user_message, session_id)
        
        # 2. Handle Ordering (Keep existing logic)
        if self.conversation_manager.is_ordering_mode(session_id):
            return self._handle_ordering_flow(user_message, session_id)
        
        # 3. Handle Product Search (The New Logic!)
        else:
            # We get BOTH the text reply AND the list of product objects
            response_text, found_products = self._generate_response(user_message)
            
            return {
                "response": response_text,
                "products": found_products, # <--- SENDING DATA TO FRONTEND
                "action": "DISPLAY_PRODUCTS" if found_products else None
            }

    def _generate_response(self, query: str) -> tuple[str, List[Dict]]:
        """
        Generate response and return found products.
        Returns: (response_string, list_of_product_dicts)
        """
        # 1. Search for products
        products = self.product_manager.search_products(query=query)
        
        # 2. Build Context for AI (Text only)
        context = []
        if self.use_rag:
            context = self.retrieval_system.retrieve(query, top_k=3)
        
        if products:
            for product in products[:3]:
                context.append({
                    "text": self.product_manager.format_product_for_display(product),
                    "product_id": product.get('id'),
                    "type": "product"
                })

        # 3. Generate AI Text Response
        system_prompt = self._get_system_prompt()
        response_text = self.llm_handler.generate_with_context(
            query=query,
            context=context,
            system_prompt=system_prompt
        )

        # 4. Return BOTH text and the raw product data
        # We only send the top 5 products to keep the chat clean
        return response_text, products[:5]
    
    def _handle_ordering_flow(self, message: str, session_id: str) -> dict:
        """Handle order placement flow."""
        state = self.conversation_manager.get_state(session_id)
        message_lower = message.lower()

        # Extract information based on state
        if state == ConversationState.COLLECTING_NAME:
            # Extract name
            name = self._extract_name(message)
            if name:
                self.current_order.customer_name = name
                self.conversation_manager.update_state(session_id, ConversationState.COLLECTING_PHONE)
                return {"response": f"Nice to meet you, {name}! What's your phone number?", "action": None}
        
        elif state == ConversationState.COLLECTING_PHONE:
            # Extract phone number
            phone = self._extract_phone(message)
            if phone:
                self.current_order.phone_number = phone
                self.conversation_manager.update_state(session_id, ConversationState.COLLECTING_ADDRESS)
                return {"response": "Great! What's your delivery address?", "action": None}
        
        elif state == ConversationState.COLLECTING_ADDRESS:
            # Extract address
            address = message.strip()
            if address and len(address) > 10:  # Basic validation
                self.current_order.address = address
                return self._confirm_order(session_id)
        
        elif state == ConversationState.COLLECTING_QUANTITY:
            # Extract product and quantity
            product_name, quantity = self._extract_product_quantity(message)
            if product_name and quantity:
                products = self.product_manager.search_products(query=product_name)
                if products:
                    product = products[0]
                    item = OrderItem(
                        product_id=product.get('id'),
                        product_name=product.get('name'),
                        quantity=quantity,
                        price=product.get('price')
                    )
                    self.current_order.add_item(item)
                    return {"response": f"Added {quantity} x {product.get('name')} to your order. Anything else, or shall we proceed with your details?", "action": None}
                else:
                    return {"response": "I couldn't find that product. Could you please specify the product name?", "action": None}
        
        # Default ordering response
        if not self.current_order.customer_name:
            return {"response": "I'd be happy to help you place an order! What's your name?", "action": None}
        elif not self.current_order.phone_number:
            return {"response": "What's your phone number?", "action": None}
        elif not self.current_order.address:
            return {"response": "What's your delivery address?", "action": None}
        else:
            return self._confirm_order(session_id)
    
    def _extract_name(self, message: str) -> Optional[str]:
        """Extract name from message."""
        # Simple extraction - can be enhanced with NLP
        patterns = [
            r"(?:my name is|i'm|i am|call me|name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
            r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)$"
        ]
        for pattern in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
    
    def _extract_phone(self, message: str) -> Optional[str]:
        """Extract phone number from message."""
        # Extract digits and common phone patterns
        digits = re.findall(r'\d+', message)
        phone = ''.join(digits)
        if len(phone) >= 10:
            return phone
        return None
    
    def _extract_product_quantity(self, message: str) -> tuple:
        """Extract product name and quantity from message."""
        # Extract quantity (number)
        quantity_match = re.search(r'\b(\d+)\b', message)
        quantity = int(quantity_match.group(1)) if quantity_match else 1
        
        # Extract product name (remove quantity and common words)
        product_name = re.sub(r'\b(\d+|want|need|buy|order|get|please|i|would|like)\b', '', message, flags=re.IGNORECASE)
        product_name = product_name.strip()
        
        return (product_name, quantity) if product_name else (None, None)
    
    def _confirm_order(self, session_id: str) -> dict:
        """Confirm and save order."""
        if self.current_order and self.current_order.is_complete:
            # Instead of adding to order manager here, return action for frontend
            order_payload = {
                "customer_name": self.current_order.customer_name,
                "phone_number": self.current_order.phone_number,
                "address": self.current_order.address,
                "items": [item.dict() for item in self.current_order.items],
                "total_amount": self.current_order.total_amount
            }
            self.conversation_manager.update_state(session_id, ConversationState.ORDER_CONFIRMATION)
            self.current_order = None # Reset current order after handing it over
            return {
                "response": "Thank you for your order! Proceeding to checkout.",
                "action": "ADD_TO_CART",
                "payload": order_payload
            }
        else:
            return {"response": "I need a bit more information to complete your order. Please provide your name, phone number, and address.", "action": None}
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for the assistant."""
        return f"""You are a polite, smart, and friendly Female Customer Assistant for "{self.store_name}".

CRITICAL RULES:
1. NO REPEAT GREETINGS: NEVER say "Aslam u Alaikum" or "Welcome" in the middle of a chat. Only say it if the User says "Hi" or "Salam" first.
2. LANGUAGE: Use **Casual Roman Urdu** mixed with English words. 
   - ❌ BAD: "Prastut", "Vishisht", "Awashyak", "Kripya". (Too formal/Hindi)
   - ✅ GOOD: "Dikha sakti hoon", "Khaas", "Zaroori", "Please". (Natural Urdu)

3. MISSING PRODUCTS: If the specific product is NOT in the Context:
   - Say: "Maaf kijiye, humare paas [Product Name] filhal available nahi hai."
   - Then suggest a category that IS available (e.g., "Kya aap humari Rings ya Bracelets dekhna chahenge?").

4. PRODUCT FORMAT (Only if found):
   **[Product Name]**
   🏷️ Price: [Price] PKR
   ([Short Description])

YOUR GOAL:
Be helpful and quick. Talk like a real Pakistani shopkeeper on WhatsApp.
"""