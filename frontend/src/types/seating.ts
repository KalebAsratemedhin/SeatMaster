/**
 * Seating assignment related types
 */

import { BaseEntity, PaginationParams, BaseFilter } from './common';
import { User } from './auth';
import { Event } from './event';
import { Guest } from './guest';
import { Seat } from './venue';

// Seating assignment model
export interface SeatingAssignment extends BaseEntity {
  event_id: string;
  event: Event;
  guest_id: string;
  guest: Guest;
  seat_id: string;
  seat: Seat;
  assigned_by: string;
  assigned_by_user: User;
  assigned_at: string;
  notes?: string;
}

// Seating assignment request/response types
export interface CreateSeatingAssignmentRequest {
  guest_id: string;
  seat_id: string;
  notes?: string;
}

export interface UpdateSeatingAssignmentRequest {
  seat_id?: string;
  notes?: string;
}

export interface SeatingAssignmentResponse {
  seating_assignment: SeatingAssignment;
}

export interface SeatingAssignmentsResponse {
  seating_assignments: SeatingAssignment[];
  total: number;
}

// Seating chart response
export interface SeatingChartResponse {
  event_id: string;
  event_name: string;
  venue_id: string;
  venue_name: string;
  room_id: string;
  room_name: string;
  seating_assignments: SeatingAssignment[];
  total_seats: number;
  assigned_seats: number;
  available_seats: number;
}

// Seating assignment filters
export interface SeatingAssignmentFilters extends BaseFilter, PaginationParams {
  event_id?: string;
  guest_id?: string;
  seat_id?: string;
  assigned_by?: string;
  assigned_after?: string;
  assigned_before?: string;
}

// Seating statistics
export interface SeatingStats {
  total_seats: number;
  assigned_seats: number;
  available_seats: number;
  utilization_rate: number;
  unassigned_guests: number;
  seat_category_distribution: Record<string, number>;
  assignment_timeline: Array<{
    date: string;
    assignments: number;
  }>;
}

// Bulk seating operations
export interface BulkSeatingAssignmentRequest {
  assignments: Array<{
    guest_id: string;
    seat_id: string;
    notes?: string;
  }>;
}

export interface BulkSeatingAssignmentResult {
  total_requested: number;
  successful: number;
  failed: number;
  errors: Array<{
    guest_id: string;
    seat_id: string;
    error: string;
  }>;
  assignments: SeatingAssignment[];
}

// Seat availability check
export interface SeatAvailabilityRequest {
  seat_id: string;
  event_id: string;
}

export interface SeatAvailabilityResponse {
  available: boolean;
  assigned_to?: {
    guest_id: string;
    guest_name: string;
    guest_email: string;
  };
  assignment?: SeatingAssignment;
}

// Auto-assignment options
export interface AutoAssignmentOptions {
  event_id: string;
  room_id: string;
  preferences?: {
    group_families?: boolean;
    group_by_category?: boolean;
    avoid_conflicts?: boolean;
    respect_preferences?: boolean;
  };
  constraints?: {
    max_guests_per_row?: number;
    required_categories?: string[];
    excluded_categories?: string[];
  };
}

export interface AutoAssignmentResult {
  total_guests: number;
  assigned_guests: number;
  unassigned_guests: number;
  assignments: SeatingAssignment[];
  conflicts: Array<{
    guest_id: string;
    conflict_reason: string;
  }>;
}
