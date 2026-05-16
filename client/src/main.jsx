import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // Import Provider
import store from './store/store.js';   // Import Store
import App from './App.jsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.jsx';

// ─── CENTRALIZED AXIOS FAILOVER ROUTER ──────────────────────────────
import axios from 'axios';
import { getActiveBackendUrl, rotateBackendNode, PEER_NODES } from './utils/networkConfig'; 

// 1. Outgoing Request Interceptor: Intercepts and corrects hardcoded target paths on the fly
axios.interceptors.request.use(
  (config) => {
    const activeUrl = getActiveBackendUrl(); // Reads the working IP from localStorage

    if (config.url) {
      PEER_NODES.forEach((node) => {
        // If the file used a hardcoded absolute address pointing to an offline node...
        if (config.url.startsWith(node) && node !== activeUrl) {
          // ...dynamically swap the prefix string to target the live active network node
          config.url = config.url.replace(node, activeUrl);
          console.log(`🎯 Routing hardcoded request dynamically to active node: ${config.url}`);
        }
      });
    }

    // Sanitize the fallback baseURL context if initialized globally elsewhere
    if (config.baseURL) {
      PEER_NODES.forEach((node) => {
        if (config.baseURL.startsWith(node) && node !== activeUrl) {
          config.baseURL = activeUrl;
        }
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Incoming Response Interceptor: Catches connection failures and executes immediate node rotation
axios.interceptors.response.use(
  (response) => response, // Let successful operations pass straight through cleanly
  async (error) => {
    const originalRequest = error.config;

    // Detect network connection failure states (like ERR_CONNECTION_REFUSED or timeouts)
    if (!error.response || error.code === 'ERR_NETWORK') {
      console.warn(`🚨 Cluster Watchdog: Network error captured on target endpoint: ${originalRequest.url}`);

      // Internal retry counter prevents an infinite loop if all physical cluster machines are down
      originalRequest._clusterRetryCount = originalRequest._clusterRetryCount || 0;

      if (originalRequest._clusterRetryCount < PEER_NODES.length) {
        originalRequest._clusterRetryCount++;

        // Identify which node address just dropped connections
        const failedNode = PEER_NODES.find(node => originalRequest.url.startsWith(node)) || getActiveBackendUrl();

        // Shift the localStorage active pointer and return the standby peer IP string
        const fallbackUrl = rotateBackendNode(failedNode);

        // Patch the request layout parameters to point to the freshly elected live node
        if (originalRequest.url.startsWith(failedNode)) {
          originalRequest.url = originalRequest.url.replace(failedNode, fallbackUrl);
        } else {
          // If the underlying module fired a relative path, append it onto the fallbackUrl base
          originalRequest.url = `${fallbackUrl}${originalRequest.url.startsWith('/') ? '' : '/'}${originalRequest.url}`;
        }

        if (originalRequest.baseURL) {
          originalRequest.baseURL = fallbackUrl;
        }

        console.log(`🔄 Recovering connection. Re-sending payload execution over to: ${originalRequest.url}`);
        
        // Re-execute the request globally using the root axios context
        return axios(originalRequest);
      }
    }

    // Maintain regular operational errors (like 401 Unauthorized or 400 Bad Request)
    return Promise.reject(error);
  }
);
// ───────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}> {/* Wrap App */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);