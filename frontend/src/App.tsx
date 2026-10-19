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
import { MesProjets } from './pages/projets/MesProjets'
import { ProjetCreation } from './pages/projets/ProjetCreation'
import { ProjetDetail } from './pages/projets/ProjetDetail'
import { ProjetEdition } from './pages/projets/ProjetEdition'
import { Projets } from './pages/projets/Projets'

/**
 * Configuration globale de TanStack Query.
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
              <Route path="projets" element={<Projets />} />
              <Route path="projets/nouveau" element={<ProjetCreation />} />
              <Route path="projets/:id" element={<ProjetDetail />} />
              <Route path="projets/:id/modifier" element={<ProjetEdition />} />
              <Route path="mes-projets" element={<MesProjets />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SessionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
