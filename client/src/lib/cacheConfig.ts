
export const cacheConfig = {
  lists: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  },
  details: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  },
  stats: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  messages: {
    staleTime: 30 * 1000, // 30 seconds - short for real-time feel
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
};
