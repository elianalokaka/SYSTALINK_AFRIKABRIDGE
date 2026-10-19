/// <reference types="vite/client" />

/**
 * Variables d'environnement du projet, typées.
 *
 * Sans ce fichier, `import.meta.env.VITE_*` n'est pas reconnu par TypeScript.
 * Chaque variable ajoutée ici doit être déclarée — c'est ce qui évite les
 * fautes de frappe silencieuses (`VITE_USE_MOCK` au lieu de `VITE_USE_MOCKS`).
 */
interface ImportMetaEnv {
  /** `'true'` pour activer les mocks MSW. Toute autre valeur les désactive. */
  readonly VITE_USE_MOCKS?: string
  /**
   * RACINE du serveur, **SANS** `/api/v1`.
   * Exemple : `http://localhost:8000`.
   * Vide en production (URLs relatives, même origine que la page).
   */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
