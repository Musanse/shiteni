import * as nodemailer from 'nodemailer';

// Email configuration for Namecheap hosting (SSL/TLS)
const emailConfig = {
  host: process.env.SMTP_HOST, // Your domain's mail server
  port: parseInt(process.env.SMTP_PORT || '587'), // Port from environment
  secure: process.env.SMTP_SECURE === 'true', // Use SSL based on environment
  auth: {
    user: process.env.SMTP_USER, // Your actual email address
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
};

// Debug: Log the actual configuration being used
console.log('=== Email Configuration Debug ===');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS_SET:', !!process.env.SMTP_PASS);
console.log('Final config:', {
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  user: emailConfig.auth.user
});

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
};

// Email templates
export const emailTemplates = {
  // User verification email
  userVerification: (name: string, verificationLink: string) => ({
    subject: 'Welcome to Shiteni - Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification - Shiteni</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2d5f3f, #4a7c59); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #2d5f3f; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏢 Shiteni</div>
            <h1>Welcome to Shiteni!</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>Thank you for joining Shiteni - Zambia's premier multi-vendor e-commerce platform!</p>
            <p>To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationLink}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">${verificationLink}</p>
            <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
            <p>Once verified, you'll be able to:</p>
            <ul>
              <li>Access your dashboard</li>
              <li>Browse and purchase from vendors</li>
              <li>Manage your orders and bookings</li>
              <li>Receive important notifications</li>
            </ul>
            <p>If you didn't create an account with Shiteni, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Shiteni. All rights reserved.</p>
            <p>This email was sent from support@shiteni.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Shiteni!
      
      Hello ${name},
      
      Thank you for joining Shiteni - Zambia's premier multi-vendor e-commerce platform!
      
      To complete your registration, please verify your email address by visiting this link:
      ${verificationLink}
      
      This verification link will expire in 24 hours for security reasons.
      
      Once verified, you'll be able to access your dashboard, browse vendors, and manage your orders.
      
      If you didn't create an account with Shiteni, please ignore this email.
      
      © 2024 Shiteni. All rights reserved.
    `
  }),

  // Password reset email
  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Reset Your Password - Shiteni',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - Shiteni</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc3545, #e74c3c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏢 Shiteni</div>
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your password for your Shiteni account.</p>
            <p>To reset your password, please click the button below:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e9e9e9; padding: 10px; border-radius: 5px;">${resetLink}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This password reset link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you click the link</li>
              </ul>
            </div>
            <p>If you continue to have problems, please contact our support team at support@shiteni.com</p>
          </div>
          <div class="footer">
            <p>© 2024 Shiteni. All rights reserved.</p>
            <p>This email was sent from support@shiteni.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Password Reset Request - Shiteni
      
      Hello ${name},
      
      We received a request to reset your password for your Shiteni account.
      
      To reset your password, please visit this link:
      ${resetLink}
      
      This password reset link will expire in 1 hour for security reasons.
      
      If you didn't request this reset, please ignore this email.
      Your password will remain unchanged until you click the link.
      
      If you continue to have problems, please contact our support team at support@shiteni.com
      
      © 2024 Shiteni. All rights reserved.
    `
  }),

  // Staff account creation email
  staffAccountCreated: (staffName: string, businessName: string, loginCredentials: { email: string; password: string }) => ({
    subject: `Welcome to ${businessName} Team - Shiteni Staff Account`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Staff Account Created - Shiteni</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2d5f3f, #4a7c59); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .credentials { background: #e8f5e8; border: 1px solid #2d5f3f; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏢 Shiteni</div>
            <h1>Staff Account Created</h1>
          </div>
          <div class="content">
            <h2>Hello ${staffName},</h2>
            <p>Welcome to the <strong>${businessName}</strong> team!</p>
            <p>A staff account has been created for you on the Shiteni platform. You can now access the business dashboard and help manage operations.</p>
            
            <div class="credentials">
              <h3>🔐 Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${loginCredentials.email}</p>
              <p><strong>Temporary Password:</strong> ${loginCredentials.password}</p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important Security Information:</strong>
              <ul>
                <li>Please change your password immediately after first login</li>
                <li>Keep your login credentials secure and confidential</li>
                <li>Do not share your password with anyone</li>
                <li>Contact your manager if you have any questions</li>
              </ul>
            </div>
            
            <p>You can now:</p>
            <ul>
              <li>Access the business dashboard</li>
              <li>Manage orders and bookings</li>
              <li>Update product information</li>
              <li>Communicate with customers</li>
              <li>View business analytics</li>
            </ul>
            
            <p>To get started, visit <a href="https://shiteni.com/login">shiteni.com/login</a> and use your credentials above.</p>
          </div>
          <div class="footer">
            <p>© 2024 Shiteni. All rights reserved.</p>
            <p>This email was sent from support@shiteni.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Staff Account Created - Shiteni
      
      Hello ${staffName},
      
      Welcome to the ${businessName} team!
      
      A staff account has been created for you on the Shiteni platform.
      
      Your Login Credentials:
      Email: ${loginCredentials.email}
      Temporary Password: ${loginCredentials.password}
      
      IMPORTANT: Please change your password immediately after first login.
      
      You can now access the business dashboard and help manage operations.
      Visit shiteni.com/login to get started.
      
      © 2024 Shiteni. All rights reserved.
    `
  }),

  // Order confirmation email
  orderConfirmation: (customerName: string, orderDetails: any) => ({
    subject: `Order Confirmation #${orderDetails.orderNumber} - Shiteni`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Shiteni</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-details { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .item { border-bottom: 1px solid #eee; padding: 10px 0; }
          .total { font-weight: bold; font-size: 18px; color: #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏢 Shiteni</div>
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName},</h2>
            <p>Thank you for your order! We've received your order and it's being processed.</p>
            
            <div class="order-details">
              <h3>📋 Order Details</h3>
              <p><strong>Order Number:</strong> #${orderDetails.orderNumber}</p>
              <p><strong>Order Date:</strong> ${new Date(orderDetails.orderDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${orderDetails.status}</p>
              <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
              
              <h4>Items Ordered:</h4>
              ${orderDetails.items.map((item: any) => `
                <div class="item">
                  <strong>${item.name}</strong> - ${item.quantity} x ${item.price}
                </div>
              `).join('')}
              
              <div class="total">
                <p>Total: ${orderDetails.total}</p>
              </div>
            </div>
            
            <p>We'll send you another email when your order ships. You can track your order status in your account dashboard.</p>
            <p>If you have any questions, please contact our support team at support@shiteni.com</p>
          </div>
          <div class="footer">
            <p>© 2024 Shiteni. All rights reserved.</p>
            <p>This email was sent from support@shiteni.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Order Confirmation - Shiteni
      
      Hello ${customerName},
      
      Thank you for your order! We've received your order and it's being processed.
      
      Order Details:
      Order Number: #${orderDetails.orderNumber}
      Order Date: ${new Date(orderDetails.orderDate).toLocaleDateString()}
      Status: ${orderDetails.status}
      Payment Method: ${orderDetails.paymentMethod}
      
      Items Ordered:
      ${orderDetails.items.map((item: any) => `${item.name} - ${item.quantity} x ${item.price}`).join('\n')}
      
      Total: ${orderDetails.total}
      
      We'll send you another email when your order ships.
      You can track your order status in your account dashboard.
      
      © 2024 Shiteni. All rights reserved.
    `
  }),

  // Promotion/Offer email
  promotion: (customerName: string, promotionDetails: any) => ({
    subject: `🎉 Special Offer: ${promotionDetails.title} - Shiteni`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Special Offer - Shiteni</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b, #ffa726); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .offer-box { background: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏢 Shiteni</div>
            <h1>🎉 Special Offer!</h1>
          </div>
          <div class="content">
            <h2>Hello ${customerName},</h2>
            <p>We have an exclusive offer just for you!</p>
            
            <div class="offer-box">
              <h3>${promotionDetails.title}</h3>
              <p style="font-size: 18px; margin: 10px 0;">${promotionDetails.description}</p>
              <p style="font-size: 24px; font-weight: bold; color: #ff6b6b;">${promotionDetails.discount}</p>
              <p><strong>Valid until:</strong> ${new Date(promotionDetails.expiryDate).toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${promotionDetails.link}" class="button">Shop Now</a>
            </div>
            
            <p>Don't miss out on this limited-time offer! Shop now and save big on your favorite products.</p>
            <p>Terms and conditions apply. Offer valid while supplies last.</p>
          </div>
          <div class="footer">
            <p>© 2024 Shiteni. All rights reserved.</p>
            <p>This email was sent from support@shiteni.com</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Special Offer - Shiteni
      
      Hello ${customerName},
      
      We have an exclusive offer just for you!
      
      ${promotionDetails.title}
      ${promotionDetails.description}
      Discount: ${promotionDetails.discount}
      Valid until: ${new Date(promotionDetails.expiryDate).toLocaleDateString()}
      
      Shop now: ${promotionDetails.link}
      
      Don't miss out on this limited-time offer!
      
      © 2024 Shiteni. All rights reserved.
    `
  })
};

// Send email function
export const sendEmail = async (to: string, template: any) => {
  try {
        const mailOptions = {
          from: '"Shiteni Support" <support@shiteni.com>',
          to: to,
          subject: template.subject,
          text: template.text,
          html: template.html
        };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error };
  }
};

// Generate verification token
export const generateVerificationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Generate reset token
export const generateResetToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default transporter;