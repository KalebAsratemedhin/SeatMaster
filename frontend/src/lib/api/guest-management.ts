/**
 * Guest management API endpoints (categories, tags, communication, plus-ones)
 */

import { baseApi } from './base';
import type {
  // Categories
  GuestCategory,
  CreateGuestCategoryRequest,
  UpdateGuestCategoryRequest,
  GuestCategoryFilters,
  GuestCategoryAssignment,
  AssignGuestToCategoryRequest,
  
  // Tags
  GuestTag,
  CreateGuestTagRequest,
  UpdateGuestTagRequest,
  GuestTagFilters,
  GuestTagAssignment,
  AssignGuestToTagRequest,
  
  // Communication
  GuestCommunication,
  CreateCommunicationRequest,
  UpdateCommunicationRequest,
  CommunicationResponse,
  CommunicationFilters,
  CommunicationStats,
  ScheduleCommunicationRequest,
  
  // Plus Ones
  PlusOne,
  CreatePlusOneRequest,
  UpdatePlusOneRequest,
  ApprovePlusOneRequest,
  RejectPlusOneRequest,
  
  // Bulk operations
  BulkGuestOperationRequest,
  BulkGuestOperationResult,
  
  // Guest
  Guest,
  
  PaginatedResponse,
} from '@/types';

export const guestManagementApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Guest Categories
    getGuestCategories: builder.query<PaginatedResponse<GuestCategory>, { eventId: string; filters?: GuestCategoryFilters }>({
      query: ({ eventId, filters }) => ({
        url: `/events/${eventId}/categories`,
        params: filters,
      }),
      providesTags: ['GuestCategory', 'Event'],
    }),

    getGuestCategory: builder.query<GuestCategory, { eventId: string; categoryId: string }>({
      query: ({ eventId, categoryId }) => `/events/${eventId}/categories/${categoryId}`,
      providesTags: ['GuestCategory'],
    }),

    createGuestCategory: builder.mutation<GuestCategory, { eventId: string; categoryData: CreateGuestCategoryRequest }>({
      query: ({ eventId, categoryData }) => ({
        url: `/events/${eventId}/categories`,
        method: 'POST',
        body: categoryData,
      }),
      invalidatesTags: ['GuestCategory', 'Event'],
    }),

    updateGuestCategory: builder.mutation<GuestCategory, { eventId: string; categoryId: string; updates: UpdateGuestCategoryRequest }>({
      query: ({ eventId, categoryId, updates }) => ({
        url: `/events/${eventId}/categories/${categoryId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['GuestCategory'],
    }),

    deleteGuestCategory: builder.mutation<void, { eventId: string; categoryId: string }>({
      query: ({ eventId, categoryId }) => ({
        url: `/events/${eventId}/categories/${categoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GuestCategory'],
    }),

    assignGuestToCategory: builder.mutation<GuestCategoryAssignment, { eventId: string; categoryId: string; assignmentData: AssignGuestToCategoryRequest }>({
      query: ({ eventId, categoryId, assignmentData }) => ({
        url: `/events/${eventId}/categories/${categoryId}/guests`,
        method: 'POST',
        body: assignmentData,
      }),
      invalidatesTags: ['GuestCategory', 'Guest', 'Event'],
    }),

    removeGuestFromCategory: builder.mutation<void, { eventId: string; categoryId: string; guestId: string }>({
      query: ({ eventId, categoryId, guestId }) => ({
        url: `/events/${eventId}/categories/${categoryId}/guests/${guestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GuestCategory', 'Guest', 'Event'],
    }),

    getGuestsByCategory: builder.query<Guest[], { eventId: string; categoryId: string }>({
      query: ({ eventId, categoryId }) => `/events/${eventId}/categories/${categoryId}/guests`,
      providesTags: ['Guest', 'GuestCategory'],
    }),

    // Guest Tags
    getGuestTags: builder.query<PaginatedResponse<GuestTag>, { eventId: string; filters?: GuestTagFilters }>({
      query: ({ eventId, filters }) => ({
        url: `/events/${eventId}/tags`,
        params: filters,
      }),
      providesTags: ['GuestTag', 'Event'],
    }),

    createGuestTag: builder.mutation<GuestTag, { eventId: string; tagData: CreateGuestTagRequest }>({
      query: ({ eventId, tagData }) => ({
        url: `/events/${eventId}/tags`,
        method: 'POST',
        body: tagData,
      }),
      invalidatesTags: ['GuestTag', 'Event'],
    }),

    updateGuestTag: builder.mutation<GuestTag, { eventId: string; tagId: string; updates: UpdateGuestTagRequest }>({
      query: ({ eventId, tagId, updates }) => ({
        url: `/events/${eventId}/tags/${tagId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['GuestTag'],
    }),

    deleteGuestTag: builder.mutation<void, { eventId: string; tagId: string }>({
      query: ({ eventId, tagId }) => ({
        url: `/events/${eventId}/tags/${tagId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GuestTag'],
    }),

    assignGuestToTag: builder.mutation<GuestTagAssignment, { eventId: string; tagId: string; assignmentData: AssignGuestToTagRequest }>({
      query: ({ eventId, tagId, assignmentData }) => ({
        url: `/events/${eventId}/tags/${tagId}/guests`,
        method: 'POST',
        body: assignmentData,
      }),
      invalidatesTags: ['GuestTag', 'Guest', 'Event'],
    }),

    removeGuestFromTag: builder.mutation<void, { eventId: string; tagId: string; guestId: string }>({
      query: ({ eventId, tagId, guestId }) => ({
        url: `/events/${eventId}/tags/${tagId}/guests/${guestId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GuestTag', 'Guest', 'Event'],
    }),

    getGuestsByTag: builder.query<Guest[], { eventId: string; tagId: string }>({
      query: ({ eventId, tagId }) => `/events/${eventId}/tags/${tagId}/guests`,
      providesTags: ['Guest', 'GuestTag'],
    }),

    // Guest Communication
    getCommunications: builder.query<PaginatedResponse<CommunicationResponse>, { eventId: string; filters?: CommunicationFilters }>({
      query: ({ eventId, filters }) => ({
        url: `/events/${eventId}/communications`,
        params: filters,
      }),
      providesTags: ['GuestCommunication', 'Event'],
    }),

    getCommunication: builder.query<CommunicationResponse, { eventId: string; communicationId: string }>({
      query: ({ eventId, communicationId }) => `/events/${eventId}/communications/${communicationId}`,
      providesTags: ['GuestCommunication'],
    }),

    createCommunication: builder.mutation<GuestCommunication, { eventId: string; communicationData: CreateCommunicationRequest }>({
      query: ({ eventId, communicationData }) => ({
        url: `/events/${eventId}/communications`,
        method: 'POST',
        body: communicationData,
      }),
      invalidatesTags: ['GuestCommunication', 'Event'],
    }),

    updateCommunication: builder.mutation<GuestCommunication, { eventId: string; communicationId: string; updates: UpdateCommunicationRequest }>({
      query: ({ eventId, communicationId, updates }) => ({
        url: `/events/${eventId}/communications/${communicationId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['GuestCommunication'],
    }),

    deleteCommunication: builder.mutation<void, { eventId: string; communicationId: string }>({
      query: ({ eventId, communicationId }) => ({
        url: `/events/${eventId}/communications/${communicationId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GuestCommunication'],
    }),

    sendCommunication: builder.mutation<GuestCommunication, { eventId: string; communicationId: string }>({
      query: ({ eventId, communicationId }) => ({
        url: `/events/${eventId}/communications/${communicationId}/send`,
        method: 'POST',
      }),
      invalidatesTags: ['GuestCommunication'],
    }),

    scheduleCommunication: builder.mutation<GuestCommunication, { eventId: string; communicationId: string; scheduleData: ScheduleCommunicationRequest }>({
      query: ({ eventId, communicationId, scheduleData }) => ({
        url: `/events/${eventId}/communications/${communicationId}/schedule`,
        method: 'POST',
        body: scheduleData,
      }),
      invalidatesTags: ['GuestCommunication'],
    }),

    getCommunicationStats: builder.query<CommunicationStats, { eventId: string; communicationId: string }>({
      query: ({ eventId, communicationId }) => `/events/${eventId}/communications/${communicationId}/stats`,
      providesTags: ['GuestCommunication'],
    }),

    // Plus Ones
    getPlusOnes: builder.query<PlusOne[], { guestId: string }>({
      query: ({ guestId }) => `/guests/${guestId}/plus-ones`,
      providesTags: ['PlusOne', 'Guest'],
    }),

    createPlusOne: builder.mutation<PlusOne, { guestId: string; plusOneData: CreatePlusOneRequest }>({
      query: ({ guestId, plusOneData }) => ({
        url: `/guests/${guestId}/plus-ones`,
        method: 'POST',
        body: plusOneData,
      }),
      invalidatesTags: ['PlusOne', 'Guest'],
    }),

    updatePlusOne: builder.mutation<PlusOne, { guestId: string; plusOneId: string; updates: UpdatePlusOneRequest }>({
      query: ({ guestId, plusOneId, updates }) => ({
        url: `/guests/${guestId}/plus-ones/${plusOneId}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['PlusOne'],
    }),

    deletePlusOne: builder.mutation<void, { guestId: string; plusOneId: string }>({
      query: ({ guestId, plusOneId }) => ({
        url: `/guests/${guestId}/plus-ones/${plusOneId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PlusOne'],
    }),

    approvePlusOne: builder.mutation<PlusOne, { guestId: string; plusOneId: string; approvalData: ApprovePlusOneRequest }>({
      query: ({ guestId, plusOneId, approvalData }) => ({
        url: `/guests/${guestId}/plus-ones/${plusOneId}/approve`,
        method: 'POST',
        body: approvalData,
      }),
      invalidatesTags: ['PlusOne'],
    }),

    rejectPlusOne: builder.mutation<PlusOne, { guestId: string; plusOneId: string; rejectionData: RejectPlusOneRequest }>({
      query: ({ guestId, plusOneId, rejectionData }) => ({
        url: `/guests/${guestId}/plus-ones/${plusOneId}/reject`,
        method: 'POST',
        body: rejectionData,
      }),
      invalidatesTags: ['PlusOne'],
    }),

    // Bulk operations
    bulkGuestOperation: builder.mutation<BulkGuestOperationResult, { eventId: string; operationData: BulkGuestOperationRequest }>({
      query: ({ eventId, operationData }) => ({
        url: `/events/${eventId}/guests/bulk-operation`,
        method: 'POST',
        body: operationData,
      }),
      invalidatesTags: ['Guest', 'GuestCategory', 'GuestTag', 'Event'],
    }),
  }),
});

export const {
  // Category hooks
  useGetGuestCategoriesQuery,
  useGetGuestCategoryQuery,
  useCreateGuestCategoryMutation,
  useUpdateGuestCategoryMutation,
  useDeleteGuestCategoryMutation,
  useAssignGuestToCategoryMutation,
  useRemoveGuestFromCategoryMutation,
  useGetGuestsByCategoryQuery,
  
  // Tag hooks
  useGetGuestTagsQuery,
  useCreateGuestTagMutation,
  useUpdateGuestTagMutation,
  useDeleteGuestTagMutation,
  useAssignGuestToTagMutation,
  useRemoveGuestFromTagMutation,
  useGetGuestsByTagQuery,
  
  // Communication hooks
  useGetCommunicationsQuery,
  useGetCommunicationQuery,
  useCreateCommunicationMutation,
  useUpdateCommunicationMutation,
  useDeleteCommunicationMutation,
  useSendCommunicationMutation,
  useScheduleCommunicationMutation,
  useGetCommunicationStatsQuery,
  
  // Plus One hooks
  useGetPlusOnesQuery,
  useCreatePlusOneMutation,
  useUpdatePlusOneMutation,
  useDeletePlusOneMutation,
  useApprovePlusOneMutation,
  useRejectPlusOneMutation,
  
  // Bulk operation hooks
  useBulkGuestOperationMutation,
} = guestManagementApi;
