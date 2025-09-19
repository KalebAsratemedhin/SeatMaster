/**
 * Event related types
 */

import { BaseEntity, PaginationParams, BaseFilter } from './common';
import { User } from './auth';

// Event visibility options
export type EventVisibility = 'private' | 'public';

// Event model
export interface Event extends BaseEntity {
  name: string;
  description?: string;
  date: string; // ISO 8601 datetime
  location: string; // Required in backend
  max_guests?: number;
  visibility: EventVisibility;
  allow_self_rsvp: boolean;
  require_approval: boolean;
  categories: string[];
  tags: string[];
  slug: string;
  owner_id: string;
  owner: User;
  // Computed fields
  guest_count?: number;
  rsvp_count?: number;
  confirmed_count?: number;
  declined_count?: number;
  pending_count?: number;
}

// Event request/response types
export interface CreateEventRequest {
  name: string;
  description?: string;
  date: string;
  location: string; // Required in backend
  max_guests?: number;
  visibility: EventVisibility;
  allow_self_rsvp?: boolean;
  require_approval?: boolean;
  categories?: string[];
  tags?: string[];
}

export interface UpdateEventRequest {
  name?: string;
  description?: string;
  date?: string;
  location?: string;
  max_guests?: number;
  visibility?: EventVisibility;
  allow_self_rsvp?: boolean;
  require_approval?: boolean;
  categories?: string[];
  tags?: string[];
}

export type EventResponse = Event;

export interface EventsResponse {
  events: Event[];
  total: number;
}

// Event filters
export interface EventFilters extends BaseFilter, PaginationParams {
  owner_id?: string;
  visibility?: EventVisibility;
  date_after?: string;
  date_before?: string;
  has_guests?: boolean;
  is_full?: boolean;
}

// Event statistics
export interface EventStats {
  total_events: number;
  active_events: number;
  total_guests: number;
  upcoming_events: number;
  recent_events: Event[];
}

// Event summary for dashboard
export interface EventSummary {
  event: Event;
  guest_count: number;
  rsvp_stats: {
    confirmed: number;
    declined: number;
    pending: number;
  };
  recent_activity: string[];
}
