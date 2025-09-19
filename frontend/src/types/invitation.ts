/**
 * Invitation related types
 */

import { BaseEntity, PaginationParams, BaseFilter } from './common';
import { User } from './auth';
import { Event } from './event';

// Invitation status
export type InvitationStatus = 'sent' | 'accepted' | 'expired' | 'cancelled';

// Invitation model
export interface Invitation extends BaseEntity {
  event_id: string;
  event: Event;
  email: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  prefilled_name?: string;
  prefilled_phone?: string;
  prefilled_notes?: string;
  sent_at: string;
  accepted_at?: string;
  expired_at?: string;
}

// Invitation list item (simplified for list views)
export interface InvitationListItem {
  id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  prefilled_name?: string;
  sent_at: string;
  accepted_at?: string;
  created_at: string;
}

// Invitation request/response types
export interface CreateInvitationRequest {
  email: string;
  expires_in_days: number; // Required, 1-90 days
  prefilled_name?: string;
  prefilled_phone?: string;
  prefilled_notes?: string;
}

export interface UpdateInvitationRequest {
  expires_in_days?: number;
  prefilled_name?: string;
  prefilled_phone?: string;
  prefilled_notes?: string;
}

export type InvitationResponse = Invitation;

export interface InvitationsResponse {
  invitations: Invitation[];
  total: number;
}

// Invitation acceptance
export interface AcceptInvitationRequest {
  rsvp_status: 'pending' | 'accept' | 'decline' | 'maybe';
  notes?: string;
}

export interface AcceptInvitationResponse {
  guest: Guest;
  message: string;
}

// Invitation filters
export interface InvitationFilters extends BaseFilter, PaginationParams {
  event_id?: string;
  status?: InvitationStatus;
  email?: string;
  expires_after?: string;
  expires_before?: string;
  sent_after?: string;
  sent_before?: string;
}

// Invitation statistics
export interface InvitationStats {
  total_invitations: number;
  status_stats: {
    sent: number;
    accepted: number;
    expired: number;
    cancelled: number;
  };
  acceptance_rate: number;
  pending_invitations: number;
  expired_invitations: number;
}

// Bulk invitation types - imported from bulk-operations

// Resend invitation
export interface ResendInvitationRequest {
  invitation_id: string;
}

export interface ResendInvitationResponse {
  invitation: Invitation;
  message: string;
}

// Import types from guest module
import { Guest, PlusOne, PlusOneRequest } from './guest';
import { BulkInvitationRequest, BulkInvitationResult } from './bulk-operations';
