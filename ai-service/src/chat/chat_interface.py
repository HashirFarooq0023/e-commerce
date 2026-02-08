"""
Chat interface for text-based interactions.
"""

from typing import Optional, Callable
import sys


class ChatInterface:
    """Chat interface for text-based user interactions."""
    
    def __init__(self, on_message: Optional[Callable] = None):
        """
        Initialize chat interface.
        
        Args:
            on_message: Callback function for handling messages
        """
        self.on_message = on_message
        self.conversation_history = []
    
    def start_chat(self):
        """Start interactive chat session."""
        print("Store Assistant Chat - Type 'exit' to quit, 'help' for commands\n")
        
        while True:
            try:
                user_input = input("You: ").strip()
                
                if not user_input:
                    continue
                
                if user_input.lower() == 'exit':
                    print("Goodbye!")
                    break
                
                if user_input.lower() == 'help':
                    self._show_help()
                    continue
                
                # Add to conversation history
                self.conversation_history.append({"role": "user", "content": user_input})
                
                # Process message
                if self.on_message:
                    response = self.on_message(user_input)
                else:
                    response = "No message handler configured."
                
                # Add response to history
                self.conversation_history.append({"role": "assistant", "content": response})
                
                # Display response
                print(f"Assistant: {response}\n")
                
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                print(f"Error: {str(e)}\n")
    
    def _show_help(self):
        """Show help message."""
        help_text = """
Available Commands:
- exit: Quit the chat
- help: Show this help message

You can ask about:
- Products and inventory
- Place orders
- Check order status
- General store information
"""
        print(help_text)
    
    def send_message(self, message: str) -> str:
        """
        Send a message and get response.
        
        Args:
            message: User message
            
        Returns:
            Assistant response
        """
        if self.on_message:
            response = self.on_message(message)
            self.conversation_history.append({"role": "user", "content": message})
            self.conversation_history.append({"role": "assistant", "content": response})
            return response
        return ""
    
    def get_conversation_history(self) -> list:
        """Get conversation history."""
        return self.conversation_history.copy()
    
    def clear_history(self):
        """Clear conversation history."""
        self.conversation_history = []

