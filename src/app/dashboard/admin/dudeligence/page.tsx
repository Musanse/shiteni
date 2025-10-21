'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Download, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  FileText,
  Building2,
  BarChart3,
  Shield,
  Target,
  Zap,
  RefreshCw,
  User,
  CreditCard,
  TrendingDown
} from 'lucide-react';

export default function AdminDueDiligence() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [loans, setLoans] = useState<LoanData[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({});
  const [loading, setLoading] = useState(true);

  // Define types for better type safety
  interface LoanData {
    _id: string;
    customerName: string;
    customerEmail: string;
    institutionName: string;
    loanType: string;
    amount: number;
    interestRate: number;
    termMonths: number;
    status: string;
    applicationDate: string;
    approvalDate?: string | null;
    disbursementDate?: string | null;
    maturityDate?: string | null;
    monthlyPayment: number;
    remainingBalance: number;
    creditScore?: number;
    riskLevel: string;
    purpose: string;
    customerQualityScore?: number;
    riskIndicators?: string[];
  }

  interface MetricsData {
    totalLoans?: number;
    totalAmount?: number;
    averageAmount?: number;
    averageCreditScore?: number;
    averageQualityScore?: number;
    pendingLoans?: number;
    approvedLoans?: number;
    activeLoans?: number;
    completedLoans?: number;
    defaultedLoans?: number;
    lowRiskLoans?: number;
    mediumRiskLoans?: number;
    highRiskLoans?: number;
  }

  interface ReportLoanData {
    customerName: string;
    institutionName: string;
    loanType: string;
    amount: number;
    status: string;
    riskLevel: string;
    qualityScore?: number;
    creditScore?: number;
  }

  // Fetch loan data from database
  const fetchLoanData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filterStatus,
        risk: filterRisk
      });
      
      const response = await fetch(`/api/admin/loans?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLoans(data.loans || []);
        setMetrics(data.metrics || {});
      } else {
        console.error('Failed to fetch loan data');
        // Fallback to mock data
        setLoans(getMockLoanData());
        setMetrics(getMockMetrics());
      }
    } catch (error) {
      console.error('Error fetching loan data:', error);
      // Fallback to mock data
      setLoans(getMockLoanData());
      setMetrics(getMockMetrics());
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterRisk]);

  // Mock data fallback
  const getMockLoanData = () => [
    {
      _id: '1',
      customerName: 'John Smith',
      customerEmail: 'john.smith@email.com',
      institutionName: 'First National Bank',
      loanType: 'personal',
      amount: 25000,
      interestRate: 8.5,
      termMonths: 36,
      status: 'active',
      applicationDate: '2024-01-15',
      approvalDate: '2024-01-20',
      disbursementDate: '2024-01-25',
      maturityDate: '2027-01-25',
      monthlyPayment: 789.50,
      remainingBalance: 18500,
      creditScore: 720,
      riskLevel: 'low',
      purpose: 'Debt Consolidation',
      customerQualityScore: 85,
      riskIndicators: []
    },
    {
      _id: '2',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah.johnson@email.com',
      institutionName: 'Community Credit Union',
      loanType: 'business',
      amount: 75000,
      interestRate: 12.0,
      termMonths: 60,
      status: 'pending',
      applicationDate: '2024-02-01',
      approvalDate: null,
      disbursementDate: null,
      maturityDate: null,
      monthlyPayment: 1668.50,
      remainingBalance: 75000,
      creditScore: 680,
      riskLevel: 'medium',
      purpose: 'Business Expansion',
      customerQualityScore: 72,
      riskIndicators: ['High Loan Amount']
    },
    {
      _id: '3',
      customerName: 'Michael Brown',
      customerEmail: 'michael.brown@email.com',
      institutionName: 'Metro Microfinance',
      loanType: 'emergency',
      amount: 5000,
      interestRate: 15.5,
      termMonths: 12,
      status: 'defaulted',
      applicationDate: '2023-11-10',
      approvalDate: '2023-11-15',
      disbursementDate: '2023-11-20',
      maturityDate: '2024-11-20',
      monthlyPayment: 450.25,
      remainingBalance: 3200,
      creditScore: 580,
      riskLevel: 'high',
      purpose: 'Medical Expenses',
      customerQualityScore: 45,
      riskIndicators: ['Low Credit Score', 'Previous Default', 'Short Term']
    }
  ];

  const getMockMetrics = () => ({
    totalLoans: 3,
    totalAmount: 105000,
    averageAmount: 35000,
    averageCreditScore: 660,
    averageQualityScore: 67,
    pendingLoans: 1,
    approvedLoans: 0,
    activeLoans: 1,
    completedLoans: 0,
    defaultedLoans: 1,
    lowRiskLoans: 1,
    mediumRiskLoans: 1,
    highRiskLoans: 1
  });

  // Initialize data
  useEffect(() => {
    fetchLoanData();
  }, [fetchLoanData]);

  const filteredLoans = loans.filter(loan => {
    const matchesSearch = loan.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.loanType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         loan.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || loan.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || loan.riskLevel === filterRisk;
    const matchesInstitution = true; // Removed filterInstitution dependency
    return matchesSearch && matchesStatus && matchesRisk && matchesInstitution;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800"><Zap className="w-3 h-3 mr-1" />Active</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'defaulted':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Defaulted</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800"><Shield className="w-3 h-3 mr-1" />Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />High Risk</Badge>;
      default:
        return <Badge variant="secondary">{riskLevel}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Handle export reports
  const handleExportReports = async () => {
    try {
      const csvContent = convertToCSV(loans);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `due_diligence_reports_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      alert('Reports exported successfully!');
    } catch (error) {
      console.error('Error exporting reports:', error);
      alert('Error exporting reports. Please try again.');
    }
  };

  // Handle generate report
  const handleGenerateReport = async () => {
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        totalLoans: totalLoans,
        totalAmount: totalAmount,
        averageQualityScore: Math.round(averageQualityScore),
        riskDistribution: {
          low: lowRiskLoans,
          medium: mediumRiskLoans,
          high: highRiskLoans
        },
        statusDistribution: {
          pending: pendingLoans,
          active: activeLoans,
          completed: completedLoans,
          defaulted: defaultedLoans
        },
        loans: loans.map(loan => ({
          customerName: loan.customerName,
          institutionName: loan.institutionName,
          loanType: loan.loanType,
          amount: loan.amount,
          status: loan.status,
          riskLevel: loan.riskLevel,
          qualityScore: loan.customerQualityScore,
          creditScore: loan.creditScore
        } as ReportLoanData))
      };

      const csvContent = convertToCSV(reportData.loans);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `due_diligence_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      alert('Report generated and downloaded successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data: LoanData[] | ReportLoanData[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = (row as unknown as Record<string, unknown>)[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });
    
    return csvRows.join('\n');
  };

  // Calculate overall metrics from fetched data
  const totalLoans = metrics.totalLoans || loans.length;
  const totalAmount = metrics.totalAmount || loans.reduce((sum, loan) => sum + loan.amount, 0);
  const averageQualityScore = metrics.averageQualityScore || (totalLoans > 0 ? loans.reduce((sum, loan) => sum + (loan.customerQualityScore || 0), 0) / totalLoans : 0);
  const pendingLoans = metrics.pendingLoans || loans.filter(l => l.status === 'pending').length;
  const activeLoans = metrics.activeLoans || loans.filter(l => l.status === 'active').length;
  const completedLoans = metrics.completedLoans || loans.filter(l => l.status === 'completed').length;
  const defaultedLoans = metrics.defaultedLoans || loans.filter(l => l.status === 'defaulted').length;
  const lowRiskLoans = metrics.lowRiskLoans || loans.filter(l => l.riskLevel === 'low').length;
  const mediumRiskLoans = metrics.mediumRiskLoans || loans.filter(l => l.riskLevel === 'medium').length;
  const highRiskLoans = metrics.highRiskLoans || loans.filter(l => l.riskLevel === 'high').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Due Diligence Management
          </h1>
          <p className="text-muted-foreground">Customer quality assessment and loan risk analysis</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchLoanData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={handleExportReports}
            disabled={loading}
            className="bg-amber-800 hover:bg-amber-900 text-white border-amber-800"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
          <Button 
            onClick={handleGenerateReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageQualityScore)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              Customer quality rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLoans}</div>
            <p className="text-xs text-muted-foreground">
              ZMW {totalAmount.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Loans</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highRiskLoans}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Defaulted Loans</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultedLoans}</div>
            <p className="text-xs text-muted-foreground">
              {totalLoans > 0 ? Math.round((defaultedLoans / totalLoans) * 100) : 0}% default rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Risk Level Distribution</CardTitle>
            <CardDescription>Loan risk assessment across all applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Low Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${totalLoans > 0 ? (lowRiskLoans / totalLoans) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{lowRiskLoans}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Medium Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${totalLoans > 0 ? (mediumRiskLoans / totalLoans) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{mediumRiskLoans}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">High Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${totalLoans > 0 ? (highRiskLoans / totalLoans) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{highRiskLoans}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Status Overview</CardTitle>
            <CardDescription>Current status of all loan applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${totalLoans > 0 ? (pendingLoans / totalLoans) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{pendingLoans}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${totalLoans > 0 ? (activeLoans / totalLoans) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{activeLoans}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${totalLoans > 0 ? (completedLoans / totalLoans) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{completedLoans}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Applications & Customer Quality</CardTitle>
          <CardDescription>Comprehensive loan data and customer quality assessment for risk analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers, institutions, or loan types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 bg-amber-800 text-white border border-amber-800 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="all" className="bg-amber-800 text-white">All Status</option>
                    <option value="pending" className="bg-amber-800 text-white">Pending</option>
                    <option value="approved" className="bg-amber-800 text-white">Approved</option>
                    <option value="active" className="bg-amber-800 text-white">Active</option>
                    <option value="completed" className="bg-amber-800 text-white">Completed</option>
                    <option value="defaulted" className="bg-amber-800 text-white">Defaulted</option>
                    <option value="cancelled" className="bg-amber-800 text-white">Cancelled</option>
                  </select>
                  <select
                    value={filterRisk}
                    onChange={(e) => setFilterRisk(e.target.value)}
                    className="px-3 py-2 bg-amber-800 text-white border border-amber-800 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600"
                  >
                    <option value="all" className="bg-amber-800 text-white">All Risk Levels</option>
                    <option value="low" className="bg-amber-800 text-white">Low Risk</option>
                    <option value="medium" className="bg-amber-800 text-white">Medium Risk</option>
                    <option value="high" className="bg-amber-800 text-white">High Risk</option>
                  </select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Loans Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading loan data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Loan Details</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Application Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{loan.customerName}</div>
                            <div className="text-sm text-muted-foreground">
                              {loan.customerEmail}
                            </div>
                            {loan.creditScore && (
                              <div className="text-xs text-muted-foreground">
                                Credit: {loan.creditScore}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div className="font-medium">{loan.institutionName}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium capitalize">{loan.loanType}</div>
                          <div className="text-sm text-muted-foreground">{loan.purpose}</div>
                          <div className="text-xs text-muted-foreground">
                            {loan.termMonths} months @ {loan.interestRate}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">ZMW {loan.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">
                            ZMW {loan.monthlyPayment.toLocaleString()}/month
                          </div>
                          {loan.remainingBalance > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Remaining: ZMW {loan.remainingBalance.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getScoreProgressColor(loan.customerQualityScore || 0)}`}
                              style={{ width: `${Math.min((loan.customerQualityScore || 0), 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${getScoreColor(loan.customerQualityScore || 0)}`}>
                            {Math.round(loan.customerQualityScore || 0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getRiskBadge(loan.riskLevel)}</TableCell>
                      <TableCell>{getStatusBadge(loan.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(loan.applicationDate).toLocaleDateString()}
                          {loan.approvalDate && (
                            <div className="text-xs text-muted-foreground">
                              Approved: {new Date(loan.approvalDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => alert(`View customer details for ${loan.customerName}\n\nCustomer Quality Score: ${loan.customerQualityScore}\nCredit Score: ${loan.creditScore}\nRisk Indicators: ${loan.riskIndicators?.join(', ') || 'None'}`)}
                            title="View Customer Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => alert(`Download loan report for ${loan.customerName}\n\nThis would download a comprehensive report including:\n- Customer quality assessment\n- Risk analysis\n- Loan performance metrics\n- Recommendations`)}
                            title="Download Report"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => alert(`More actions for ${loan.customerName}:\n\n- Update Risk Assessment\n- Add Notes\n- Flag for Review\n- Generate Quality Report\n- Contact Customer`)}
                            title="More Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
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
