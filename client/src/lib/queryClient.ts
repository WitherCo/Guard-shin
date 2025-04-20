import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Helper function for API requests
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function apiRequest(
  method: HttpMethod,
  url: string,
  data?: unknown,
  options?: RequestInit
) {
  const isFormData = data instanceof FormData;
  
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for authentication
    ...options,
  };

  if (data && method !== 'GET') {
    config.body = isFormData ? data as FormData : JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}