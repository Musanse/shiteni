'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Search,
  Clock,
  Users,
  DollarSign,
  Bed,
  Star,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';

interface Report {
  id: string;
  name: string;
  type: 'financial' | 'occupancy' | 'guest' | 'operational' | 'marketing';
  description: string;
  lastGenerated: string;
  status: 'ready' | 'generating' | 'error';
  size: string;
  format: 'pdf' | 'excel' | 'csv';
}

export default function HotelReportsPage() {
  const { data: session } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  // Initialize with default reports
  useEffect(() => {
    const defaultReports: Report[] = [
      {
        id: 'financial',
        name: 'Financial Report',
        type: 'financial',
        description: 'Comprehensive revenue and expense analysis',
        lastGenerated: 'Never generated',
        status: 'ready',
        size: '0 MB',
        format: 'excel'
      },
      {
        id: 'occupancy',
        name: 'Occupancy Report',
        type: 'occupancy',
        description: 'Room occupancy rates and utilization analysis',
        lastGenerated: 'Never generated',
        status: 'ready',
        size: '0 MB',
        format: 'excel'
      },
      {
        id: 'guest',
        name: 'Guest Report',
        type: 'guest',
        description: 'Guest demographics and satisfaction analysis',
        lastGenerated: 'Never generated',
        status: 'ready',
        size: '0 MB',
        format: 'excel'
      },
      {
        id: 'operational',
        name: 'Operational Report',
        type: 'operational',
        description: 'Staff performance and operational metrics',
        lastGenerated: 'Never generated',
        status: 'ready',
        size: '0 MB',
        format: 'excel'
      }
    ];

    setReports(defaultReports);
    setFilteredReports(defaultReports);
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(report => report.type === typeFilter);
    }

    setFilteredReports(filtered);
  }, [searchTerm, typeFilter, reports]);

  const getTypeBadge = (type: string) => {
    const colors = {
      financial: 'bg-green-100 text-green-800',
      occupancy: 'bg-blue-100 text-blue-800',
      guest: 'bg-purple-100 text-purple-800',
      operational: 'bg-orange-100 text-orange-800',
      marketing: 'bg-pink-100 text-pink-800'
    };

    return (
      <Badge className={colors[type as keyof typeof colors]}>
        {type.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ready: 'bg-green-100 text-green-800',
      generating: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };

    const icons = {
      ready: <Download className="h-3 w-3" />,
      generating: <Clock className="h-3 w-3" />,
      error: <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {icons[status as keyof typeof icons]}
        <span className="ml-1">{status.toUpperCase()}</span>
      </Badge>
    );
  };

  const handleGenerateReport = async (reportType: string) => {
    try {
      setGenerating(reportType);
      
      // Fetch data based on report type
      const [bookingsResponse, roomsResponse, paymentsResponse] = await Promise.all([
        fetch('/api/hotel/bookings'),
        fetch('/api/hotel/rooms'),
        fetch('/api/hotel/payments')
      ]);
      
      const bookingsData = bookingsResponse.ok ? await bookingsResponse.json() : { bookings: [] };
      const roomsData = roomsResponse.ok ? await roomsResponse.json() : { rooms: [] };
      const paymentsData = paymentsResponse.ok ? await paymentsResponse.json() : { payments: [] };
      
      const bookings = bookingsData.bookings || [];
      const rooms = roomsData.rooms || [];
      const payments = paymentsData.payments || [];
      
      // Generate report based on type
      let reportData: any[] = [];
      let reportName = '';
      
      switch (reportType) {
        case 'financial':
          reportName = 'Financial Report';
          reportData = generateFinancialReport(bookings, payments);
          break;
        case 'occupancy':
          reportName = 'Occupancy Report';
          reportData = generateOccupancyReport(bookings, rooms);
          break;
        case 'guest':
          reportName = 'Guest Report';
          reportData = generateGuestReport(bookings);
          break;
        case 'operational':
          reportName = 'Operational Report';
          reportData = generateOperationalReport(bookings, rooms);
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      // Create CSV content
      const csvContent = createCSVContent(reportData);
      
      // Download the report
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Update report status
      setReports(prev => prev.map(report => 
        report.id === reportType 
          ? { 
              ...report, 
              lastGenerated: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
              status: 'ready',
              size: `${(csvContent.length / 1024).toFixed(1)} KB`
            }
          : report
      ));
      
    } catch (error) {
      console.error('Error generating report:', error);
      setReports(prev => prev.map(report => 
        report.id === reportType 
          ? { ...report, status: 'error' as const }
          : report
      ));
    } finally {
      setGenerating(null);
    }
  };

  const handleDownloadReport = (reportId: string) => {
    // For now, just regenerate the report
    handleGenerateReport(reportId);
  };

  // Helper functions for report generation
  const generateFinancialReport = (bookings: any[], payments: any[]) => {
    const reportData = [];
    
    // Add header
    reportData.push([
      'Date',
      'Booking ID',
      'Customer Name',
      'Room Number',
      'Amount',
      'Payment Method',
      'Payment Status',
      'Fees',
      'Net Amount'
    ]);
    
    // Add payment data
    if (payments.length > 0) {
      payments.forEach(payment => {
        reportData.push([
          format(new Date(payment.processedAt), 'yyyy-MM-dd'),
          payment.bookingId,
          payment.customerName,
          payment.roomNumber,
          payment.amount,
          payment.paymentMethod,
          payment.paymentStatus,
          payment.fees,
          payment.netAmount
        ]);
      });
    } else {
      // Fallback to booking data
      bookings.forEach(booking => {
        if (booking.paymentMethod && booking.totalAmount > 0) {
          reportData.push([
            format(new Date(booking.createdAt), 'yyyy-MM-dd'),
            booking._id,
            booking.customerName,
            booking.roomNumber,
            booking.totalAmount,
            booking.paymentMethod,
            booking.paymentStatus,
            '0', // No fees in booking data
            booking.totalAmount
          ]);
        }
      });
    }
    
    return reportData;
  };

  const generateOccupancyReport = (bookings: any[], rooms: any[]) => {
    const reportData = [];
    
    // Add header
    reportData.push([
      'Date',
      'Room Number',
      'Room Type',
      'Status',
      'Customer Name',
      'Check In',
      'Check Out',
      'Nights',
      'Revenue'
    ]);
    
    // Add room occupancy data
    bookings.forEach(booking => {
      if (booking.status === 'checked-in' || booking.status === 'checked-out') {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        
        reportData.push([
          format(new Date(booking.createdAt), 'yyyy-MM-dd'),
          booking.roomNumber,
          booking.roomType,
          booking.status,
          booking.customerName,
          format(checkIn, 'yyyy-MM-dd'),
          format(checkOut, 'yyyy-MM-dd'),
          nights,
          booking.totalAmount
        ]);
      }
    });
    
    return reportData;
  };

  const generateGuestReport = (bookings: any[]) => {
    const reportData = [];
    
    // Add header
    reportData.push([
      'Customer Name',
      'Email',
      'Phone',
      'Total Bookings',
      'Total Nights',
      'Total Revenue',
      'Last Visit',
      'Average Stay',
      'Preferred Room Type'
    ]);
    
    // Group bookings by customer
    const customerMap = new Map();
    
    bookings.forEach(booking => {
      const email = booking.customerEmail;
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          name: booking.customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
          bookings: [],
          totalRevenue: 0,
          totalNights: 0
        });
      }
      
      const customer = customerMap.get(email);
      customer.bookings.push(booking);
      customer.totalRevenue += booking.totalAmount || 0;
      
      const checkIn = new Date(booking.checkIn);
      const checkOut = new Date(booking.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      customer.totalNights += nights;
    });
    
    // Add customer data to report
    customerMap.forEach(customer => {
      const lastVisit = customer.bookings
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const averageStay = customer.totalNights / customer.bookings.length;
      
      // Find most preferred room type
      const roomTypes = customer.bookings.map((b: any) => b.roomType);
      const preferredRoomType = roomTypes.reduce((a: string, b: string) => 
        roomTypes.filter((v: string) => v === a).length >= roomTypes.filter((v: string) => v === b).length ? a : b
      );
      
      reportData.push([
        customer.name,
        customer.email,
        customer.phone,
        customer.bookings.length,
        customer.totalNights,
        customer.totalRevenue,
        format(new Date(lastVisit.createdAt), 'yyyy-MM-dd'),
        averageStay.toFixed(1),
        preferredRoomType
      ]);
    });
    
    return reportData;
  };

  const generateOperationalReport = (bookings: any[], rooms: any[]) => {
    const reportData = [];
    
    // Add header
    reportData.push([
      'Date',
      'Room Number',
      'Room Type',
      'Status',
      'Maintenance Required',
      'Last Cleaned',
      'Next Maintenance',
      'Revenue Generated'
    ]);
    
    // Add room operational data
    rooms.forEach(room => {
      const roomBookings = bookings.filter(b => b.roomNumber === room.number);
      const revenue = roomBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
      
      reportData.push([
        format(new Date(), 'yyyy-MM-dd'),
        room.number,
        room.type,
        room.status,
        room.maintenanceRequired ? 'Yes' : 'No',
        room.lastCleaned || 'N/A',
        room.nextMaintenance || 'N/A',
        revenue
      ]);
    });
    
    return reportData;
  };

  const createCSVContent = (data: any[][]) => {
    const BOM = '\uFEFF';
    const csvString = data.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    return BOM + csvString;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hotel Reports</h1>
          <p className="text-muted-foreground">Generate and manage hotel performance reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="occupancy">Occupancy</SelectItem>
                <SelectItem value="guest">Guest</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quick Report Generation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Financial Report</p>
                <p className="text-xs text-muted-foreground">Revenue & expenses</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3"
              onClick={() => handleGenerateReport('financial')}
              disabled={generating === 'financial'}
            >
              {generating === 'financial' ? 'Generating...' : 'Generate'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Occupancy Report</p>
                <p className="text-xs text-muted-foreground">Room utilization</p>
              </div>
              <Bed className="h-8 w-8 text-blue-600" />
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3"
              onClick={() => handleGenerateReport('occupancy')}
              disabled={generating === 'occupancy'}
            >
              {generating === 'occupancy' ? 'Generating...' : 'Generate'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Guest Report</p>
                <p className="text-xs text-muted-foreground">Satisfaction & feedback</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3"
              onClick={() => handleGenerateReport('guest')}
              disabled={generating === 'guest'}
            >
              {generating === 'guest' ? 'Generating...' : 'Generate'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Operational Report</p>
                <p className="text-xs text-muted-foreground">Staff & operations</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <Button 
              size="sm" 
              className="w-full mt-3"
              onClick={() => handleGenerateReport('operational')}
              disabled={generating === 'operational'}
            >
              {generating === 'operational' ? 'Generating...' : 'Generate'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{report.name}</h3>
                    {getTypeBadge(report.type)}
                    {getStatusBadge(report.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {report.description}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Last generated: {report.lastGenerated}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Size: {report.size}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Format: {report.format.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Type: {report.type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {report.status === 'ready' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadReport(report.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                  {report.status === 'generating' && (
                    <Button variant="outline" size="sm" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      Generating...
                    </Button>
                  )}
                  {report.status === 'error' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleGenerateReport(report.id)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No reports found</h3>
            <p className="text-muted-foreground">
              {searchTerm || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No reports have been generated yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report Generation Form */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
          <CardDescription>Create a custom report with specific parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reportName">Report Name</Label>
              <Input id="reportName" placeholder="Enter report name" />
            </div>
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="occupancy">Occupancy Report</SelectItem>
                  <SelectItem value="guest">Guest Report</SelectItem>
                  <SelectItem value="operational">Operational Report</SelectItem>
                  <SelectItem value="marketing">Marketing Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" />
            </div>
            <div>
              <Label htmlFor="format">Format</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="schedule">Schedule</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select schedule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="once">Generate Once</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline">Cancel</Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
