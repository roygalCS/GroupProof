// IPFS Upload utilities using Web3.Storage or Pinata

export interface IPFSUploadResult {
  cid: string;
  url: string;
}

/**
 * Generate a mock CID for development when IPFS is not configured
 */
function generateMockCID(content: string): string {
  // Create a simple hash-like string from the content
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Create a fake CID-like string
  const timestamp = Date.now().toString(36);
  const hashStr = Math.abs(hash).toString(36);
  return `Qm${timestamp}${hashStr}MockCID${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Upload file to IPFS using Web3.Storage
 * Note: You'll need to set VITE_WEB3_STORAGE_TOKEN in your .env file
 * Falls back to mock implementation for development
 */
export async function uploadToIPFS(file: File): Promise<IPFSUploadResult> {
  const token = import.meta.env.VITE_WEB3_STORAGE_TOKEN;

  // If no token or placeholder token, use mock implementation
  if (!token || token === 'your_web3_storage_token_here') {
    console.warn('⚠️ IPFS: Using mock implementation (Web3.Storage not configured)');

    // Read file content to generate a deterministic-ish CID
    const content = await file.text();
    const mockCID = generateMockCID(content);

    console.log('📦 Mock IPFS Upload:', {
      fileName: file.name,
      size: file.size,
      mockCID,
      note: 'This is a development mock. Set VITE_WEB3_STORAGE_TOKEN for real IPFS uploads.'
    });

    return {
      cid: mockCID,
      url: `https://w3s.link/ipfs/${mockCID}`, // Mock URL (won't work but follows format)
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    const cid = data.cid;

    return {
      cid,
      url: `https://w3s.link/ipfs/${cid}`,
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    throw error;
  }
}

/**
 * Upload text/JSON to IPFS
 */
export async function uploadJSONToIPFS(data: object): Promise<IPFSUploadResult> {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const file = new File([blob], 'data.json', { type: 'application/json' });
  return uploadToIPFS(file);
}

/**
 * Get IPFS URL from CID
 */
export function getIPFSUrl(cid: string): string {
  return `https://w3s.link/ipfs/${cid}`;
}

/**
 * Fetch content from IPFS
 */
export async function fetchFromIPFS(cid: string): Promise<Response> {
  const url = getIPFSUrl(cid);
  return fetch(url);
}
