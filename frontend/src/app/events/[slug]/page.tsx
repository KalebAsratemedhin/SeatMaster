'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Globe,
  Lock,
  ArrowLeft,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollAnimation } from '@/components/ui/scroll-animation';

import { useGetEventBySlugQuery } from '@/lib/api/events';
import type { EventVisibility } from '@/types';

export default function PublicEventPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  // State
  const [isRegistering, setIsRegistering] = useState(false);

  // API hooks
  const { 
    data: event, 
    isLoading, 
    error 
  } = useGetEventBySlugQuery(slug);

  // Helper functions
  const getVisibilityIcon = (visibility: EventVisibility) => {
    return visibility === 'public' ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />;
  };

  const getVisibilityLabel = (visibility: EventVisibility) => {
    return visibility === 'public' ? 'Public' : 'Private';
  };

  const handleRegister = () => {
    if (event?.allow_self_rsvp) {
      // TODO: Implement self-registration
      setIsRegistering(true);
      // For now, just show a message
      alert('Self-registration will be implemented soon!');
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This event doesn't exist or is not publicly accessible.
          </p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <div className="flex items-center gap-2">
            <Badge className="flex items-center gap-1">
              {getVisibilityIcon(event.visibility)}
              {getVisibilityLabel(event.visibility)}
            </Badge>
          </div>
        </div>

        {/* Event Details */}
        <ScrollAnimation>
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-4xl font-bold mb-2">{event.name}</CardTitle>
              {event.description && (
                <CardDescription className="text-xl text-muted-foreground">
                  {event.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {event.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">{event.guest_list?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Guests</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-2xl font-bold">
                    {event.max_guests ? `${event.max_guests}` : '∞'}
                  </p>
                  <p className="text-sm text-muted-foreground">Max Guests</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="h-6 w-6 mx-auto mb-2 flex items-center justify-center">
                    {event.allow_self_rsvp ? (
                      <UserPlus className="h-6 w-6 text-green-600" />
                    ) : (
                      <Lock className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {event.allow_self_rsvp ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-muted-foreground">Self RSVP</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="h-6 w-6 mx-auto mb-2 flex items-center justify-center">
                    {event.require_approval ? (
                      <Lock className="h-6 w-6 text-yellow-600" />
                    ) : (
                      <UserPlus className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <p className="text-2xl font-bold">
                    {event.require_approval ? 'Yes' : 'No'}
                  </p>
                  <p className="text-sm text-muted-foreground">Approval Required</p>
                </div>
              </div>

              {/* Categories and Tags */}
              {(event.categories?.length > 0 || event.tags?.length > 0) && (
                <div className="space-y-3">
                  {event.categories?.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {event.categories.map((category, index) => (
                          <Badge key={index} variant="secondary">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {event.tags?.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Registration Button */}
              {event.allow_self_rsvp && (
                <div className="text-center pt-4">
                  <Button 
                    size="lg" 
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="min-w-48"
                  >
                    <UserPlus className="h-5 w-5 mr-2" />
                    {isRegistering ? 'Registering...' : 'Register for Event'}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    {event.require_approval 
                      ? 'Your registration will require approval from the event organizer.'
                      : 'You will be automatically registered for this event.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </ScrollAnimation>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by SeatMaster</p>
        </div>
      </div>
    </div>
  );
}
