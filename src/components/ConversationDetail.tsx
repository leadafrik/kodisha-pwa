import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";

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

const formatLastActive = (value?: string | Date) => {
  if (!value) return "Active recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Active recently";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMins < 60) return `Active ${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Active ${diffDays}d ago`;
  return `Active ${date.toLocaleDateString()}`;
};

const ConversationDetail: React.FC<{ conversationId: string; currentUserId: string }> = ({
  conversationId,
  currentUserId,
}) => {
  const [messageText, setMessageText] = useState("");

  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const response = await axios.get(`/api/conversations/${conversationId}`);
      return response.data.data as Conversation;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await axios.post(`/api/conversations/${conversationId}/messages`, { text });
      return response.data.data;
    },
    onSuccess: () => {
      setMessageText("");
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText);
    }
  };

  if (isLoading) return <div className="ui-card p-4">Loading conversation...</div>;
  if (error) return <div className="ui-card border-red-200 p-4 text-red-700">Error loading conversation</div>;
  if (!conversation) return <div className="ui-card p-4">Conversation not found</div>;

  const otherParty = conversation.buyer._id === currentUserId ? conversation.seller : conversation.buyer;
  const responseTimeLabel = otherParty?.responseTime || otherParty?.responseTimeLabel || "Usually replies within 24 hours";
  const lastActiveLabel = formatLastActive(otherParty?.lastActive || otherParty?.updatedAt || conversation.lastMessageAt);
  const isVerified = !!otherParty?.isVerified;

  return (
    <div className="ui-card flex h-[600px] flex-col overflow-hidden">
      <div className="border-b border-stone-200 bg-[#FAF7F2] px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-stone-900">{otherParty.name}</h2>
          {isVerified && (
            <span className="rounded-full bg-[#FDF5F3] px-2 py-0.5 text-xs font-semibold text-[#A0452E]">
              Verified
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-stone-500">{responseTimeLabel} - {lastActiveLabel}</p>
        {conversation.listing && <p className="text-sm text-stone-600">{conversation.listing.title}</p>}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
        {conversation.messages.map((msg: Message, idx: number) => {
          const isCurrentUser = msg.sender._id === currentUserId;
          return (
            <div key={idx} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 ${
                  isCurrentUser
                    ? "bg-[#A0452E] text-white"
                    : "bg-[#FAF7F2] text-stone-900"
                }`}
              >
                <p className="text-sm leading-6">{msg.text}</p>
                <p className={`mt-1 text-xs ${isCurrentUser ? "text-white/75" : "text-stone-500"}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-stone-200 bg-[#FAF7F2] p-4">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="ui-input flex-1"
        />
        <button type="submit" disabled={sendMessageMutation.isPending} className="ui-btn-primary px-6">
          Send
        </button>
      </form>
    </div>
  );
};

export default ConversationDetail;
