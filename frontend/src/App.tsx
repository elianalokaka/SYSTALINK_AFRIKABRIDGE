/**
 * Racine de l'application.
 *
 * Écran volontairement minimal : il sert à vérifier que la chaîne
 * React + TypeScript + Tailwind + tokens fonctionne, avant d'écrire les vrais
 * écrans — qui se construiront composant par composant.
 *
 * Contrainte du projet : aucune valeur en dur.
 * Ici, tout passe par les tokens définis dans `src/index.css`.
 */
function App() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-0 px-6">
      <h1 className="text-center text-2xl font-medium tracking-tight text-fg-1">
        Bienvenue au projet <span className="text-accent">AfricaBridge</span>
      </h1>
    </main>
  )
}

export default App
