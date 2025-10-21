import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Loan } from '@/models/Loan';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get database connection status
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Get collection statistics
    const userCount = await User.countDocuments();
    const institutionCount = await Institution.countDocuments();
    const loanCount = await Loan.countDocuments();

    // Get recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    const recentInstitutions = await Institution.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    const recentLoans = await Loan.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    // Get loan status distribution
    const loanStatusStats = await Loan.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get institution status distribution
    const institutionStatusStats = await Institution.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user role distribution
    const userRoleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate system health score
    const totalEntities = userCount + institutionCount + loanCount;
    const activeEntities = loanStatusStats.find(s => s._id === 'active')?.count || 0;
    const approvedInstitutions = institutionStatusStats.find(s => s._id === 'active')?.count || 0;
    
    let healthScore = 100;
    if (dbState !== 1) healthScore -= 50; // Database disconnected
    if (recentUsers === 0 && recentInstitutions === 0 && recentLoans === 0) healthScore -= 20; // No recent activity
    if (approvedInstitutions === 0) healthScore -= 15; // No approved institutions
    if (activeEntities === 0) healthScore -= 10; // No active loans

    // Get database performance metrics
    const dbStats = await mongoose.connection.db.stats();
    
    // Calculate uptime (simplified - in production you'd want more sophisticated tracking)
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    const systemHealth = {
      database: {
        status: dbStates[dbState as keyof typeof dbStates],
        connected: dbState === 1,
        collections: {
          users: userCount,
          institutions: institutionCount,
          loans: loanCount
        },
        storage: {
          dataSize: dbStats.dataSize || 0,
          indexSize: dbStats.indexSize || 0,
          totalSize: (dbStats.dataSize || 0) + (dbStats.indexSize || 0)
        }
      },
      metrics: {
        totalUsers: userCount,
        totalInstitutions: institutionCount,
        totalLoans: loanCount,
        recentActivity: {
          users: recentUsers,
          institutions: recentInstitutions,
          loans: recentLoans
        }
      },
      distributions: {
        loanStatus: loanStatusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        institutionStatus: institutionStatusStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        userRoles: userRoleStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>)
      },
      performance: {
        healthScore: Math.max(0, healthScore),
        uptime: {
          hours: uptimeHours,
          minutes: uptimeMinutes,
          total: uptime
        },
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform
      },
      alerts: []
    };

    // Add alerts based on system state
    if (dbState !== 1) {
      systemHealth.alerts.push({
        type: 'critical',
        message: 'Database connection is not active',
        timestamp: new Date().toISOString()
      });
    }

    if (healthScore < 70) {
      systemHealth.alerts.push({
        type: 'warning',
        message: 'System health score is below optimal threshold',
        timestamp: new Date().toISOString()
      });
    }

    if (recentUsers === 0 && recentInstitutions === 0 && recentLoans === 0) {
      systemHealth.alerts.push({
        type: 'info',
        message: 'No recent activity detected in the last 24 hours',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(systemHealth);
  } catch (error) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system health data' },
      { status: 500 }
    );
  }
}
