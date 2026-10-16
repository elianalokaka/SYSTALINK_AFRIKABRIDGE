import { Atelier } from './pages/atelier/Atelier'

/**
 * Racine de l'application.
 *
 * TEMPORAIRE : on affiche l'atelier du design system, qui prouve que les
 * primitives existent et possèdent tous leurs états.
 *
 * Le routage (react-router) et les vrais écrans arriveront avec le module
 * `feat/api-et-auth`. À ce moment-là, l'atelier passera derrière une route de
 * développement au lieu d'être la racine.
 */
function App() {
  return <Atelier />
}

export default App
