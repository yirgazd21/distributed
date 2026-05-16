import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getActiveBackendUrl, rotateBackendNode, PEER_NODES } from '../../utils/networkConfig'; 

// ─── SMART DYNAMIC BASE_URL EXPORT ───
// This acts exactly like a standard string so your existing code doesn't break,
// but it executes a functional lookup every time a component reads it!
export const BASE_URL = {
  toString: () => getActiveBackendUrl(),
  valueOf: () => getActiveBackendUrl()
};
// ─────────────────────────────────────

// ─── CUSTOM DYNAMIC CLUSTER BASE QUERY WRAPPER ───
const dynamicClusterBaseQuery = async (args, api, extraOptions) => {
  // Use the lookup utility directly here
  let activeUrl = getActiveBackendUrl();

  // Sanitize incoming query arguments if they contain hardcoded absolute backend IPs
  let adjustedArgs = typeof args === 'string' ? args : { ...args };
  if (typeof adjustedArgs === 'string') {
    PEER_NODES.forEach((node) => {
      if (adjustedArgs.startsWith(node) && node !== activeUrl) {
        adjustedArgs = adjustedArgs.replace(node, '');
      }
    });
  } else if (adjustedArgs.url) {
    PEER_NODES.forEach((node) => {
      if (adjustedArgs.url.startsWith(node) && node !== activeUrl) {
        adjustedArgs.url = adjustedArgs.url.replace(node, '');
      }
    });
  }

  // Build the base query instance dynamically using the current active IP string value
  const rawBaseQuery = fetchBaseQuery({
    baseUrl: activeUrl,
    prepareHeaders: (headers, { getState, endpoint }) => {
      const userToken = getState().auth?.userInfo?.token;
      const sellerToken = getState().sellerAuth?.sellerInfo?.token;
      const adminToken = getState().adminAuth?.adminInfo?.token;

      let token = userToken;
      const endpointLower = endpoint?.toLowerCase() || '';
      const isSellerAction = endpointLower.includes('seller') || endpointLower.includes('upload');
      const isAdminAction = endpointLower.includes('admin');

      if (isAdminAction && adminToken) {
        token = adminToken;
      } else if (isSellerAction && sellerToken) {
        token = sellerToken;
      } else if (sellerToken && !userToken) {
        token = sellerToken;
      } else if (adminToken && !userToken && !sellerToken) {
        token = adminToken;
      }

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      return headers;
    },
  });

  let result = await rawBaseQuery(adjustedArgs, api, extraOptions);

  if (result.error && (result.error.status === 'FETCH_ERROR' || result.error.status === 503)) {
    console.warn(`🚨 RTK Query Cluster Watchdog: Node [${activeUrl}] down. Rotating routes...`);

    const fallbackUrl = rotateBackendNode(activeUrl);

    const fallbackBaseQuery = fetchBaseQuery({
      baseUrl: fallbackUrl,
      prepareHeaders: (headers, { getState, endpoint }) => {
        const userToken = getState().auth?.userInfo?.token;
        const sellerToken = getState().sellerAuth?.sellerInfo?.token;
        const adminToken = getState().adminAuth?.adminInfo?.token;

        let token = userToken;
        const endpointLower = endpoint?.toLowerCase() || '';
        const isSellerAction = endpointLower.includes('seller') || endpointLower.includes('upload');
        const isAdminAction = endpointLower.includes('admin');

        if (isAdminAction && adminToken) {
          token = adminToken;
        } else if (isSellerAction && sellerToken) {
          token = sellerToken;
        } else if (sellerToken && !userToken) {
          token = sellerToken;
        } else if (adminToken && !userToken && !sellerToken) {
          token = adminToken;
        }

        if (token) {
          headers.set('authorization', `Bearer ${token}`);
        }

        return headers;
      },
    });

    result = await fallbackBaseQuery(adjustedArgs, api, extraOptions);
  }

  return result;
};

// ─── INITIALIZE CENTRALIZED API SLICE ───
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: dynamicClusterBaseQuery,
  tagTypes: [
    'Product', 'Category', 'Order', 'User', 'Favorites', 'BrowseHistory', 
    'seller', 'SellerProduct', 'SellerOrder', 'AdminSeller', 'AdminUser', 
    'AdminOrder', 'AdminFinance', 'AdminSupport'
  ],
  endpoints: (builder) => ({}),
});