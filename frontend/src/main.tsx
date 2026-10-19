import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* Poppins, auto-hébergée. On n'importe QUE les graisses réellement utilisées
   dans l'interface (400, 500, 600, 700) : chaque graisse inutilisée serait un
   fichier de police téléchargé pour rien. */
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'

import './index.css'
import App from './App.tsx'

/**
 * Démarrage de l'application.
 *
 * MSW démarre AVANT le rendu, et uniquement si `VITE_USE_MOCKS === 'true'`.
 * C'est le SEUL endroit du projet qui connaît l'existence des mocks : aucun
 * composant ne sait qu'une simulation existe.
 *
 * MSW v3 : plus d'option `onUnhandledRequest`. Les requêtes non mockées
 * (fichiers de police, HMR) sont traversées automatiquement — et les assets
 * courants sont ignorés d'office par `isCommonAssetRequest`.
 */
async function demarrer() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { demarrerMocks } = await import('./mocks/browser')
    await demarrerMocks()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

void demarrer()
