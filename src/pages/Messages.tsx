import React, { useState, useEffect } from 'react';
import { messageService, MessageThread, Message } from '../services/messageService';

const Messages: React.FC = () => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch conversation when selected user changes
  useEffect(() => {
    if (!selectedUserId) return;

    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await messageService.getConversation(selectedUserId);
        setMessages(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [selectedUserId]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUserId) return;

    try {
      setError(null);
      await messageService.sendMessage(selectedUserId, messageInput);
      setMessageInput('');

      // Refresh conversation
      const data = await messageService.getConversation(selectedUserId);
      setMessages(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Threads List */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Conversations</h2>

          {loading && threads.length === 0 && (
            <p className="text-gray-500">Loading conversations...</p>
          )}

          {error && threads.length === 0 && (
            <p className="text-red-500">{error}</p>
          )}

          {threads.length === 0 && !loading && (
            <p className="text-gray-500">No conversations yet</p>
          )}

          <div className="space-y-2">
            {threads.map((thread) => (
              <button
                key={thread._id}
                onClick={() => setSelectedUserId(thread.counterpart || thread.to)}
                className={`w-full text-left p-3 rounded-lg transition ${
                  selectedUserId === (thread.counterpart || thread.to)
                    ? 'bg-green-100 border-l-4 border-green-600'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <p className="font-medium text-sm">
                  {thread.counterpart || thread.to}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {thread.body}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(thread.createdAt).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
          {!selectedUserId ? (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <p>Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">
                Conversation with {selectedUserId}
              </h2>

              {/* Messages */}
              <div className="bg-gray-50 rounded p-4 mb-4 h-96 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`p-3 rounded-lg max-w-xs ${
                        msg.from === selectedUserId
                          ? 'bg-blue-100 text-blue-900 mr-auto'
                          : 'bg-green-100 text-green-900 ml-auto'
                      }`}
                    >
                      <p>{msg.body}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

              {/* Message Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
