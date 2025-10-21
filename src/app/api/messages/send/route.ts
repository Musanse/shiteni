import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Message from '@/models/Message';
import * as UserModule from '@/models/User';
const { User } = UserModule;
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      vendorId, // Specific vendor ID (required)
      serviceType, 
      content, 
      productName 
    } = await request.json();

    if (!vendorId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorId, content' },
        { status: 400 }
      );
    }

    // Get sender details
    let sender = await User.findById(session.user.id);
    if (!sender) {
      // If sender doesn't exist, create a customer record
      sender = new User({
        _id: session.user.id,
        email: session.user.email,
        name: session.user.name || session.user.email.split('@')[0], // Use name from session or derive from email
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await sender.save();
      console.log(`👤 Created new customer: ${sender.email} (${sender.name})`);
    }

    // Determine if sender is a vendor or customer
    const isVendorSender = sender.serviceType && ['hotel', 'bus', 'store', 'pharmacy'].includes(sender.serviceType);
    
    let vendor, customer, conversationId;
    
    if (isVendorSender) {
      // Vendor sending message to customer
      console.log(`🏢 Vendor ${sender.email} sending message to customer ${vendorId}`);
      
      // Get the customer (vendorId is actually customer email in this case)
      customer = await User.findOne({ email: vendorId });
      if (!customer) {
        return NextResponse.json({ 
          error: 'Customer not found. Please contact support.' 
        }, { status: 404 });
      }
      
      vendor = sender;
      conversationId = vendor._id.toString();
    } else {
      // Customer sending message to vendor
      console.log(`👤 Customer ${sender.email} sending message to vendor ${vendorId}`);
      
      // Get the specific vendor
      vendor = await User.findById(vendorId);
      if (!vendor) {
        // Try to find vendor by email if ID doesn't work
        vendor = await User.findOne({ email: vendorId });
        if (!vendor) {
          return NextResponse.json({ 
            error: 'Vendor not found. Please contact support.' 
          }, { status: 404 });
        }
      }
      
      customer = sender;
      conversationId = vendor._id.toString();
    }

    // Enhance the message content with product information
    let enhancedContent = content;
    if (productName) {
      enhancedContent = `Product: ${productName}\n\n${content}`;
    }

    // Create the message
    const message = new Message({
      senderId: sender._id.toString(),
      senderEmail: sender.email,
      senderName: sender.name || sender.email.split('@')[0],
      senderRole: sender.role || (isVendorSender ? 'vendor' : 'customer'),
      recipientId: isVendorSender ? customer._id.toString() : vendor._id.toString(),
      recipientEmail: isVendorSender ? customer.email : vendor.email,
      recipientName: isVendorSender 
        ? (customer.name || customer.email.split('@')[0])
        : (vendor.businessName || vendor.name || vendor.email.split('@')[0]),
      recipientRole: isVendorSender ? 'customer' : (vendor.role || 'vendor'),
      conversationId: conversationId,
      content: enhancedContent,
      messageType: 'text',
      isRead: false,
      timestamp: new Date()
    });

    await message.save();

    const recipientEmail = isVendorSender ? customer.email : vendor.email;
    console.log(`📨 Message sent from ${sender.email} to ${recipientEmail} (${isVendorSender ? 'customer' : vendor.serviceType})`);
    console.log(`💬 Content: ${enhancedContent.substring(0, 100)}...`);

    return NextResponse.json({
      success: true,
      message: {
        _id: message._id,
        content: message.content,
        timestamp: message.timestamp,
        senderName: message.senderName,
        recipientName: message.recipientName,
        vendorEmail: vendor.email,
        vendorId: vendor._id.toString()
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}