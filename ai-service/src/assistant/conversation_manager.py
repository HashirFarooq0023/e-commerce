"""
Conversation manager for handling conversation state and context.
"""

from typing import List, Dict, Optional
from enum import Enum


class ConversationState(Enum):
    """Conversation state enumeration."""
    INITIAL = "initial"
    PRODUCT_SEARCH = "product_search"
    PRODUCT_DETAILS = "product_details"
    ORDERING = "ordering"
    COLLECTING_NAME = "collecting_name"
    COLLECTING_PHONE = "collecting_phone"
    COLLECTING_ADDRESS = "collecting_address"
    COLLECTING_QUANTITY = "collecting_quantity"
    ORDER_CONFIRMATION = "order_confirmation"
    GENERAL_QUERY = "general_query"


class ConversationManager:
    """Manages conversation state and context."""
    
    def __init__(self):
        """Initialize conversation manager."""
        self.sessions: Dict[str, Dict] = {}

    def _get_session_data(self, session_id: str) -> Dict:
        """Get or create session data."""
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "state": ConversationState.INITIAL,
                "context": {},
                "conversation_history": [],
                "pending_order_data": {}
            }
        return self.sessions[session_id]
    
    def get_state(self, session_id: str) -> ConversationState:
        """Get conversation state for a session."""
        return self._get_session_data(session_id)["state"]
    
    def update_state(self, session_id: str, new_state: ConversationState):
        """Update conversation state for a session."""
        self._get_session_data(session_id)["state"] = new_state
    
    def add_message(self, session_id: str, role: str, content: str, metadata: Optional[Dict] = None):
        """
        Add message to conversation history for a session.
        
        Args:
            session_id: Unique identifier for the user session
            role: Message role ("user" or "assistant")
            content: Message content
            metadata: Optional metadata
        """
        session_data = self._get_session_data(session_id)
        message = {
            "role": role,
            "content": content,
            "timestamp": None  # Can add datetime if needed
        }
        if metadata:
            message["metadata"] = metadata
        session_data["conversation_history"].append(message)
    
    
    def set_context(self, session_id: str, key: str, value: any):
        """Set context value for a session."""
        session_data = self._get_session_data(session_id)
        session_data["context"][key] = value
    
    def get_context(self, session_id: str, key: str, default: any = None) -> any:
        """Get context value for a session."""
        session_data = self._get_session_data(session_id)
        return session_data["context"].get(key, default)
    
    def clear_context(self, session_id: str):
        """Clear context for a session."""
        session_data = self._get_session_data(session_id)
        session_data["context"] = {}
        session_data["pending_order_data"] = {}
        session_data["state"] = ConversationState.INITIAL
    
    def is_ordering_mode(self, session_id: str) -> bool:
        """Check if in ordering mode for a session."""
        state = self._get_session_data(session_id)["state"]
        return state in [
            ConversationState.ORDERING,
            ConversationState.COLLECTING_NAME,
            ConversationState.COLLECTING_PHONE,
            ConversationState.COLLECTING_ADDRESS,
            ConversationState.COLLECTING_QUANTITY
        ]
    
    def extract_order_intent(self, message: str, session_id: str) -> bool:
        """Check if message indicates order intent for a session."""
        # This method might not strictly need session_id for its core logic,
        # but it's included for consistency if future state-dependent intent
        # extraction is added.
        order_keywords = [
            "order", "buy", "purchase", "place order", "want to buy",
            "I'd like to", "I want", "add to cart", "checkout"
        ]
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in order_keywords)
    
    def extract_product_mention(self, message: str) -> Optional[str]:
        """Extract product name from message."""
        # Simple extraction - can be enhanced with NLP
        # This is a placeholder for more sophisticated extraction
        return None
    
    def get_recent_context(self, session_id: str, n_messages: int = 5) -> List[Dict]:
        """Get recent conversation context for a session."""
        session_data = self._get_session_data(session_id)
        history = session_data["conversation_history"]
        return history[-n_messages:] if len(history) > n_messages else history

