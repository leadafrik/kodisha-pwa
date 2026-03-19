import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatSession {
  chatId: string;
  sessionId: string;
}

const BRAND = '#A0452E';

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://kodisha-backend-vjr9.onrender.com/api';

  useEffect(() => {
    if (isOpen && !chatSession) startChat();
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const startChat = async () => {
    try {
      setError('');
      const res = await fetch(`${API_URL}/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setChatSession({ chatId: data.data.chatId, sessionId: data.data.sessionId });
        setMessages([{
          id: '1',
          sender: 'bot',
          message: data.data.welcome,
          timestamp: new Date(),
          suggestions: ['Browse listings', 'How to list', 'ID verification'],
        }]);
      } else {
        setError('Could not start chat. Please try again.');
      }
    } catch {
      setError('Connection error. Check your internet and try again.');
    }
  };

  const handleSendMessage = async (messageText: string = inputValue) => {
    const trimmed = messageText.trim();
    if (!trimmed || !chatSession || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/chat/${chatSession.chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      if (data.success) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          message: data.data.message,
          timestamp: new Date(),
          suggestions: data.data.suggestions,
        }]);
      } else {
        setError(data.message || 'Failed to send message.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const escalateToHuman = async () => {
    if (!chatSession || isLoading) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/chat/${chatSession.chatId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User requested human support' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 2).toString(),
          sender: 'bot',
          message: 'Connecting you with our team now.\n\nJoin our WhatsApp group: https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i\n\nWe usually respond within a few minutes.',
          timestamp: new Date(),
        }]);
      }
    } catch {
      setError('Could not connect. Try WhatsApp directly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: BRAND,
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(160,69,46,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Soko — Agrisoko assistant"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            height: 540,
            maxHeight: 'calc(100vh - 40px)',
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 40,
            overflow: 'hidden',
            animation: 'sokoChatIn 0.22s ease',
          }}
        >
          <style>{`
            @keyframes sokoChatIn {
              from { opacity: 0; transform: translateY(16px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes sokoDot {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
              40%            { transform: scale(1);   opacity: 1;   }
            }
          `}</style>

          {/* Header */}
          <div style={{ backgroundColor: BRAND, color: 'white', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Soko — Agrisoko</p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>{isLoading ? 'Typing…' : 'Online · Usually replies instantly'}</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, background: '#f8f7f6' }}>
            {messages.length === 0 && !isLoading && (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 32 }}>Starting chat…</div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start', gap: 6, animation: 'sokoChatIn 0.18s ease' }}>
                {/* Bubble */}
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '9px 13px',
                    borderRadius: msg.sender === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                    fontSize: 14,
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    backgroundColor: msg.sender === 'user' ? BRAND : 'white',
                    color: msg.sender === 'user' ? 'white' : '#1f2937',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: msg.sender === 'bot' ? '1px solid #e5e7eb' : 'none',
                  }}
                >
                  {msg.message.includes('http')
                    ? msg.message.split(/(\bhttps?:\/\/[^\s]+)/g).map((part, i) =>
                        /^https?:\/\//.test(part)
                          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: msg.sender === 'user' ? '#fde8e0' : '#A0452E', textDecoration: 'underline', wordBreak: 'break-all' }}>{part}</a>
                          : <span key={i}>{part}</span>
                      )
                    : msg.message}
                </div>
                {/* Suggestion pills */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: '82%' }}>
                    {msg.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(s)}
                        disabled={isLoading}
                        style={{
                          padding: '5px 11px',
                          background: 'white',
                          border: `1.5px solid ${BRAND}`,
                          color: BRAND,
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'background 0.15s',
                          opacity: isLoading ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = '#fdf0ed'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', display: 'flex', gap: 5 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#9ca3af', display: 'inline-block', animation: `sokoDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fee2e2', color: '#991b1b', fontSize: 12, padding: '6px 14px', borderTop: '1px solid #fca5a5' }}>{error}</div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e7eb', background: 'white', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Enter to send)"
              disabled={isLoading || !chatSession}
              maxLength={600}
              rows={1}
              style={{
                flex: 1,
                border: '1px solid #d1d5db',
                borderRadius: 10,
                padding: '8px 12px',
                fontFamily: 'inherit',
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                maxHeight: 72,
                lineHeight: 1.4,
                background: isLoading || !chatSession ? '#f3f4f6' : 'white',
                color: '#1f2937',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = BRAND; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
            <button
              onClick={() => void handleSendMessage()}
              disabled={isLoading || !inputValue.trim() || !chatSession}
              aria-label="Send"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                backgroundColor: !inputValue.trim() || isLoading || !chatSession ? '#d1d5db' : BRAND,
                color: 'white',
                cursor: !inputValue.trim() || isLoading || !chatSession ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>

          {/* Footer */}
          <div style={{ padding: '6px 14px 10px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>Powered by Agrisoko · 24/7</span>
            <button
              onClick={escalateToHuman}
              disabled={isLoading}
              style={{ background: 'none', border: 'none', color: BRAND, fontSize: 11, cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              Talk to a person →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
