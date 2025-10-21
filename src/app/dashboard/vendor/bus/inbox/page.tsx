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

export default function BusInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bus/inbox');
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
          
          // Set the current user's ID from the API response
          if (data.currentUserId) {
            setCurrentUserId(data.currentUserId);
          }
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
      // Find the conversation to get the customer email
      const conversation = conversations.find(conv => conv._id === conversationId);
      if (!conversation) {
        console.error('Conversation not found:', conversationId);
        return;
      }
      
      const response = await fetch(`/api/messages?busId=${conversation.contactEmail}`);
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
      // Find the conversation to get the customer email
      const conversation = conversations.find(conv => conv._id === selectedConversationId);
      if (!conversation) {
        console.error('Conversation not found:', selectedConversationId);
        return;
      }
      
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          vendorId: conversation.contactEmail, // Customer email (recipient)
          serviceType: 'bus'
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
        <h1 className="text-3xl font-bold">Bus Inbox</h1>
        <p className="text-muted-foreground">Manage passenger communications and messages</p>
      </div>

      <WhatsAppInbox
        conversations={conversations}
        messages={messages}
        currentUserId={currentUserId}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        loading={loading}
        selectedConversationId={selectedConversationId}
        title="Bus Messages"
      />
    </div>
  );
}