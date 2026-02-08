import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { messageService, MessageThread, Message } from '../services/messageService';
import { API_ENDPOINTS, apiRequest } from '../config/api';
import { ChevronLeft, Send, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;
const THREADS_POLL_INTERVAL_MS = 15000;
const CONVERSATION_POLL_INTERVAL_MS = 5000;
const AUTO_SCROLL_THRESHOLD_PX = 120;

const valueAsString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : '';
};

const normalizeId = (value: unknown): string => {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'object') {
    const rawObject = value as any;
    const nestedId = rawObject?._id ?? rawObject?.id ?? rawObject?.$oid;
    const normalizedNested = normalizeId(nestedId);
    if (normalizedNested) return normalizedNested;

    const asString = rawObject?.toString?.();
    if (
      typeof asString === 'string' &&
      asString !== '[object Object]' &&
      asString.trim()
    ) {
      return asString.trim();
    }
  }

  return '';
};

const formatUserLabel = (userId: string, value?: string) => {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  if (OBJECT_ID_PATTERN.test(userId)) return `User ${userId.slice(-6)}`;
  return userId;
};

const getProfileDisplayName = (
  profile: Record<string, unknown>,
  userId: string
) => {
  const firstName = valueAsString(profile.firstName);
  const lastName = valueAsString(profile.lastName);
  const fullName =
    valueAsString(profile.fullName) ||
    valueAsString(profile.name) ||
    valueAsString(profile.displayName) ||
    [firstName, lastName].filter(Boolean).join(' ').trim();
  const contactValue =
    valueAsString(profile.email) ||
    valueAsString(profile.phone) ||
    valueAsString(profile.username);
  return formatUserLabel(userId, fullName || contactValue);
};

const resolveCounterpartId = (
  thread: MessageThread,
  currentUserId: string
): string => {
  const normalizedCounterpart = normalizeId((thread as any).counterpart);
  if (normalizedCounterpart) return normalizedCounterpart;

  const fromId = normalizeId((thread as any).from);
  const toId = normalizeId((thread as any).to);

  if (currentUserId) {
    if (fromId === currentUserId && toId) return toId;
    if (toId === currentUserId && fromId) return fromId;
  }
  return toId || fromId;
};

interface ListingPreview {
  id: string;
  title: string;
  category: string;
  location: string;
  price: string;
  image?: string;
}

const formatPrice = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Contact for price';
  return `KSh ${amount.toLocaleString()}`;
};

const getMessageListingId = (message: Message): string => {
  const rawListing = message?.listing;
  if (!rawListing) return '';
  return normalizeId(rawListing);
};

const buildListingPreview = (listingId: string, listing: any): ListingPreview => {
  const location =
    [
      valueAsString(listing?.location?.county),
      valueAsString(listing?.location?.constituency),
      valueAsString(listing?.location?.ward),
    ]
      .filter(Boolean)
      .join(', ') || 'Location not specified';

  return {
    id: listingId,
    title: valueAsString(listing?.title || listing?.name) || 'Listing',
    category:
      valueAsString(listing?.listingType || listing?.category || listing?.type) || 'Listing',
    location,
    price: formatPrice(listing?.price || listing?.pricing),
    image: Array.isArray(listing?.images) ? listing.images[0] : undefined,
  };
};

const isNearBottom = (element: HTMLElement) => {
  const distanceFromBottom =
    element.scrollHeight - element.scrollTop - element.clientHeight;
  return distanceFromBottom <= AUTO_SCROLL_THRESHOLD_PX;
};

const buildMessagesSignature = (items: Message[]) => {
  const last = items[items.length - 1];
  const lastId = normalizeId((last as any)?._id);
  const lastRead = (last as any)?.read ? '1' : '0';
  const lastStatus = valueAsString((last as any)?.status);
  const lastCreatedAt = valueAsString((last as any)?.createdAt);
  return `${items.length}:${lastId}:${lastRead}:${lastStatus}:${lastCreatedAt}`;
};

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [listingPreviews, setListingPreviews] = useState<Record<string, ListingPreview | null>>({});
  const conversationScrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userPinnedToBottomRef = useRef(true);
  const forceScrollToBottomRef = useRef(false);
  const previousMessagesSignatureRef = useRef('');
  const currentUserId = useMemo(() => {
    const authId = normalizeId(user?._id) || normalizeId(user?.id);
    if (authId) return authId;

    if (typeof window === 'undefined') return '';

    try {
      const rawUser = window.localStorage.getItem('kodisha_user');
      if (!rawUser) return '';
      const parsed = JSON.parse(rawUser);
      return normalizeId(parsed?._id) || normalizeId(parsed?.id);
    } catch {
      return '';
    }
  }, [user?._id, user?.id]);
  const requestedUserId = valueAsString(searchParams.get('userId'));

  const loadThreads = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const data = await messageService.getMessageThreads();
      setThreads(data);

      const ids = Array.from(
        new Set(
          data
            .map((thread) => resolveCounterpartId(thread, currentUserId))
            .filter((id): id is string => !!id)
        )
      );

      if (ids.length > 0) {
        const profiles = await Promise.all(
          ids.map(async (id) => {
            try {
              const res = await apiRequest(API_ENDPOINTS.users.getProfile(id));
              const payload =
                res && typeof res === 'object'
                  ? (res as Record<string, unknown>)
                  : {};
              const profileSource = payload.data ?? payload.user ?? payload;
              const profile =
                profileSource && typeof profileSource === 'object'
                  ? (profileSource as Record<string, unknown>)
                  : {};
              return { id, name: getProfileDisplayName(profile, id) };
            } catch {
              return { id, name: formatUserLabel(id) };
            }
          })
        );

        setUserNames((prev) => {
          const next = { ...prev };
          profiles.forEach((entry) => {
            next[entry.id] = entry.name;
          });
          return next;
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currentUserId]);

  const loadConversation = useCallback(
    async (userId: string, showLoading = false) => {
      try {
        if (showLoading) setLoading(true);
        setError(null);
        const data = await messageService.getConversation(userId);
        setMessages((previous) => {
          const previousSignature = buildMessagesSignature(previous);
          const nextSignature = buildMessagesSignature(data);
          return previousSignature === nextSignature ? previous : data;
        });

        // Mark messages from this user as read
        try {
          await messageService.markMessagesAsRead(userId);
        } catch (markErr) {
          console.error('Failed to mark messages as read:', markErr);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    []
  );

  const loadListingPreview = useCallback(async (listingId: string) => {
    try {
      const res: any = await apiRequest(API_ENDPOINTS.properties.getById(listingId));
      const listing = res?.data || res;
      if (!listing || typeof listing !== 'object') {
        setListingPreviews((prev) => ({ ...prev, [listingId]: null }));
        return;
      }
      setListingPreviews((prev) => ({
        ...prev,
        [listingId]: buildListingPreview(listingId, listing),
      }));
    } catch {
      setListingPreviews((prev) => ({ ...prev, [listingId]: null }));
    }
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleConversationScroll = useCallback(() => {
    const container = conversationScrollRef.current;
    if (!container) return;
    userPinnedToBottomRef.current = isNearBottom(container);
  }, []);

  useEffect(() => {
    const signature = buildMessagesSignature(messages);
    const signatureChanged = signature !== previousMessagesSignatureRef.current;
    if (!signatureChanged) return;

    const shouldAutoScroll =
      forceScrollToBottomRef.current || userPinnedToBottomRef.current;

    if (shouldAutoScroll) {
      const behavior: ScrollBehavior = forceScrollToBottomRef.current ? 'smooth' : 'auto';
      scrollToBottom(behavior);
      userPinnedToBottomRef.current = true;
    }

    previousMessagesSignatureRef.current = signature;
    forceScrollToBottomRef.current = false;
  }, [messages, scrollToBottom]);

  // Fetch message threads on mount and refresh regularly
  useEffect(() => {
    loadThreads(true);

    const intervalId = window.setInterval(() => {
      loadThreads(false);
    }, THREADS_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [loadThreads]);

  // Fetch conversation and keep it updated while a thread is selected
  useEffect(() => {
    if (!selectedUserId) return;

    loadConversation(selectedUserId, true);

    const intervalId = window.setInterval(() => {
      loadConversation(selectedUserId, false);
    }, CONVERSATION_POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [selectedUserId, loadConversation]);

  useEffect(() => {
    if (!selectedUserId) return;
    previousMessagesSignatureRef.current = '';
    setSelectedUserName(formatUserLabel(selectedUserId, userNames[selectedUserId]));
  }, [selectedUserId, userNames]);

  useEffect(() => {
    if (!requestedUserId) return;
    forceScrollToBottomRef.current = true;
    userPinnedToBottomRef.current = true;
    setSelectedUserId((prev) => (prev === requestedUserId ? prev : requestedUserId));
    setSelectedUserName(formatUserLabel(requestedUserId, userNames[requestedUserId]));
  }, [requestedUserId, userNames]);

  useEffect(() => {
    const listingIds = Array.from(
      new Set(
        messages.map((msg) => getMessageListingId(msg)).filter((id): id is string => !!id)
      )
    );
    if (listingIds.length === 0) return;

    const missingIds = listingIds.filter((id) => !(id in listingPreviews));
    if (missingIds.length === 0) return;

    missingIds.forEach((id) => {
      void loadListingPreview(id);
    });
  }, [messages, listingPreviews, loadListingPreview]);

  const handleSelectUser = (userId: string, userName: string) => {
    forceScrollToBottomRef.current = true;
    userPinnedToBottomRef.current = true;
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
      forceScrollToBottomRef.current = true;
      userPinnedToBottomRef.current = true;

      // Refresh immediately after sending
      await loadConversation(selectedUserId, false);
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
    <div className="mx-auto flex h-full min-h-0 max-w-6xl flex-col bg-white">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 flex-1 overflow-hidden">
        {/* Threads List */}
        <div className="hidden md:flex md:flex-col bg-white border-r border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && threads.length === 0 && (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="animate-pulse rounded-xl border border-gray-100 p-3">
                    <div className="h-3 w-2/5 rounded bg-gray-200" />
                    <div className="mt-2 h-3 w-4/5 rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            )}

            {error && threads.length === 0 && (
              <div className="p-4 space-y-3">
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
                <button
                  type="button"
                  onClick={() => loadThreads(true)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Retry
                </button>
              </div>
            )}

            {threads.length === 0 && !loading && !error && (
              <div className="p-6 text-center">
                <p className="text-sm font-semibold text-gray-800">No conversations yet</p>
                <p className="mt-1 text-xs text-gray-500">
                  Start from a listing and your chats will appear here.
                </p>
                <Link
                  to="/browse"
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
                >
                  Browse listings
                </Link>
              </div>
            )}

            <div className="space-y-0">
              {threads.map((thread) => {
                const otherUserId = resolveCounterpartId(thread, currentUserId);
                if (!otherUserId) return null;
                const displayName = formatUserLabel(otherUserId, userNames[otherUserId]);
                const isSelected = selectedUserId === otherUserId;

                return (
                  <button
                    key={thread._id}
                    onClick={() => handleSelectUser(otherUserId, displayName)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition ${
                      isSelected
                        ? 'bg-green-50 border-l-4 border-l-green-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {displayName}
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
              <div className="text-center px-4">
                <p className="text-gray-700 text-lg font-semibold">Select a conversation</p>
                <p className="text-gray-500 text-sm mt-2">
                  Choose a thread from the list or start one from any listing.
                </p>
                <Link
                  to="/browse"
                  className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-lg border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 transition"
                >
                  Find listings
                </Link>
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
                  <p className="text-xs text-gray-500">Live updates</p>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={conversationScrollRef}
                onScroll={handleConversationScroll}
                className="flex-1 overflow-y-auto bg-white space-y-3 p-4"
              >
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {loading && messages.length === 0 ? (
                  <div className="space-y-3 animate-pulse">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-14 rounded-xl ${index % 2 === 0 ? 'w-2/3 bg-gray-100' : 'w-1/2 ml-auto bg-green-100'}`}
                      />
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-center">
                      No messages yet with {selectedUserName || 'this user'}.<br />
                      <span className="text-sm">Send the first message below.</span>
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const senderId = normalizeId((msg as any).from);
                    const isOwn = !!currentUserId && senderId === currentUserId;
                    const listingId = getMessageListingId(msg);
                    const listingPreview = listingId ? listingPreviews[listingId] : undefined;
                    const senderName = isOwn
                      ? 'You'
                      : formatUserLabel(
                          senderId || valueAsString((msg as any).from),
                          senderId === selectedUserId
                            ? selectedUserName
                            : userNames[senderId]
                        );

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
                            <p
                              className={`text-[11px] font-semibold ${
                                isOwn ? 'text-green-100 text-right' : 'text-gray-500'
                              }`}
                            >
                              {senderName}
                            </p>
                            <p className="text-sm break-words">{msg.body}</p>
                            {listingId && (
                              <Link
                                to={`/listings/${listingId}`}
                                className={`mt-2 block rounded-lg border p-2 transition ${
                                  isOwn
                                    ? 'border-green-400 bg-green-500/30 hover:bg-green-500/40'
                                    : 'border-gray-200 bg-white hover:bg-gray-50'
                                }`}
                              >
                                {listingPreview ? (
                                  <div className="flex items-center gap-2">
                                    {listingPreview.image ? (
                                      <img
                                        src={listingPreview.image}
                                        alt={listingPreview.title}
                                        className="h-12 w-12 rounded-md object-cover flex-shrink-0"
                                      />
                                    ) : null}
                                    <div className="min-w-0">
                                      <p
                                        className={`truncate text-xs font-semibold ${
                                          isOwn ? 'text-white' : 'text-gray-900'
                                        }`}
                                      >
                                        {listingPreview.title}
                                      </p>
                                      <p
                                        className={`truncate text-[11px] ${
                                          isOwn ? 'text-green-100' : 'text-gray-600'
                                        }`}
                                      >
                                        {listingPreview.category}
                                      </p>
                                      <p
                                        className={`truncate text-[11px] font-semibold ${
                                          isOwn ? 'text-green-50' : 'text-green-700'
                                        }`}
                                      >
                                        {listingPreview.price}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <p className={`text-xs font-semibold ${isOwn ? 'text-green-50' : 'text-green-700'}`}>
                                    View listing details
                                  </p>
                                )}
                              </Link>
                            )}
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
                    className="min-h-[44px] min-w-[44px] p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
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
