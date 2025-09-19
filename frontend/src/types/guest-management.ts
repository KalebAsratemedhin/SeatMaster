/**
 * Enhanced guest management types (categories, tags, communication)
 */

import { BaseEntity, PaginationParams, BaseFilter } from './common';
import { User } from './auth';
import { Event } from './event';
import { Guest } from './guest';

// Guest Category types
export interface GuestCategory extends BaseEntity {
  event_id: string;
  event: Event;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_default: boolean;
  guest_count?: number;
}

export interface CreateGuestCategoryRequest {
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_default?: boolean;
}

export interface UpdateGuestCategoryRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  is_default?: boolean;
}

export type GuestCategoryResponse = GuestCategory;

export interface GuestCategoriesResponse {
  categories: GuestCategoryResponse[];
  total: number;
}

// Guest Category Assignment
export interface GuestCategoryAssignment extends BaseEntity {
  guest_id: string;
  guest: Guest;
  category_id: string;
  category: GuestCategory;
  assigned_by: string;
  assigned_by_user: User;
  notes?: string;
}

export interface AssignGuestToCategoryRequest {
  guest_id: string;
  notes?: string;
}

export type GuestCategoryAssignmentResponse = GuestCategoryAssignment;

// Guest Tag types
export interface GuestTag extends BaseEntity {
  event_id: string;
  event: Event;
  name: string;
  description?: string;
  color: string;
  guest_count?: number;
}

export interface CreateGuestTagRequest {
  name: string;
  description?: string;
  color: string;
}

export interface UpdateGuestTagRequest {
  name?: string;
  description?: string;
  color?: string;
}

export type GuestTagResponse = GuestTag;

export interface GuestTagsResponse {
  tags: GuestTagResponse[];
  total: number;
}

// Guest Tag Assignment
export interface GuestTagAssignment extends BaseEntity {
  guest_id: string;
  guest: Guest;
  tag_id: string;
  tag: GuestTag;
  assigned_by: string;
  assigned_by_user: User;
}

export interface AssignGuestToTagRequest {
  guest_id: string;
}

export type GuestTagAssignmentResponse = GuestTagAssignment;

// Guest Communication types
export type CommunicationType = 'email' | 'sms' | 'push' | 'in_app';
export type CommunicationStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';

export interface GuestCommunication extends BaseEntity {
  event_id: string;
  event: Event;
  type: CommunicationType;
  subject: string;
  message: string;
  recipients: string[]; // Array of guest IDs
  categories?: string[]; // Array of category IDs
  tags?: string[]; // Array of tag IDs
  status: CommunicationStatus;
  scheduled_at?: string;
  sent_at?: string;
  sent_by: string;
  sent_by_user: User;
  recipient_count?: number;
}

export interface CreateCommunicationRequest {
  type: CommunicationType;
  subject: string;
  message: string;
  recipients: string[];
  categories?: string[];
  tags?: string[];
  scheduled_at?: string;
}

export interface UpdateCommunicationRequest {
  type?: CommunicationType;
  subject?: string;
  message?: string;
  recipients?: string[];
  categories?: string[];
  tags?: string[];
  scheduled_at?: string;
}

export interface ScheduleCommunicationRequest {
  scheduled_at: string;
}

export interface CommunicationResponse {
  id: string;
  event_id: string;
  type: CommunicationType;
  subject: string;
  message: string;
  recipients: string[];
  categories: string[];
  tags: string[];
  status: CommunicationStatus;
  scheduled_at?: string;
  sent_at?: string;
  sent_by: string;
  sent_by_user: User;
  recipient_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunicationsResponse {
  communications: CommunicationResponse[];
  total: number;
}

// Communication Statistics
export interface CommunicationStats {
  id: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  open_rate: number;
  click_rate: number;
  response_rate: number;
}

// Filters
export interface GuestCategoryFilters extends BaseFilter, PaginationParams {
  event_id?: string;
  is_default?: boolean;
}

export interface GuestTagFilters extends BaseFilter, PaginationParams {
  event_id?: string;
}

export interface CommunicationFilters extends BaseFilter, PaginationParams {
  event_id?: string;
  type?: CommunicationType;
  status?: CommunicationStatus;
  sent_after?: string;
  sent_before?: string;
  scheduled_after?: string;
  scheduled_before?: string;
}

// Bulk operations for guest management
export interface BulkGuestOperationRequest {
  guest_ids: string[];
  operation: 'assign_category' | 'assign_tag' | 'remove_category' | 'remove_tag' | 'update_rsvp' | 'approve' | 'delete';
  category_id?: string;
  tag_id?: string;
  rsvp_status?: string;
  notes?: string;
}

export interface BulkGuestOperationResult {
  total_requested: number;
  successful: number;
  failed: number;
  errors: Array<{
    guest_id: string;
    error: string;
  }>;
}
