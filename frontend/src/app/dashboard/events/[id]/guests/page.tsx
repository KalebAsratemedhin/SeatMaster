"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetGuestsQuery, useGetGuestSummaryQuery, useCreateGuestMutation, useUpdateGuestMutation, useDeleteGuestMutation, useUpdateGuestRSVPMutation, useApproveGuestMutation } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { AnimatedCursor } from '@/components/ui/animated-cursor';
import { ParticleBackground } from '@/components/ui/particle-background';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
  MoreVertical,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { CreateGuestRequest, UpdateGuestRequest, UpdateGuestRSVPRequest, RSVPStatus, Guest } from '@/types';

export default function GuestManagementPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRSVPStatus, setSelectedRSVPStatus] = useState<RSVPStatus | 'all'>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuestId, setDeletingGuestId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateGuestRequest>({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // API hooks
  const { data: guests, isLoading: guestsLoading, error: guestsError, refetch } = useGetGuestsQuery({ eventId });
  const { data: guestSummary, isLoading: summaryLoading } = useGetGuestSummaryQuery({ eventId });

  // Debug logging
  useEffect(() => {
    console.log('Guests data:', guests);
    console.log('Guests loading:', guestsLoading);
    console.log('Guests error:', guestsError);
  }, [guests, guestsLoading, guestsError]);
  const [createGuest, { isLoading: isCreating }] = useCreateGuestMutation();
  const [updateGuest, { isLoading: isUpdating }] = useUpdateGuestMutation();
  const [deleteGuest, { isLoading: isDeleting }] = useDeleteGuestMutation();
  const [updateGuestRSVP, { isLoading: isUpdatingRSVP }] = useUpdateGuestRSVPMutation();
  const [approveGuest, { isLoading: isApproving }] = useApproveGuestMutation();

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  // Filter guests based on selected filters
  const filteredGuests = Array.isArray(guests) ? guests.filter(guest => {
    if (searchTerm && !guest.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !guest.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (selectedRSVPStatus !== 'all' && guest.rsvp_status !== selectedRSVPStatus) return false;
    if (selectedSource !== 'all' && guest.source !== selectedSource) return false;
    return true;
  }) : [];

  // Handle form submission
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating guest with data:', formData);
      const result = await createGuest({ eventId, guest: formData }).unwrap();
      console.log('Guest created successfully:', result);
      setIsCreateDialogOpen(false);
      setFormData({ name: '', email: '', phone: '', notes: '' });
    } catch (error) {
      console.error('Failed to create guest:', error);
    }
  };

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;
    
    try {
      await updateGuest({ eventId, guestId: editingGuest.id, updates: formData }).unwrap();
      setIsEditDialogOpen(false);
      setEditingGuest(null);
    } catch (error) {
      console.error('Failed to update guest:', error);
    }
  };

  const handleDeleteGuest = async () => {
    if (!deletingGuestId) return;
    
    try {
      await deleteGuest({ eventId, guestId: deletingGuestId }).unwrap();
      setDeletingGuestId(null);
    } catch (error) {
      console.error('Failed to delete guest:', error);
    }
  };

  const handleUpdateRSVP = async (guestId: string, rsvpStatus: RSVPStatus) => {
    try {
      await updateGuestRSVP({ 
        eventId, 
        guestId, 
        rsvpData: { rsvp_status: rsvpStatus } 
      }).unwrap();
    } catch (error) {
      console.error('Failed to update RSVP:', error);
    }
  };

  const handleApproveGuest = async (guestId: string) => {
    try {
      await approveGuest({ eventId, guestId }).unwrap();
    } catch (error) {
      console.error('Failed to approve guest:', error);
    }
  };

  const openEditDialog = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      name: guest.name,
      email: guest.email,
      phone: guest.phone || '',
      notes: guest.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  const getRSVPStatusIcon = (status: RSVPStatus) => {
    switch (status) {
      case 'accept': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'decline': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'maybe': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRSVPStatusLabel = (status: RSVPStatus) => {
    switch (status) {
      case 'accept': return 'Confirmed';
      case 'decline': return 'Declined';
      case 'maybe': return 'Maybe';
      default: return 'Pending';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'owner_added': return 'Manual';
      case 'invitation': return 'Invitation';
      case 'user_registration': return 'Self-Registered';
      default: return source;
    }
  };

  if (guestsLoading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading guests...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (guestsError) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Error Loading Guests</h2>
            <p className="text-muted-foreground mb-6">There was an error loading the guest list.</p>
            <Button onClick={() => router.push('/dashboard/events')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <AnimatedCursor />
        <ParticleBackground />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <Button variant="outline" onClick={() => router.push(`/dashboard/events/${eventId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Guest Management</h1>
                <p className="text-xl text-muted-foreground">
                  Manage your event guests and RSVPs
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Guest
              </Button>
            </div>
          </div>

          {/* Guest Summary Stats */}
          {guestSummary && (
            <ScrollAnimation>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Guests</p>
                        <p className="text-2xl font-bold">{guestSummary.total_guests}</p>
                      </div>
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                        <p className="text-2xl font-bold text-green-600">{guestSummary.confirmed}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                        <p className="text-2xl font-bold text-yellow-600">{guestSummary.pending}</p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Confirmation Rate</p>
                        <p className="text-2xl font-bold text-blue-600">{Math.round(guestSummary.confirmation_rate)}%</p>
                      </div>
                      <UserCheck className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollAnimation>
          )}

          {/* Filters */}
          <ScrollAnimation>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search">Search Guests</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rsvp-status">RSVP Status</Label>
                    <Select value={selectedRSVPStatus} onValueChange={(value: RSVPStatus | 'all') => setSelectedRSVPStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accept">Confirmed</SelectItem>
                        <SelectItem value="decline">Declined</SelectItem>
                        <SelectItem value="maybe">Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sources</SelectItem>
                        <SelectItem value="owner_added">Manual</SelectItem>
                        <SelectItem value="invitation">Invitation</SelectItem>
                        <SelectItem value="user_registration">Self-Registered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedRSVPStatus('all');
                        setSelectedSource('all');
                      }}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollAnimation>

          {/* Guest List */}
          <ScrollAnimation>
            <div className="grid gap-4">
              {!Array.isArray(guests) || guests.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No guests found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || selectedRSVPStatus !== 'all' || selectedSource !== 'all'
                        ? 'No guests match your current filters'
                        : 'Add your first guest to get started'
                      }
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Guest
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredGuests.map((guest) => (
                  <Card key={guest.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{guest.name}</h3>
                            <Badge variant="outline">{getSourceLabel(guest.source)}</Badge>
                            {!guest.approved && (
                              <Badge variant="destructive">Pending Approval</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {guest.email}
                            </div>
                            {guest.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {guest.phone}
                              </div>
                            )}
                            {guest.rsvp_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(guest.rsvp_date), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                          {guest.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{guest.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            {getRSVPStatusIcon(guest.rsvp_status)}
                            <span className="text-sm font-medium">
                              {getRSVPStatusLabel(guest.rsvp_status)}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Select 
                              value={guest.rsvp_status} 
                              onValueChange={(value: RSVPStatus) => handleUpdateRSVP(guest.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="accept">Confirm</SelectItem>
                                <SelectItem value="decline">Decline</SelectItem>
                                <SelectItem value="maybe">Maybe</SelectItem>
                              </SelectContent>
                            </Select>
                            {!guest.approved && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveGuest(guest.id)}
                                disabled={isApproving}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(guest)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Guest</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{guest.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => setDeletingGuestId(guest.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollAnimation>
        </div>

        {/* Create Guest Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Guest</DialogTitle>
              <DialogDescription>
                Add a new guest to your event
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGuest}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter guest name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special notes about this guest"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Adding...' : 'Add Guest'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Guest Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Guest</DialogTitle>
              <DialogDescription>
                Update guest information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateGuest}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Full Name *</Label>
                    <Input
                      id="edit-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter guest name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special notes about this guest"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Guest'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingGuestId} onOpenChange={() => setDeletingGuestId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Guest</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this guest? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteGuest}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Sidebar>
  );
}
