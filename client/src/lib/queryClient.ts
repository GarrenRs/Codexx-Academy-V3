import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = queryKey[0] as string;
    const additionalSegments: string[] = [];
    const mergedParams: Record<string, unknown> = {};

    for (let i = 1; i < queryKey.length; i++) {
      const segment = queryKey[i];
      if (typeof segment === "string" || typeof segment === "number") {
        additionalSegments.push(String(segment));
      } else if (typeof segment === "object" && segment !== null && !Array.isArray(segment)) {
        Object.assign(mergedParams, segment);
      }
    }

    let finalUrl = baseUrl;
    if (additionalSegments.length > 0) {
      finalUrl = `${baseUrl}/${additionalSegments.join("/")}`;
    }

    const paramKeys = Object.keys(mergedParams);
    if (paramKeys.length > 0) {
      const searchParams = new URLSearchParams();
      paramKeys.forEach((key) => {
        const value = mergedParams[key];
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl = `${finalUrl}?${queryString}`;
      }
    }

    const res = await fetch(finalUrl, {
      credentials: "include",
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
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache garbage collection
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: false,
    },
  },
});

// Custom cache times for different query types
export const cacheConfig = {
  // User data - cache longer as it changes less frequently
  user: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  },
  // Stats - cache for 2 minutes
  stats: {
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  },
  // Lists (rooms, groups, etc.) - cache for 3 minutes
  lists: {
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  },
  // Real-time data (messages) - shorter cache
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000,
  },
};