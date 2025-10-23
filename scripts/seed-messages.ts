import connectDB from '../src/lib/mongodb';
import { Message } from '../src/models/Message';
import { User } from '../src/models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function seedMessages() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('No admin user found. Please create an admin user first.');
      return;
    }

    // Get some institution users
    const institutionUsers = await User.find({ role: 'institution' }).limit(3);
    if (institutionUsers.length === 0) {
      console.log('No institution users found. Creating sample institution users...');
      
      // Create sample institution users
      const sampleInstitutions = [
        {
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@firstbank.com',
          password: 'password123',
          role: 'institution',
          address: {
            city: 'First National Bank',
            state: 'NY',
            country: 'USA'
          }
        },
        {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@communitycu.org',
          password: 'password123',
          role: 'institution',
          address: {
            city: 'Community Credit Union',
            state: 'CA',
            country: 'USA'
          }
        },
        {
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@metrofinance.com',
          password: 'password123',
          role: 'institution',
          address: {
            city: 'Metro Microfinance',
            state: 'TX',
            country: 'USA'
          }
        }
      ];

      for (const inst of sampleInstitutions) {
        const existingUser = await User.findOne({ email: inst.email });
        if (!existingUser) {
          await User.create(inst);
          console.log(`Created institution user: ${inst.email}`);
        }
      }

      // Refresh institution users
      const updatedInstitutionUsers = await User.find({ role: 'institution' }).limit(3);
      institutionUsers.push(...updatedInstitutionUsers);
    }

    // Clear existing messages
    await Message.deleteMany({});
    console.log('Cleared existing messages');

    // Create sample conversations
    const conversations = [
      {
        id: 'conv-compliance-1',
        institution: institutionUsers[0],
        messages: [
          {
            senderId: institutionUsers[0].email,
            senderName: `${institutionUsers[0].firstName} ${institutionUsers[0].lastName}`,
            senderRole: institutionUsers[0].role,
            recipientId: adminUser.email,
            recipientName: `${adminUser.firstName} ${adminUser.lastName}`,
            recipientRole: adminUser.role,
            conversationId: 'conv-compliance-1',
            messageType: 'text',
            content: 'Hello Admin Team, I hope this message finds you well.',
            isRead: true,
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            senderId: adminUser.email,
            senderName: `${adminUser.firstName} ${adminUser.lastName}`,
            senderRole: adminUser.role,
            recipientId: institutionUsers[0].email,
            recipientName: `${institutionUsers[0].firstName} ${institutionUsers[0].lastName}`,
            recipientRole: institutionUsers[0].role,
            conversationId: 'conv-compliance-1',
            messageType: 'text',
            content: 'Hello John, thank you for reaching out. How can I assist you today?',
            isRead: true,
            createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) // 1.5 hours ago
          },
          {
            senderId: institutionUsers[0].email,
            senderName: `${institutionUsers[0].firstName} ${institutionUsers[0].lastName}`,
            senderRole: institutionUsers[0].role,
            recipientId: adminUser.email,
            recipientName: `${adminUser.firstName} ${adminUser.lastName}`,
            recipientRole: adminUser.role,
            conversationId: 'conv-compliance-1',
            messageType: 'text',
            content: 'Please find attached our quarterly compliance report for Q4 2023. All required documentation has been included.',
            isRead: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
          },
          {
            senderId: institutionUsers[0].email,
            senderName: `${institutionUsers[0].firstName} ${institutionUsers[0].lastName}`,
            senderRole: institutionUsers[0].role,
            recipientId: adminUser.email,
            recipientName: `${adminUser.firstName} ${adminUser.lastName}`,
            recipientRole: adminUser.role,
            conversationId: 'conv-compliance-1',
            messageType: 'document',
            content: 'Q4 2023 Compliance Report',
            fileUrl: '/uploads/document/compliance_report_q4_2023.pdf',
            fileName: 'compliance_report_q4_2023.pdf',
            fileSize: 2048000,
            fileType: 'application/pdf',
            isRead: false,
            createdAt: new Date(Date.now() - 25 * 60 * 1000) // 25 minutes ago
          }
        ]
      },
      {
        id: 'conv-support-1',
        institution: institutionUsers[1],
        messages: [
          {
            senderId: institutionUsers[1].email,
            senderName: `${institutionUsers[1].firstName} ${institutionUsers[1].lastName}`,
            senderRole: institutionUsers[1].role,
            recipientId: adminUser.email,
            recipientName: `${adminUser.firstName} ${adminUser.lastName}`,
            recipientRole: adminUser.role,
            conversationId: 'conv-support-1',
            messageType: 'text',
            content: 'Hello Support Team, we are experiencing technical difficulties with our system integration.',
            isRead: true,
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
          },
          {
            senderId: adminUser.email,
            senderName: `${adminUser.firstName} ${adminUser.lastName}`,
            senderRole: adminUser.role,
            recipientId: institutionUsers[1].email,
            recipientName: `${institutionUsers[1].firstName} ${institutionUsers[1].lastName}`,
            recipientRole: institutionUsers[1].role,
            conversationId: 'conv-support-1',
            messageType: 'text',
            content: 'Hello Sarah, I understand you\'re having integration issues. Can you provide more details about the specific problems you\'re encountering?',
            isRead: true,
            createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000) // 3.5 hours ago
          },
          {
            senderId: institutionUsers[1].email,
            senderName: `${institutionUsers[1].firstName} ${institutionUsers[1].lastName}`,
            senderRole: institutionUsers[1].role,
            recipientId: adminUser.email,
            recipientName: `${adminUser.firstName} ${adminUser.lastName}`,
            recipientRole: adminUser.role,
            conversationId: 'conv-support-1',
            messageType: 'text',
            content: 'The API for loan processing is not syncing properly with our core banking system. We\'re seeing delays and data synchronization errors.',
            isRead: false,
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
          }
        ]
      },
      {
        id: 'conv-appeal-1',
        institution: institutionUsers[2],
        messages: [
          {
            senderId: institutionUsers[2].email,
            senderName: `${institutionUsers[2].firstName} ${institutionUsers[2].lastName}`,
            senderRole: institutionUsers[2].role,
            recipientId: adminUser.email,
            recipientName: `${adminUser.firstName} ${adminUser.lastName}`,
            recipientRole: adminUser.role,
            conversationId: 'conv-appeal-1',
            messageType: 'text',
            content: 'Dear Administration, I am writing to formally appeal the recent suspension of our account.',
            isRead: false,
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
          },
          {
            senderId: institutionUsers[2].email,
            senderName: `${institutionUsers[2].firstName} ${institutionUsers[2].lastName}`,
            senderRole: institutionUsers[2].role,
            recipientId: adminUser.email,
            recipientName: `${adminUser.firstName} ${adminUser.lastName}`,
            recipientRole: adminUser.role,
            conversationId: 'conv-appeal-1',
            messageType: 'text',
            content: 'We believe there has been a misunderstanding regarding our compliance status. All required documentation was submitted on time.',
            isRead: false,
            createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000) // 5.5 hours ago
          }
        ]
      }
    ];

    // Create messages for each conversation
    for (const conversation of conversations) {
      for (const messageData of conversation.messages) {
        await Message.create(messageData);
      }
      console.log(`Created conversation: ${conversation.id} with ${conversation.messages.length} messages`);
    }

    console.log('✅ Sample messages seeded successfully!');
    console.log(`Created ${conversations.length} conversations with total messages`);
    
  } catch (error) {
    console.error('Error seeding messages:', error);
  } finally {
    process.exit(0);
  }
}

seedMessages();
