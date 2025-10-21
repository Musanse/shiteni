'use client';

import { useState, useEffect } from 'react';
import WhatsAppInbox from '@/components/ui/whatsapp-inbox';

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
}

export default function StoreInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/store/inbox');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.conversations) {
          // Ensure all conversation fields are properly defined
          const safeConversations = data.conversations.map((conv: {
            _id: string;
            customerName: string;
            customerEmail: string;
            lastMessage: string;
            timestamp: string;
            unreadCount: number;
            isFromMe: boolean;
          }) => ({
            _id: conv._id || '',
            contactName: conv.customerName || 'Unknown',
            contactEmail: conv.customerEmail || '',
            lastMessage: conv.lastMessage || '',
            timestamp: conv.timestamp || new Date().toISOString(),
            unreadCount: conv.unreadCount || 0,
            isFromMe: conv.isFromMe || false
          }));
          setConversations(safeConversations);
          // Use actual vendor id for conversation linkage
          if (data.vendorId) setCurrentUserId(data.vendorId);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a specific conversation
  const fetchConversationMessages = async (conversationId: string) => {
    try {
      // conversationId should be the vendorId; participantId is the selected customer id
      const params = new URLSearchParams({
        conversationId: currentUserId || '',
        participantId: conversationId
      });
      const response = await fetch(`/api/store/inbox/messages?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    fetchConversationMessages(conversationId);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;
    
    try {
      const response = await fetch('/api/store/inbox/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentUserId, // vendor id conversation root
          content,
          participantId: selectedConversationId
        })
      });

      if (response.ok) {
        fetchConversationMessages(selectedConversationId);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Store Inbox</h1>
        <p className="text-muted-foreground">Manage customer communications and messages</p>
      </div>

      <WhatsAppInbox
        conversations={conversations}
        messages={messages}
        currentUserId={currentUserId}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        loading={loading}
        selectedConversationId={selectedConversationId}
        title="Store Messages"
      />
    </div>
  );
}