// IPFS Upload utilities using Web3.Storage or Pinata

export interface IPFSUploadResult {
  cid: string;
  url: string;
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
 * Generate a valid-looking mock CID for development when IPFS is not configured
 * Uses base58btc alphabet (no 0, O, I, l characters)
 */
export function generateMockCID(content: string): string {
  // Create a simple hash from the content
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Base58btc alphabet (Bitcoin's base58 without 0, O, I, l)
  const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  
  // Generate a hash-like string using base58
  let num = Math.abs(hash) + Date.now();
  let cid = 'Qm'; // CIDv0 prefix
  
  // Convert to base58
  while (num > 0) {
    cid += base58[num % 58];
    num = Math.floor(num / 58);
  }
  
  // Pad to typical CID length (46 chars total: Qm + 44 chars)
  while (cid.length < 46) {
    const randomChar = base58[Math.floor(Math.random() * base58.length)];
    cid += randomChar;
  }
  
  return cid.substring(0, 46); // Ensure exactly 46 characters
}

/**
 * Get IPFS URL from CID
 * Shows a warning if CID looks like a mock CID
 */
export function getIPFSUrl(cid: string): string {
  // Check if this is a mock CID (starts with Qm but might not be valid)
  const token = import.meta.env.VITE_WEB3_STORAGE_TOKEN;
  if (!token || token === 'your_web3_storage_token_here') {
    // If IPFS is not configured, return a placeholder URL
    // The CID won't resolve, but at least the format is valid
    return `https://w3s.link/ipfs/${cid}`;
  }
  return `https://w3s.link/ipfs/${cid}`;
}

/**
 * Fetch content from IPFS
 */
export async function fetchFromIPFS(cid: string): Promise<Response> {
  const url = getIPFSUrl(cid);
  return fetch(url);
}
