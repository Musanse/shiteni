'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, ArrowLeft, MoreVertical, Phone, Video, Search, Check, CheckCheck, Paperclip } from 'lucide-react';
import CallModal from '@/components/call-modal';
import FileUploadModal from '@/components/file-upload-modal';

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
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

interface Conversation {
  _id: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isFromMe: boolean;
}

interface ConversationDetail {
  vendor: {
    _id: string;
    name: string;
    email: string;
    serviceType: string;
  };
  customer: {
    _id: string;
    name: string;
    email: string;
  };
  messages: Message[];
}

export default function PharmacyInboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pharmacy/inbox');
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
        const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (conversation: Conversation) => {
    try {
      const response = await fetch(`/api/pharmacy/conversation?customerId=${conversation._id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
        const data = await response.json();
      setSelectedConversation(data.conversation);
      
      // Update unread count in conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversation._id 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error fetching conversation:', error);
      setError('Failed to load conversation');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch('/api/pharmacy/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedConversation.customer._id,
          content: newMessage.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add the new message to the conversation
      setSelectedConversation(prev => ({
        ...prev!,
        messages: [...prev!.messages, data.message]
      }));

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const initiateCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setShowCallModal(true);
  };

  const handleCallAccept = () => {
    console.log('Call accepted');
    // Here you would implement actual WebRTC call logic
  };

  const handleCallReject = () => {
    console.log('Call rejected');
    setShowCallModal(false);
  };

  const sendFile = async (file: File, messageType: 'image' | 'document') => {
    if (!selectedConversation) return;

    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('messageType', messageType);

      const uploadResponse = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const uploadData = await uploadResponse.json();

      // Send message with file
      const messageResponse = await fetch('/api/pharmacy/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedConversation.customer._id,
          content: `📎 ${file.name}`,
          messageType: messageType,
          fileUrl: uploadData.file.url,
          fileName: uploadData.file.name,
          fileSize: uploadData.file.size,
          fileType: uploadData.file.type
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to send file message');
      }

      const messageData = await messageResponse.json();
      
      // Add the new message to the conversation
      setSelectedConversation(prev => ({
        ...prev!,
        messages: [...prev!.messages, messageData.message]
      }));

    } catch (error) {
      console.error('Error sending file:', error);
      setError('Failed to send file');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCustomerInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const getCustomerColor = (customerId: string) => {
    const colors = [
      'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = customerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  // WhatsApp-style conversation view
  if (selectedConversation) {
    return (
      <div className="h-screen flex flex-col bg-gray-100">
        {/* WhatsApp-style Header */}
        <div className="bg-green-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedConversation(null)}
            className="text-white hover:bg-green-600 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className={`w-10 h-10 ${getCustomerColor(selectedConversation.customer._id)} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
            {getCustomerInitials(selectedConversation.customer.name)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-lg truncate">{selectedConversation.customer.name}</h2>
            <p className="text-green-100 text-sm truncate">{selectedConversation.customer.email}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-green-600 p-2"
              onClick={() => initiateCall('video')}
            >
              <Video className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-green-600 p-2"
              onClick={() => initiateCall('audio')}
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-green-600 p-2">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* WhatsApp-style Messages */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 space-y-2">
          {selectedConversation.messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.senderId === selectedConversation.vendor._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                  message.senderId === selectedConversation.vendor._id
                    ? 'bg-green-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                }`}
              >
                {/* Message Content */}
                {message.messageType === 'image' && message.fileUrl ? (
                  <div className="space-y-2">
                    <img
                      src={message.fileUrl}
                      alt={message.fileName || 'Image'}
                      className="max-w-full h-auto rounded-lg cursor-pointer"
                      onClick={() => window.open(message.fileUrl, '_blank')}
                    />
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                ) : message.messageType === 'document' && message.fileUrl ? (
                  <div className="space-y-2">
                    <div 
                      className="flex items-center space-x-2 p-2 bg-gray-100 rounded cursor-pointer hover:bg-gray-200"
                      onClick={() => window.open(message.fileUrl, '_blank')}
                    >
                      <Paperclip className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{message.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {message.fileSize ? `${(message.fileSize / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}

                {/* Timestamp and Read Receipt */}
                <div className={`flex items-center gap-1 mt-1 ${
                  message.senderId === selectedConversation.vendor._id ? 'justify-end' : 'justify-start'
                }`}>
                  <span className={`text-xs ${
                    message.senderId === selectedConversation.vendor._id ? 'text-green-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.timestamp)}
                  </span>
                  {message.senderId === selectedConversation.vendor._id && (
                    <div className="flex">
                      {message.isRead ? (
                        <CheckCheck className="h-3 w-3 text-blue-300" />
                      ) : (
                        <Check className="h-3 w-3 text-green-100" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp-style Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileUploadModal(true)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="w-full px-4 py-3 rounded-full border-gray-300 focus:border-green-500 focus:ring-green-500 pr-12"
              />
            </div>
            
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim()}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full p-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // WhatsApp-style conversations list view
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* WhatsApp-style Header */}
      <div className="bg-green-500 text-white px-4 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Pharmacy Messages</h1>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-green-600 p-2">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-green-600 p-2">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-3">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full px-4 py-2 rounded-full border-gray-300 focus:border-white focus:ring-white bg-white text-gray-900"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-600 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchConversations}
              className="mt-2 text-red-600 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Messages Yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              Patient inquiries will appear here when customers contact you.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations
              .filter(conv => 
                conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((conversation) => (
              <div 
                key={conversation._id} 
                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => openConversation(conversation)}
              >
                <div className={`w-12 h-12 ${getCustomerColor(conversation._id)} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
                  {getCustomerInitials(conversation.customerName)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {conversation.customerName}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(conversation.timestamp)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <div className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <p className="text-sm text-gray-600 truncate flex-1">
                      {conversation.isFromMe && (
                        <span className="text-green-600 font-medium">You: </span>
                      )}
                      {conversation.lastMessage}
                    </p>
                    {conversation.isFromMe && (
                      <div className="flex-shrink-0">
                        {conversation.unreadCount > 0 ? (
                          <Check className="h-4 w-4 text-gray-400" />
                        ) : (
                          <CheckCheck className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Modal */}
      <CallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        callType={callType}
        participantName={selectedConversation?.customer.name || 'Customer'}
        participantServiceType="Customer"
        onAccept={handleCallAccept}
        onReject={handleCallReject}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => setShowFileUploadModal(false)}
        onSendFile={sendFile}
      />
    </div>
  );
}