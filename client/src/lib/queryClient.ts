import { QueryClient } from "@tanstack/react-query";

/**
 * The QueryClient instance for managing React Query state and caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

/**
 * HTTP method types for API requests
 */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Makes an API request with the specified method and data
 *
 * @param method - The HTTP method to use
 * @param url - The URL to make the request to (will be prefixed with correct base URL)
 * @param data - Optional data to include in the request body
 * @param options - Optional fetch options to override defaults
 * @returns A Promise that resolves to the fetch Response
 */
export async function apiRequest(
  method: HttpMethod,
  url: string,
  data?: any,
  options?: RequestInit
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const config: RequestInit = {
    method,
    headers,
    credentials: "include", // For cookie-based authentication
    ...options,
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    
    // Handle specific error responses
    if (!response.ok) {
      // You can add specific error handling here if needed
      // e.g., for authentication errors redirect to login
      if (response.status === 401 || response.status === 403) {
        // Check if we're already on the login page to avoid redirect loops
        if (!window.location.pathname.includes("/login")) {
          queryClient.clear();
          // We could redirect here but that's handled by the auth provider
        }
      }
    }
    
    return response;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
}

/**
 * Generic response type for API data
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Default fetcher function for React Query's useQuery hook
 */
export const defaultQueryFn = async <T>({ queryKey }: { queryKey: string[] }): Promise<T> => {
  const [url] = queryKey;
  const response = await apiRequest("GET", url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
};