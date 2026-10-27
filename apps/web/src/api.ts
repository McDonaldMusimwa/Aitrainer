// Same-origin by default: the Vite dev server proxies /api to the backend.
// Set VITE_API_URL to call a backend on another origin instead.
const baseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(baseUrl + path, options);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Request failed. Please try again.');
  }
  return await response.json() as T;
}

export type Health = { status: string; service: string };

export const getHealth = () => request<Health>('/health');
