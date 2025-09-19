'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Copy,
  Eye,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollAnimation } from '@/components/ui/scroll-animation';
import { Sidebar } from '@/components/layout/sidebar';

import {
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useUpdateInvitationMutation,
  useDeleteInvitationMutation,
  useResendInvitationMutation,
} from '@/lib/api/invitations';
import { useGetEventQuery } from '@/lib/api/events';
import type { InvitationListItem, CreateInvitationRequest, UpdateInvitationRequest, InvitationStatus } from '@/types';

export default function InvitationsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<InvitationStatus | 'all'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<InvitationListItem | null>(null);
  const [deletingInvitationId, setDeletingInvitationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateInvitationRequest>({
    email: '',
    expires_in_days: 30,
    prefilled_name: '',
    prefilled_phone: '',
    prefilled_notes: '',
  });

  // API hooks
  const { data: event, isLoading: eventLoading } = useGetEventQuery(eventId);
  const { data: invitations, isLoading: invitationsLoading, error: invitationsError } = useGetInvitationsQuery({ eventId });
  const [createInvitation, { isLoading: isCreating }] = useCreateInvitationMutation();
  const [updateInvitation, { isLoading: isUpdating }] = useUpdateInvitationMutation();
  const [deleteInvitation, { isLoading: isDeleting }] = useDeleteInvitationMutation();
  const [resendInvitation, { isLoading: isResending }] = useResendInvitationMutation();

  // Debug logging
  useEffect(() => {
    console.log('Invitations data:', invitations);
    console.log('Invitations loading:', invitationsLoading);
    console.log('Invitations error:', invitationsError);
  }, [invitations, invitationsLoading, invitationsError]);

  // Filter invitations
  const filteredInvitations = Array.isArray(invitations) ? invitations.filter((invitation) => {
    const matchesSearch = invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invitation.prefilled_name && invitation.prefilled_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || invitation.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) : [];

  // Helper functions
  const getStatusIcon = (status: InvitationStatus) => {
    switch (status) {
      case 'sent':
        return <Mail className="h-4 w-4" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: InvitationStatus) => {
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

  const getStatusLabel = (status: InvitationStatus) => {
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

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Event handlers
  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('Creating invitation with data:', formData);
      const result = await createInvitation({ eventId, invitationData: formData }).unwrap();
      console.log('Invitation created successfully:', result);
      setIsCreateDialogOpen(false);
      setFormData({
        email: '',
        expires_in_days: 30,
        prefilled_name: '',
        prefilled_phone: '',
        prefilled_notes: '',
      });
    } catch (error) {
      console.error('Failed to create invitation:', error);
    }
  };

  const handleUpdateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvitation) return;
    
    try {
      await updateInvitation({ 
        eventId, 
        invitationId: editingInvitation.id, 
        updates: formData 
      }).unwrap();
      setIsEditDialogOpen(false);
      setEditingInvitation(null);
    } catch (error) {
      console.error('Failed to update invitation:', error);
    }
  };

  const handleDeleteInvitation = async () => {
    if (!deletingInvitationId) return;
    
    try {
      await deleteInvitation({ eventId, invitationId: deletingInvitationId }).unwrap();
      setDeletingInvitationId(null);
    } catch (error) {
      console.error('Failed to delete invitation:', error);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await resendInvitation({ eventId, invitationId }).unwrap();
    } catch (error) {
      console.error('Failed to resend invitation:', error);
    }
  };

  const openEditDialog = (invitation: InvitationListItem) => {
    setEditingInvitation(invitation);
    setFormData({
      email: invitation.email,
      expires_in_days: Math.ceil((new Date(invitation.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      prefilled_name: invitation.prefilled_name || '',
      prefilled_phone: '',
      prefilled_notes: '',
    });
    setIsEditDialogOpen(true);
  };

  const copyInvitationLink = (invitation: InvitationListItem) => {
    const link = `${window.location.origin}/invitations/${invitation.token}`;
    navigator.clipboard.writeText(link);
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
              <h1 className="text-3xl font-bold">{event.name} - Invitations</h1>
              <p className="text-muted-foreground">
                Manage invitations for your event
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push(`/dashboard/events/${eventId}`)}>
                Back to Event
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send Invitation</DialogTitle>
                    <DialogDescription>
                      Send an invitation to someone for this event.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateInvitation} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="guest@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expires_in_days">Expires In (Days) *</Label>
                      <Input
                        id="expires_in_days"
                        type="number"
                        min="1"
                        max="90"
                        value={formData.expires_in_days}
                        onChange={(e) => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prefilled_name">Pre-filled Name (Optional)</Label>
                      <Input
                        id="prefilled_name"
                        value={formData.prefilled_name}
                        onChange={(e) => setFormData({ ...formData, prefilled_name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prefilled_phone">Pre-filled Phone (Optional)</Label>
                      <Input
                        id="prefilled_phone"
                        value={formData.prefilled_phone}
                        onChange={(e) => setFormData({ ...formData, prefilled_phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prefilled_notes">Pre-filled Notes (Optional)</Label>
                      <Textarea
                        id="prefilled_notes"
                        value={formData.prefilled_notes}
                        onChange={(e) => setFormData({ ...formData, prefilled_notes: e.target.value })}
                        placeholder="Any special notes or requirements..."
                        rows={3}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isCreating}>
                        {isCreating ? 'Sending...' : 'Send Invitation'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search invitations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as InvitationStatus | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invitations List */}
          {invitationsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading invitations...</p>
            </div>
          ) : invitationsError ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load invitations</h3>
              <p className="text-muted-foreground mb-4">
                {invitationsError?.toString() || 'An error occurred while loading invitations.'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No invitations found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'No invitations match your current filters.' 
                  : 'No invitations have been sent for this event yet.'}
              </p>
              {!searchTerm && selectedStatus === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Send First Invitation
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredInvitations.map((invitation) => (
                <ScrollAnimation key={invitation.id}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{invitation.email}</h3>
                            <Badge className={getStatusColor(invitation.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(invitation.status)}
                                {getStatusLabel(invitation.status)}
                              </div>
                            </Badge>
                            {isExpired(invitation.expires_at) && invitation.status === 'sent' && (
                              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                <Clock className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                          </div>
                          {invitation.prefilled_name && (
                            <p className="text-sm text-muted-foreground mb-1">
                              Pre-filled name: {invitation.prefilled_name}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Sent: {format(new Date(invitation.sent_at), 'MMM d, yyyy')}</span>
                            <span>Expires: {format(new Date(invitation.expires_at), 'MMM d, yyyy')}</span>
                            {invitation.accepted_at && (
                              <span>Accepted: {format(new Date(invitation.accepted_at), 'MMM d, yyyy')}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInvitationLink(invitation)}
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </Button>
                          {invitation.status === 'sent' && !isExpired(invitation.expires_at) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                              disabled={isResending}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(invitation)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingInvitationId(invitation.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              ))}
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Invitation</DialogTitle>
                <DialogDescription>
                  Update the invitation details.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateInvitation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expires_in_days">Expires In (Days)</Label>
                  <Input
                    id="edit-expires_in_days"
                    type="number"
                    min="1"
                    max="90"
                    value={formData.expires_in_days}
                    onChange={(e) => setFormData({ ...formData, expires_in_days: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prefilled_name">Pre-filled Name</Label>
                  <Input
                    id="edit-prefilled_name"
                    value={formData.prefilled_name}
                    onChange={(e) => setFormData({ ...formData, prefilled_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prefilled_phone">Pre-filled Phone</Label>
                  <Input
                    id="edit-prefilled_phone"
                    value={formData.prefilled_phone}
                    onChange={(e) => setFormData({ ...formData, prefilled_phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-prefilled_notes">Pre-filled Notes</Label>
                  <Textarea
                    id="edit-prefilled_notes"
                    value={formData.prefilled_notes}
                    onChange={(e) => setFormData({ ...formData, prefilled_notes: e.target.value })}
                    placeholder="Any special notes or requirements..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Update Invitation'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deletingInvitationId} onOpenChange={() => setDeletingInvitationId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this invitation? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteInvitation}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
