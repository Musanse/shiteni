# 🏢 Shiteni - Multi-Vendor E-Commerce Platform

A comprehensive multi-vendor e-commerce platform built with Next.js, featuring hotel bookings, bus ticketing, pharmacy services, and online store functionality.

## 🌟 Features

### 🏨 Hotel Management
- Room booking and management
- Guest management system
- Booking confirmations and receipts
- Revenue tracking and analytics

### 🚌 Bus Ticketing System
- Route and schedule management
- Real-time seat booking
- Fare calculation based on segments
- Passenger management

### 💊 Pharmacy Services
- Medicine inventory management
- Prescription handling
- Order processing and delivery
- Subscription-based access

### 🛒 Online Store
- Product catalog management
- Shopping cart functionality
- Order processing and tracking
- Vendor management system

### 👥 User Management
- Multi-role authentication (Customer, Vendor, Staff, Admin)
- Email verification system
- Password reset functionality
- Subscription-based access control

### 💳 Payment Integration
- Lipila Payment Gateway integration
- Multiple payment methods (Card, Mobile Money)
- Subscription management
- Payment status tracking

### 📧 Communication System
- WhatsApp-like messaging interface
- File upload support (images, documents)
- Real-time notifications
- Vendor-customer communication

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS, Shadcn UI
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas
- **Authentication:** NextAuth.js
- **Email Service:** Nodemailer with Namecheap SMTP
- **Payment Gateway:** Lipila Payment Gateway
- **Charts:** Chart.js, React-Chartjs-2

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Namecheap hosting account (for email)
- Lipila Payment Gateway account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shiteni
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   MONGODB_URI=your-mongodb-connection-string
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   
   # Email Configuration (Namecheap)
   SMTP_HOST=mail.yourdomain.com
   SMTP_PORT=587
   SMTP_USER=your-email@yourdomain.com
   SMTP_PASS=your-email-password
   
   # Payment Gateway
   LIPILA_SECRET_KEY=your-lipila-secret-key
   LIPILA_BASE_URL=https://lipila-prod.hobbiton.app
   LIPILA_CURRENCY=ZMW
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
shiteni/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── hotel/             # Hotel pages
│   │   ├── bus/               # Bus pages
│   │   ├── pharmacy/          # Pharmacy pages
│   │   └── store/             # Store pages
│   ├── components/            # Reusable components
│   │   ├── ui/                # UI components
│   │   └── layout/            # Layout components
│   ├── lib/                   # Utility libraries
│   ├── models/                # Database models
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── scripts/                   # Database scripts
└── docs/                      # Documentation
```

## 🔐 User Roles

### 👤 Customer
- Browse and book hotels
- Purchase bus tickets
- Order medicines
- Shop online
- Manage bookings and orders

### 🏢 Vendor (Manager/Admin)
- Manage business operations
- Handle bookings and orders
- Update inventory
- Communicate with customers
- View analytics and reports

### 👨‍💼 Staff
- Assist with daily operations
- Process orders and bookings
- Customer support
- Limited access based on permissions

### 🔧 Super Admin
- Platform management
- User management
- System configuration
- Analytics and reporting

## 📊 Key Features

### 🎯 Multi-Service Platform
- **Hotels:** Room booking, guest management, revenue tracking
- **Bus Services:** Route management, seat booking, fare calculation
- **Pharmacy:** Medicine inventory, prescription handling, delivery
- **Store:** Product catalog, shopping cart, order management

### 💰 Subscription System
- Vendor subscription management
- Payment gateway integration
- Access control based on subscription status
- Revenue tracking and analytics

### 📱 Responsive Design
- Mobile-first approach
- Cross-platform compatibility
- Modern UI/UX design
- Accessibility features

### 🔒 Security Features
- Role-based access control
- Email verification
- Password reset functionality
- Secure payment processing
- Data encryption

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify:** Static site deployment
- **Railway:** Full-stack deployment
- **DigitalOcean:** VPS deployment

## 📈 Analytics & Reporting

- Revenue tracking by service type
- User registration trends
- Order status distribution
- Business performance metrics
- Customer acquisition analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email:** support@shiteni.com
- **Documentation:** [Project Wiki](link-to-wiki)
- **Issues:** [GitHub Issues](link-to-issues)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Shadcn UI for beautiful components
- MongoDB for database services
- Lipila for payment gateway integration
- Namecheap for hosting services

---

**Built with ❤️ for Zambia's e-commerce ecosystem**"# shiteni" 
