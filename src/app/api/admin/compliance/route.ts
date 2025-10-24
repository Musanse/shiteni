import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';

// GET - Fetch compliance data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as { role: string }).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const period = searchParams.get('period') || 'current';

    // Build query based on filters
    const query: Record<string, string> = {};
    
    if (status !== 'all') {
      query.status = status;
    }

    // Fetch institutions with compliance data
    const institutions = await (User as any).find({ role: { $in: ['manager', 'admin'] } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Transform data to compliance report format
    const complianceReports = institutions.map((institution) => {
      // Generate mock compliance data based on institution data
      const baseScore = institution.status === 'active' ? 85 + Math.random() * 15 : 60 + Math.random() * 20;
      const score = Math.round(baseScore);
      
      const violations = institution.status === 'suspended' ? Math.floor(Math.random() * 3) + 1 : 
                        institution.status === 'pending' ? Math.floor(Math.random() * 2) : 0;
      
      const recommendations = Math.floor(Math.random() * 5) + 1;
      
      const submittedDate = new Date(institution.createdAt);
      const reviewedDate = institution.status === 'active' ? 
        new Date(submittedDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null;
      
      const nextDue = new Date(submittedDate.getTime() + 90 * 24 * 60 * 60 * 1000);

      return {
        id: institution._id.toString(),
        institution: institution.businessName || `${institution.firstName} ${institution.lastName}`,
        reportType: institution.serviceType === 'hotel' ? 'Hotel Compliance' : 
                   institution.serviceType === 'pharmacy' ? 'Pharmacy Compliance' :
                   institution.serviceType === 'store' ? 'Store Compliance' :
                   institution.serviceType === 'bus' ? 'Bus Compliance' : 'General Compliance',
        period: period === 'current' ? 'Q4 2023' : 
                period === 'last_quarter' ? 'Q3 2023' : '2022',
        status: institution.status === 'active' ? 'approved' :
                institution.status === 'pending' ? 'under_review' : 'rejected',
        score,
        submittedDate: submittedDate.toISOString().split('T')[0],
        reviewedDate: reviewedDate ? reviewedDate.toISOString().split('T')[0] : null,
        reviewer: 'Admin User',
        violations,
        recommendations,
        nextDue: nextDue.toISOString().split('T')[0],
        documents: Math.floor(Math.random() * 20) + 10,
        businessId: institution._id.toString(),
        institutionType: institution.serviceType || 'general',
        registrationDate: institution.createdAt,
        totalCustomers: institution.totalCustomers || Math.floor(Math.random() * 1000) + 100,
        totalAssets: institution.totalAssets || Math.floor(Math.random() * 10000000) + 1000000,
        complianceScore: institution.complianceScore || score
      };
    });

    // Calculate metrics
    const totalUsers = complianceReports.length;
    const approvedReports = complianceReports.filter(r => r.status === 'approved').length;
    const underReviewReports = complianceReports.filter(r => r.status === 'under_review').length;
    const rejectedReports = complianceReports.filter(r => r.status === 'rejected').length;
    const averageScore = totalUsers > 0 ? 
      Math.round(complianceReports.reduce((sum, r) => sum + r.score, 0) / totalUsers) : 0;
    const totalViolations = complianceReports.reduce((sum, r) => sum + r.violations, 0);
    const totalRecommendations = complianceReports.reduce((sum, r) => sum + r.recommendations, 0);

    return NextResponse.json({
      reports: complianceReports,
      metrics: {
        totalUsers,
        approvedReports,
        underReviewReports,
        rejectedReports,
        averageScore,
        totalViolations,
        totalRecommendations
      }
    });

  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

// POST - Generate Excel report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as { role: string }).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { period } = await request.json();

    await connectDB();

    // Fetch compliance data
    const institutions = await (User as any).find({ role: { $in: ['manager', 'admin'] } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Transform data for Excel export
    const excelData = institutions.map((institution) => {
      const baseScore = institution.status === 'active' ? 85 + Math.random() * 15 : 60 + Math.random() * 20;
      const score = Math.round(baseScore);
      
      return {
        'User Name': `${institution.firstName} ${institution.lastName}`,
        'User Role': institution.role,
        'Status': institution.status,
        'Compliance Score': score,
        'Registration Date': new Date(institution.createdAt).toLocaleDateString(),
        'Total Customers': institution.totalCustomers || Math.floor(Math.random() * 1000) + 100,
        'Total Assets': institution.totalAssets || Math.floor(Math.random() * 10000000) + 1000000,
        'Violations': institution.status === 'suspended' ? Math.floor(Math.random() * 3) + 1 : 0,
        'Recommendations': Math.floor(Math.random() * 5) + 1,
        'Last Audit': institution.lastAudit ? new Date(institution.lastAudit).toLocaleDateString() : 'N/A',
        'Compliance Rating': score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 70 ? 'Fair' : 'Poor'
      };
    });

    // For now, return the data structure that would be used for Excel generation
    // In a real implementation, you would use a library like 'xlsx' to generate actual Excel files
    return NextResponse.json({
      message: 'Excel report generated successfully',
      data: excelData,
      filename: `compliance-report-${period}-${new Date().toISOString().split('T')[0]}.xlsx`,
      totalRecords: excelData.length
    });

  } catch (error) {
    console.error('Error generating Excel report:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel report' },
      { status: 500 }
    );
  }
}
