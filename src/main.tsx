import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

import './index.css'
import './lib/install-prompt'
import App from './App.tsx'
import UpdatePrompt from './components/UpdatePrompt.tsx'
import AuthProvider from './features/auth/AuthProvider.tsx'
import { CACHE_KEY, CACHE_MAX_AGE, PERSISTED_KEYS } from './lib/query-cache'

const queryClient = new QueryClient({
  defaultOptions: {
    // gcTime >= maxAge du cache persistant, sinon les données restaurées sont supprimées.
    queries: { staleTime: 60_000, gcTime: CACHE_MAX_AGE, retry: 1, refetchOnWindowFocus: false },
    // Hors connexion, une écriture échoue tout de suite au lieu de rester en attente.
    mutations: { networkMode: 'always' },
  },
})

const persister = createSyncStoragePersister({ storage: window.localStorage, key: CACHE_KEY })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_MAX_AGE,
        // Une nouvelle version de l'application invalide l'ancien cache (formats de données).
        buster: __APP_BUILD__,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && PERSISTED_KEYS.includes(String(query.queryKey[0])),
        },
      }}
    >
      <AuthProvider>
        <App />
        <UpdatePrompt />
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
