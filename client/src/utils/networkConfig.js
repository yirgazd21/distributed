// List all peer backend nodes across your ZeroTier network
export const PEER_NODES = [
  "http://10.40.210.101:3000", // PC_1 Server
  "http://10.40.210.21:3000"   // PC_2 Server
];

// Helper to get the currently cached working node, defaulting to PC_1
// src/utils/networkConfig.js

export const getActiveBackendUrl = () => {
  return localStorage.getItem('activeBackendUrl') || 'http://10.40.210.101:3000';
};

export const rotateBackendNode = (currentUrl) => {
  // If current URL points to PC_2 (.21), switch to PC_1 (.101), and vice versa
  const nextUrl = currentUrl.includes('10.40.210.21') 
    ? 'http://10.40.210.101:3000' 
    : 'http://10.40.210.21:3000';
    
  localStorage.setItem('activeBackendUrl', nextUrl);
  return nextUrl;
};


export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // If the image path is already an absolute URL, return it directly
  if (imagePath.startsWith('http')) return imagePath;

  // Otherwise, attach it dynamically to the live cluster node address
  return `${getActiveBackendUrl()}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};