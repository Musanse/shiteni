'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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

export default function HotelInboxPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Fetch conversations from API
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hotel/inbox');
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
          // Set current user ID from the first conversation
          if (safeConversations.length > 0) {
            setCurrentUserId(session?.user?.email || 'hotel@example.com'); // Hotel vendor email
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Fetch messages for a specific conversation
  const fetchConversationMessages = async (conversationId: string) => {
    if (!conversationId) {
      console.warn('No conversation ID provided, skipping message fetch');
      return;
    }
    
    try {
      console.log('Fetching messages for conversation ID (customer email):', conversationId);
      const response = await fetch(`/api/messages?hotelId=${conversationId}`);
      console.log('Messages API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Messages API response data:', data);
        if (data.success && data.messages) {
          // Transform messages to match the expected format
          const transformedMessages = data.messages.map((msg: {
            _id: string;
            senderName: string;
            senderEmail: string;
            senderRole: string;
            content: string;
            timestamp: string;
            isRead: boolean;
          }) => ({
            _id: msg._id,
            senderId: msg.senderEmail,
            senderName: msg.senderName,
            senderEmail: msg.senderEmail,
            senderRole: msg.senderRole,
            recipientId: msg.senderEmail === conversationId ? (session?.user?.email || 'hotel@example.com') : conversationId,
            recipientName: msg.senderEmail === conversationId ? 'Hotel Staff' : 'Customer',
            recipientEmail: msg.senderEmail === conversationId ? (session?.user?.email || 'hotel@example.com') : conversationId,
            recipientRole: msg.senderEmail === conversationId ? 'vendor' : 'customer',
            conversationId: conversationId,
            content: msg.content,
            messageType: 'text' as const,
            isRead: msg.isRead,
            timestamp: msg.timestamp,
            createdAt: msg.timestamp
          }));
          console.log('Transformed messages:', transformedMessages);
          setMessages(transformedMessages);
          
          // Mark messages as read
          try {
            const markReadResponse = await fetch('/api/messages/mark-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conversationId })
            });
            
            if (markReadResponse.ok) {
              const markReadData = await markReadResponse.json();
              console.log(`Marked ${markReadData.markedCount} messages as read`);
              
              // Refresh conversations to update unread counts
              fetchConversations();
            }
          } catch (error) {
            console.error('Error marking messages as read:', error);
          }
        } else {
          console.log('No messages found or API error');
          setMessages([]);
        }
      } else {
        console.error('Failed to fetch messages:', response.status);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    fetchConversationMessages(conversationId);
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId) return;
    
    try {
      console.log('Sending message to conversation ID (customer email):', selectedConversationId);
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          hotelId: selectedConversationId
        })
      });

      console.log('Send message response status:', response.status);
      if (response.ok) {
        console.log('Message sent successfully');
        // Refresh messages
        fetchConversationMessages(selectedConversationId);
        // Refresh conversations to update last message
        fetchConversations();
      } else {
        const errorData = await response.json();
        console.error('Failed to send message:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Hotel Inbox</h1>
        <p className="text-muted-foreground">Manage guest communications and messages</p>
      </div>

      <WhatsAppInbox
        conversations={conversations}
        messages={messages}
        currentUserId={currentUserId}
        onSelectConversation={handleSelectConversation}
        onSendMessage={handleSendMessage}
        loading={loading}
        selectedConversationId={selectedConversationId}
        title="Hotel Messages"
      />
    </div>
  );
}