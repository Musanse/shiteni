'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
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
  Calendar,
  Building2,
  Users,
  DollarSign,
  BarChart3,
  RefreshCw,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';

export default function AdminCompliance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [complianceReports, setComplianceReports] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch compliance data from database
  const fetchComplianceData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: filterStatus,
        period: selectedPeriod
      });
      
      const response = await fetch(`/api/admin/compliance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setComplianceReports(data.reports || []);
        setMetrics(data.metrics || {});
      } else {
        console.error('Failed to fetch compliance data');
        // Fallback to mock data
        setComplianceReports(getMockComplianceData());
        setMetrics(getMockMetrics());
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      // Fallback to mock data
      setComplianceReports(getMockComplianceData());
      setMetrics(getMockMetrics());
    } finally {
      setLoading(false);
    }
  };

  // Mock data fallback
  const getMockComplianceData = () => [
    {
      id: 1,
      institution: 'First National Bank',
      reportType: 'Quarterly Compliance',
      period: 'Q4 2023',
      status: 'approved',
      score: 95,
      submittedDate: '2024-01-10',
      reviewedDate: '2024-01-12',
      reviewer: 'Sarah Johnson',
      violations: 0,
      recommendations: 2,
      nextDue: '2024-04-10',
      documents: 15
    },
    {
      id: 2,
      institution: 'Community Credit Union',
      reportType: 'Annual Audit',
      period: '2023',
      status: 'under_review',
      score: 88,
      submittedDate: '2024-01-05',
      reviewedDate: null,
      reviewer: 'Michael Chen',
      violations: 1,
      recommendations: 5,
      nextDue: '2024-12-31',
      documents: 23
    },
    {
      id: 3,
      institution: 'Metro Microfinance',
      reportType: 'Monthly Compliance',
      period: 'December 2023',
      status: 'rejected',
      score: 72,
      submittedDate: '2023-12-28',
      reviewedDate: '2024-01-02',
      reviewer: 'Emily Rodriguez',
      violations: 3,
      recommendations: 8,
      nextDue: '2024-01-28',
      documents: 12
    }
  ];

  const getMockMetrics = () => ({
    totalInstitutions: 3,
    approvedReports: 1,
    underReviewReports: 1,
    rejectedReports: 1,
    averageScore: 85,
    totalViolations: 4,
    totalRecommendations: 15
  });

  // Initialize data
  useEffect(() => {
    fetchComplianceData();
  }, [filterStatus, selectedPeriod]);

  // Handle action buttons
  const handleViewReport = (report: any) => {
    alert(`Viewing compliance report for ${report.institution}\n\nReport Type: ${report.reportType}\nPeriod: ${report.period}\nScore: ${report.score}%\nStatus: ${report.status}\nViolations: ${report.violations}\nRecommendations: ${report.recommendations}`);
  };

  const handleDownloadReport = async (report: any) => {
    try {
      setActionLoading(report.id);
      
      // Create CSV content for individual report
      const reportData = [{
        'Institution Name': report.institution,
        'Report Type': report.reportType,
        'Period': report.period,
        'Status': report.status,
        'Compliance Score': report.score,
        'Submitted Date': report.submittedDate,
        'Reviewed Date': report.reviewedDate || 'N/A',
        'Violations': report.violations,
        'Recommendations': report.recommendations,
        'Next Due Date': report.nextDue,
        'Documents Count': report.documents
      }];
      
      const csvContent = convertToCSV(reportData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${report.institution.replace(/\s+/g, '_')}_compliance_report.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoreActions = (report: any) => {
    alert(`More actions for ${report.institution}:\n\n- Edit Report\n- Add Comments\n- Request Resubmission\n- Escalate to Legal\n- Archive Report`);
  };

  // Generate Excel report
  const generateExcelReport = async () => {
    try {
      setGeneratingReport(true);
      
      const response = await fetch('/api/admin/compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: 'compliance_summary',
          period: selectedPeriod,
          format: 'excel'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create and download the Excel file
        const csvContent = convertToCSV(data.data);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', data.filename.replace('.xlsx', '.csv'));
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`Excel report generated and downloaded successfully!\n\nFilename: ${data.filename.replace('.xlsx', '.csv')}\nTotal Records: ${data.totalRecords}`);
      } else {
        console.error('Failed to generate Excel report');
        alert('Failed to generate Excel report. Please try again.');
      }
    } catch (error) {
      console.error('Error generating Excel report:', error);
      alert('Error generating Excel report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  // Convert data to CSV format
  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
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

  const filteredReports = complianceReports.filter(report => {
    const matchesSearch = report.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reportType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-yellow-500';
    if (score >= 70) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Calculate overall compliance metrics from fetched data
  const totalInstitutions = metrics.totalInstitutions || complianceReports.length;
  const approvedReports = metrics.approvedReports || complianceReports.filter(r => r.status === 'approved').length;
  const underReviewReports = metrics.underReviewReports || complianceReports.filter(r => r.status === 'under_review').length;
  const rejectedReports = metrics.rejectedReports || complianceReports.filter(r => r.status === 'rejected').length;
  const averageScore = metrics.averageScore || (totalInstitutions > 0 ? Math.round(complianceReports.reduce((sum, r) => sum + r.score, 0) / totalInstitutions) : 0);
  const totalViolations = metrics.totalViolations || complianceReports.reduce((sum, r) => sum + r.violations, 0);
  const totalRecommendations = metrics.totalRecommendations || complianceReports.reduce((sum, r) => sum + r.recommendations, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Compliance Management
          </h1>
          <p className="text-muted-foreground">Monitor and manage regulatory compliance across all institutions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchComplianceData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            onClick={generateExcelReport}
            disabled={generatingReport}
          >
            {generatingReport ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export Reports
          </Button>
          <Button 
            onClick={generateExcelReport}
            disabled={generatingReport}
          >
            {generatingReport ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +3% from last quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Reports</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedReports}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((approvedReports / totalInstitutions) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViolations}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecommendations}</div>
            <p className="text-xs text-muted-foreground">
              Improvement suggestions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status Overview</CardTitle>
            <CardDescription>Current compliance status across all institutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(approvedReports / totalInstitutions) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{approvedReports}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Under Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(underReviewReports / totalInstitutions) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{underReviewReports}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Rejected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(rejectedReports / totalInstitutions) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{rejectedReports}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Compliance deadlines requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceReports
                .filter(r => new Date(r.nextDue) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                .sort((a, b) => new Date(a.nextDue).getTime() - new Date(b.nextDue).getTime())
                .map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{report.institution}</div>
                      <div className="text-xs text-muted-foreground">{report.reportType}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{new Date(report.nextDue).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.ceil((new Date(report.nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Reports</CardTitle>
          <CardDescription>Review and manage all compliance submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search institutions or report types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-amber-100 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 hover:bg-amber-200 transition-colors"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="under_review">Under Review</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 bg-amber-100 border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-amber-600 hover:bg-amber-200 transition-colors"
              >
                <option value="current">Current Period</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="last_year">Last Year</option>
              </select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading compliance data...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution</TableHead>
                    <TableHead>Report Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Violations</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{report.institution}</div>
                            <div className="text-sm text-muted-foreground">
                              {report.documents} documents
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{report.reportType}</TableCell>
                      <TableCell>{report.period}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getScoreProgressColor(report.score)}`}
                              style={{ width: `${report.score}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-medium ${getScoreColor(report.score)}`}>
                            {report.score}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {report.violations > 0 ? (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {report.violations}
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              0
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(report.submittedDate).toLocaleDateString()}
                          {report.reviewedDate && (
                            <div className="text-xs text-muted-foreground">
                              Reviewed: {new Date(report.reviewedDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(report.nextDue).toLocaleDateString()}
                          <div className="text-xs text-muted-foreground">
                            {Math.ceil((new Date(report.nextDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Button */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewReport(report)}
                            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                            title="View Report Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {/* Download Button */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadReport(report)}
                            disabled={actionLoading === report.id}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Download Report"
                          >
                            {actionLoading === report.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                          
                          {/* More Options Button */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleMoreActions(report)}
                            className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
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
