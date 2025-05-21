import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { baseHost } from "./host";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = (await res.text()) || res.statusText;
      console.error(`throwIfResNotOk error: ${res.status} - ${text}`);
      throw new Error(`${res.status}: ${text}`);
    } catch (error) {
      console.error('throwIfResNotOk parsing error:', error);
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use the provided external API URL from host.ts
  const fullUrl = url.startsWith("/") ? `${baseHost}${url}` : url;
  
  console.log(`apiRequest: ${method} to ${fullUrl}`);
  
  // Get the auth token from localStorage
  const token = localStorage.getItem('token');
  
  const headers: Record<string, string> = {
    ...(data ? { "Content-Type": "application/json" } : {}),
  };
  
  // Add auth token if it exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  console.log('apiRequest headers:', headers);
  console.log('apiRequest data:', data);
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      // Don't use credentials include with CORS - causes preflight issues
      // credentials: "include",
    });
    
    console.log(`apiRequest response status: ${res.status}`);
    
    if (!res.ok) {
      console.error(`API Error: ${res.status} ${res.statusText}`);
      const errorText = await res.text();
      console.error(`Error response body: ${errorText}`);
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }
    
    return res;
  } catch (error) {
    console.error('apiRequest fetch error:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use the provided external API URL from host.ts
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith("/") ? `${baseHost}${url}` : url;
    
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    
    // Prepare headers
    const headers: Record<string, string> = {};
    
    // Add auth token if it exists
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const res = await fetch(fullUrl, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
