'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bed, Plus, Edit, Trash2, Search, Filter, Wifi, Tv, Coffee, Car, Dumbbell, Waves, Users, Calendar, CheckCircle, AlertCircle, Upload, Image, Camera } from 'lucide-react';

interface Room {
  _id: string;
  id?: string; // For backward compatibility
  number: string;
  type: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-order';
  amenities: string[];
  price: number;
  maxGuests: number;
  description: string;
  lastCleaned?: string;
  nextMaintenance?: string;
  images: string[];
  featuredImage?: string;
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

export default function RoomManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    number: '',
    type: '',
    floor: 1,
    price: 0,
    maxGuests: 1,
    status: 'available',
    description: ''
  });

  // Image upload handlers
  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(prev => [...prev, ...files]);
    
    // Upload files to server and get permanent URLs
    const uploadPromises = files.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const result = await response.json();
          return result.url; // Return the permanent URL
        } else {
          console.error('Failed to upload file:', file.name);
          return null;
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        return null;
      }
    });
    
    // Wait for all uploads to complete
    const uploadedUrls = await Promise.all(uploadPromises);
    const validUrls = uploadedUrls.filter(url => url !== null);
    
    console.log('Uploaded URLs:', uploadedUrls);
    console.log('Valid URLs:', validUrls);
    
    // Set the permanent URLs
    setImagePreviewUrls(prev => {
      const newUrls = [...prev, ...validUrls];
      console.log('Setting image preview URLs:', newUrls);
      return newUrls;
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      // For permanent URLs, we don't need to revoke them
      // Just remove from the state
      return prev.filter((_, i) => i !== index);
    });
  };

  // No cleanup needed for permanent URLs

  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities(prev => [...prev, amenityId]);
    } else {
      setSelectedAmenities(prev => prev.filter(id => id !== amenityId));
    }
  };

  const handleSaveRoom = async () => {
    try {
      const roomData = {
        number: formData.number,
        type: formData.type,
        floor: formData.floor,
        status: formData.status,
        amenities: selectedAmenities,
        price: formData.price,
        maxGuests: formData.maxGuests,
        description: formData.description,
        images: imagePreviewUrls,
        featuredImage: imagePreviewUrls[0] || undefined,
        lastCleaned: new Date().toISOString(),
      };

      console.log('Sending room data:', roomData);
      console.log('Image URLs:', imagePreviewUrls);

      let response;
      if (editingRoom) {
        // Update existing room
        response = await fetch(`/api/hotel/rooms/${editingRoom._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(roomData),
        });
      } else {
        // Create new room
        response = await fetch('/api/hotel/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(roomData),
        });
      }

      if (response.ok) {
        // Refresh rooms from database
        await fetchRooms();
        
        // Reset form and close dialog
        setFormData({
          number: '',
          type: '',
          floor: 1,
          price: 0,
          maxGuests: 1,
          status: 'available',
          description: ''
        });
        setSelectedImages([]);
        setImagePreviewUrls([]); // Reset image URLs
        setSelectedAmenities([]);
        setEditingRoom(null);
        setIsDialogOpen(false);
      } else {
        const error = await response.json();
        console.error('Failed to save room:', error.message);
        alert('Failed to save room: ' + error.message);
      }
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error saving room. Please try again.');
    }
  };

  const handleAddRoom = () => {
    setEditingRoom(null);
    setFormData({
      number: '',
      type: '',
      floor: 1,
      price: 0,
      maxGuests: 1,
      status: 'available',
      description: ''
    });
    setSelectedImages([]);
    setImagePreviewUrls([]); // Reset image URLs
    setSelectedAmenities([]);
    setIsDialogOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      number: room.number,
      type: room.type,
      floor: room.floor,
      price: room.price,
      maxGuests: room.maxGuests,
      status: room.status,
      description: room.description
    });
    setSelectedImages([]);
    setImagePreviewUrls(room.images || []); // Set existing room images
    setSelectedAmenities(room.amenities);
    setIsDialogOpen(true);
  };

  // Load rooms from database
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hotel/rooms');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched rooms data:', data);
        console.log('Rooms array:', data.rooms);
        setRooms(data.rooms);
        setFilteredRooms(data.rooms);
      } else {
        console.error('Failed to fetch rooms');
        setRooms([]);
        setFilteredRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
      setFilteredRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // No cleanup needed for permanent URLs

  useEffect(() => {
    let filtered = rooms;

    if (searchTerm) {
      filtered = filtered.filter(room =>
        room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(room => room.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(room => room.type === typeFilter);
    }

    setFilteredRooms(filtered);
  }, [searchTerm, statusFilter, typeFilter, rooms]);

  const getStatusBadge = (status: string) => {
    const variants = {
      available: 'default',
      occupied: 'secondary',
      maintenance: 'destructive',
      'out-of-order': 'outline'
    } as const;

    const colors = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      'out-of-order': 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.replace('-', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getAmenityIcon = (amenity: string) => {
    const icons = {
      wifi: <Wifi className="h-4 w-4" />,
      tv: <Tv className="h-4 w-4" />,
      coffee: <Coffee className="h-4 w-4" />,
      parking: <Car className="h-4 w-4" />,
      gym: <Dumbbell className="h-4 w-4" />,
      pool: <Waves className="h-4 w-4" />,
      balcony: <span className="text-xs">🏖️</span>,
      minibar: <span className="text-xs">🍷</span>,
      kitchenette: <span className="text-xs">🍳</span>
    };

    return icons[amenity as keyof typeof icons] || <span className="text-xs">✓</span>;
  };


  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this room?')) {
      return;
    }

    try {
      const response = await fetch(`/api/hotel/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh rooms from database
        await fetchRooms();
      } else {
        const error = await response.json();
        console.error('Failed to delete room:', error.message);
        alert('Failed to delete room: ' + error.message);
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Error deleting room. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold">Room Management</h1>
          <p className="text-muted-foreground">Manage hotel rooms, availability, and maintenance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={handleAddRoom}>
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </DialogTitle>
              <DialogDescription>
                {editingRoom ? 'Update room details' : 'Create a new room in your hotel'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number">Room Number</Label>
                <Input 
                  id="number" 
                  placeholder="101" 
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="type">Room Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Room</SelectItem>
                    <SelectItem value="deluxe">Deluxe Suite</SelectItem>
                    <SelectItem value="executive">Executive Suite</SelectItem>
                    <SelectItem value="family">Family Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="floor">Floor</Label>
                <Input 
                  id="floor" 
                  type="number" 
                  placeholder="1" 
                  value={formData.floor}
                  onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="price">Price per Night (ZMW)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="100" 
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="maxGuests">Max Guests</Label>
                <Input 
                  id="maxGuests" 
                  type="number" 
                  placeholder="2" 
                  value={formData.maxGuests}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="out-of-order">Out of Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Room description..." 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              </div>
              
              {/* Amenities Selection */}
              <div className="space-y-4">
              <div>
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {[
                    { id: 'wifi', label: 'WiFi', icon: <Wifi className="h-4 w-4" /> },
                    { id: 'tv', label: 'TV', icon: <Tv className="h-4 w-4" /> },
                    { id: 'coffee', label: 'Coffee Maker', icon: <Coffee className="h-4 w-4" /> },
                    { id: 'parking', label: 'Parking', icon: <Car className="h-4 w-4" /> },
                    { id: 'gym', label: 'Gym Access', icon: <Dumbbell className="h-4 w-4" /> },
                    { id: 'pool', label: 'Pool Access', icon: <Waves className="h-4 w-4" /> },
                    { id: 'balcony', label: 'Balcony', icon: <span className="text-xs">🏠</span> },
                    { id: 'minibar', label: 'Minibar', icon: <span className="text-xs">🍷</span> },
                    { id: 'kitchenette', label: 'Kitchenette', icon: <span className="text-xs">🍳</span> }
                  ].map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`amenity-${amenity.id}`}
                        className="rounded border-gray-300"
                        checked={selectedAmenities.includes(amenity.id)}
                        onChange={(e) => handleAmenityChange(amenity.id, e.target.checked)}
                      />
                      <label htmlFor={`amenity-${amenity.id}`} className="flex items-center space-x-2 cursor-pointer">
                        {amenity.icon}
                        <span className="text-sm">{amenity.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              </div>
              
              {/* Image Upload Section */}
              <div className="space-y-4">
              <div>
                <Label>Room Images</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
                  >
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Click to upload images</p>
                      <p className="text-xs text-gray-400">PNG, JPG up to 10MB each</p>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div>
                  <Label>Selected Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={`preview-${index}-${url}`} className="relative group">
                        {url ? (
                          <img
                            key={`img-${index}-${url}`}
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                            onError={(e) => {
                              // Hide broken images and remove from state
                              (e.target as HTMLImageElement).style.display = 'none';
                              // Remove the broken URL from state
                              setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
                              setSelectedImages(prev => prev.filter((_, i) => i !== index));
                            }}
                            onLoad={() => {
                              // URL is valid and loaded successfully
                            }}
                          />
                        ) : (
                          <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-xs">Uploading...</span>
                          </div>
                        )}
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Existing Images (for edit mode) */}
              {editingRoom && editingRoom.images.length > 0 && (
                <div>
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {editingRoom.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Room ${editingRoom.number} image ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                          onError={(e) => {
                            // Hide broken images
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          Current
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-4 border-t pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveRoom}>
                {editingRoom ? 'Update Room' : 'Add Room'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="out-of-order">Out of Order</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Standard Room">Standard Room</SelectItem>
                <SelectItem value="Deluxe Suite">Deluxe Suite</SelectItem>
                <SelectItem value="Executive Suite">Executive Suite</SelectItem>
                <SelectItem value="Family Room">Family Room</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Room Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Rooms</p>
                <p className="text-2xl font-bold">{rooms.length}</p>
              </div>
              <Bed className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-green-600">
                  {rooms.filter(r => r.status === 'available').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-2xl font-bold text-blue-600">
                  {rooms.filter(r => r.status === 'occupied').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {rooms.filter(r => r.status === 'maintenance').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room) => (
          <Card key={room._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Room {room.number}</CardTitle>
                  <CardDescription>{room.type}</CardDescription>
                </div>
                {getStatusBadge(room.status)}
              </div>
              
              {/* Room Image */}
              {room.featuredImage && (
                <div className="mt-3 relative">
                  <img 
                    src={room.featuredImage} 
                    alt={`Room ${room.number}`}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      // Hide broken images
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  {room.images.length > 1 && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      +{room.images.length - 1} more
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Floor:</span>
                  <span>{room.floor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Guests:</span>
                  <span>{room.maxGuests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-semibold">ZMW {room.price}/night</span>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.map((amenity) => (
                      <div key={amenity} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                        {getAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {room.lastCleaned && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Cleaned:</span>
                    <span>{room.lastCleaned}</span>
                  </div>
                )}

                {room.nextMaintenance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Next Maintenance:</span>
                    <span>{room.nextMaintenance}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditRoom(room)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteRoom(room._id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bed className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No rooms have been added yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
