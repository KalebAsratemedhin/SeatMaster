"use client";

import { useState, useEffect } from 'react';
import { useGetMeQuery, useGetEventsQuery } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  UserPlus,
  Mail as MailIcon,
  BarChart3,
  Building,
  Sofa
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // API hooks
  const { data: user, isLoading: userLoading, error: userError } = useGetMeQuery();
  const { data: events, isLoading: eventsLoading, error: eventsError } = useGetEventsQuery({});

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      window.location.href = '/login';
    }
  }, []);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-4">Please log in again to access your dashboard.</p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const upcomingEvents = Array.isArray(events) ? events.filter(event => new Date(event.date) > new Date()) : [];
  const pastEvents = Array.isArray(events) ? events.filter(event => new Date(event.date) <= new Date()) : [];

  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <AnimatedCursor />
        <ParticleBackground />
        
        <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <ScrollAnimation>
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {user?.first_name}! 👋
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your events, guests, and seating arrangements all in one place.
            </p>
          </div>
        </ScrollAnimation>

        {/* Quick Stats */}
        <ScrollAnimation>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                    <p className="text-3xl font-bold">{Array.isArray(events) ? events.length : 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                    <p className="text-3xl font-bold">{upcomingEvents.length}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Guests</p>
                    <p className="text-3xl font-bold">
                      {Array.isArray(events) ? events.reduce((sum, event) => sum + (event.guest_count || 0), 0) : 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Venues</p>
                    <p className="text-3xl font-bold">0</p>
                  </div>
                  <Building className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollAnimation>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="guests">Guests</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="invitations">Invitations</TabsTrigger>
            <TabsTrigger value="seating">Seating</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <ScrollAnimation>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>
                      Your events happening soon
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No upcoming events</p>
                        <Button className="mt-4" asChild>
                          <Link href="#events">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Event
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {upcomingEvents.slice(0, 3).map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{event.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(event.date), 'MMM dd, yyyy')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {event.guest_count || 0} guests
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/events/${event.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Latest updates across your events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">New guest registered for "Summer Wedding"</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">Invitation sent to john@example.com</p>
                          <p className="text-xs text-muted-foreground">4 hours ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm">Seating chart updated for "Corporate Event"</p>
                          <p className="text-xs text-muted-foreground">1 day ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollAnimation>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <ScrollAnimation>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Events</CardTitle>
                      <CardDescription>
                        Manage all your events and their details
                      </CardDescription>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {eventsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-2 text-muted-foreground">Loading events...</p>
                    </div>
                  ) : !Array.isArray(events) || events.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No events yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first event to get started with SeatMaster
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Event
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(events) && events.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-6 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-medium">{event.name}</h3>
                              <Badge variant={event.visibility === 'public' ? 'default' : 'secondary'}>
                                {event.visibility}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-2">{event.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {format(new Date(event.date), 'MMM dd, yyyy')}
                              </div>
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {event.location}
                                </div>
                              )}
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {event.guest_count || 0} guests
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/events/${event.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ScrollAnimation>
          </TabsContent>

          {/* Guests Tab */}
          <TabsContent value="guests" className="space-y-6">
            <ScrollAnimation>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Guest Management</CardTitle>
                      <CardDescription>
                        Manage guests across all your events
                      </CardDescription>
                    </div>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Guest
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Guest Management</h3>
                    <p className="text-muted-foreground mb-4">
                      Select an event to manage its guests
                    </p>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Guests
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </TabsContent>

          {/* Venues Tab */}
          <TabsContent value="venues" className="space-y-6">
            <ScrollAnimation>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Venue Management</CardTitle>
                      <CardDescription>
                        Manage venues, rooms, and seating arrangements
                      </CardDescription>
                    </div>
                    <Button>
                      <Building className="h-4 w-4 mr-2" />
                      Add Venue
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No venues yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create venues to manage rooms and seating arrangements
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Venue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </TabsContent>

          {/* Invitations Tab */}
          <TabsContent value="invitations" className="space-y-6">
            <ScrollAnimation>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Invitation Management</CardTitle>
                      <CardDescription>
                        Send and manage invitations for your events
                      </CardDescription>
                    </div>
                    <Button>
                      <MailIcon className="h-4 w-4 mr-2" />
                      Send Invitations
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <MailIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No invitations sent</h3>
                    <p className="text-muted-foreground mb-4">
                      Send invitations to guests for your events
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Send Your First Invitation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </TabsContent>

          {/* Seating Tab */}
          <TabsContent value="seating" className="space-y-6">
            <ScrollAnimation>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Seating Management</CardTitle>
                      <CardDescription>
                        Create and manage seating arrangements for your events
                      </CardDescription>
                    </div>
                    <Button>
                      <Sofa className="h-4 w-4 mr-2" />
                      Create Seating Chart
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Sofa className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No seating charts</h3>
                    <p className="text-muted-foreground mb-4">
                      Create seating arrangements for your events
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Seating Chart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimation>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </Sidebar>
  );
}

