# Shiteni Multi-Vending Platform - Setup Guide

## Quick Start Guide

### 1. Database Connection

Your MongoDB Atlas connection has been configured:
- **Database**: `shiteni`
- **Connection**: MongoDB Atlas Cluster
- **Status**: ✅ Connected and verified

### 2. Environment Setup

Create a `.env.local` file in the root directory with the following:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://zeedemypartners_db_user:Oup88TrQDNdIwc4M@cluster0.fhzjpdc.mongodb.net/shiteni?retryWrites=true&w=majority&appName=Cluster0

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=shiteni-secret-key-change-in-production

# JWT Configuration
JWT_SECRET=shiteni-jwt-secret-change-in-production

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=support@shiteni.com
SMTP_PASS=your-smtp-password

# Application Configuration
APP_NAME=Shiteni
APP_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Seed the Database

The database has already been seeded with sample data:

```bash
npm run seed
```

Or use the Shiteni-specific seed:

```bash
npx tsx scripts/seed-shiteni.ts
```

### 5. Run the Development Server

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## Demo Accounts

### Super Admin
- **Email**: admin@shiteni.com
- **Password**: admin123
- **Role**: Super Admin (Full platform access)

### Hotel Management
- **Email**: manager@luxuryhotel.com
- **Password**: hotel123
- **Business**: Luxury Hotel & Resort
- **Access**: Hotel dashboard, rooms, bookings, guests

### Online Store
- **Email**: owner@techstore.com
- **Password**: store123
- **Business**: TechStore Electronics
- **Access**: Store dashboard, products, orders, customers

### Pharmacy Store
- **Email**: pharmacist@medpharmacy.com
- **Password**: pharmacy123
- **Business**: MedPharmacy Healthcare
- **Access**: Pharmacy dashboard, medicines, prescriptions, patients

### Bus Ticketing
- **Email**: operator@citybus.com
- **Password**: bus123
- **Business**: CityBus Transportation
- **Access**: Bus dashboard, routes, schedules, bookings, fleet

---

## Database Statistics

After seeding, your database contains:

### Collections Created
- ✅ **users** - User accounts and authentication
- ✅ **institutions** - Business entities (4 businesses)
- ✅ **hotelrooms** - Hotel rooms (100 rooms)
- ✅ **hotelbookings** - Hotel reservations
- ✅ **hotelguests** - Guest profiles
- ✅ **storeproducts** - Store inventory (50 products)
- ✅ **storeorders** - Customer orders
- ✅ **storecustomers** - Store customers
- ✅ **pharmacymedicines** - Medicine inventory (30 medicines)
- ✅ **pharmacyprescriptions** - Patient prescriptions
- ✅ **pharmacypatients** - Patient records
- ✅ **busroutes** - Bus routes (15 routes)
- ✅ **busschedules** - Trip schedules
- ✅ **busbookings** - Ticket bookings
- ✅ **busfleet** - Bus fleet management (25 buses)
- ✅ **buspassengers** - Passenger profiles

### Total Records
- **Users**: 5 (1 Super Admin + 4 Business Managers)
- **Businesses**: 4 (Hotel, Store, Pharmacy, Bus)
- **Hotel Rooms**: 100
- **Store Products**: 50
- **Pharmacy Medicines**: 30
- **Bus Routes**: 15
- **Bus Fleet**: 25 buses

---

## Platform Structure

### Business Types

#### 1. Hotel Management 🏨
**Features:**
- Room booking and management
- Guest services and profiles
- Check-in/check-out operations
- Revenue tracking and analytics
- Housekeeping management
- Staff scheduling

**Dashboard Modules:**
- `/dashboard/hotel` - Main dashboard
- `/dashboard/hotel/rooms` - Room management
- `/dashboard/hotel/bookings` - Booking management
- `/dashboard/hotel/guests` - Guest profiles
- `/dashboard/hotel/revenue` - Revenue tracking
- `/dashboard/hotel/housekeeping` - Housekeeping operations

#### 2. Online Store 🛒
**Features:**
- Product catalog and inventory
- Order processing and fulfillment
- Customer management
- Payment integration
- Shipping and logistics
- Analytics and reporting

**Dashboard Modules:**
- `/dashboard/store` - Main dashboard
- `/dashboard/store/products` - Product management
- `/dashboard/store/orders` - Order processing
- `/dashboard/store/customers` - Customer management
- `/dashboard/store/inventory` - Inventory tracking
- `/dashboard/store/analytics` - Sales analytics

#### 3. Pharmacy Store 💊
**Features:**
- Medicine inventory management
- Prescription processing
- Patient records and history
- Insurance integration
- Compliance tracking
- Drug interaction checks

**Dashboard Modules:**
- `/dashboard/pharmacy` - Main dashboard
- `/dashboard/pharmacy/medicines` - Medicine inventory
- `/dashboard/pharmacy/prescriptions` - Prescription management
- `/dashboard/pharmacy/patients` - Patient records
- `/dashboard/pharmacy/inventory` - Stock management
- `/dashboard/pharmacy/compliance` - Regulatory compliance

#### 4. Bus Ticketing 🚌
**Features:**
- Route planning and management
- Schedule management
- Seat booking and allocation
- Passenger tracking
- Fleet management
- Payment processing

**Dashboard Modules:**
- `/dashboard/bus` - Main dashboard
- `/dashboard/bus/routes` - Route management
- `/dashboard/bus/schedules` - Schedule planning
- `/dashboard/bus/bookings` - Booking management
- `/dashboard/bus/fleet` - Fleet management
- `/dashboard/bus/passengers` - Passenger tracking

---

## API Endpoints

### Hotel Management
- `GET/POST /api/hotel/rooms` - Room management
- `GET/POST /api/hotel/bookings` - Booking operations
- `GET /api/hotel/guests` - Guest information
- `GET /api/hotel/stats` - Hotel statistics

### Store Management
- `GET/POST /api/store/products` - Product operations
- `GET/POST /api/store/orders` - Order management
- `GET /api/store/customers` - Customer data
- `GET /api/store/stats` - Store analytics

### Pharmacy Management
- `GET/POST /api/pharmacy/medicines` - Medicine inventory
- `GET/POST /api/pharmacy/prescriptions` - Prescription handling
- `GET /api/pharmacy/patients` - Patient records
- `GET /api/pharmacy/stats` - Pharmacy statistics

### Bus Management
- `GET/POST /api/bus/routes` - Route operations
- `GET/POST /api/bus/schedules` - Schedule management
- `GET/POST /api/bus/bookings` - Booking operations
- `GET /api/bus/fleet` - Fleet information
- `GET /api/bus/stats` - Bus statistics

---

## Testing the Platform

### 1. Test MongoDB Connection
```bash
node scripts/test-mongodb-connection.js
```

Expected output:
```
🔄 Testing MongoDB connection...
✅ Successfully connected to MongoDB!
📊 Database: shiteni
🎉 All tests passed!
```

### 2. Test Authentication
1. Navigate to: `http://localhost:3000/auth/signin`
2. Login with any demo account
3. Verify redirect to dashboard

### 3. Test Business Dashboards
- Hotel: `http://localhost:3000/dashboard/hotel`
- Store: `http://localhost:3000/dashboard/store`
- Pharmacy: `http://localhost:3000/dashboard/pharmacy`
- Bus: `http://localhost:3000/dashboard/bus`

### 4. Test Business Selection
- Navigate to: `http://localhost:3000/dashboard/business-selection`
- Select a business type
- Verify navigation to correct dashboard

---

## Development Workflow

### Adding New Features

1. **Define Business Type** (`src/types/business.ts`)
2. **Create Models** (`src/models/`)
3. **Create API Routes** (`src/app/api/[business]/`)
4. **Build Dashboard** (`src/app/dashboard/[business]/`)
5. **Add Components** (`src/components/business/`)

### Database Management

**View Collections:**
```bash
mongosh "mongodb+srv://cluster0.fhzjpdc.mongodb.net/shiteni" --username zeedemypartners_db_user
```

**Clear Database:**
```javascript
use shiteni
db.dropDatabase()
```

**Re-seed Database:**
```bash
npx tsx scripts/seed-shiteni.ts
```

---

## Troubleshooting

### MongoDB Connection Issues
```bash
# Test connection
node scripts/test-mongodb-connection.js

# Check environment variables
echo $MONGODB_URI
```

### Build Errors
```bash
# Clear cache
rm -rf .next
npm run build
```

### Authentication Issues
```bash
# Verify NextAuth configuration
# Check NEXTAUTH_URL and NEXTAUTH_SECRET in .env.local
```

---

## Production Deployment

### Environment Variables (Production)
```env
MONGODB_URI=your-production-mongodb-uri
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=strong-random-secret-change-this
JWT_SECRET=strong-jwt-secret-change-this
NODE_ENV=production
```

### Deployment Checklist
- [ ] Update MongoDB connection string
- [ ] Set strong NEXTAUTH_SECRET
- [ ] Set strong JWT_SECRET
- [ ] Configure SMTP for emails
- [ ] Set up payment gateway
- [ ] Configure file storage
- [ ] Set up SSL/TLS
- [ ] Configure domain and DNS
- [ ] Set up monitoring
- [ ] Configure backup strategy

---

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB, Mongoose
- **Authentication**: NextAuth.js with JWT
- **Database**: MongoDB Atlas (Multi-tenant)
- **UI Components**: Custom components with Lucide React icons
- **Styling**: Tailwind CSS with dark/light mode

---

## Support

For issues or questions:
- Check the documentation
- Review API endpoints
- Test with demo accounts
- Check console logs for errors

---

## Next Steps

1. ✅ Database connected and seeded
2. ✅ Demo accounts created
3. ✅ All business types configured
4. 🔄 Start development server
5. 🔄 Test all dashboards
6. 🔄 Add custom features
7. 🔄 Deploy to production

**Ready to get started!** Run `npm run dev` and visit `http://localhost:3000`

