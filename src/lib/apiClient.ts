// API Client - Centralized fetch wrapper with authentication
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Server availability tracking
let serverAvailable = true;
let serverChecked = false;

export async function checkServerAvailability(): Promise<boolean> {
  if (serverChecked) return serverAvailable;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE}/settings`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    serverAvailable = response.ok;
  } catch {
    serverAvailable = false;
  }
  serverChecked = true;
  console.log(`Server availability: ${serverAvailable ? 'Online' : 'Offline (using localStorage fallback)'}`);
  return serverAvailable;
}

export function isServerAvailable(): boolean {
  return serverAvailable;
}

// Token management
let authToken: string | null = null;

export function setAuthToken(token: string | null, rememberMe: boolean = true): void {
  authToken = token;

  // Clear from both storages first
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');

  if (token) {
    if (rememberMe) {
      localStorage.setItem('auth_token', token);
    } else {
      sessionStorage.setItem('auth_token', token);
    }
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    // Check localStorage first (remember me), then sessionStorage
    authToken = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }
  return authToken;
}

export function clearAuthToken(): void {
  authToken = null;
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
}

// Fetch wrapper with error handling and auth
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// GET request
export async function get<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint);
}

// POST request
export async function post<T>(endpoint: string, data?: any): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// PUT request
export async function put<T>(endpoint: string, data?: any): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// DELETE request
export async function del<T>(endpoint: string): Promise<T> {
  return fetchApi<T>(endpoint, {
    method: 'DELETE',
  });
}

// File upload
export async function uploadFile(file: File): Promise<{ url: string; filename: string; size: number; type: string }> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

// Media upload with dimensions
export async function uploadMedia(
  file: File,
  width?: number,
  height?: number
): Promise<any> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);
  // Backend doesn't strictly use width/height in upload, but we can keep them if needed later.
  // CRITICAL FIX: Endpoint must be /upload, not /media

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

// Get full URL for uploads
export function getUploadUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) {
    return path;
  }
  const baseUrl = API_BASE.replace('/api', '');
  return `${baseUrl}${path}`;
}

export { API_BASE };
