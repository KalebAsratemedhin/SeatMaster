/**
 * Bulk operations API endpoints
 */

import { baseApi } from './base';
import type {
  GuestExportFilters,
  BulkImportResult,
  BulkInvitationRequest,
  BulkInvitationResult,
  BulkRSVPUpdateRequest,
  BulkRSVPUpdateResult,
  BulkDeleteResult,
  CSVGuestFormat,
  ImportValidationResult,
  ExportOptions,
  BulkOperationStatus,
} from '@/types';

export const bulkOperationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Import guests from CSV
    importGuestsFromCSV: builder.mutation<BulkImportResult, { eventId: string; file: File }>({
      query: ({ eventId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return {
          url: `/events/${eventId}/guests/bulk/import`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: ['Guest', 'Event'],
    }),

    // Export guests to CSV
    exportGuestsToCSV: builder.query<Blob, { eventId: string; filters?: GuestExportFilters }>({
      query: ({ eventId, filters }) => ({
        url: `/events/${eventId}/guests/bulk/export`,
        params: filters,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    // Send bulk invitations
    sendBulkInvitations: builder.mutation<BulkInvitationResult, { eventId: string; invitations: BulkInvitationRequest }>({
      query: ({ eventId, invitations }) => ({
        url: `/events/${eventId}/guests/bulk/invite`,
        method: 'POST',
        body: invitations,
      }),
      invalidatesTags: ['Guest', 'Event'],
    }),

    // Update bulk RSVP
    updateBulkRSVP: builder.mutation<BulkRSVPUpdateResult, { eventId: string; rsvpData: BulkRSVPUpdateRequest }>({
      query: ({ eventId, rsvpData }) => ({
        url: `/events/${eventId}/guests/bulk/rsvp`,
        method: 'PATCH',
        body: rsvpData,
      }),
      invalidatesTags: ['Guest', 'Event'],
    }),

    // Delete bulk guests
    deleteBulkGuests: builder.mutation<BulkDeleteResult, { eventId: string; guestIds: string[] }>({
      query: ({ eventId, guestIds }) => ({
        url: `/events/${eventId}/guests/bulk`,
        method: 'DELETE',
        body: guestIds,
      }),
      invalidatesTags: ['Guest', 'Event'],
    }),

    // Validate CSV import
    validateCSVImport: builder.mutation<ImportValidationResult, { eventId: string; file: File }>({
      query: ({ eventId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return {
          url: `/events/${eventId}/guests/bulk/validate`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
    }),

    // Get CSV template
    getCSVTemplate: builder.query<Blob, { eventId: string }>({
      query: ({ eventId }) => ({
        url: `/events/${eventId}/guests/bulk/template`,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    // Get bulk operation status
    getBulkOperationStatus: builder.query<BulkOperationStatus, { eventId: string; operationId: string }>({
      query: ({ eventId, operationId }) => `/events/${eventId}/guests/bulk/status/${operationId}`,
      providesTags: ['BulkOperation'],
    }),

    // Get bulk operation history
    getBulkOperationHistory: builder.query<BulkOperationStatus[], { eventId: string; limit?: number }>({
      query: ({ eventId, limit = 10 }) => ({
        url: `/events/${eventId}/guests/bulk/history`,
        params: { limit },
      }),
      providesTags: ['BulkOperation', 'Event'],
    }),

    // Cancel bulk operation
    cancelBulkOperation: builder.mutation<{ cancelled: boolean }, { eventId: string; operationId: string }>({
      query: ({ eventId, operationId }) => ({
        url: `/events/${eventId}/guests/bulk/cancel/${operationId}`,
        method: 'POST',
      }),
      invalidatesTags: ['BulkOperation'],
    }),

    // Get export options
    getExportOptions: builder.query<ExportOptions, { eventId: string }>({
      query: ({ eventId }) => `/events/${eventId}/guests/bulk/export-options`,
      providesTags: ['BulkOperation', 'Event'],
    }),

    // Export with custom options
    exportWithOptions: builder.mutation<Blob, { eventId: string; options: ExportOptions }>({
      query: ({ eventId, options }) => ({
        url: `/events/${eventId}/guests/bulk/export-custom`,
        method: 'POST',
        body: options,
        responseHandler: (response: Response) => response.blob(),
      }),
    }),

    // Get import statistics
    getImportStatistics: builder.query<{
      total_imports: number;
      successful_imports: number;
      failed_imports: number;
      last_import: string;
      average_import_time: number;
    }, { eventId: string }>({
      query: ({ eventId }) => `/events/${eventId}/guests/bulk/import-stats`,
      providesTags: ['BulkOperation', 'Event'],
    }),

    // Preview CSV import
    previewCSVImport: builder.mutation<{
      valid_rows: CSVGuestFormat[];
      invalid_rows: Array<{
        row: number;
        data: CSVGuestFormat;
        errors: string[];
      }>;
      total_rows: number;
      valid_count: number;
      invalid_count: number;
    }, { eventId: string; file: File }>({
      query: ({ eventId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        return {
          url: `/events/${eventId}/guests/bulk/preview`,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
    }),
  }),
});

export const {
  useImportGuestsFromCSVMutation,
  useLazyExportGuestsToCSVQuery,
  useUpdateBulkRSVPMutation,
  useDeleteBulkGuestsMutation,
  useValidateCSVImportMutation,
  useLazyGetCSVTemplateQuery,
  useGetBulkOperationStatusQuery,
  useGetBulkOperationHistoryQuery,
  useCancelBulkOperationMutation,
  useLazyGetExportOptionsQuery,
  useExportWithOptionsMutation,
  useGetImportStatisticsQuery,
  usePreviewCSVImportMutation,
} = bulkOperationsApi;
