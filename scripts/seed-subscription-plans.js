const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define SubscriptionPlan schema
const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  vendorType: { type: String, enum: ['hotel', 'store', 'pharmacy', 'bus'], required: true },
  planType: { type: String, enum: ['basic', 'premium', 'enterprise'], required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'ZMW' },
  billingCycle: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
  features: [{ type: String }],
  maxUsers: { type: Number, required: true },
  maxLoans: { type: Number, required: true },
  maxStorage: { type: Number, required: true },
  maxStaffAccounts: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, {
  timestamps: true,
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

async function seedSubscriptionPlans() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log('Cleared existing subscription plans');

    // Store subscription plans
    const storePlans = [
      {
        name: 'Starter Store',
        description: 'Perfect for small stores getting started online',
        vendorType: 'store',
        planType: 'basic',
        price: 2.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Up to 50 products',
          'Basic inventory management',
          'Order tracking',
          'Customer support',
          'Mobile app access'
        ],
        maxUsers: 1,
        maxLoans: 50, // Using maxLoans field for max products
        maxStorage: 1, // 1GB
        maxStaffAccounts: 2,
        isActive: true,
        isPopular: false,
        sortOrder: 1
      },
      {
        name: 'Professional Store',
        description: 'Ideal for growing businesses with more products',
        vendorType: 'store',
        planType: 'premium',
        price: 5.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Up to 200 products',
          'Advanced inventory management',
          'Order tracking & analytics',
          'Priority customer support',
          'Mobile app access',
          'Custom branding'
        ],
        maxUsers: 3,
        maxLoans: 200,
        maxStorage: 5, // 5GB
        maxStaffAccounts: 5,
        isActive: true,
        isPopular: true,
        sortOrder: 2
      },
      {
        name: 'Enterprise Store',
        description: 'For large stores with unlimited needs',
        vendorType: 'store',
        planType: 'enterprise',
        price: 10.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Unlimited products',
          'Advanced inventory management',
          'Order tracking & analytics',
          'Priority customer support',
          'Mobile app access',
          'Custom branding',
          'API access',
          'Advanced reporting'
        ],
        maxUsers: 10,
        maxLoans: -1, // Unlimited
        maxStorage: 20, // 20GB
        maxStaffAccounts: 20,
        isActive: true,
        isPopular: false,
        sortOrder: 3
      }
    ];

    // Bus subscription plans
    const busPlans = [
      {
        name: 'Starter Bus',
        description: 'Perfect for small bus operators',
        vendorType: 'bus',
        planType: 'basic',
        price: 3.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Up to 5 routes',
          'Up to 2 buses',
          'Basic booking management',
          'Customer support',
          'Mobile app access'
        ],
        maxUsers: 1,
        maxLoans: 5, // Using maxLoans field for max routes
        maxStorage: 1,
        maxStaffAccounts: 2,
        isActive: true,
        isPopular: false,
        sortOrder: 1
      },
      {
        name: 'Professional Bus',
        description: 'Ideal for growing bus companies',
        vendorType: 'bus',
        planType: 'premium',
        price: 7.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Up to 20 routes',
          'Up to 10 buses',
          'Advanced booking management',
          'Priority customer support',
          'Mobile app access',
          'Custom branding'
        ],
        maxUsers: 3,
        maxLoans: 20,
        maxStorage: 5,
        maxStaffAccounts: 5,
        isActive: true,
        isPopular: true,
        sortOrder: 2
      },
      {
        name: 'Enterprise Bus',
        description: 'For large bus companies with unlimited needs',
        vendorType: 'bus',
        planType: 'enterprise',
        price: 15.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Unlimited routes',
          'Unlimited buses',
          'Advanced booking management',
          'Priority customer support',
          'Mobile app access',
          'Custom branding',
          'API access',
          'Advanced reporting'
        ],
        maxUsers: 10,
        maxLoans: -1, // Unlimited
        maxStorage: 20,
        maxStaffAccounts: 20,
        isActive: true,
        isPopular: false,
        sortOrder: 3
      }
    ];

    // Pharmacy subscription plans
    const pharmacyPlans = [
      {
        name: 'Starter Pharmacy',
        description: 'Perfect for small pharmacies',
        vendorType: 'pharmacy',
        planType: 'basic',
        price: 4.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Up to 100 medicines',
          'Basic inventory management',
          'Prescription tracking',
          'Customer support',
          'Mobile app access'
        ],
        maxUsers: 1,
        maxLoans: 100, // Using maxLoans field for max medicines
        maxStorage: 1,
        maxStaffAccounts: 2,
        isActive: true,
        isPopular: false,
        sortOrder: 1
      },
      {
        name: 'Professional Pharmacy',
        description: 'Ideal for growing pharmacies',
        vendorType: 'pharmacy',
        planType: 'premium',
        price: 8.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Up to 500 medicines',
          'Advanced inventory management',
          'Prescription tracking & analytics',
          'Priority customer support',
          'Mobile app access',
          'Custom branding'
        ],
        maxUsers: 3,
        maxLoans: 500,
        maxStorage: 5,
        maxStaffAccounts: 5,
        isActive: true,
        isPopular: true,
        sortOrder: 2
      },
      {
        name: 'Enterprise Pharmacy',
        description: 'For large pharmacies with unlimited needs',
        vendorType: 'pharmacy',
        planType: 'enterprise',
        price: 12.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Unlimited medicines',
          'Advanced inventory management',
          'Prescription tracking & analytics',
          'Priority customer support',
          'Mobile app access',
          'Custom branding',
          'API access',
          'Advanced reporting'
        ],
        maxUsers: 10,
        maxLoans: -1, // Unlimited
        maxStorage: 20,
        maxStaffAccounts: 20,
        isActive: true,
        isPopular: false,
        sortOrder: 3
      }
    ];

    // Hotel subscription plans
    const hotelPlans = [
      {
        name: 'Starter Hotel',
        description: 'Perfect for small hotels and guesthouses',
        vendorType: 'hotel',
        planType: 'basic',
        price: 6.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Up to 10 rooms',
          'Basic booking management',
          'Guest management',
          'Customer support',
          'Mobile app access'
        ],
        maxUsers: 1,
        maxLoans: 10, // Using maxLoans field for max rooms
        maxStorage: 1,
        maxStaffAccounts: 2,
        isActive: true,
        isPopular: false,
        sortOrder: 1
      },
      {
        name: 'Professional Hotel',
        description: 'Ideal for growing hotels',
        vendorType: 'hotel',
        planType: 'premium',
        price: 12.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Up to 50 rooms',
          'Advanced booking management',
          'Guest management & analytics',
          'Priority customer support',
          'Mobile app access',
          'Custom branding'
        ],
        maxUsers: 3,
        maxLoans: 50,
        maxStorage: 5,
        maxStaffAccounts: 5,
        isActive: true,
        isPopular: true,
        sortOrder: 2
      },
      {
        name: 'Enterprise Hotel',
        description: 'For large hotels with unlimited needs',
        vendorType: 'hotel',
        planType: 'enterprise',
        price: 20.00,
        currency: 'ZMW',
        billingCycle: 'monthly',
        features: [
          'Unlimited rooms',
          'Advanced booking management',
          'Guest management & analytics',
          'Priority customer support',
          'Mobile app access',
          'Custom branding',
          'API access',
          'Advanced reporting'
        ],
        maxUsers: 10,
        maxLoans: -1, // Unlimited
        maxStorage: 20,
        maxStaffAccounts: 20,
        isActive: true,
        isPopular: false,
        sortOrder: 3
      }
    ];

    // Insert all plans
    const allPlans = [...storePlans, ...busPlans, ...pharmacyPlans, ...hotelPlans];
    const insertedPlans = await SubscriptionPlan.insertMany(allPlans);
    
    console.log(`✅ Successfully seeded ${insertedPlans.length} subscription plans:`);
    console.log(`   - ${storePlans.length} Store plans`);
    console.log(`   - ${busPlans.length} Bus plans`);
    console.log(`   - ${pharmacyPlans.length} Pharmacy plans`);
    console.log(`   - ${hotelPlans.length} Hotel plans`);

    // Verify the plans were created
    const totalPlans = await SubscriptionPlan.countDocuments();
    console.log(`📊 Total subscription plans in database: ${totalPlans}`);

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedSubscriptionPlans();
