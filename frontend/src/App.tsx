import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './components/layout/AppShell'
import { RequiertSession } from './features/auth/RequiertSession'
import { SessionProvider } from './features/auth/SessionProvider'
import { Accueil } from './pages/accueil/Accueil'
import { Connexion } from './pages/auth/Connexion'
import { Inscription } from './pages/auth/Inscription'
import { Atelier } from './pages/atelier/Atelier'
import { MonProfil } from './pages/profil/MonProfil'
import { ModifierProfil } from './pages/profil/ModifierProfil'

/**
 * Configuration globale de TanStack Query.
 *
 * `retry: 1` : une seule nouvelle tentative en cas d'échec réseau — la
 * session elle-même est déjà couverte (retry désactivé dans SessionProvider).
 * `refetchOnWindowFocus: false` : on ne relance pas les requêtes à chaque
 * retour d'onglet, sauf pour le polling des messages (géré explicitement).
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})

/**
 * Racine de l'application.
 *
 * Structure en couches :
 *   QueryClientProvider  → les données
 *   BrowserRouter        → les routes
 *   SessionProvider      → l'état de session (sous le routeur : la redirection
 *                          de RequiertSession a besoin du routeur)
 *
 * Routes publiques : /connexion, /inscription, /atelier (page de développement).
 * Routes protégées : un layout `RequiertSession` → `AppShell` → les pages.
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionProvider>
          <Routes>
            <Route path="/connexion" element={<Connexion />} />
            <Route path="/inscription" element={<Inscription />} />
            <Route path="/atelier" element={<Atelier />} />

            <Route
              element={
                <RequiertSession>
                  <AppShell />
                </RequiertSession>
              }
            >
              <Route index element={<Accueil />} />
              <Route path="profil" element={<MonProfil />} />
              <Route path="profil/modifier" element={<ModifierProfil />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
