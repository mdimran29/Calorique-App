// services/queryClient.ts — Shared TanStack Query client configuration

import { QueryClient } from '@tanstack/react-query';
import { STALE_TIME_MS, GC_TIME_MS } from '../utils/constants';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          STALE_TIME_MS,
      gcTime:             GC_TIME_MS,
      retry:              2,
      refetchOnWindowFocus: true,
      refetchOnReconnect:   true,
    },
    mutations: {
      retry: 1,
    },
  },
});
