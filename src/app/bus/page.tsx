'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  Calendar,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Wifi,
  Coffee,
  Car,
  Star,
  MessageCircle,
  Send
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface BusRoute {
  _id: string;
  routeName: string;
  departureCity: string;
  arrivalCity: string;
  distance: number;
  duration: string;
  stops: string[];
}

interface BusSchedule {
  _id: string;
  routeId: string;
  busId: string;
  busName: string;
  busNumber: string;
  busImage: string;
  departureTime: string;
  arrivalTime: string;
  date: string;
  totalSeats: number;
  availableSeats: number;
  totalFare: number; // Full route fare
  amenities: string[];
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  // Route details
  routeName: string;
  departureCity: string;
  arrivalCity: string;
  distance: number;
  duration: number;
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
}

interface BusBooking {
  scheduleId: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  seatNumber: string;
  boardingStop: string; // NEW: boarding stop name
  alightingStop: string; // NEW: alighting stop name
  fare: number; // Calculated based on selected segments
  paymentMethod: string;
}

interface BusVendor {
  _id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  rating: number;
  images: string[];
  buses: Array<{
    _id: string;
    busName: string;
    busNumber: string;
    busImage: string;
    capacity: number;
    amenities: string[];
    status: string;
  }>;
  scheduledTrips: Array<{
    _id: string;
    tripName: string;
    routeName: string;
    busName: string;
    departureTimes: {
      to: string;
      from: string;
    };
    daysOfWeek: string[];
    status: string;
  }>;
  routes: Array<{
    _id: string;
    routeName: string;
    routeNumber: string;
    origin: string;
    destination: string;
    stops: Array<{
      name: string;
      address: string;
      latitude: number;
      longitude: number;
    }>;
    fare: number;
    fareSegments: Array<{
      from: string;
      to: string;
      amount: number;
    }>;
  }>;
  stops: Array<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }>;
  totalRoutes: number;
  totalBuses: number;
  totalTrips: number;
  amenities: string[];
}

interface Message {
  _id: string;
  senderName: string;
  senderEmail: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export default function BusBrowsePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<BusVendor[]>([]);
  const [schedules, setSchedules] = useState<BusSchedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<BusSchedule[]>([]);
  const [routes, setRoutes] = useState<BusRoute[]>([]);
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<BusSchedule | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState<BusBooking>({
    scheduleId: '',
    passengerName: '',
    passengerEmail: '',
    passengerPhone: '',
    seatNumber: '',
    boardingStop: '',
    alightingStop: '',
    fare: 0,
    paymentMethod: 'card'
  });

  // Chat state
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Booking interface states
  const [showBookingInterface, setShowBookingInterface] = useState<{ [vendorId: string]: boolean }>({});
  const [selectedFromStop, setSelectedFromStop] = useState<{ [vendorId: string]: string }>({});
  const [selectedToStop, setSelectedToStop] = useState<{ [vendorId: string]: string }>({});
  const [selectedDate, setSelectedDate] = useState<{ [vendorId: string]: string }>({});
  const [selectedDay, setSelectedDay] = useState<{ [vendorId: string]: string }>({});
  const [queryResults, setQueryResults] = useState<{ [vendorId: string]: any[] }>({});
  const [isQuerying, setIsQuerying] = useState<{ [vendorId: string]: boolean }>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [bookingId, setBookingId] = useState('');

  const cities = [
    'Lusaka', 'Ndola', 'Kitwe', 'Livingstone', 'Chipata', 'Kabwe', 'Mazabuka', 'Solwezi', 'Kafue', 'Choma', 'Kapiri Mposhi', 'Chililabombwe', 'Petauke', 'Mumbwa'
  ];

  const amenities = [
    { id: 'wifi', label: 'Free WiFi', icon: Wifi },
    { id: 'refreshments', label: 'Refreshments', icon: Coffee },
    { id: 'parking', label: 'Parking', icon: Car }
  ];

  useEffect(() => {
    const fetchBusData = async () => {
      try {
        setLoading(true);
        
        // Fetch vendors and schedules in parallel
        const [vendorsResponse, schedulesResponse] = await Promise.all([
          fetch('/api/bus/vendors'),
          fetch(`/api/bus/schedules?${new URLSearchParams({
            ...(departureCity && { departure: departureCity }),
            ...(arrivalCity && { arrival: arrivalCity }),
            ...(travelDate && { date: travelDate })
          }).toString()}`)
        ]);
        
        // Handle vendors response
        if (vendorsResponse.ok) {
          const vendorsData = await vendorsResponse.json();
          if (vendorsData.success) {
            console.log('Received vendors data:', vendorsData.vendors);
            console.log('First vendor routes:', vendorsData.vendors[0]?.routes);
            console.log('First vendor fare segments:', vendorsData.vendors[0]?.routes[0]?.fareSegments);
            console.log('First vendor stops:', vendorsData.vendors[0]?.stops);
            setVendors(vendorsData.vendors || []);
          }
        }
        
        // Handle schedules response
        if (schedulesResponse.ok) {
          const contentType = schedulesResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await schedulesResponse.json();
            
            console.log('🔍 API Response:', data);
            console.log('📊 Schedules count:', data.schedules?.length || 0);
            console.log('🚌 Routes count:', data.routes?.length || 0);
            
            if (data.success) {
              console.log('✅ Setting real data from API');
              setSchedules(data.schedules || []);
              setFilteredSchedules(data.schedules || []);
              setRoutes(data.routes || []);
            } else {
              console.error('❌ API returned error:', data.error);
              setSchedules([]);
              setFilteredSchedules([]);
              setRoutes([]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching bus data:', error);
        setSchedules([]);
        setFilteredSchedules([]);
        setRoutes([]);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBusData();
  }, [departureCity, arrivalCity, travelDate]);

  useEffect(() => {
    let filtered = schedules;

    // Filter by departure city
    if (departureCity) {
      filtered = filtered.filter(schedule => 
        schedule.departureCity.toLowerCase().includes(departureCity.toLowerCase())
      );
    }

    // Filter by arrival city
    if (arrivalCity) {
      filtered = filtered.filter(schedule => 
        schedule.arrivalCity.toLowerCase().includes(arrivalCity.toLowerCase())
      );
    }

    // Filter by date
    if (travelDate) {
      filtered = filtered.filter(schedule => {
        const scheduleDate = new Date(schedule.date).toISOString().split('T')[0];
        return scheduleDate === travelDate;
      });
    }

    setFilteredSchedules(filtered);
  }, [schedules, departureCity, arrivalCity, travelDate]);

  const calculateSegmentFare = (
    boardingStop: string, 
    alightingStop: string, 
    stops: Array<{stopId: string; stopName: string; order: number}>,
    fareSegments: Array<{from: string, to: string, amount: number}>
  ): number => {
    // Find order indices
    const boardingIndex = stops.findIndex(s => s.stopName === boardingStop);
    const alightingIndex = stops.findIndex(s => s.stopName === alightingStop);
    
    if (boardingIndex === -1 || alightingIndex === -1 || boardingIndex >= alightingIndex) {
      return 0;
    }
    
    // Sum fares for all segments between boarding and alighting
    let totalFare = 0;
    for (let i = boardingIndex; i < alightingIndex; i++) {
      const fromStop = stops[i].stopName;
      const toStop = stops[i + 1].stopName;
      const segment = fareSegments.find(s => s.from === fromStop && s.to === toStop);
      if (segment) {
        totalFare += segment.amount;
      }
    }
    return totalFare;
  };

  const handleBookTicket = (schedule: BusSchedule) => {
    setSelectedSchedule(schedule);
    const firstStop = schedule.stops[0]?.stopName || '';
    const lastStop = schedule.stops[schedule.stops.length - 1]?.stopName || '';
    const segmentFare = calculateSegmentFare(firstStop, lastStop, schedule.stops, schedule.fareSegments);
    
    setBookingData({
      ...bookingData,
      scheduleId: schedule._id,
      boardingStop: firstStop,
      alightingStop: lastStop,
      fare: segmentFare
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async () => {
    try {
      const response = await fetch('/api/bus/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      
      if (data.success) {
        alert(`Ticket booked successfully! Booking ID: ${data.booking._id}`);
        setShowBookingModal(false);
        // Refresh the schedules to update available seats
        window.location.reload();
      } else {
        throw new Error(data.error || 'Failed to book ticket');
      }
    } catch (error) {
      console.error('Error booking ticket:', error);
      alert(`Error booking ticket: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  // Chat functions
  const handleOpenChat = (vendorId: string) => {
    if (!session?.user?.email) {
      alert('Please log in to start a chat');
      return;
    }
    
    setSelectedVendorId(vendorId);
    setShowChatModal(true);
    fetchMessages(vendorId);
  };

  const fetchMessages = async (vendorId: string) => {
    try {
      setChatLoading(true);
      const response = await fetch(`/api/messages?vendorId=${vendorId}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      } else {
        console.error('Error fetching messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedVendorId) return;
    
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          vendorId: selectedVendorId,
          serviceType: 'bus'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNewMessage('');
        setMessages(prev => [...prev, data.message]);
      } else {
        console.error('Send message error:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Booking interface functions
  const toggleBookingInterface = (vendorId: string) => {
    setShowBookingInterface(prev => ({
      ...prev,
      [vendorId]: !prev[vendorId]
    }));
  };

  const handleFromStopChange = (vendorId: string, stop: string) => {
    setSelectedFromStop(prev => ({
      ...prev,
      [vendorId]: stop
    }));
  };

  const handleToStopChange = (vendorId: string, stop: string) => {
    setSelectedToStop(prev => ({
      ...prev,
      [vendorId]: stop
    }));
  };

  const handleDateChange = (vendorId: string, date: string) => {
    setSelectedDate(prev => ({
      ...prev,
      [vendorId]: date
    }));
    
    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    setSelectedDay(prev => ({
      ...prev,
      [vendorId]: dayOfWeek
    }));
  };

  const querySchedules = async (vendorId: string) => {
    const vendor = vendors.find(v => v._id === vendorId);
    if (!vendor) return;

    setIsQuerying(prev => ({ ...prev, [vendorId]: true }));

    try {
      // Mock query - in real implementation, this would call an API
      const mockResults = vendor.scheduledTrips.filter(trip => {
        const fromStop = selectedFromStop[vendorId];
        const toStop = selectedToStop[vendorId];
        const day = selectedDay[vendorId];
        
        return trip.daysOfWeek.includes(day) && trip.status === 'active';
      });

      setQueryResults(prev => ({
        ...prev,
        [vendorId]: mockResults
      }));
    } catch (error) {
      console.error('Error querying schedules:', error);
    } finally {
      setIsQuerying(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  const handleBuyTicket = async (trip: any, vendorId: string) => {
    console.log('🚌 BUY TICKET CLICKED!', { trip, vendorId });
    
    // Check if user is authenticated
    if (!session?.user?.email) {
      setModalMessage('Please log in to purchase tickets. Only authenticated users can buy tickets online.');
      setShowErrorModal(true);
      return;
    }
    
    try {
      console.log('=== BUY TICKET DEBUG ===');
      console.log('Trip object:', trip);
      console.log('Vendor ID:', vendorId);
      
      const fromStop = selectedFromStop[vendorId];
      const toStop = selectedToStop[vendorId];
      
      console.log('Selected from stop:', fromStop);
      console.log('Selected to stop:', toStop);
      console.log('Selected stops state:', selectedFromStop);
      console.log('Selected stops state:', selectedToStop);
      
      const fare = calculateFare(vendorId, fromStop, toStop);
      
      // Validate required fields
      if (!fromStop || !toStop) {
        console.log('Validation failed - missing stops');
        setModalMessage('Please select both departure and arrival stops.');
        setShowErrorModal(true);
        return;
      }
      
      if (!fare || fare <= 0) {
        setModalMessage('Unable to calculate fare. Please check your route selection.');
        setShowErrorModal(true);
        return;
      }
      
      // Create schedule ID (tripId_date)
      const scheduleId = `${trip._id}_${selectedDate[vendorId] || new Date().toISOString().split('T')[0]}`;
      
      // Set booking data to match API expectations - use authenticated user data
      const apiBookingData = {
        scheduleId: scheduleId,
        passengerName: session.user.name || 'Customer',
        passengerEmail: session.user.email || 'customer@example.com',
        passengerPhone: bookingData.passengerPhone || '0971960353', // Keep phone from form as it might be different
        seatNumber: '', // System will assign
        boardingStop: fromStop,
        alightingStop: toStop,
        fare: fare,
        paymentMethod: 'card'
      };

      console.log('Booking data being sent:', apiBookingData);
      console.log('Session data:', session);

      // Create booking
      const response = await fetch('/api/bus/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiBookingData),
      });

      if (response.ok) {
        const result = await response.json();
        setBookingId(result.booking.bookingNumber);
        setModalMessage('Ticket purchased successfully!');
        setShowSuccessModal(true);
        // Refresh the page after a delay
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        const error = await response.json();
        setModalMessage(error.error || 'Unknown error');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      setModalMessage('Failed to purchase ticket. Please try again.');
      setShowErrorModal(true);
    }
  };

  const calculateFare = (vendorId: string, fromStop: string, toStop: string) => {
    console.log('=== CALCULATE FARE DEBUG ===');
    console.log('Vendor ID:', vendorId);
    console.log('From Stop:', fromStop);
    console.log('To Stop:', toStop);
    
    const vendor = vendors.find(v => v._id === vendorId);
    if (!vendor) {
      console.log('Vendor not found');
      return 0;
    }

    console.log('Vendor found:', vendor.name);
    console.log('Vendor routes:', vendor.routes.length);
    console.log('All vendor routes:', vendor.routes);
    console.log('First route stops:', vendor.routes[0]?.stops);

    // Find route that contains both stops
    const route = vendor.routes.find(r => {
      const hasFromStop = r.stops.some(s => 
        s.name === fromStop
      );
      const hasToStop = r.stops.some(s => 
        s.name === toStop
      );
      return hasFromStop && hasToStop;
    });

    if (route) {
      console.log('Route found:', route.routeName);
      console.log('Route stops:', route.stops.map(s => s.name));
      console.log('Fare segments count:', route.fareSegments?.length || 0);
      console.log('Fare segments:', route.fareSegments);
      
      // If route has fareSegments, calculate based on segments
      if (route.fareSegments && Array.isArray(route.fareSegments) && route.fareSegments.length > 0) {
        // Look for direct fare between the selected stops
        const directFare = route.fareSegments.find(segment => 
          segment.from === fromStop && segment.to === toStop
        );
        
        if (directFare) {
          console.log('Direct fare found:', directFare);
          return directFare.amount;
        }
        
        console.log('No direct fare found, checking route segments...');
        
        // Get stop order in the route
        const stops = route.stops || [];
        const fromIndex = stops.findIndex(s => s.name === fromStop);
        const toIndex = stops.findIndex(s => s.name === toStop);
        
        console.log('Stop indices:', { fromIndex, toIndex, fromStop, toStop });
        
        if (fromIndex === -1 || toIndex === -1) {
          console.log('Stop not found in route');
          return route.fare || 0;
        }
        
        // Determine direction (from lower index to higher index)
        const startIndex = Math.min(fromIndex, toIndex);
        const endIndex = Math.max(fromIndex, toIndex);
        
        console.log('Journey indices:', { startIndex, endIndex });
        
        // Find segments that are part of this journey
        const relevantSegments = route.fareSegments.filter(segment => {
          const segmentFromIndex = stops.findIndex(s => s.name === segment.from);        
          const segmentToIndex = stops.findIndex(s => s.name === segment.to);
          
          // Check if this segment is within our journey
          return segmentFromIndex >= startIndex && segmentToIndex <= endIndex;
        });
        
        console.log('Relevant segments:', relevantSegments);
        
        // Sum up the fare amounts
        const totalFare = relevantSegments.reduce((total, segment) => total + (segment.amount || 0), 0);
        console.log('Total fare:', totalFare);
        
        return totalFare;
      }
      
      // Fallback to route fare if no segments
      console.log('No fare segments, using route fare:', route.fare);
      return route.fare || 0;
    }

    console.log('No route found for stops:', { fromStop, toStop });
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading bus schedules...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Browse Buses</h1>
              <p className="text-primary-foreground/80">Find and book bus tickets for your journey</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="departure">From</Label>
              <Select value={departureCity} onValueChange={setDepartureCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select departure city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="arrival">To</Label>
              <Select value={arrivalCity} onValueChange={setArrivalCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select arrival city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Travel Date</Label>
              <Input
                id="date"
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setDepartureCity('');
                  setArrivalCity('');
                  setTravelDate('');
                }}
                variant="outline"
                className="w-full text-primary-foreground border-primary-foreground/20"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bus Vendors */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Bus Companies</h2>
          <p className="text-muted-foreground">Choose from our trusted bus service providers</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vendors.map((vendor, index) => (
            <Card key={vendor._id} className="overflow-hidden">
              <div className="relative h-48 bg-muted">
                <Image
                  src={vendor.images && vendor.images.length > 0 ? vendor.images[0] : "/placeholder-bus.jpg"}
                  alt={vendor.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index < 2}
                  loading={index < 2 ? "eager" : "lazy"}
                  className="object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/90 text-black">
                    <Star className="h-3 w-3 mr-1" />
                    {vendor.rating.toFixed(1)}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {vendor.name}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenChat(vendor._id)}
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </Button>
                    <Badge variant="outline">{vendor.totalTrips || 0} trips</Badge>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {typeof vendor.address === 'string' ? vendor.address : 'Zambia'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {typeof vendor.description === 'string' ? vendor.description : 'Professional bus transportation services'}
                </p>
                
                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(Array.isArray(vendor.amenities) ? vendor.amenities : []).map(amenity => (
                    <Badge key={amenity} variant="outline" className="text-xs">
                      {typeof amenity === 'string' ? amenity : String(amenity)}
                    </Badge>
                  ))}
                </div>

                {/* Interactive Booking Interface */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Are you traveling with us?</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBookingInterface(vendor._id)}
                    >
                      {showBookingInterface[vendor._id] ? 'Hide Booking' : 'Book Trip'}
                    </Button>
                  </div>

                  {showBookingInterface[vendor._id] && (
                    <div className="space-y-4 p-4 border rounded-lg" style={{ backgroundColor: '#2d5f3f' }}>
                      {/* Authentication Check */}
                      {!session?.user?.email ? (
                        <div className="text-center py-8">
                          <div className="bg-white/10 rounded-lg p-6">
                            <h3 className="text-white text-lg font-semibold mb-2">Authentication Required</h3>
                            <p className="text-white/80 mb-4">You need to be logged in to purchase bus tickets online.</p>
                            <div className="space-y-2">
                              <Link href="/auth/signin">
                                <Button className="w-full bg-white text-gray-900 hover:bg-gray-100">
                                  Login to Continue
                                </Button>
                              </Link>
                              <p className="text-white/60 text-sm">
                                Don't have an account? <Link href="/auth/signup" className="text-white underline">Sign up here</Link>
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* From Stop Selection */}
                      <div>
                        <Label htmlFor={`from-${vendor._id}`} className="text-white">From</Label>
                        <Select
                          value={selectedFromStop[vendor._id] || ''}
                          onValueChange={(value) => handleFromStopChange(vendor._id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select departure stop" />
                          </SelectTrigger>
                          <SelectContent>
                            {(vendor.stops || []).length === 0 ? (
                              <SelectItem value="no-stops" disabled>
                                No routes configured yet
                              </SelectItem>
                            ) : (
                              (vendor.stops || []).map(stop => (
                                <SelectItem key={stop.name} value={stop.name}>
                                  {stop.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* To Stop Selection */}
                      <div>
                        <Label htmlFor={`to-${vendor._id}`} className="text-white">To</Label>
                        <Select
                          value={selectedToStop[vendor._id] || ''}
                          onValueChange={(value) => handleToStopChange(vendor._id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select arrival stop" />
                          </SelectTrigger>
                          <SelectContent>
                            {(vendor.stops || []).length === 0 ? (
                              <SelectItem value="no-stops" disabled>
                                No routes configured yet
                              </SelectItem>
                            ) : (
                              (vendor.stops || []).map(stop => (
                                <SelectItem key={stop.name} value={stop.name}>
                                  {stop.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Date Selection */}
                      <div>
                        <Label htmlFor={`date-${vendor._id}`} className="text-white">Travel Date</Label>
                        <Input
                          type="date"
                          value={selectedDate[vendor._id] || ''}
                          onChange={(e) => handleDateChange(vendor._id, e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      {/* Query Button */}
                      <Button
                        onClick={() => querySchedules(vendor._id)}
                        disabled={!selectedFromStop[vendor._id] || !selectedToStop[vendor._id] || !selectedDate[vendor._id] || isQuerying[vendor._id]}
                        className="w-full"
                      >
                        {isQuerying[vendor._id] ? 'Querying...' : 'Query Schedules'}
                      </Button>

                      {/* Query Results */}
                      {queryResults[vendor._id] && queryResults[vendor._id].length > 0 && (
                        <div className="space-y-3">
                          <h5 className="font-medium text-white">Available Trips</h5>
                          {queryResults[vendor._id].map(trip => {
                            const fare = calculateFare(vendor._id, selectedFromStop[vendor._id], selectedToStop[vendor._id]);
                            console.log('Fare calculation:', {
                              vendorId: vendor._id,
                              fromStop: selectedFromStop[vendor._id],
                              toStop: selectedToStop[vendor._id],
                              fare,
                              route: vendor.routes.find(r => 
                                r.stops.some(s => s.name === selectedFromStop[vendor._id]) && 
                                r.stops.some(s => s.name === selectedToStop[vendor._id])
                              )
                            });
                            return (
                              <div key={trip._id} className="p-3 border rounded-lg" style={{ backgroundColor: '#2d5f3f' }}>
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-medium text-white">{trip.tripName}</p>
                                    <p className="text-sm text-white/80">{selectedFromStop[vendor._id]} → {selectedToStop[vendor._id]}</p>
                                    <p className="text-sm text-white/80">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      {trip.departureTimes?.to} - {trip.departureTimes?.from}
                                    </p>
                                    <p className="text-sm text-white/80">
                                      <Bus className="h-3 w-3 inline mr-1" />
                                      {trip.busName}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-lg text-white">K{fare}</p>
                                    <p className="text-sm text-white/80">Fare</p>
                                  </div>
                                </div>
                                
                                {/* Days of Week */}
                                {trip.daysOfWeek && trip.daysOfWeek.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {trip.daysOfWeek.map((day, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {day.substring(0, 3)}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Action Button */}
                                <div className="flex justify-center">
                                  <Button 
                                    size="sm" 
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleBuyTicket(trip, vendor._id)}
                                  >
                                    Buy Ticket
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {queryResults[vendor._id] && queryResults[vendor._id].length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No trips available for the selected criteria
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {vendors.length === 0 && (
          <div className="text-center py-12">
            <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bus companies found</h3>
            <p className="text-muted-foreground">Bus companies will appear here when available</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Book Bus Ticket</CardTitle>
              <CardDescription>
                {selectedSchedule.departureCity} → {selectedSchedule.arrivalCity}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={selectedSchedule.busImage || '/placeholder-bus.jpg'}
                    alt={selectedSchedule.busName}
                    className="w-12 h-12 rounded object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-bus.jpg';
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{selectedSchedule.busName}</p>
                    <p className="text-xs text-muted-foreground">{selectedSchedule.busNumber}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Departure: {selectedSchedule.departureTime}</p>
                <p className="text-sm text-muted-foreground">Date: {new Date(selectedSchedule.date).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground">Fare: ZMW {bookingData.fare || 'TBD'}</p>
              </div>
              
              <div>
                <Label htmlFor="passenger-name">Passenger Name</Label>
                <Input 
                  id="passenger-name" 
                  value={session?.user?.name || 'Not logged in'}
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground mt-1">Name from your account</p>
              </div>
              <div>
                <Label htmlFor="passenger-email">Email</Label>
                <Input 
                  id="passenger-email" 
                  type="email" 
                  value={session?.user?.email || 'Not logged in'}
                  readOnly
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground mt-1">Email from your account</p>
              </div>
              <div>
                <Label htmlFor="passenger-phone">Phone</Label>
                <Input 
                  id="passenger-phone" 
                  placeholder="Enter phone number"
                  value={bookingData.passengerPhone}
                  onChange={(e) => setBookingData({...bookingData, passengerPhone: e.target.value})}
                />
              </div>
              
              {/* Stop Selection */}
              <div>
                <Label htmlFor="boarding-stop">Boarding Stop</Label>
                <Select 
                  value={bookingData.boardingStop} 
                  onValueChange={(value) => {
                    const segmentFare = calculateSegmentFare(value, bookingData.alightingStop, selectedSchedule.stops, selectedSchedule.fareSegments);
                    setBookingData({...bookingData, boardingStop: value, fare: segmentFare});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select boarding stop" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSchedule.stops.map((stop, index) => (
                      <SelectItem 
                        key={stop.stopId} 
                        value={stop.stopName}
                        disabled={index >= selectedSchedule.stops.findIndex(s => s.stopName === bookingData.alightingStop)}
                      >
                        {stop.stopName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="alighting-stop">Alighting Stop</Label>
                <Select 
                  value={bookingData.alightingStop} 
                  onValueChange={(value) => {
                    const segmentFare = calculateSegmentFare(bookingData.boardingStop, value, selectedSchedule.stops, selectedSchedule.fareSegments);
                    setBookingData({...bookingData, alightingStop: value, fare: segmentFare});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select alighting stop" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedSchedule.stops.map((stop, index) => (
                      <SelectItem 
                        key={stop.stopId} 
                        value={stop.stopName}
                        disabled={index <= selectedSchedule.stops.findIndex(s => s.stopName === bookingData.boardingStop)}
                      >
                        {stop.stopName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Fare Display */}
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Selected Route:</span>
                  <span className="text-sm">{bookingData.boardingStop} → {bookingData.alightingStop}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm font-medium">Fare:</span>
                  <span className="text-lg font-bold text-primary">ZMW {bookingData.fare}</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="seat-number">Seat Number</Label>
                <Input 
                  id="seat-number" 
                  placeholder="Enter preferred seat number"
                  value={bookingData.seatNumber}
                  onChange={(e) => setBookingData({...bookingData, seatNumber: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="payment-method">Payment Method</Label>
                <Select 
                  value={bookingData.paymentMethod} 
                  onValueChange={(value) => setBookingData({...bookingData, paymentMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    <SelectItem value="cash">Cash on Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBookingSubmit}
                  className="flex-1"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ZMW {bookingData.fare}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedVendorId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md h-[500px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                Chat with Bus Company
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChatModal(false)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {chatLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading messages...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.senderEmail === session?.user?.email ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.senderEmail === session?.user?.email
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-gray-900 border'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp ? 
                              (() => {
                                try {
                                  const date = new Date(message.timestamp);
                                  return isNaN(date.getTime()) ? 'Just now' : date.toLocaleTimeString();
                                } catch (error) {
                                  return 'Just now';
                                }
                              })() 
                              : 'Just now'
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="flex-shrink-0 p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: '#2d5f3f' }}>
          <DialogHeader>
            <DialogTitle className="text-white">Success!</DialogTitle>
            <DialogDescription className="text-white/80">
              Your ticket has been purchased successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-white/20 mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-white">{modalMessage}</p>
              <p className="text-sm text-white/80 mt-2">
                Booking Number: <span className="font-mono font-bold">{bookingId}</span>
              </p>
              <p className="text-xs text-white/60 mt-2">This page will refresh automatically...</p>
            </div>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-white text-gray-900 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: '#2d5f3f' }}>
          <DialogHeader>
            <DialogTitle className="text-white">Error</DialogTitle>
            <DialogDescription className="text-white/80">
              There was an issue with your booking request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-white/20 mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-white">{modalMessage}</p>
              <p className="text-sm text-white/80 mt-2">
                Please check your selection and try again.
              </p>
            </div>
            <Button 
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-white text-gray-900 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
