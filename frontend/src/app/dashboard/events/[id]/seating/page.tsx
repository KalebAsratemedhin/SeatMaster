'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Users,
  Settings,
  Save,
  RotateCcw,
  Grid3X3,
  Table,
  Sofa,
  Eye,
  Edit,
  Trash2,
  Move,
  RotateCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { Sidebar } from '@/components/layout/sidebar';

import {
  useGetEventQuery,
  useGetVenuesQuery,
  useGetRoomsQuery,
  useGetSeatsQuery,
  useCreateVenueMutation,
  useCreateRoomMutation,
  useCreateSeatMutation,
  useUpdateSeatMutation,
  useDeleteSeatMutation,
  useAssignGuestToSeatMutation,
  useUnassignGuestFromSeatMutation,
} from '@/lib/api';
import type { Venue, Room, Seat, SeatCategory, SeatStatus } from '@/types';

export default function SeatingManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // State
  const [selectedVenue, setSelectedVenue] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isCreateVenueDialogOpen, setIsCreateVenueDialogOpen] = useState(false);
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [isCreateSeatDialogOpen, setIsCreateSeatDialogOpen] = useState(false);
  const [isEditSeatDialogOpen, setIsEditSeatDialogOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | null>(null);
  const [deletingSeatId, setDeletingSeatId] = useState<string | null>(null);
  const [venueFormData, setVenueFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    phone: '',
    website: '',
    is_public: false,
  });
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    description: '',
    capacity: 100,
    floor: 1,
    room_type: 'general' as const,
  });
  const [seatFormData, setSeatFormData] = useState({
    event_id: eventId,
    row: '',
    number: '',
    column: '',
    category: 'standard' as SeatCategory,
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    rotation: 0,
  });

  // API hooks
  const { data: event, isLoading: eventLoading } = useGetEventQuery(eventId);
  const { data: venues, isLoading: venuesLoading } = useGetVenuesQuery();
  const { data: rooms, isLoading: roomsLoading } = useGetRoomsQuery({ venueId: selectedVenue });
  const { data: seats, isLoading: seatsLoading } = useGetSeatsQuery({ 
    venueId: selectedVenue, 
    roomId: selectedRoom 
  });
  const [createVenue, { isLoading: isCreatingVenue }] = useCreateVenueMutation();
  const [createRoom, { isLoading: isCreatingRoom }] = useCreateRoomMutation();
  const [createSeat, { isLoading: isCreatingSeat }] = useCreateSeatMutation();
  const [updateSeat, { isLoading: isUpdatingSeat }] = useUpdateSeatMutation();
  const [deleteSeat, { isLoading: isDeletingSeat }] = useDeleteSeatMutation();
  const [assignGuestToSeat] = useAssignGuestToSeatMutation();
  const [unassignGuestFromSeat] = useUnassignGuestFromSeatMutation();

  // Filter seats by status
  const availableSeats = seats?.filter(seat => seat.status === 'available') || [];
  const occupiedSeats = seats?.filter(seat => seat.status === 'occupied') || [];
  const reservedSeats = seats?.filter(seat => seat.status === 'reserved') || [];

  // Helper functions
  const getSeatCategoryColor = (category: SeatCategory) => {
    switch (category) {
      case 'vip':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'accessible':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'economy':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'standing':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getSeatStatusColor = (status: SeatStatus) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'blocked':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeatStatusLabel = (status: SeatStatus) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'occupied':
        return 'Occupied';
      case 'reserved':
        return 'Reserved';
      case 'blocked':
        return 'Blocked';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  // Event handlers
  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVenue(venueFormData).unwrap();
      setIsCreateVenueDialogOpen(false);
      setVenueFormData({
        name: '',
        description: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
        phone: '',
        website: '',
        is_public: false,
      });
    } catch (error) {
      console.error('Failed to create venue:', error);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue) return;

    try {
      await createRoom({ venueId: selectedVenue, roomData: roomFormData }).unwrap();
      setIsCreateRoomDialogOpen(false);
      setRoomFormData({
        name: '',
        description: '',
        capacity: 100,
        floor: 1,
        room_type: 'general',
      });
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleCreateSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !selectedVenue) return;

    try {
      await createSeat({ venueId: selectedVenue, roomId: selectedRoom, seatData: seatFormData }).unwrap();
      setIsCreateSeatDialogOpen(false);
      setSeatFormData({
        event_id: eventId,
        row: '',
        number: '',
        column: '',
        category: 'standard',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        rotation: 0,
      });
    } catch (error) {
      console.error('Failed to create seat:', error);
    }
  };

  const handleUpdateSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeat || !selectedRoom || !selectedVenue) return;

    try {
      await updateSeat({ 
        venueId: selectedVenue,
        roomId: selectedRoom, 
        seatId: editingSeat.id, 
        updates: seatFormData 
      }).unwrap();
      setIsEditSeatDialogOpen(false);
      setEditingSeat(null);
    } catch (error) {
      console.error('Failed to update seat:', error);
    }
  };

  const handleDeleteSeat = async () => {
    if (!deletingSeatId || !selectedRoom || !selectedVenue) return;

    try {
      await deleteSeat({ venueId: selectedVenue, roomId: selectedRoom, seatId: deletingSeatId }).unwrap();
      setDeletingSeatId(null);
    } catch (error) {
      console.error('Failed to delete seat:', error);
    }
  };

  const openEditSeatDialog = (seat: Seat) => {
    setEditingSeat(seat);
    setSeatFormData({
      event_id: eventId,
      row: seat.row,
      number: seat.number,
      column: seat.column,
      category: seat.category,
      x: seat.x,
      y: seat.y,
      width: seat.width,
      height: seat.height,
      rotation: seat.rotation,
    });
    setIsEditSeatDialogOpen(true);
  };

  if (eventLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <p className="text-muted-foreground mb-4">The event you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/events')}>
              Back to Events
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{event.name} - Seating Management</h1>
              <p className="text-muted-foreground">
                Manage seating arrangements for your event
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/dashboard/events/${eventId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Button>
            </div>
          </div>

          {/* No Venues Message */}
          {venues?.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Venues Available</h3>
                <p className="text-muted-foreground mb-6">
                  You need to create a venue before you can set up seating arrangements.
                </p>
                <Button onClick={() => setIsCreateVenueDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Venue
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Create Venue Dialog - Always rendered */}
          <Dialog open={isCreateVenueDialogOpen} onOpenChange={setIsCreateVenueDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Venue</DialogTitle>
                <DialogDescription>
                  Add a new venue for your events.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateVenue} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue-name">Venue Name *</Label>
                    <Input
                      id="venue-name"
                      value={venueFormData.name}
                      onChange={(e) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                      placeholder="Grand Hotel Ballroom"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-city">City *</Label>
                    <Input
                      id="venue-city"
                      value={venueFormData.city}
                      onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })}
                      placeholder="New York"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue-description">Description</Label>
                  <Input
                    id="venue-description"
                    value={venueFormData.description}
                    onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })}
                    placeholder="Elegant ballroom with modern amenities"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue-address">Address *</Label>
                  <Input
                    id="venue-address"
                    value={venueFormData.address}
                    onChange={(e) => setVenueFormData({ ...venueFormData, address: e.target.value })}
                    placeholder="123 Main Street"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue-state">State *</Label>
                    <Input
                      id="venue-state"
                      value={venueFormData.state}
                      onChange={(e) => setVenueFormData({ ...venueFormData, state: e.target.value })}
                      placeholder="NY"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-country">Country *</Label>
                    <Input
                      id="venue-country"
                      value={venueFormData.country}
                      onChange={(e) => setVenueFormData({ ...venueFormData, country: e.target.value })}
                      placeholder="USA"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-postal">Postal Code *</Label>
                    <Input
                      id="venue-postal"
                      value={venueFormData.postal_code}
                      onChange={(e) => setVenueFormData({ ...venueFormData, postal_code: e.target.value })}
                      placeholder="10001"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue-phone">Phone</Label>
                    <Input
                      id="venue-phone"
                      value={venueFormData.phone}
                      onChange={(e) => setVenueFormData({ ...venueFormData, phone: e.target.value })}
                      placeholder="+1-555-123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="venue-website">Website</Label>
                    <Input
                      id="venue-website"
                      value={venueFormData.website}
                      onChange={(e) => setVenueFormData({ ...venueFormData, website: e.target.value })}
                      placeholder="https://grandhotel.com"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="venue-public"
                    checked={venueFormData.is_public}
                    onChange={(e) => setVenueFormData({ ...venueFormData, is_public: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="venue-public">Make this venue public</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateVenueDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingVenue}>
                    {isCreatingVenue ? 'Creating...' : 'Create Venue'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Venue and Room Selection */}
          {venues && venues.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Select Venue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a venue" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues?.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No venues found. Create one to get started.
                      </div>
                    ) : (
                      venues?.map((venue) => (
                        <SelectItem key={venue.id} value={venue.id}>
                          {venue.name} - {venue.city}, {venue.state}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <div className="mt-4">
                  <Button size="sm" onClick={() => setIsCreateVenueDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Venue
                  </Button>
                </div>
                {selectedVenue && (
                  <div className="mt-4">
                    <Dialog open={isCreateRoomDialogOpen} onOpenChange={setIsCreateRoomDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Room
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Room</DialogTitle>
                          <DialogDescription>
                            Add a new room to the selected venue.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateRoom} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="room-name">Room Name</Label>
                            <Input
                              id="room-name"
                              value={roomFormData.name}
                              onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                              placeholder="Main Ballroom"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="room-description">Description</Label>
                            <Input
                              id="room-description"
                              value={roomFormData.description}
                              onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                              placeholder="Spacious ballroom with high ceilings"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="room-capacity">Capacity</Label>
                              <Input
                                id="room-capacity"
                                type="number"
                                min="1"
                                value={roomFormData.capacity}
                                onChange={(e) => setRoomFormData({ ...roomFormData, capacity: parseInt(e.target.value) })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="room-floor">Floor</Label>
                              <Input
                                id="room-floor"
                                type="number"
                                min="0"
                                value={roomFormData.floor}
                                onChange={(e) => setRoomFormData({ ...roomFormData, floor: parseInt(e.target.value) })}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="room-type">Room Type</Label>
                            <Select value={roomFormData.room_type} onValueChange={(value: any) => setRoomFormData({ ...roomFormData, room_type: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General</SelectItem>
                                <SelectItem value="ballroom">Ballroom</SelectItem>
                                <SelectItem value="conference">Conference</SelectItem>
                                <SelectItem value="theater">Theater</SelectItem>
                                <SelectItem value="banquet">Banquet</SelectItem>
                                <SelectItem value="outdoor">Outdoor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateRoomDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isCreatingRoom}>
                              {isCreatingRoom ? 'Creating...' : 'Create Room'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Select Room
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedRoom} onValueChange={setSelectedRoom} disabled={!selectedVenue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms?.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No rooms found. Create one to get started.
                      </div>
                    ) : (
                      rooms?.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} (Capacity: {room.capacity})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedRoom && (
                  <div className="mt-4">
                    <Dialog open={isCreateSeatDialogOpen} onOpenChange={setIsCreateSeatDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Seat
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Seat</DialogTitle>
                          <DialogDescription>
                            Add a new seat to the selected room.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateSeat} className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="seat-row">Row</Label>
                              <Input
                                id="seat-row"
                                value={seatFormData.row}
                                onChange={(e) => setSeatFormData({ ...seatFormData, row: e.target.value })}
                                placeholder="A"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="seat-number">Number</Label>
                              <Input
                                id="seat-number"
                                value={seatFormData.number}
                                onChange={(e) => setSeatFormData({ ...seatFormData, number: e.target.value })}
                                placeholder="1"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="seat-column">Column</Label>
                              <Input
                                id="seat-column"
                                value={seatFormData.column}
                                onChange={(e) => setSeatFormData({ ...seatFormData, column: e.target.value })}
                                placeholder="1"
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="seat-category">Category</Label>
                            <Select value={seatFormData.category} onValueChange={(value: SeatCategory) => setSeatFormData({ ...seatFormData, category: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="vip">VIP</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="accessible">Accessible</SelectItem>
                                <SelectItem value="economy">Economy</SelectItem>
                                <SelectItem value="standing">Standing</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="seat-x">X Position</Label>
                              <Input
                                id="seat-x"
                                type="number"
                                step="0.1"
                                value={seatFormData.x}
                                onChange={(e) => setSeatFormData({ ...seatFormData, x: parseFloat(e.target.value) })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="seat-y">Y Position</Label>
                              <Input
                                id="seat-y"
                                type="number"
                                step="0.1"
                                value={seatFormData.y}
                                onChange={(e) => setSeatFormData({ ...seatFormData, y: parseFloat(e.target.value) })}
                                required
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="seat-width">Width</Label>
                              <Input
                                id="seat-width"
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={seatFormData.width}
                                onChange={(e) => setSeatFormData({ ...seatFormData, width: parseFloat(e.target.value) })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="seat-height">Height</Label>
                              <Input
                                id="seat-height"
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={seatFormData.height}
                                onChange={(e) => setSeatFormData({ ...seatFormData, height: parseFloat(e.target.value) })}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="seat-rotation">Rotation (degrees)</Label>
                            <Input
                              id="seat-rotation"
                              type="number"
                              step="1"
                              value={seatFormData.rotation}
                              onChange={(e) => setSeatFormData({ ...seatFormData, rotation: parseFloat(e.target.value) })}
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateSeatDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isCreatingSeat}>
                              {isCreatingSeat ? 'Creating...' : 'Create Seat'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          )}

          {/* Seating Statistics */}
          {venues && venues.length > 0 && selectedRoom && (
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{availableSeats.length}</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{occupiedSeats.length}</div>
                    <div className="text-sm text-muted-foreground">Occupied</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{reservedSeats.length}</div>
                    <div className="text-sm text-muted-foreground">Reserved</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{seats?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Seats</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Seats List */}
          {venues && venues.length > 0 && selectedRoom && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sofa className="h-5 w-5" />
                  Seats ({seats?.length || 0})
                </CardTitle>
                <CardDescription>
                  Manage individual seats in the selected room
                </CardDescription>
              </CardHeader>
              <CardContent>
                {seatsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading seats...</p>
                  </div>
                ) : seats?.length === 0 ? (
                  <div className="text-center py-8">
                    <Sofa className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No seats found</h3>
                    <p className="text-muted-foreground mb-6">
                      This room doesn't have any seats yet. Add some seats to get started.
                    </p>
                    <Button onClick={() => setIsCreateSeatDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Seat
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {seats?.map((seat) => (
                      <ScrollAnimation key={seat.id}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold">Seat {seat.row}{seat.number} (Col {seat.column})</h3>
                                  <Badge className={getSeatCategoryColor(seat.category)}>
                                    {seat.category.toUpperCase()}
                                  </Badge>
                                  <Badge className={getSeatStatusColor(seat.status)}>
                                    {getSeatStatusLabel(seat.status)}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Position: ({seat.x}, {seat.y}) | Size: {seat.width}×{seat.height}
                                  {seat.rotation !== 0 && ` | Rotation: ${seat.rotation}°`}
                                </div>
                                {seat.guest && (
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Assigned to: {seat.guest.name}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditSeatDialog(seat)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeletingSeatId(seat.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </ScrollAnimation>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit Seat Dialog */}
          <Dialog open={isEditSeatDialogOpen} onOpenChange={setIsEditSeatDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Seat</DialogTitle>
                <DialogDescription>
                  Update the seat details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateSeat} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-seat-row">Row</Label>
                    <Input
                      id="edit-seat-row"
                      value={seatFormData.row}
                      onChange={(e) => setSeatFormData({ ...seatFormData, row: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-seat-number">Number</Label>
                    <Input
                      id="edit-seat-number"
                      value={seatFormData.number}
                      onChange={(e) => setSeatFormData({ ...seatFormData, number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-seat-column">Column</Label>
                    <Input
                      id="edit-seat-column"
                      value={seatFormData.column}
                      onChange={(e) => setSeatFormData({ ...seatFormData, column: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-seat-category">Category</Label>
                  <Select value={seatFormData.category} onValueChange={(value: SeatCategory) => setSeatFormData({ ...seatFormData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="accessible">Accessible</SelectItem>
                      <SelectItem value="economy">Economy</SelectItem>
                      <SelectItem value="standing">Standing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-seat-x">X Position</Label>
                    <Input
                      id="edit-seat-x"
                      type="number"
                      step="0.1"
                      value={seatFormData.x}
                      onChange={(e) => setSeatFormData({ ...seatFormData, x: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-seat-y">Y Position</Label>
                    <Input
                      id="edit-seat-y"
                      type="number"
                      step="0.1"
                      value={seatFormData.y}
                      onChange={(e) => setSeatFormData({ ...seatFormData, y: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-seat-width">Width</Label>
                    <Input
                      id="edit-seat-width"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={seatFormData.width}
                      onChange={(e) => setSeatFormData({ ...seatFormData, width: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-seat-height">Height</Label>
                    <Input
                      id="edit-seat-height"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={seatFormData.height}
                      onChange={(e) => setSeatFormData({ ...seatFormData, height: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-seat-rotation">Rotation (degrees)</Label>
                  <Input
                    id="edit-seat-rotation"
                    type="number"
                    step="1"
                    value={seatFormData.rotation}
                    onChange={(e) => setSeatFormData({ ...seatFormData, rotation: parseFloat(e.target.value) })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditSeatDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdatingSeat}>
                    {isUpdatingSeat ? 'Updating...' : 'Update Seat'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Seat Confirmation Dialog */}
          <AlertDialog open={!!deletingSeatId} onOpenChange={() => setDeletingSeatId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Seat</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this seat? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSeat}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeletingSeat}
                >
                  {isDeletingSeat ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
