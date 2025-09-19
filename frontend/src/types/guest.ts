/**
 * Guest related types
 */

import { BaseEntity, PaginationParams, BaseFilter } from './common';
import { User } from './auth';
import { Event } from './event';

// Guest source and RSVP status
export type GuestSource = 'owner_added' | 'invitation' | 'user_registration';
export type RSVPStatus = 'pending' | 'accept' | 'decline' | 'maybe';

// Guest model
export interface Guest extends BaseEntity {
  event_id: string;
  event: Event;
  user_id?: string; // For user registrations
  user?: User;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  rsvp_status: RSVPStatus;
  rsvp_date?: string; // ISO 8601 datetime
  source: GuestSource;
  approved: boolean;
  seat_id?: string;
  seat?: any; // Seat model (for future implementation)
}

// Guest request/response types
export interface CreateGuestRequest {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface UpdateGuestRequest {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  rsvp_status?: RSVPStatus;
}

export interface UpdateGuestRSVPRequest {
  rsvp_status: RSVPStatus;
  notes?: string;
}

export type GuestResponse = Guest;

export interface GuestsResponse {
  guests: Guest[];
  total: number;
}

// User event registration types
export interface UserEventRegistrationRequest {
  plus_one?: PlusOneRequest;
  notes?: string;
}

export interface PlusOneRequest {
  name: string;
  notes?: string;
}

export interface UserEventRegistrationResponse {
  guest: Guest;
  message: string;
}

export interface UpdateUserRegistrationRequest {
  plus_one?: PlusOneRequest;
  notes?: string;
}

// Guest filters
export interface GuestFilters extends BaseFilter, PaginationParams {
  event_id?: string;
  rsvp_status?: RSVPStatus;
  source?: GuestSource;
  approved?: boolean;
  has_plus_ones?: boolean;
  search?: string; // Search in name, email, phone
}

// Guest summary
export interface GuestSummary {
  total_guests: number;
  confirmed: number;
  declined: number;
  pending: number;
  maybe: number;
  confirmation_rate: number;
}

// Plus One types
export interface PlusOne extends BaseEntity {
  guest_id: string;
  guest: Guest;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  approved_by?: string;
  approved_by_user?: User;
  rejected_at?: string;
  rejected_by?: string;
  rejected_by_user?: User;
  rejection_reason?: string;
}

export interface CreatePlusOneRequest {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface UpdatePlusOneRequest {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface ApprovePlusOneRequest {
  notes?: string;
}

export interface RejectPlusOneRequest {
  reason: string;
}

export type PlusOneResponse = PlusOne;

export interface PlusOnesResponse {
  plus_ones: PlusOne[];
  total: number;
}
