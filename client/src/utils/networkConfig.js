// List all peer backend nodes across your ZeroTier network
export const PEER_NODES = [
  "http://10.40.210.101:3000", // PC_1 Server
  "http://10.40.210.21:3000"   // PC_2 Server
];

// Helper to get the currently cached working node, defaulting to PC_1
export const getActiveBackendUrl = () => {
  return localStorage.getItem("active_backend_url") || PEER_NODES[0];
};

// Helper to rotate to the next available server node if one fails
export const rotateBackendNode = (currentUrl) => {
  const currentIndex = PEER_NODES.indexOf(currentUrl);
  const nextIndex = (currentIndex + 1) % PEER_NODES.length;
  const nextUrl = PEER_NODES[nextIndex];
  
  localStorage.setItem("active_backend_url", nextUrl);
  console.warn(`⚠️ Connection to ${currentUrl} failed. Switching fallback routing to: ${nextUrl}`);
  return nextUrl;
};