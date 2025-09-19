"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetEventQuery, useUpdateEventMutation, useDeleteEventMutation, useGetGuestSummaryQuery } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { AnimatedCursor } from '@/components/ui/animated-cursor';
import { ParticleBackground } from '@/components/ui/particle-background';
import { Sidebar } from '@/components/layout/sidebar';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Globe,
  Lock,
  UserCheck,
  Mail,
  Grid3X3,
  UserPlus,
  Clock,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import type { UpdateEventRequest, EventVisibility } from '@/types';

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateEventRequest>({});

  // API hooks
  const { data: event, isLoading, error, refetch } = useGetEventQuery(eventId);
  const { data: guestSummary } = useGetGuestSummaryQuery({ eventId });
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent, { isLoading: isDeletingMutation }] = useDeleteEventMutation();

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  // Initialize form data when event loads
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description || '',
        date: new Date(event.date).toISOString().slice(0, 16), // Convert to datetime-local format
        location: event.location || '',
        max_guests: event.max_guests,
        visibility: event.visibility,
        allow_self_rsvp: event.allow_self_rsvp || false,
        require_approval: event.require_approval || false,
        categories: event.categories || [],
        tags: event.tags || []
      });
    }
  }, [event]);

  // Handle form submission
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert date to ISO format for backend
      const updateData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };
      await updateEvent({ id: eventId, updates: updateData }).unwrap();
      setIsEditDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await deleteEvent(eventId).unwrap();
      router.push('/dashboard/events');
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const copyEventSlug = async () => {
    if (event?.slug) {
      await navigator.clipboard.writeText(`${window.location.origin}/events/${event.slug}`);
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    }
  };

  const getVisibilityIcon = (visibility: EventVisibility) => {
    return visibility === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />;
  };

  const getRSVPStatusIcon = (allowSelfRSVP: boolean) => {
    return allowSelfRSVP ? <UserPlus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />;
  };

  const getRSVPStatusLabel = (allowSelfRSVP: boolean) => {
    return allowSelfRSVP ? 'Self RSVP Allowed' : 'Owner Managed Only';
  };

  const getEventStatus = () => {
    if (!event) return 'Unknown';
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (eventDate > now) {
      const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return `Upcoming (${diffDays} days)`;
    } else {
      return 'Past Event';
    }
  };

  if (isLoading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading event...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (error || !event) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
            <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/dashboard/events')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
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
          {/* Sticky Header */}
          <div className="sticky top-0 z-40 bg-background/95 border-b border-border/50 mb-8 -mx-4 px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/events')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{event.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    Event Details & Management
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push(`/dashboard/events/${eventId}/guests`)}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Guests
                </Button>
                <Button onClick={() => router.push(`/dashboard/events/${eventId}/invitations`)}>
                  <Mail className="h-4 w-4 mr-2" />
                  Manage Invitations
                </Button>
                <Button onClick={() => router.push(`/dashboard/events/${eventId}/seating`)}>
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  Manage Seating
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Event
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Event</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{event.name}"? This action cannot be undone and will remove all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteEvent}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeletingMutation}
                      >
                        {isDeletingMutation ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Main Title (hidden on scroll) */}
          <ScrollAnimation>
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">{event.name}</h1>
              <p className="text-xl text-muted-foreground">
                Event Details & Management
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Event Information */}
            <div className="lg:col-span-2 space-y-6">
              <ScrollAnimation>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Calendar className="h-5 w-5" />
                      Event Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Event Name</Label>
                        <p className="text-lg font-semibold">{event.name}</p>
                      </div>
                      
                      {event.description && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                          <p className="text-sm">{event.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Date & Time</Label>
                          <p className="text-sm">{format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">{format(new Date(event.date), 'HH:mm')}</p>
                        </div>
                        
                        {event.location && (
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                            <p className="text-sm">{event.location}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Guest Capacity</Label>
                          <p className="text-sm">
                            {event.max_guests ? `${event.guest_count || 0} / ${event.max_guests} guests` : 'No limit'}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                          <p className="text-sm">{getEventStatus()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollAnimation>

              <ScrollAnimation>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Users className="h-5 w-5" />
                      Guest Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge variant={event.visibility === 'public' ? 'default' : 'secondary'}>
                          {getVisibilityIcon(event.visibility)}
                          <span className="ml-1">{event.visibility}</span>
                        </Badge>
                        <Badge variant="outline">
                          {getRSVPStatusIcon(event.allow_self_rsvp)}
                          <span className="ml-1">{getRSVPStatusLabel(event.allow_self_rsvp)}</span>
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-primary">{event.rsvp_count || 0}</p>
                          <p className="text-sm text-muted-foreground">RSVPs</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-600">{event.confirmed_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Confirmed</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-red-600">{event.declined_count || 0}</p>
                          <p className="text-sm text-muted-foreground">Declined</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ScrollAnimation>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Share2 className="h-5 w-5" />
                      Event Sharing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Event URL</Label>
                      <div className="flex gap-2 mt-1">
                        <Input 
                          value={`${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.slug}`}
                          readOnly
                          className="text-xs"
                        />
                        <Button size="sm" variant="outline" onClick={copyEventSlug}>
                          {copiedSlug ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Share this URL with guests to allow them to view and RSVP to your event.
                    </div>
                  </CardContent>
                </Card>
              </ScrollAnimation>

              {guestSummary && (
                <ScrollAnimation>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <Users className="h-5 w-5" />
                        Guest Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{guestSummary.total_guests}</div>
                          <div className="text-sm text-muted-foreground">Total Guests</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{guestSummary.confirmed}</div>
                          <div className="text-sm text-muted-foreground">Confirmed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{guestSummary.pending}</div>
                          <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{Math.round(guestSummary.confirmation_rate)}%</div>
                          <div className="text-sm text-muted-foreground">Confirmation Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              )}

              <ScrollAnimation>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Clock className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline" asChild>
                      <a href={`/dashboard/events/${event.id}/guests`}>
                        <Users className="h-4 w-4 mr-2" />
                        Manage Guests
                      </a>
                    </Button>
                    <Button className="w-full" variant="outline" asChild>
                      <a href={`/dashboard/events/${event.id}/invitations`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitations
                      </a>
                    </Button>
                    <Button className="w-full" variant="outline" asChild>
                      <a href={`/dashboard/events/${event.id}/seating`}>
                        <Users className="h-4 w-4 mr-2" />
                        Seating Arrangement
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            </div>
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>
                  Update the event details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateEvent}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Event Name *</Label>
                      <Input
                        id="edit-name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter event name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-date">Event Date *</Label>
                      <Input
                        id="edit-date"
                        type="datetime-local"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter event description"
                      rows={3}
                    />
                  </div>
                    <div>
                      <Label htmlFor="edit-location">Location *</Label>
                      <Input
                        id="edit-location"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Enter event location"
                        required
                      />
                    </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-max_guests">Max Guests</Label>
                      <Input
                        id="edit-max_guests"
                        type="number"
                        value={formData.max_guests || ''}
                        onChange={(e) => setFormData({ ...formData, max_guests: e.target.value ? parseInt(e.target.value) : undefined })}
                        placeholder="No limit"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-visibility">Visibility</Label>
                      <Select value={formData.visibility || 'private'} onValueChange={(value: EventVisibility) => setFormData({ ...formData, visibility: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-allow_self_rsvp">Allow Self RSVP</Label>
                      <Select value={formData.allow_self_rsvp ? 'true' : 'false'} onValueChange={(value) => setFormData({ ...formData, allow_self_rsvp: value === 'true' })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Owner Managed Only</SelectItem>
                          <SelectItem value="true">Allow Self RSVP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Event'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Sidebar>
  );
}
