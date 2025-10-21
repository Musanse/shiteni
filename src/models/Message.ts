import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  senderRole: string; // Changed from senderType to senderRole
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: string; // Changed from recipientType to recipientRole
  conversationId: string; // Changed from hotelId to conversationId
  content: string; // Changed from message to content
  messageType: 'text' | 'image' | 'file' | 'document';
  isRead: boolean;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  // Optional fields for file attachments
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: String,
    required: true
  },
  senderEmail: {
    type: String,
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  senderRole: {
    type: String,
    required: true
  },
  recipientId: {
    type: String,
    required: true
  },
  recipientEmail: {
    type: String,
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  recipientRole: {
    type: String,
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'document'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Optional fields for file attachments
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  fileType: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
MessageSchema.index({ senderId: 1, recipientId: 1, timestamp: -1 });
MessageSchema.index({ conversationId: 1, timestamp: -1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);