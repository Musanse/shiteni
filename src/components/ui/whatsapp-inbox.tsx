'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Clock, 
  User, 
  ArrowLeft,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  _id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientRole: string;
  conversationId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'document';
  isRead: boolean;
  timestamp: string;
  createdAt: string;
}

interface Conversation {
  _id: string;
  contactName: string;
  contactEmail: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isFromMe: boolean;
  avatar?: string;
}

interface WhatsAppInboxProps {
  conversations: Conversation[];
  messages: Message[];
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  onSendMessage: (content: string) => void;
  onLoadMoreMessages?: () => void;
  loading?: boolean;
  selectedConversationId?: string;
  title?: string;
}

export default function WhatsAppInbox({
  conversations,
  messages,
  currentUserId,
  onSelectConversation,
  onSendMessage,
  onLoadMoreMessages,
  loading = false,
  selectedConversationId,
  title = "Messages"
}: WhatsAppInboxProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Filter conversations based on search
  const filteredConversations = conversations
    .filter(conv =>
    (conv.contactName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (conv.contactEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (conv.lastMessage?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Use messages as-is; then sort ascending so new messages appear at the bottom
  const conversationMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Debug logging
  useEffect(() => {
    console.log('WhatsAppInbox Debug:');
    console.log('  selectedConversationId:', selectedConversationId);
    console.log('  messages.length:', messages.length);
    console.log('  conversationMessages.length:', conversationMessages.length);
    console.log('  messages:', messages);
    console.log('  conversationMessages:', conversationMessages);
  }, [messages, selectedConversationId, conversationMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  // Load more messages when scrolling to top
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && onLoadMoreMessages) {
      onLoadMoreMessages();
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedContact(conversation);
    setShowChat(true);
    onSelectConversation(conversation._id);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE');
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE');
    } else {
      return format(date, 'dd/MM');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] bg-white rounded-lg shadow-lg overflow-hidden flex">
      {/* Conversations Sidebar */}
      <div className={`${showChat ? 'w-1/3' : 'w-full'} border-r border-gray-200 flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">{title}</h1>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-green-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white text-gray-900"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation._id}
                onClick={() => handleSelectConversation(conversation)}
                className={`cursor-pointer p-4 rounded-none border-b border-gray-100 transition-all ${
                  selectedConversationId === conversation._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {conversation.contactName.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.contactName}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatConversationTime(conversation.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.isFromMe ? 'You: ' : ''}{conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-green-500 text-white text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {showChat && selectedContact && (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(false)}
                className="md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                {selectedContact.contactName.charAt(0).toUpperCase()}
              </div>
              
              <div>
                <h2 className="font-semibold text-gray-900">{selectedContact.contactName}</h2>
                <p className="text-sm text-gray-500">{selectedContact.contactEmail}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            onScroll={handleScroll}
          >
            {conversationMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              conversationMessages.map((message) => {
                const isFromMe = message.senderId === currentUserId;
                return (
                  <div
                    key={message._id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        isFromMe
                          ? 'bg-green-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        isFromMe ? 'text-green-100' : 'text-gray-500'
                      }`}>
                        <Clock className="h-3 w-3" />
                        {formatMessageTime(message.timestamp)}
                        {isFromMe && (
                          <span className="ml-1">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-green-500 hover:bg-green-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!showChat && (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
            <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
          </div>
        </div>
      )}
    </div>
  );
}
