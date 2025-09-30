import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 60 * 1000,   // 1 хвилина вважаємо "свіжими"
      gcTime: 60 * 60 * 1000, // тримаємо в кеші до 60 хв
      keepPreviousData: true,
      throwOnError: false,
      networkMode: 'always',
    },
  },
});

export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'rsi-dashboard-cache',
});

export { PersistQueryClientProvider };
