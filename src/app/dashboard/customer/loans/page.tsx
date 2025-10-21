'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Download,
  RefreshCw,
  Database,
  AlertCircle as AlertCircleIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  CreditCard,
  TrendingUp,
  Activity,
  Shield,
  Zap
} from 'lucide-react';

interface CustomerLoan {
  _id: string;
  loanType: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: string;
  applicationDate: string;
  approvalDate?: string;
  disbursementDate?: string;
  monthlyPayment: number;
  remainingBalance: number;
  nextPaymentDate?: string;
  institutionName: string;
  riskLevel: string;
}

export default function CustomerLoans() {
  const [loans, setLoans] = useState<CustomerLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch customer loans from database
  const fetchLoans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/loans');
      
      if (response.ok) {
        const data = await response.json();
        setLoans(data.loans || []);
        setIsRealData(true);
      } else if (response.status === 401) {
        console.warn('Unauthorized - using mock data');
        setLoans(getMockLoans());
        setIsRealData(false);
      } else {
        console.error('Failed to fetch loans:', response.statusText);
        setLoans(getMockLoans());
        setIsRealData(false);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoans(getMockLoans());
      setIsRealData(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const getMockLoans = (): CustomerLoan[] => [
    {
      _id: '1',
      loanType: 'Personal Loan',
      amount: 25000,
      interestRate: 8.5,
      termMonths: 36,
      status: 'recovery',
      applicationDate: '2024-01-15',
      approvalDate: '2024-01-20',
      disbursementDate: '2024-01-25',
      monthlyPayment: 850,
      remainingBalance: 15000,
      nextPaymentDate: '2024-02-25',
      institutionName: 'First National Bank',
      riskLevel: 'low'
    },
    {
      _id: '2',
      loanType: 'Business Loan',
      amount: 50000,
      interestRate: 6.2,
      termMonths: 60,
      status: 'recovery',
      applicationDate: '2023-12-01',
      approvalDate: '2023-12-10',
      disbursementDate: '2023-12-15',
      monthlyPayment: 1200,
      remainingBalance: 35000,
      nextPaymentDate: '2024-02-15',
      institutionName: 'Commercial Bank',
      riskLevel: 'medium'
    },
    {
      _id: '3',
      loanType: 'Auto Loan',
      amount: 15000,
      interestRate: 7.8,
      termMonths: 24,
      status: 'approved',
      applicationDate: '2024-01-20',
      approvalDate: '2024-01-25',
      monthlyPayment: 650,
      remainingBalance: 15000,
      institutionName: 'Auto Finance Co',
      riskLevel: 'low'
    }
  ];

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.loanType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.institutionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'under_review':
        return <Badge className="bg-blue-100 text-blue-800"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'assessment':
        return <Badge className="bg-purple-100 text-purple-800"><Shield className="w-3 h-3 mr-1" />Assessment</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'disbursement':
        return <Badge className="bg-indigo-100 text-indigo-800"><CreditCard className="w-3 h-3 mr-1" />Disbursement</Badge>;
      case 'recovery':
        return <Badge className="bg-orange-100 text-orange-800"><Activity className="w-3 h-3 mr-1" />Active</Badge>;
      case 'defaulted':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Defaulted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High Risk</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical Risk</Badge>;
      default:
        return <Badge variant="secondary">{riskLevel}</Badge>;
    }
  };

  // Calculate summary metrics
  const totalLoans = loans.length;
  const activeLoans = loans.filter(loan => loan.status === 'recovery').length;
  const totalBorrowed = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalOutstanding = loans.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0);
  const nextPayment = loans.find(loan => loan.nextPaymentDate && loan.status === 'recovery');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">Loading your loans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            My Loans
          </h1>
          <p className="text-muted-foreground">View and manage your loan applications and active loans</p>
          {isRealData ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                <Database className="w-3 h-3" />
                Live Data
              </div>
              <span className="text-sm text-green-600">Showing real loan data from database</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                <AlertCircleIcon className="w-3 h-3" />
                Demo Data
              </div>
              <span className="text-sm text-yellow-600">Please log in to see real loan data</span>
            </div>
          )}
        </div>
        <Button 
          variant="outline" 
          onClick={fetchLoans}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoans}</div>
            <p className="text-xs text-muted-foreground">All applications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Borrowed</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {(totalBorrowed / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ZMW {(totalOutstanding / 1000000).toFixed(1)}M</div>
            <p className="text-xs text-muted-foreground">Remaining balance</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Payment Alert */}
      {nextPayment && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Calendar className="h-5 w-5" />
              Upcoming Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-800 font-medium">
                  {nextPayment.loanType} - {nextPayment.institutionName}
                </p>
                <p className="text-orange-600 text-sm">
                  Payment due: {new Date(nextPayment.nextPaymentDate!).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-800">
                  ZMW {nextPayment.monthlyPayment.toLocaleString()}
                </div>
                <Button className="mt-2 bg-orange-600 hover:bg-orange-700">
                  Make Payment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Loan History</CardTitle>
          <CardDescription>Your complete loan application and payment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search loans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              style={{ backgroundColor: 'var(--coffee-brown)', color: 'white' }}
            >
              <option value="all">All Status</option>
              <option value="pending_review">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="assessment">Assessment</option>
              <option value="approved">Approved</option>
              <option value="disbursement">Disbursement</option>
              <option value="recovery">Active</option>
              <option value="defaulted">Defaulted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="rounded-md border">
            {filteredLoans.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <FileText className="h-8 w-8 mr-2" />
                No loans found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan Type</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Monthly Payment</TableHead>
                    <TableHead>Next Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan._id}>
                      <TableCell>
                        <div className="font-medium">{loan.loanType}</div>
                        <div className="text-sm text-muted-foreground">
                          {loan.interestRate}% APR • {loan.termMonths} months
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{loan.institutionName}</div>
                        <div className="text-sm text-muted-foreground">
                          Applied: {new Date(loan.applicationDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">ZMW {loan.amount.toLocaleString()}</div>
                        {loan.remainingBalance > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Remaining: ZMW {loan.remainingBalance.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="mb-1">{getStatusBadge(loan.status)}</div>
                        <div>{getRiskBadge(loan.riskLevel)}</div>
                      </TableCell>
                      <TableCell>
                        {loan.monthlyPayment > 0 ? (
                          <div className="font-medium">ZMW {loan.monthlyPayment.toLocaleString()}</div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {loan.nextPaymentDate ? (
                          <div className="font-medium">{new Date(loan.nextPaymentDate).toLocaleDateString()}</div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="View Details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {loan.status === 'recovery' && (
                            <Button variant="ghost" size="sm" title="Make Payment">
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" title="Download Statement">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
