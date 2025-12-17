import React, { useState, useRef, useEffect } from 'react';
import './ChatbotWidget.css';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
  suggestions?: string[];
  confidence?: number;
}

interface ChatSession {
  chatId: string;
  sessionId: string;
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://kodisha-backend-vjr9.onrender.com/api';

  // Initialize chat session when widget opens
  useEffect(() => {
    if (isOpen && !chatSession) {
      startChat();
    }
  }, [isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Start a new chat session
   */
  const startChat = async () => {
    try {
      setError('');
      const response = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setChatSession({
          chatId: data.data.chatId,
          sessionId: data.data.sessionId,
        });

        // Add welcome message
        setMessages([
          {
            id: '1',
            sender: 'bot',
            message: data.data.welcome,
            timestamp: new Date(),
            suggestions: [
              'Search products',
              'Sell something',
              'Create account',
            ],
          },
        ]);
      } else {
        setError('Failed to start chat. Please try again.');
      }
    } catch (err) {
      console.error('Error starting chat:', err);
      setError('Connection error. Please check your internet and try again.');
    }
  };

  /**
   * Send a message to the chatbot
   */
  const handleSendMessage = async (messageText: string = inputValue) => {
    if (!messageText.trim() || !chatSession) return;

    // Add user message to UI
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/chat/${chatSession.chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();

      if (data.success) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          message: data.data.message,
          timestamp: new Date(),
          suggestions: data.data.suggestions,
          confidence: data.data.confidence,
        };

        setMessages((prev) => [...prev, botMessage]);

        // Auto-escalate if bot recommends it
        if (data.data.requiresEscalation) {
          setTimeout(() => {
            escalateToHuman();
          }, 2000);
        }
      } else {
        setError('Failed to send message. Please try again.');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle suggestion button click
   */
  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  /**
   * Escalate chat to human support
   */
  const escalateToHuman = async () => {
    if (!chatSession) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/chat/${chatSession.chatId}/escalate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: 'User requested human support',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const escalationMessage: Message = {
          id: (Date.now() + 2).toString(),
          sender: 'bot',
          message:
            '📞 Your chat has been escalated to our support team. A human agent will respond within a few minutes. Thank you for your patience!',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, escalationMessage]);
      }
    } catch (err) {
      console.error('Error escalating chat:', err);
      setError('Failed to escalate. Please contact support directly.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle Enter key to send message
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chatbot-widget">
      {/* Floating Button */}
      {!isOpen && (
        <button
          className="chatbot-floating-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="chatbot-badge">💬</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div>
              <h3>Agrisoko Assistant</h3>
              <p className="chatbot-status">
                {isLoading ? '⚙️ Typing...' : '🟢 Online'}
              </p>
            </div>
            <button
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.length === 0 ? (
              <div className="chatbot-empty">
                <p>👋 Hi! How can I help you today?</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`chatbot-message chatbot-message-${msg.sender}`}>
                  <div className="chatbot-message-content">
                    <p>{msg.message}</p>
                    {msg.confidence && msg.confidence < 80 && (
                      <small className="chatbot-confidence">
                        Confidence: {msg.confidence}%
                      </small>
                    )}
                  </div>

                  {/* Suggestions */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="chatbot-suggestions">
                      {msg.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className="chatbot-suggestion-btn"
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isLoading}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {error && <div className="chatbot-error">{error}</div>}

          {/* Input Area */}
          <div className="chatbot-input-area">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Shift+Enter for new line)"
              disabled={isLoading || !chatSession}
              className="chatbot-input"
              rows={1}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim() || !chatSession}
              className="chatbot-send-btn"
              aria-label="Send message"
            >
              {isLoading ? '⏳' : '📤'}
            </button>
            <button
              onClick={escalateToHuman}
              disabled={isLoading}
              className="chatbot-escalate-btn"
              title="Connect with human support"
              aria-label="Escalate to human support"
            >
              👤
            </button>
          </div>

          {/* Footer */}
          <div className="chatbot-footer">
            <p>Powered by Agrisoko • Available 24/7</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
