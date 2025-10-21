import connectDB from '../src/lib/mongodb';
import { Subscription } from '../src/models/Subscription';
import { Institution } from '../src/models/Institution';
import mongoose from 'mongoose';

async function seedSubscriptions() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing subscriptions
    await Subscription.deleteMany({});
    console.log('Cleared existing subscriptions');

    // Get existing institutions
    const institutions = await Institution.find({}).limit(10);
    
    if (institutions.length === 0) {
      console.log('No institutions found. Please seed institutions first.');
      return;
    }

    const planTypes = ['basic', 'premium', 'enterprise'];
    const statuses = ['active', 'inactive', 'suspended', 'cancelled', 'expired'];
    const billingCycles = ['monthly', 'quarterly', 'yearly'];
    const paymentMethods = ['card', 'bank_transfer', 'cash'];

    const planDetails = {
      basic: {
        amount: 5000,
        maxUsers: 10,
        maxLoans: 100,
        maxStorage: 10,
        features: ['basic_support', 'standard_reports']
      },
      premium: {
        amount: 15000,
        maxUsers: 100,
        maxLoans: 1000,
        maxStorage: 100,
        features: ['advanced_analytics', 'custom_reports', 'priority_support']
      },
      enterprise: {
        amount: 50000,
        maxUsers: 1000,
        maxLoans: 10000,
        maxStorage: 1000,
        features: ['unlimited_users', 'advanced_analytics', 'priority_support', 'custom_integrations', 'dedicated_support']
      }
    };

    const sampleSubscriptions = [];

    for (let i = 0; i < institutions.length; i++) {
      const institution = institutions[i];
      const planType = planTypes[Math.floor(Math.random() * planTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const billingCycle = billingCycles[Math.floor(Math.random() * billingCycles.length)];
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      const plan = planDetails[planType as keyof typeof planDetails];
      
      // Calculate dates
      const startDate = new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
      let endDate = new Date(startDate);
      
      if (billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (billingCycle === 'quarterly') {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Adjust end date based on status
      if (status === 'expired') {
        endDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
      } else if (status === 'active') {
        endDate = new Date(Date.now() + Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000));
      }

      const lastPaymentDate = status === 'active' ? new Date(startDate.getTime() + Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)) : undefined;
      const nextPaymentDate = status === 'active' ? new Date(endDate) : undefined;

      const subscription = {
        institutionId: institution._id,
        institutionName: institution.name,
        planType,
        status,
        startDate,
        endDate,
        billingCycle,
        amount: plan.amount,
        currency: 'ZMW',
        features: plan.features,
        maxUsers: plan.maxUsers,
        maxLoans: plan.maxLoans,
        maxStorage: plan.maxStorage,
        paymentMethod,
        lastPaymentDate,
        nextPaymentDate,
        autoRenew: Math.random() > 0.3, // 70% auto-renew
        notes: status === 'suspended' ? 'Payment overdue' : 
               status === 'expired' ? 'Subscription expired, awaiting renewal' :
               status === 'cancelled' ? 'Cancelled by customer request' : undefined,
        createdAt: startDate,
        updatedAt: new Date()
      };

      sampleSubscriptions.push(subscription);
    }

    await Subscription.insertMany(sampleSubscriptions);
    console.log(`Seeded ${sampleSubscriptions.length} subscriptions successfully`);

    // Log summary
    const totalAmount = sampleSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
    const activeSubscriptions = sampleSubscriptions.filter(s => s.status === 'active').length;
    const expiredSubscriptions = sampleSubscriptions.filter(s => s.status === 'expired').length;

    console.log('\nSubscription Summary:');
    console.log('====================');
    console.log(`Total Subscriptions: ${sampleSubscriptions.length}`);
    console.log(`Total Revenue: ZMW ${totalAmount.toLocaleString()}`);
    console.log(`Active Subscriptions: ${activeSubscriptions}`);
    console.log(`Expired Subscriptions: ${expiredSubscriptions}`);

    const planBreakdown = sampleSubscriptions.reduce((acc, sub) => {
      acc[sub.planType] = (acc[sub.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nPlan Breakdown:');
    for (const plan in planBreakdown) {
      console.log(`- ${plan}: ${planBreakdown[plan]}`);
    }

    const statusBreakdown = sampleSubscriptions.reduce((acc, sub) => {
      acc[sub.status] = (acc[sub.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nStatus Breakdown:');
    for (const status in statusBreakdown) {
      console.log(`- ${status}: ${statusBreakdown[status]}`);
    }

  } catch (error) {
    console.error('Error seeding subscriptions:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedSubscriptions();
