/**
 * Bulk operations related types
 */

import { PaginationParams, BaseFilter } from './common';
import { Guest } from './guest';
import { Invitation } from './invitation';

// CSV Import/Export types
export interface GuestExportFilters extends BaseFilter, PaginationParams {
  categories?: string[];
  tags?: string[];
  rsvp_status?: string;
  source?: string;
  approved?: boolean;
}

export interface BulkImportResult {
  total_rows: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: Record<string, unknown>;
  }>;
  guests: Guest[];
  warnings: Array<{
    row: number;
    warning: string;
    data?: Record<string, unknown>;
  }>;
}

// Bulk invitation types
export interface BulkInvitationRequest {
  emails: string[];
  expires_in_days?: number;
  prefilled_data?: {
    name?: string;
    phone?: string;
    notes?: string;
  };
}

export interface BulkInvitationResult {
  total_requested: number;
  successful: number;
  failed: number;
  errors: Array<{
    email: string;
    error: string;
  }>;
  invitations: Invitation[];
}

// Bulk RSVP update types
export interface BulkRSVPUpdateRequest {
  guest_ids: string[];
  rsvp_status: string;
  notes?: string;
}

export interface BulkRSVPUpdateResult {
  total_requested: number;
  successful: number;
  failed: number;
  errors: Array<{
    guest_id: string;
    error: string;
  }>;
  updated_guests: Guest[];
}

// Bulk delete types
export interface BulkDeleteResult {
  total_requested: number;
  successful: number;
  failed: number;
  errors: Array<{
    guest_id: string;
    error: string;
  }>;
  deleted_guests: string[];
}

// CSV format specification
export interface CSVGuestFormat {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  dietary_restrictions?: string;
  accessibility_needs?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  plus_one_limit?: number;
  rsvp_status?: string;
  category?: string;
  tags?: string;
}

// Import validation
export interface ImportValidationResult {
  valid: boolean;
  errors: Array<{
    row: number;
    field: string;
    error: string;
    value?: unknown;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    warning: string;
    value?: unknown;
  }>;
  total_rows: number;
  valid_rows: number;
}

// Export options
export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  include_plus_ones?: boolean;
  include_assignments?: boolean;
  include_communications?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  fields?: string[];
}

// Bulk operation status
export interface BulkOperationStatus {
  id: string;
  type: 'import' | 'export' | 'invitation' | 'rsvp_update' | 'delete';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  total_items: number;
  processed_items: number;
  errors: string[];
  created_at: string;
  completed_at?: string;
  result?: unknown;
}
