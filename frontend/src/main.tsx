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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
