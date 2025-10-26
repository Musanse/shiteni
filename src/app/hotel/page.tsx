'use client';

// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Building2, 
  Users, 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell, 
  Waves,
  Tv,
  Wind,
  Home,
  Lock,
  MapPin,
  Star,
  Search,
  ArrowLeft,
  MessageCircle,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface HotelRoom {
  _id: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  capacity: number;
  amenities: string[];
  pricePerNight: number;
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order';
  description: string;
  images: string[];
}

interface Hotel {
  _id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  amenities: string[];
  rating: number;
  images: string[];
  rooms: HotelRoom[];
}

interface Amenity {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface BookingData {
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  specialRequests?: string;
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

export default function HotelBrowsePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [checkInDate, setCheckInDate] = useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money' | 'check_in'>('check_in');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [userProfileLoading, setUserProfileLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Chat state
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);

  const allAmenities: Amenity[] = useMemo(() => [
    { id: 'wifi', label: 'Free WiFi', icon: Wifi },
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'restaurant', label: 'Restaurant', icon: Coffee },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'pool', label: 'Swimming Pool', icon: Waves },
    { id: 'tv', label: 'TV', icon: Tv },
    { id: 'ac', label: 'Air Conditioning', icon: Wind },
    { id: 'balcony', label: 'Balcony', icon: Home },
    { id: 'minibar', label: 'Minibar', icon: Coffee },
    { id: 'safe', label: 'Safe', icon: Lock }
  ], []);

  useEffect(() => {
    const fetchHotels = async (retryCount = 0) => {
      try {
        setLoading(true);
        console.log(`Fetching hotels from /api/hotels... (attempt ${retryCount + 1})`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch('/api/hotels', {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Hotels API response:', data);
        
        if (data.success) {
          console.log('API Response:', data);
          console.log('Hotels received:', data.hotels.length);
          console.log('Hotel details:', data.hotels.map((h: Hotel) => ({ name: h.name, rooms: h.rooms.length })));
          
          // Debug room amenities
          data.hotels.forEach((hotel: Hotel) => {
            hotel.rooms.forEach((room: HotelRoom) => {
              console.log(`Room ${room.roomNumber} amenities:`, room.amenities);
            });
          });
          
          setHotels(data.hotels);
          setFilteredHotels(data.hotels);
          
          // Extract unique amenities from all rooms
          const roomAmenities = new Set<string>();
          data.hotels.forEach((hotel: Hotel) => {
            hotel.rooms.forEach((room: HotelRoom) => {
              room.amenities.forEach((amenity: string) => {
                roomAmenities.add(amenity);
              });
            });
          });
          
          // Create available amenities list from room amenities
          const available = allAmenities.filter(amenity => 
            roomAmenities.has(amenity.id)
          );
          setAvailableAmenities(available);
          
          console.log('Available amenities:', available.map((a: Amenity) => a.label));
          
          if (data.message) {
            console.log(data.message); // Log if showing sample data
          }
        } else {
          console.error('Error fetching hotels:', data.error);
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          retryCount: retryCount
        });
        
        // Retry logic for network errors - reduce retries from 2 to 0
        if (retryCount < 1 && (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch')))) {
          console.log(`Retrying hotels fetch in 1 second... (attempt ${retryCount + 2})`);
          setTimeout(() => fetchHotels(retryCount + 1), 1000);
          return;
        }
        
        // If all retries failed, show sample data
        console.log('All retries failed, showing sample hotels');
        setHotels([]);
        setFilteredHotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [allAmenities]);

  // Separate useEffect for user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user?.email) {
        try {
          setUserProfileLoading(true);
          console.log('Fetching user profile for:', session.user.email);
          const response = await fetch('/api/user/profile');
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('User profile API response:', data);
          if (data.success) {
            // Generate a fallback name from email if no name is provided
            const fallbackName = data.user.name || 
              (data.user.email ? data.user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '');
            
            setGuestName(fallbackName);
            setGuestEmail(data.user.email || '');
            setGuestPhone(data.user.phone || '');
            console.log('Set guest data:', { name: fallbackName, email: data.user.email, phone: data.user.phone });
          } else {
            console.error('User profile API error:', data.error);
            // Fallback to session data with name generation
            const fallbackName = session.user.name || 
              (session.user.email ? session.user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '');
            setGuestName(fallbackName);
            setGuestEmail(session.user.email || '');
            setGuestPhone('');
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          console.error('User profile error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
          // Fallback to session data with name generation
          const fallbackName = session.user.name || 
            (session.user.email ? session.user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '');
          setGuestName(fallbackName);
          setGuestEmail(session.user.email || '');
          setGuestPhone('');
        } finally {
          setUserProfileLoading(false);
        }
      } else {
        // No session, clear the fields
        console.log('No session email, clearing guest data');
        setGuestName('');
        setGuestEmail('');
        setGuestPhone('');
      }
    };

    fetchUserProfile();
  }, [session]);

  useEffect(() => {
    console.log('Filtering hotels:', {
      totalHotels: hotels.length,
      searchTerm,
      selectedAmenities,
      priceRange
    });

    let filtered = hotels;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(hotel =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('After search filter:', filtered.length);
    }

    // Filter by amenities (check room amenities)
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(hotel =>
        hotel.rooms.some(room =>
          selectedAmenities.every(amenity => room.amenities.includes(amenity))
        )
      );
      console.log('After amenities filter:', filtered.length);
    }

    // Filter by price range
    filtered = filtered.map(hotel => ({
      ...hotel,
      rooms: hotel.rooms.filter(room =>
        room.pricePerNight >= priceRange[0] && room.pricePerNight <= priceRange[1]
      )
    }));
    // Don't filter out hotels completely - show them even if no rooms match price range
    // .filter(hotel => hotel.rooms.length > 0); // Removed this line

    console.log('Final filtered hotels:', filtered.length);
    console.log('Filtered hotels:', filtered.map(h => ({ name: h.name, rooms: h.rooms.length })));

    setFilteredHotels(filtered);
  }, [hotels, searchTerm, selectedAmenities, priceRange]);

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenityId)
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleBookRoom = (room: HotelRoom) => {
    setSelectedRoom(room);
    
    // Pre-fill today's date
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setCheckInDate(today);
    setCheckOutDate(tomorrow);
    
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (bookingData: BookingData) => {
    // Store booking data and show payment modal
    setBookingData(bookingData);
    setShowBookingModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!bookingData) return;
    
    try {
      const response = await fetch('/api/hotels/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: selectedRoom?._id,
          guestName: bookingData.guestName,
          guestEmail: bookingData.guestEmail,
          guestPhone: bookingData.guestPhone,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          numberOfGuests: guests,
          specialRequests: bookingData.specialRequests || '',
          paymentMethod
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setNotification({
          type: 'success',
          message: `Booking confirmed! Booking ID: ${data.booking._id}`
        });
        setShowPaymentModal(false);
        setBookingData(null);
        setSelectedRoom(null);
        // Auto-hide notification after 5 seconds
        setTimeout(() => setNotification(null), 5000);
        // Refresh hotels to update availability
        window.location.reload();
      } else {
        setNotification({
          type: 'error',
          message: `Booking failed: ${data.error}`
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setNotification({
        type: 'error',
        message: 'Error submitting booking. Please try again.'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Chat functions
  const handleOpenChat = (hotelId: string) => {
    if (!session?.user?.email) {
      setNotification({
        type: 'error',
        message: 'Please log in to start a chat'
      });
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    
    setSelectedHotelId(hotelId);
    setShowChatModal(true);
    fetchMessages(hotelId);
  };

  const fetchMessages = async (hotelId: string) => {
    try {
      setChatLoading(true);
      const response = await fetch(`/api/messages?hotelId=${hotelId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('Messages received:', data.messages.map((msg: Message) => ({
          id: msg._id,
          content: msg.content,
          timestamp: msg.timestamp,
          timestampType: typeof msg.timestamp
        })));
        setMessages(data.messages);
      } else {
        console.error('Error fetching messages:', data.error);
        setNotification({
          type: 'error',
          message: 'Failed to load messages'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setNotification({
        type: 'error',
        message: 'Error loading messages. Please try again.'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setChatLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedHotelId) return;
    
    try {
      console.log('Sending message:', { message: newMessage, hotelId: selectedHotelId, session: session?.user?.email });
      
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          hotelId: selectedHotelId
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('Message sent successfully:', {
          id: data.message._id,
          content: data.message.content,
          timestamp: data.message.timestamp,
          timestampType: typeof data.message.timestamp
        });
        setNewMessage('');
        // Add the new message to the messages array
        setMessages(prev => [...prev, data.message]);
      } else {
        console.error('Send message error:', data.error);
        setNotification({
          type: 'error',
          message: `Failed to send message: ${data.details || data.error}`
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setNotification({
        type: 'error',
        message: 'Error sending message. Please try again.'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  if (loading && hotels.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading hotels...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
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
              <h1 className="text-3xl font-bold">Browse Hotels</h1>
              <p className="text-primary-foreground/80">Find and book the perfect hotel for your stay</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search hotels or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="guests">Guests</Label>
              <Select value={guests.toString()} onValueChange={(value) => setGuests(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'Guest' : 'Guests'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price-range">Price Range (ZMW)</Label>
              <Select value={`${priceRange[0]}-${priceRange[1]}`} onValueChange={(value) => {
                const [min, max] = value.split('-').map(Number);
                setPriceRange([min, max]);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-1000">Under ZMW 1,000</SelectItem>
                  <SelectItem value="1000-2000">ZMW 1,000 - 2,000</SelectItem>
                  <SelectItem value="2000-3000">ZMW 2,000 - 3,000</SelectItem>
                  <SelectItem value="3000-5000">ZMW 3,000 - 5,000</SelectItem>
                  <SelectItem value="5000-10000">ZMW 5,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amenities Filter */}
          <div className="mt-4">
            <Label className="text-sm font-medium">Amenities</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableAmenities.map(amenity => {
                const Icon = amenity.icon;
                return (
                  <Button
                    key={amenity.id}
                    variant={selectedAmenities.includes(amenity.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAmenityToggle(amenity.id)}
                    className="text-primary-foreground border-primary-foreground/20"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {amenity.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      {/* Hotels List */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHotels.map((hotel, index) => (
            <Card key={hotel._id} className="overflow-hidden">
              <div className="relative h-48 bg-muted">
                <Image
                  src={hotel.images && hotel.images.length > 0 ? hotel.images[0] : "/hotel-placeholder.jpg"}
                  alt={hotel.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={index < 2}
                  loading={index < 2 ? "eager" : "lazy"}
                  className="object-cover"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-white/90 text-black">
                    <Star className="h-3 w-3 mr-1" />
                    {hotel.rating}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {hotel.name}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenChat(hotel._id)}
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Chat
                    </Button>
                    <Badge variant="outline">{hotel.rooms.length} rooms</Badge>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {hotel.address}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{hotel.description}</p>
                
                {/* Amenities */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {hotel.amenities.map(amenityId => {
                    const amenity = allAmenities.find((a: Amenity) => a.id === amenityId);
                    if (!amenity) return null;
                    const Icon = amenity.icon;
                    return (
                      <Badge key={amenityId} variant="outline" className="text-xs">
                        <Icon className="h-3 w-3 mr-1" />
                        {amenity.label}
                      </Badge>
                    );
                  })}
                </div>

                {/* Hotel Gallery */}
                {hotel.images && hotel.images.length > 1 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Hotel Gallery</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {hotel.images.slice(1, 7).map((image, index) => (
                        <div key={index} className="relative aspect-square overflow-hidden rounded-lg border">
                          <Image
                            src={image}
                            alt={`${hotel.name} gallery ${index + 2}`}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                            className="object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                    {hotel.images.length > 7 && (
                      <p className="text-sm text-muted-foreground">
                        +{hotel.images.length - 7} more images
                      </p>
                    )}
                  </div>
                )}

                {/* Rooms */}
                <div className="space-y-3">
                  <h4 className="font-medium">Rooms</h4>
                  {hotel.rooms.map(room => (
                    <div key={room._id} className="flex gap-4 p-3 border rounded-lg">
                      {/* Room Image */}
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={room.images[0] || '/room-placeholder.jpg'}
                          alt={`${room.roomType} - Room ${room.roomNumber}`}
                          fill
                          sizes="96px"
                          className="object-cover rounded-md"
                        />
                      </div>
                      
                      {/* Room Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{room.roomType} - Room {room.roomNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              <Users className="h-3 w-3 inline mr-1" />
                              {room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}
                            </p>
                            <p className="text-sm text-muted-foreground">{room.description}</p>
                            
                            {/* Room Amenities */}
                            {room.amenities && room.amenities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {room.amenities.map((amenity, index) => {
                                  // Try to find matching amenity from predefined list
                                  const predefinedAmenity = allAmenities.find((a: Amenity) => a.id === amenity);
                                  if (predefinedAmenity) {
                                    const Icon = predefinedAmenity.icon;
                                    return (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        <Icon className="h-3 w-3 mr-1" />
                                        {predefinedAmenity.label}
                                      </Badge>
                                    );
                                  } else {
                                    // If no predefined match, display the amenity as text
                                    return (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {amenity}
                                      </Badge>
                                    );
                                  }
                                })}
                              </div>
                            )}
                            
                            {/* Room Status Badge */}
                            <div className="mt-2">
                              <Badge 
                                variant={room.status === 'available' ? 'default' : 
                                        room.status === 'occupied' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {room.status === 'available' ? 'Available' :
                                 room.status === 'occupied' ? 'Occupied' :
                                 room.status === 'maintenance' ? 'Maintenance' : 'Out of Order'}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-lg">ZMW {room.pricePerNight.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">per night</p>
                            <Button 
                              size="sm" 
                              onClick={() => handleBookRoom(room)}
                              className="mt-2"
                              disabled={room.status === 'out_of_order'}
                              variant={room.status === 'occupied' ? 'outline' : 'default'}
                            >
                              {room.status === 'out_of_order' ? 'Not Available' : 
                               room.status === 'occupied' ? 'Available for Reservation' : 'Book Now'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredHotels.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hotels found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {selectedRoom.status === 'occupied' ? 'Reserve Room' : 'Book Room'}
              </CardTitle>
              <CardDescription>
                {selectedRoom.roomType} - Room {selectedRoom.roomNumber}
                {selectedRoom.status === 'occupied' && (
                  <span className="block text-yellow-600 text-sm mt-1">
                    This room is currently occupied. Please select future dates for your reservation.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="checkin">Check-in Date</Label>
                <Input
                  id="checkin"
                  type="date"
                  value={checkInDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setCheckInDate(new Date(e.target.value))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="checkout">Check-out Date</Label>
                <Input
                  id="checkout"
                  type="date"
                  value={checkOutDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) => setCheckOutDate(new Date(e.target.value))}
                  min={checkInDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="guest-name">Guest Name {userProfileLoading && <span className="text-xs text-muted-foreground">(Loading...)</span>}</Label>
                <Input 
                  id="guest-name" 
                  placeholder="Enter your full name" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guest-email">Email</Label>
                <Input 
                  id="guest-email" 
                  type="email" 
                  placeholder="Enter your email" 
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guest-phone">Phone</Label>
                <Input 
                  id="guest-phone" 
                  placeholder="Enter your phone number" 
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="special-requests">Special Requests (Optional)</Label>
                <Input id="special-requests" placeholder="Any special requests?" />
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
                  onClick={() => {
                    const specialRequests = (document.getElementById('special-requests') as HTMLInputElement)?.value;
                    
                    if (!guestName || !guestEmail || !guestPhone || !checkInDate || !checkOutDate) {
                      alert('Please fill in all required fields');
                      return;
                    }
                    
                    handleBookingSubmit({
                      roomId: selectedRoom._id,
                      guestName,
                      guestEmail,
                      guestPhone,
                      checkInDate: checkInDate?.toISOString(),
                      checkOutDate: checkOutDate?.toISOString(),
                      numberOfGuests: guests,
                      specialRequests
                    });
                  }}
                  className="flex-1"
                >
                  {selectedRoom.status === 'occupied' ? 'Confirm Reservation' : 'Confirm Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && bookingData && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Choose Payment Method</CardTitle>
              <CardDescription>
                {selectedRoom.roomType} - Room {selectedRoom.roomNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Payment Method</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="check-in"
                      name="payment"
                      value="check_in"
                      checked={paymentMethod === 'check_in'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'check_in')}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="check-in" className="text-sm">
                      Pay on Check-in
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="card"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'card')}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="card" className="text-sm">
                      Card Payment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="mobile-money"
                      name="payment"
                      value="mobile_money"
                      checked={paymentMethod === 'mobile_money'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'mobile_money')}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="mobile-money" className="text-sm">
                      Mobile Money
                    </Label>
                  </div>
                </div>
              </div>

              <div className="bg-green-800 p-3 rounded-lg">
                <div className="text-sm text-green-200">Booking Summary</div>
                <div className="text-sm text-white">
                  <div>Guest: {bookingData.guestName}</div>
                  <div>Check-in: {new Date(bookingData.checkInDate).toLocaleDateString()}</div>
                  <div>Check-out: {new Date(bookingData.checkOutDate).toLocaleDateString()}</div>
                  <div className="font-medium mt-1">
                    Total: ZMW {(() => {
                      const checkIn = new Date(bookingData.checkInDate);
                      const checkOut = new Date(bookingData.checkOutDate);
                      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                      return (nights * selectedRoom.pricePerNight).toLocaleString();
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowBookingModal(true);
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handlePaymentSubmit}
                  className="flex-1"
                >
                  {paymentMethod === 'check_in' ? 'Reserve Room' : 'Pay Now'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedHotelId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md h-[500px] flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center justify-between">
                Chat with Hotel
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
                                } catch {
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
    </div>
  );
}
