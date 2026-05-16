import { apiSlice } from './apiSlice';

const USERS_URL = '/api/users'; // Helper constant

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🔐 Login
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/login`,
        method: 'POST',
        body: data,
      }),
    }),
    // 📝 Register (Default is Buyer)
    register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/register`,
        method: 'POST',
        body: data,
      }),
    }),
    googleAuth: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/google`,
        method: 'POST',
        body: data,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/forgot-password`,
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `${USERS_URL}/reset-password/${token}`,
        method: 'POST',
        body: { password },
      }),
    }),
    // 🚪 Logout (Server-side clear cookie if needed, but mostly client-side)
    logout: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/logout`,
        method: 'POST',
      }),
    }),

    profile: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: 'PUT',
        body: data,
      }),
    }),
    // Favorites endpoints
    getUserFavorites: builder.query({
      query: () => `${USERS_URL}/favorites`,
      providesTags: ['Favorites'],
    }),
    addToFavorites: builder.mutation({
      query: (productId) => ({
        url: `${USERS_URL}/favorites`,
        method: 'POST',
        body: { productId },
      }),
      invalidatesTags: ['Favorites'],
    }),
    removeFromFavorites: builder.mutation({
      query: (productId) => ({
        url: `${USERS_URL}/favorites/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Favorites'],
    }),
    // Browse history endpoints
    getUserBrowseHistory: builder.query({
      query: () => `${USERS_URL}/browse-history`,
      providesTags: ['BrowseHistory'],
    }),
    addToBrowseHistory: builder.mutation({
      query: (productId) => ({
        url: `${USERS_URL}/browse-history`,
        method: 'POST',
        body: { productId },
      }),
      invalidatesTags: ['BrowseHistory'],
    }),
    removeFromBrowseHistory: builder.mutation({
      query: (productId) => ({
        url: `${USERS_URL}/browse-history/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BrowseHistory'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleAuthMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useProfileMutation,
  useGetUserFavoritesQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useGetUserBrowseHistoryQuery,
  useAddToBrowseHistoryMutation,
  useRemoveFromBrowseHistoryMutation,
} = usersApiSlice;
