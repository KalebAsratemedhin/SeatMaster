'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollAnimation } from '@/components/ui/scroll-animation';

import {
  useGetInvitationByTokenQuery,
  useAcceptInvitationMutation,
} from '@/lib/api/invitations';
import type { AcceptInvitationRequest, RSVPStatus } from '@/types';

export default function InvitationAcceptancePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  // State
  const [rsvpStatus, setRsvpStatus] = useState<RSVPStatus>('pending');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  // API hooks
  const { 
    data: invitation, 
    isLoading, 
    error 
  } = useGetInvitationByTokenQuery(token);
  const [acceptInvitation] = useAcceptInvitationMutation();

  // Check if invitation is expired
  const isExpired = invitation ? new Date(invitation.expires_at) < new Date() : false;

  // Handle form submission
  const handleAcceptInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || isExpired) return;

    setIsSubmitting(true);
    try {
      const acceptData: AcceptInvitationRequest = {
        rsvp_status: rsvpStatus,
        notes: notes.trim() || undefined,
      };

      await acceptInvitation({ token, data: acceptData }).unwrap();
      setIsAccepted(true);
    } catch (error) {
      console.error('Failed to accept invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'accepted':
        return 'Accepted';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  // Get RSVP status color
  const getRSVPStatusColor = (status: RSVPStatus) => {
    switch (status) {
      case 'accept':
        return 'bg-green-100 text-green-800';
      case 'decline':
        return 'bg-red-100 text-red-800';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get RSVP status label
  const getRSVPStatusLabel = (status: RSVPStatus) => {
    switch (status) {
      case 'accept':
        return 'Accept';
      case 'decline':
        return 'Decline';
      case 'maybe':
        return 'Maybe';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invitation Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This invitation link is invalid or has expired.
          </p>
          <Button onClick={() => router.push('/')}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invitation Accepted!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for responding to the invitation. You'll receive a confirmation email shortly.
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push('/')}>
              Go Home
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              View Event Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">You're Invited!</h1>
          <p className="text-xl text-muted-foreground">
            {invitation.event.name}
          </p>
        </div>

        {/* Event Details */}
        <ScrollAnimation>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(invitation.event.date), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {invitation.event.location}
                    </p>
                  </div>
                </div>
              </div>
              {invitation.event.description && (
                <div>
                  <p className="font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {invitation.event.description}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(invitation.status)}>
                  {getStatusLabel(invitation.status)}
                </Badge>
                {isExpired && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </ScrollAnimation>

        {/* Invitation Status */}
        {invitation.status !== 'sent' ? (
          <ScrollAnimation>
            <Alert className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {invitation.status === 'accepted' && 'This invitation has already been accepted.'}
                {invitation.status === 'expired' && 'This invitation has expired.'}
                {invitation.status === 'cancelled' && 'This invitation has been cancelled.'}
              </AlertDescription>
            </Alert>
          </ScrollAnimation>
        ) : isExpired ? (
          <ScrollAnimation>
            <Alert className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation has expired. Please contact the event organizer for assistance.
              </AlertDescription>
            </Alert>
          </ScrollAnimation>
        ) : (
          /* RSVP Form */
          <ScrollAnimation>
            <Card>
              <CardHeader>
                <CardTitle>RSVP</CardTitle>
                <CardDescription>
                  Please let us know if you'll be attending this event.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAcceptInvitation} className="space-y-6">
                  {/* Pre-filled Information Display */}
                  {(invitation.prefilled_name || invitation.prefilled_phone || invitation.prefilled_notes) && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Pre-filled Information</h4>
                      {invitation.prefilled_name && (
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{invitation.prefilled_name}</span>
                        </div>
                      )}
                      {invitation.prefilled_phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{invitation.prefilled_phone}</span>
                        </div>
                      )}
                      {invitation.prefilled_notes && (
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{invitation.prefilled_notes}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RSVP Status */}
                  <div className="space-y-2">
                    <Label htmlFor="rsvp-status">Will you be attending? *</Label>
                    <Select value={rsvpStatus} onValueChange={(value) => setRsvpStatus(value as RSVPStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your response" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accept">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Accept - I'll be there!
                          </div>
                        </SelectItem>
                        <SelectItem value="decline">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Decline - I can't make it
                          </div>
                        </SelectItem>
                        <SelectItem value="maybe">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            Maybe - I'm not sure yet
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any dietary restrictions, accessibility needs, or other information..."
                      rows={4}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || rsvpStatus === 'pending'}
                      className="min-w-32"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </ScrollAnimation>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by SeatMaster</p>
        </div>
      </div>
    </div>
  );
}
