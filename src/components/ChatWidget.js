'use client';
import { useState, useRef, useEffect } from 'react';

export default function ChatWidget({ isOpen, setIsOpen }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I can help you find products or track orders.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, session_id: 'guest' })
      });

      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'bot', text: data.response }]);

      if (data.action === 'ADD_TO_CART') {
        console.log("Adding to cart:", data.payload);
        alert(`AI added ${data.payload.items.length} items to your cart!`);
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I'm having trouble connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 2. The Sidebar Panel */}
      <div 
        className={`chat-widget-container ${isOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '30%',         
          minWidth: '300px',      
          height: '100vh',       
          margin: 0,
          borderRadius: 0,        
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)', 
          left: 'auto',        
          transition: 'transform 0.3s ease-in-out',
          zIndex: 3000
        }}
      >
        <div className="chat-window" style={{ height: '100%' }}>
          
          <div className="chat-header">
            <h3 className="chat-title">Store Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="chat-close-button">✕</button>
          </div>

          <div className="chat-messages-area">
            {messages.map((m, i) => (
              <div key={i} className={`chat-message-row ${m.role}`}>
                <div className={`chat-message-bubble ${m.role}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="chat-typing-indicator">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area with Flex fix */}
          <div className="chat-input-area" style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about laptops..."
              className="chat-input-field"
            />
            <button 
              onClick={sendMessage}
              disabled={isLoading}
              className="chat-send-button"
            >
              ➤
            </button>
          </div>

        </div>
      </div>
    </>
  );
}