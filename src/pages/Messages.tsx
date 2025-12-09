import React, { useState, useEffect, useRef } from 'react';
import { messageService, MessageThread, Message } from '../services/messageService';
import { ChevronLeft, Send, Check, CheckCheck, Circle } from 'lucide-react';

const Messages: React.FC = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch message threads on mount
  useEffect(() => {
    const loadThreads = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await messageService.getMessageThreads();
        setThreads(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, []);

  // Fetch conversation and mark as read when selected user changes
  useEffect(() => {
    if (!selectedUserId) return;

    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await messageService.getConversation(selectedUserId);
        setMessages(data);

        // Mark messages from this user as read
        try {
          await messageService.markMessagesAsRead(selectedUserId);
        } catch (markErr) {
          console.error('Failed to mark messages as read:', markErr);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [selectedUserId]);

  const handleSelectUser = (userId: string, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId) return;

    const messageText = messageInput;
    setMessageInput('');

    try {
      setError(null);
      await messageService.sendMessage(selectedUserId, messageText);

      // Refresh conversation
      const data = await messageService.getConversation(selectedUserId);
      setMessages(data);
    } catch (err) {
      setError((err as Error).message);
      setMessageInput(messageText); // Restore input on error
    }
  };

  const getStatusIcon = (msg: Message, isOwn: boolean) => {
    if (!isOwn) return null;

    if (msg.status === 'read') {
      return <CheckCheck size={16} className="text-blue-500" />;
    } else if (msg.status === 'delivered' || msg.read) {
      return <CheckCheck size={16} className="text-gray-400" />;
    } else {
      return <Check size={16} className="text-gray-400" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1 overflow-hidden">
        {/* Threads List */}
        <div className="hidden md:flex md:flex-col bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && threads.length === 0 && (
              <p className="p-4 text-gray-500 text-center">Loading conversations...</p>
            )}

            {error && threads.length === 0 && (
              <p className="p-4 text-red-500 text-center">{error}</p>
            )}

            {threads.length === 0 && !loading && (
              <p className="p-4 text-gray-500 text-center">No conversations yet</p>
            )}

            <div className="space-y-0">
              {threads.map((thread) => {
                const otherUserId = thread.counterpart || thread.to;
                const isSelected = selectedUserId === otherUserId;

                return (
                  <button
                    key={thread._id}
                    onClick={() => handleSelectUser(otherUserId, thread.counterpart || thread.to)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition ${
                      isSelected
                        ? 'bg-green-50 border-l-4 border-l-green-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {thread.counterpart || thread.to}
                        </p>
                        <p className="text-xs text-gray-600 truncate line-clamp-1">
                          {thread.body}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 flex-shrink-0">
                        {new Date(thread.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 flex flex-col bg-white">
          {!selectedUserId ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <p className="text-gray-500 text-lg">Select a conversation to start messaging</p>
                <p className="text-gray-400 text-sm mt-2">or start a new one from the list</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-4 flex items-center gap-3 bg-white sticky top-0">
                <button
                  onClick={() => {
                    setSelectedUserId(null);
                    setSelectedUserName('');
                  }}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedUserName}</h2>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-white space-y-3 p-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center">
                      No messages yet.<br />
                      <span className="text-sm">Start the conversation!</span>
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwn = msg.from === localStorage.getItem('userId') || msg.from !== selectedUserId;

                    return (
                      <div
                        key={msg._id}
                        className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg flex gap-1 items-end ${
                            isOwn
                              ? 'bg-green-600 text-white rounded-br-none'
                              : 'bg-gray-100 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          <div className="flex-1">
                            <p className="text-sm break-words">{msg.body}</p>
                            <div className="flex items-center gap-1 justify-end mt-1">
                              <p className={`text-xs opacity-75 ${isOwn ? 'text-green-50' : ''}`}>
                                {formatTime(msg.createdAt)}
                              </p>
                              {isOwn && getStatusIcon(msg, isOwn)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white sticky bottom-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
