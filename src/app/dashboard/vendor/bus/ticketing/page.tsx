'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Ticket, 
  Plus, 
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  Printer,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface BusTicket {
  _id: string;
  ticketNumber: string;
  tripId: string;
  tripName: string;
  routeName: string;
  busId: string;
  busName: string;
  passengerDetails: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    idNumber?: string;
    idType?: string;
  };
  boardingPoint: string;
  droppingPoint: string;
  seatNumber: string;
  fareAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  departureDate: string;
  departureTime: string;
  status: string;
  soldBy: string;
  soldByName: string;
  createdAt: string;
}

interface BusTrip {
  _id: string;
  tripName: string;
  busId: string;
  busName: string;
  routeId: string;
  routeName: string;
  departureTimes: {
    to: string;
    from: string;
  };
  daysOfWeek: string[];
  status: string;
}

interface BusRoute {
  _id: string;
  routeName: string;
  stops: Array<{
    stopId: string;
    stopName: string;
    order: number;
  }>;
  fareSegments: Array<{
    from: string;
    to: string;
    fareId: string;
    amount: number;
  }>;
  totalDistance?: number;
  isBidirectional: boolean;
  status: string;
}

interface RouteSegment {
  from: string;
  to: string;
  fareAmount: number;
  tripId: string;
  tripName: string;
  routeName: string;
  busId: string;
  busName: string;
}

export default function BusTicketingPage() {
  const [tickets, setTickets] = useState<BusTicket[]>([]);
  const [trips, setTrips] = useState<BusTrip[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [availableSegments, setAvailableSegments] = useState<RouteSegment[]>([]);
  const [availableSeats, setAvailableSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<BusTicket | null>(null);
  const [formData, setFormData] = useState({
    tripId: '',
    tripName: '',
    routeName: '',
    busId: '',
    busName: '',
    boardingPoint: '',
    droppingPoint: '',
    passengerDetails: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      idNumber: '',
      idType: 'National ID'
    },
    seatNumber: '',
    fareAmount: '',
    currency: 'ZMW',
    paymentMethod: 'cash',
    departureDate: '',
    departureTime: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const generateAvailableSegments = () => {
      const segments: RouteSegment[] = [];
      
      trips.forEach(trip => {
        const route = routes.find(r => r._id === trip.routeId);
        if (route && route.fareSegments) {
          route.fareSegments.forEach(segment => {
            segments.push({
              from: segment.from,
              to: segment.to,
              fareAmount: segment.amount,
              tripId: trip._id,
              tripName: trip.tripName,
              routeName: route.routeName,
              busId: trip.busId,
              busName: trip.busName
            });
          });
        }
      });
      
      setAvailableSegments(segments);
    };

    generateAvailableSegments();
  }, [trips, routes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ticketsResponse, tripsResponse, routesResponse] = await Promise.all([
        fetch('/api/bus/tickets'),
        fetch('/api/bus/trips'),
        fetch('/api/bus/routes')
      ]);

      const ticketsData = await ticketsResponse.json();
      const tripsData = await tripsResponse.json();
      const routesData = await routesResponse.json();

      if (ticketsData.success) {
        setTickets(ticketsData.tickets || []);
      }
      if (tripsData.success) {
        setTrips(tripsData.trips || []);
      }
      if (routesData.success) {
        setRoutes(routesData.routes || []);
      }

      if (!ticketsData.success) {
        setError(ticketsData.error || 'Failed to load tickets');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const generateSeatNumbers = (busId: string) => {
    const trip = trips.find(t => t.busId === busId);
    if (!trip) return [];
    
    // Find the bus details to get number of seats
    // For now, we'll generate a standard set of seats
    const seats: string[] = [];
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const seatsPerRow = 4;
    
    rows.forEach(row => {
      for (let i = 1; i <= seatsPerRow; i++) {
        seats.push(`${row}${i}`);
      }
    });
    
    return seats;
  };

  const handleSegmentChange = (segment: RouteSegment) => {
    const seats = generateSeatNumbers(segment.busId);
    setAvailableSeats(seats);
    
    setFormData(prev => ({
      ...prev,
      tripId: segment.tripId,
      tripName: segment.tripName,
      routeName: segment.routeName,
      busId: segment.busId,
      busName: segment.busName,
      boardingPoint: segment.from,
      droppingPoint: segment.to,
      fareAmount: segment.fareAmount.toString(),
      departureTime: trips.find(t => t._id === segment.tripId)?.departureTimes.to || '',
      seatNumber: '' // Reset seat selection
    }));
  };

  const handleAddTicket = async () => {
    if (!formData.tripId || !formData.passengerDetails.firstName || 
        !formData.passengerDetails.lastName || !formData.passengerDetails.phoneNumber ||
        !formData.boardingPoint || !formData.droppingPoint ||
        !formData.seatNumber || !formData.fareAmount || !formData.departureDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/bus/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        setTickets([data.ticket, ...tickets]);
        setIsAddDialogOpen(false);
        resetForm();
        setError(null);
      } else {
        setError(data.error || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      setError('Failed to create ticket');
    }
  };


  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const response = await fetch(`/api/bus/tickets/${ticketId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        setTickets(tickets.filter(ticket => ticket._id !== ticketId));
      } else {
        setError(data.error || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      setError('Failed to delete ticket');
    }
  };

  const resetForm = () => {
    setFormData({
      tripId: '',
      tripName: '',
      routeName: '',
      busId: '',
      busName: '',
      boardingPoint: '',
      droppingPoint: '',
      passengerDetails: {
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        idNumber: '',
        idType: 'National ID'
      },
      seatNumber: '',
      fareAmount: '',
      currency: 'ZMW',
      paymentMethod: 'cash',
      departureDate: '',
      departureTime: ''
    });
    setAvailableSeats([]);
  };

  const openViewDialog = (ticket: BusTicket) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.passengerDetails.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.passengerDetails.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.passengerDetails.phoneNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesDate = !dateFilter || ticket.departureDate.startsWith(dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      used: 'secondary',
      cancelled: 'destructive',
      refunded: 'outline'
    } as const;

    const colors = {
      active: 'text-green-600',
      used: 'text-blue-600',
      cancelled: 'text-red-600',
      refunded: 'text-gray-600'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        <span className={colors[status as keyof typeof colors] || 'text-gray-600'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'used':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'refunded':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Ticket className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'ZMW') => {
    return new Intl.NumberFormat('en-ZM', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZM');
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handlePrintTicket = () => {
    if (!selectedTicket) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to print tickets');
      return;
    }

    // Get status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'active': return '#10b981';
        case 'used': return '#6b7280';
        case 'cancelled': return '#ef4444';
        default: return '#6b7280';
      }
    };

    const ticketHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Bus Ticket - ${selectedTicket.ticketNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: white;
      color: black;
      line-height: 1.4;
    }
    .ticket {
      max-width: 400px;
      margin: 0 auto;
      border: 2px solid #333;
      border-radius: 8px;
      padding: 20px;
      background: white;
    }
    .ticket-header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .ticket-number {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      background: ${getStatusColor(selectedTicket.status)};
      color: white;
    }
    .section {
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section:last-child {
      border-bottom: none;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 8px;
      color: #374151;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .info-item {
      margin-bottom: 8px;
    }
    .info-label {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 500;
    }
    .fare-amount {
      font-size: 20px;
      font-weight: bold;
      color: #059669;
    }
    .boarding-dropping {
      background: #8B4513;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      text-align: center;
      margin: 5px 0;
    }
    .route-info {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 10px 0;
    }
    @media print {
      body { 
        margin: 0; 
        padding: 10px;
      }
      .ticket { 
        border: 2px solid #000; 
        box-shadow: none; 
        margin: 0;
        max-width: none;
      }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="ticket-header">
      <div class="ticket-number">${selectedTicket.ticketNumber}</div>
      <div class="status">${selectedTicket.status}</div>
    </div>
    
    <div class="section">
      <div class="section-title">Trip Information</div>
      <div class="route-info">${selectedTicket.routeName}</div>
      <div class="boarding-dropping">${selectedTicket.boardingPoint} → ${selectedTicket.droppingPoint}</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Bus</div>
          <div class="info-value">${selectedTicket.busName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Seat</div>
          <div class="info-value">${selectedTicket.seatNumber}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Date</div>
          <div class="info-value">${formatDate(selectedTicket.departureDate)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Time</div>
          <div class="info-value">${formatTime(selectedTicket.departureTime)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Passenger Information</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Name</div>
          <div class="info-value">${selectedTicket.passengerDetails.firstName} ${selectedTicket.passengerDetails.lastName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Phone</div>
          <div class="info-value">${selectedTicket.passengerDetails.phoneNumber}</div>
        </div>
        ${selectedTicket.passengerDetails.email ? `
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${selectedTicket.passengerDetails.email}</div>
        </div>
        ` : ''}
        ${selectedTicket.passengerDetails.idNumber ? `
        <div class="info-item">
          <div class="info-label">ID Number</div>
          <div class="info-value">${selectedTicket.passengerDetails.idNumber} (${selectedTicket.passengerDetails.idType})</div>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payment Information</div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Fare Amount</div>
          <div class="info-value fare-amount">${formatCurrency(selectedTicket.fareAmount, selectedTicket.currency)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Payment Method</div>
          <div class="info-value">${selectedTicket.paymentMethod}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Sold by</div>
          <div class="info-value">${selectedTicket.soldByName}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Write content and trigger print
    printWindow.document.write(ticketHtml);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        // Close window after printing (optional)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    };
  };

  const handleDownloadTicket = () => {
    if (!selectedTicket) return;
    
    // Create a simple text-based ticket for download
    const ticketText = `BUS TICKET
==========

Ticket Number: ${selectedTicket.ticketNumber}
Status: ${selectedTicket.status.toUpperCase()}

TRIP INFORMATION
================
Route: ${selectedTicket.routeName}
Boarding Point: ${selectedTicket.boardingPoint}
Dropping Point: ${selectedTicket.droppingPoint}
Bus: ${selectedTicket.busName}
Seat Number: ${selectedTicket.seatNumber}
Departure Date: ${formatDate(selectedTicket.departureDate)}
Departure Time: ${formatTime(selectedTicket.departureTime)}

PASSENGER INFORMATION
=====================
Name: ${selectedTicket.passengerDetails.firstName} ${selectedTicket.passengerDetails.lastName}
Phone: ${selectedTicket.passengerDetails.phoneNumber}
${selectedTicket.passengerDetails.email ? `Email: ${selectedTicket.passengerDetails.email}` : ''}
${selectedTicket.passengerDetails.idNumber ? `ID Number: ${selectedTicket.passengerDetails.idNumber} (${selectedTicket.passengerDetails.idType})` : ''}

PAYMENT INFORMATION
===================
Fare Amount: ${formatCurrency(selectedTicket.fareAmount, selectedTicket.currency)}
Payment Method: ${selectedTicket.paymentMethod}
Sold by: ${selectedTicket.soldByName}

Generated on: ${new Date().toLocaleString()}`;

    // Create and download as text file
    const blob = new Blob([ticketText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bus-ticket-${selectedTicket.ticketNumber}.txt`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bus Ticketing</h1>
          <p className="text-gray-600 mt-1">Sell walk-in bus tickets to customers</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Sell Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sell Bus Ticket</DialogTitle>
              <DialogDescription>
                Create a new ticket for a walk-in customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="routeSegment">Select Route Segment</Label>
                  <Select value={`${formData.boardingPoint}-${formData.droppingPoint}`} onValueChange={(value) => {
                    const segment = availableSegments.find(s => `${s.from}-${s.to}` === value);
                    if (segment) handleSegmentChange(segment);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select boarding and dropping points" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSegments.map((segment) => (
                        <SelectItem key={`${segment.from}-${segment.to}`} value={`${segment.from}-${segment.to}`}>
                          {segment.from} → {segment.to} - {formatCurrency(segment.fareAmount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="seatNumber">Seat Number</Label>
                  <Select value={formData.seatNumber} onValueChange={(value) => setFormData(prev => ({ ...prev, seatNumber: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seat number" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSeats.map((seat) => (
                        <SelectItem key={seat} value={seat}>
                          {seat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boardingPoint">Boarding Point</Label>
                  <Input
                    id="boardingPoint"
                    value={formData.boardingPoint}
                    readOnly
                    className="text-white"
                    style={{ backgroundColor: '#8B4513' }}
                  />
                </div>
                <div>
                  <Label htmlFor="droppingPoint">Dropping Point</Label>
                  <Input
                    id="droppingPoint"
                    value={formData.droppingPoint}
                    readOnly
                    className="text-white"
                    style={{ backgroundColor: '#8B4513' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departureDate">Departure Date</Label>
                  <Input
                    id="departureDate"
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="departureTime">Departure Time</Label>
                  <Input
                    id="departureTime"
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fareAmount">Fare Amount</Label>
                  <Input
                    id="fareAmount"
                    type="number"
                    value={formData.fareAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, fareAmount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Passenger Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.passengerDetails.firstName}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        passengerDetails: { ...prev.passengerDetails, firstName: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.passengerDetails.lastName}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        passengerDetails: { ...prev.passengerDetails, lastName: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.passengerDetails.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        passengerDetails: { ...prev.passengerDetails, phoneNumber: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.passengerDetails.email}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        passengerDetails: { ...prev.passengerDetails, email: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input
                      id="idNumber"
                      value={formData.passengerDetails.idNumber}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        passengerDetails: { ...prev.passengerDetails, idNumber: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="idType">ID Type</Label>
                    <Select value={formData.passengerDetails.idType} onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      passengerDetails: { ...prev.passengerDetails, idType: value }
                    }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="National ID">National ID</SelectItem>
                        <SelectItem value="Passport">Passport</SelectItem>
                        <SelectItem value="Drivers License">Drivers License</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTicket}>
                  Sell Ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="used">Used</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket._id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                    <div>
                      <h3 className="text-lg font-semibold">{ticket.ticketNumber}</h3>
                      <p className="text-sm text-gray-500">{ticket.busName} - {ticket.tripName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{ticket.passengerDetails.firstName} {ticket.passengerDetails.lastName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{ticket.passengerDetails.phoneNumber}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(ticket.departureDate)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(ticket.departureTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(ticket.status)}
                  <Badge variant="outline">
                    {formatCurrency(ticket.fareAmount, ticket.currency)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openViewDialog(ticket)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTicket(ticket._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Route:</span> {ticket.boardingPoint} → {ticket.droppingPoint}
                </div>
                <div>
                  <span className="font-medium">Seat:</span> {ticket.seatNumber}
                </div>
                <div>
                  <span className="font-medium">Payment:</span> {ticket.paymentMethod}
                </div>
                <div>
                  <span className="font-medium">Sold by:</span> {ticket.soldByName}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' || dateFilter
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by selling your first ticket'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && !dateFilter && (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Sell First Ticket
            </Button>
          )}
        </div>
      )}

      {/* View Ticket Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
            <DialogDescription>
              View ticket information
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-medium text-sm">Ticket Number</Label>
                  <p className="text-lg font-mono">{selectedTicket.ticketNumber}</p>
                </div>
                <div>
                  <Label className="font-medium text-sm">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-medium text-sm">Trip</Label>
                  <p className="text-sm">{selectedTicket.tripName}</p>
                </div>
                <div>
                  <Label className="font-medium text-sm">Route</Label>
                  <p className="text-sm">{selectedTicket.routeName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-medium text-sm">Boarding Point</Label>
                  <p className="text-sm">{selectedTicket.boardingPoint}</p>
                </div>
                <div>
                  <Label className="font-medium text-sm">Dropping Point</Label>
                  <p className="text-sm">{selectedTicket.droppingPoint}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-medium text-sm">Bus</Label>
                  <p className="text-sm">{selectedTicket.busName}</p>
                </div>
                <div>
                  <Label className="font-medium text-sm">Seat Number</Label>
                  <p className="text-sm">{selectedTicket.seatNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-medium text-sm">Departure Date</Label>
                  <p className="text-sm">{formatDate(selectedTicket.departureDate)}</p>
                </div>
                <div>
                  <Label className="font-medium text-sm">Departure Time</Label>
                  <p className="text-sm">{formatTime(selectedTicket.departureTime)}</p>
                </div>
              </div>

              <div className="border-t pt-3">
                <h3 className="font-medium mb-2 text-sm">Passenger Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-medium text-sm">Name</Label>
                    <p className="text-sm">{selectedTicket.passengerDetails.firstName} {selectedTicket.passengerDetails.lastName}</p>
                  </div>
                  <div>
                    <Label className="font-medium text-sm">Phone</Label>
                    <p className="text-sm">{selectedTicket.passengerDetails.phoneNumber}</p>
                  </div>
                </div>
                {selectedTicket.passengerDetails.email && (
                  <div className="mt-2">
                    <Label className="font-medium text-sm">Email</Label>
                    <p className="text-sm">{selectedTicket.passengerDetails.email}</p>
                  </div>
                )}
                {selectedTicket.passengerDetails.idNumber && (
                  <div className="mt-2">
                    <Label className="font-medium text-sm">ID Number</Label>
                    <p className="text-sm">{selectedTicket.passengerDetails.idNumber} ({selectedTicket.passengerDetails.idType})</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="font-medium text-sm">Fare Amount</Label>
                    <p className="text-lg font-semibold">{formatCurrency(selectedTicket.fareAmount, selectedTicket.currency)}</p>
                  </div>
                  <div>
                    <Label className="font-medium text-sm">Payment Method</Label>
                    <p className="text-sm">{selectedTicket.paymentMethod}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="font-medium text-sm">Sold by</Label>
                  <p className="text-sm">{selectedTicket.soldByName}</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintTicket}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownloadTicket}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
