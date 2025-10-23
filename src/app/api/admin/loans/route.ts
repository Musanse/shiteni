import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { Loan } from '@/models/Loan';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'super_admin'].includes((session.user as any).role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || 'all';
    const riskFilter = searchParams.get('risk') || 'all';
    const institutionFilter = searchParams.get('institution') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Build match criteria
    let matchStage: any = {};

    if (statusFilter !== 'all') {
      matchStage.status = statusFilter;
    }

    if (riskFilter !== 'all') {
      matchStage.riskLevel = riskFilter;
    }

    if (institutionFilter !== 'all') {
      matchStage.institutionId = institutionFilter;
    }

    // Aggregate pipeline for loan data with customer quality metrics
    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $lookup: {
          from: 'institutions',
          localField: 'institutionId',
          foreignField: '_id',
          as: 'institution'
        }
      },
      {
        $addFields: {
          customerData: { $arrayElemAt: ['$customer', 0] },
          institutionData: { $arrayElemAt: ['$institution', 0] }
        }
      },
      {
        $addFields: {
          // Calculate customer quality score based on various factors
          customerQualityScore: {
            $add: [
              { $ifNull: ['$creditScore', 0] },
              { $multiply: [{ $ifNull: ['$customerData.accountAge', 0] }, 2] },
              { $cond: [{ $eq: ['$status', 'completed'] }, 20, 0] },
              { $cond: [{ $eq: ['$status', 'active'] }, 10, 0] },
              { $cond: [{ $eq: ['$status', 'defaulted'] }, -30, 0] }
            ]
          },
          // Calculate risk indicators
          riskIndicators: {
            $concatArrays: [
              { $cond: [{ $lt: ['$creditScore', 600] }, ['Low Credit Score'], []] },
              { $cond: [{ $eq: ['$status', 'defaulted'] }, ['Previous Default'], []] },
              { $cond: [{ $gt: ['$amount', 100000] }, ['High Loan Amount'], []] },
              { $cond: [{ $lt: ['$termMonths', 6] }, ['Short Term'], []] }
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          customerId: 1,
          customerName: 1,
          customerEmail: 1,
          institutionId: 1,
          institutionName: 1,
          loanType: 1,
          amount: 1,
          interestRate: 1,
          termMonths: 1,
          status: 1,
          applicationDate: 1,
          approvalDate: 1,
          disbursementDate: 1,
          maturityDate: 1,
          monthlyPayment: 1,
          remainingBalance: 1,
          creditScore: 1,
          riskLevel: 1,
          purpose: 1,
          collateral: 1,
          guarantor: 1,
          documents: 1,
          notes: 1,
          customerQualityScore: 1,
          riskIndicators: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { applicationDate: -1 } },
      {
        $facet: {
          loans: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: 'count' }
          ],
          metrics: [
            {
              $group: {
                _id: null,
                totalLoans: { $sum: 1 },
                totalAmount: { $sum: '$amount' },
                averageAmount: { $avg: '$amount' },
                averageCreditScore: { $avg: '$creditScore' },
                averageQualityScore: { $avg: '$customerQualityScore' },
                pendingLoans: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                approvedLoans: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                activeLoans: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                completedLoans: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                defaultedLoans: { $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] } },
                lowRiskLoans: { $sum: { $cond: [{ $eq: ['$riskLevel', 'low'] }, 1, 0] } },
                mediumRiskLoans: { $sum: { $cond: [{ $eq: ['$riskLevel', 'medium'] }, 1, 0] } },
                highRiskLoans: { $sum: { $cond: [{ $eq: ['$riskLevel', 'high'] }, 1, 0] } }
              }
            }
          ]
        }
      }
    ];

    const result = await Loan.aggregate(pipeline);

    const loans = result[0]?.loans || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const metrics = result[0]?.metrics[0] || {};

    return NextResponse.json({
      loans,
      totalCount,
      metrics,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching loan data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan data' },
      { status: 500 }
    );
  }
}
