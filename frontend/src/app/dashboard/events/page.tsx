"use client";

import { useState, useEffect } from 'react';
import { useGetEventsQuery, useCreateEventMutation, useUpdateEventMutation, useDeleteEventMutation } from '@/lib/api';
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
  Calendar, 
  Users, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Search,
  Filter,
  Clock,
  Globe,
  Lock,
  UserCheck,
  Mail,
  UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { CreateEventRequest, UpdateEventRequest, EventVisibility } from '@/types';

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState<EventVisibility | 'all'>('all');
  const [selectedAllowSelfRSVP, setSelectedAllowSelfRSVP] = useState<boolean | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateEventRequest>({
    name: '',
    description: '',
    date: '',
    location: '',
    max_guests: undefined,
    visibility: 'private',
    allow_self_rsvp: false,
    require_approval: false,
    categories: [],
    tags: []
  });

  // API hooks
  const { data: events, isLoading: eventsLoading, error: eventsError, refetch } = useGetEventsQuery({
    search: searchTerm || undefined,
  });
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  // Filter events based on selected filters
  const filteredEvents = Array.isArray(events) ? events.filter(event => {
    if (selectedVisibility !== 'all' && event.visibility !== selectedVisibility) return false;
    if (selectedAllowSelfRSVP !== 'all' && event.allow_self_rsvp !== selectedAllowSelfRSVP) return false;
    return true;
  }) : [];

  // Handle form submission
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convert date to ISO format for backend
      const eventData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };
      await createEvent(eventData).unwrap();
      setIsCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        date: '',
        location: '',
        max_guests: undefined,
        visibility: 'private',
        allow_self_rsvp: false,
        require_approval: false,
        categories: [],
        tags: []
      });
      refetch();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    
    try {
      // Convert date to ISO format for backend
      const updateData = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };
      await updateEvent({ id: editingEvent.id, updates: updateData }).unwrap();
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      refetch();
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEventId) return;
    
    try {
      await deleteEvent(deletingEventId).unwrap();
      setDeletingEventId(null);
      refetch();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const openEditDialog = (event: any) => {
    setEditingEvent(event);
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
    setIsEditDialogOpen(true);
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

  if (eventsLoading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading events...</p>
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
          <ScrollAnimation>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Events Management</h1>
                <p className="text-xl text-muted-foreground">
                  Create, manage, and organize your events
                </p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Fill in the details to create a new event
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateEvent}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Event Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter event name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">Event Date *</Label>
                          <Input
                            id="date"
                            type="datetime-local"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter event description"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="Enter event location"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="max_guests">Max Guests</Label>
                          <Input
                            id="max_guests"
                            type="number"
                            value={formData.max_guests || ''}
                            onChange={(e) => setFormData({ ...formData, max_guests: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="No limit"
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="visibility">Visibility</Label>
                          <Select value={formData.visibility} onValueChange={(value: EventVisibility) => setFormData({ ...formData, visibility: value })}>
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
                          <Label htmlFor="allow_self_rsvp">Allow Self RSVP</Label>
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
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create Event'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </ScrollAnimation>

          {/* Filters */}
          <ScrollAnimation>
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedVisibility} onValueChange={(value: EventVisibility | 'all') => setSelectedVisibility(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Visibility</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedAllowSelfRSVP === 'all' ? 'all' : selectedAllowSelfRSVP ? 'true' : 'false'} onValueChange={(value) => setSelectedAllowSelfRSVP(value === 'all' ? 'all' : value === 'true')}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All RSVP Types</SelectItem>
                        <SelectItem value="false">Owner Managed</SelectItem>
                        <SelectItem value="true">Self RSVP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollAnimation>

          {/* Events List */}
          <ScrollAnimation>
            {!Array.isArray(events) || events.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No events found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || selectedVisibility !== 'all' || selectedAllowSelfRSVP !== 'all'
                      ? 'No events match your current filters'
                      : 'Create your first event to get started'
                    }
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold">{event.name}</h3>
                            <Badge variant={event.visibility === 'public' ? 'default' : 'secondary'}>
                              {getVisibilityIcon(event.visibility)}
                              <span className="ml-1">{event.visibility}</span>
                            </Badge>
                            <Badge variant="outline">
                              {getRSVPStatusIcon(event.allow_self_rsvp)}
                              <span className="ml-1">{getRSVPStatusLabel(event.allow_self_rsvp)}</span>
                            </Badge>
                          </div>
                          
                          {event.description && (
                            <p className="text-muted-foreground mb-4">{event.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-2" />
                              {format(new Date(event.date), 'MMM dd, yyyy HH:mm')}
                            </div>
                            {event.location && (
                              <div className="flex items-center text-muted-foreground">
                                <MapPin className="h-4 w-4 mr-2" />
                                {event.location}
                              </div>
                            )}
                            <div className="flex items-center text-muted-foreground">
                              <Users className="h-4 w-4 mr-2" />
                              {event.guest_count || 0} guests
                              {event.max_guests && ` / ${event.max_guests} max`}
                            </div>
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-2" />
                              {new Date(event.date) > new Date() ? 'Upcoming' : 'Past'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/events/${event.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(event)}>
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
                                <AlertDialogTitle>Delete Event</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{event.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    setDeletingEventId(event.id);
                                    handleDeleteEvent();
                                  }}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollAnimation>

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
                        value={formData.name}
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
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter event description"
                      rows={3}
                    />
                  </div>
                    <div>
                      <Label htmlFor="edit-location">Location *</Label>
                      <Input
                        id="edit-location"
                        value={formData.location}
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
                      <Select value={formData.visibility} onValueChange={(value: EventVisibility) => setFormData({ ...formData, visibility: value })}>
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

