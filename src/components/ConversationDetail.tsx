import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';

interface Message {
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  text: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  _id: string;
  buyer: any;
  seller: any;
  listing?: any;
  messages: Message[];
  status: string;
  lastMessage?: Message;
  lastMessageAt: string;
}

const ConversationDetail: React.FC<{ conversationId: string; currentUserId: string }> = ({
  conversationId,
  currentUserId,
}) => {
  const [messageText, setMessageText] = useState('');

  // Fetch conversation
  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await axios.get(`/api/conversations/${conversationId}`);
      return response.data.data;
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await axios.post(
        `/api/conversations/${conversationId}/messages`,
        { text }
      );
      return response.data.data;
    },
    onSuccess: () => {
      setMessageText('');
      // Refetch conversation
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
    }
  };

  if (isLoading) return <div className="p-4">Loading conversation...</div>;
  if (error) return <div className="p-4 text-red-500">Error loading conversation</div>;
  if (!conversation) return <div className="p-4">Conversation not found</div>;

  const otherParty = conversation.buyer._id === currentUserId ? conversation.seller : conversation.buyer;

  return (
    <div className="flex flex-col h-[600px] bg-white border rounded-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-semibold text-lg">{otherParty.name}</h2>
        {conversation.listing && (
          <p className="text-sm text-gray-600">{conversation.listing.title}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conversation.messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender._id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.sender._id === currentUserId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-4 border-t bg-gray-50 flex gap-2"
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={sendMessageMutation.isPending}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ConversationDetail;
