import type { fr } from './fr'

/**
 * Dictionnaire ANGLAIS. Typé sur les clés de `fr.ts` : une clé manquante ou en trop
 * ne compile pas.
 */
export const en: Record<keyof typeof fr, string> = {
  /* —— Common —— */
  'commun.chargement': 'Loading…',
  'commun.annuler': 'Cancel',
  'commun.supprimer': 'Delete',
  'commun.afficher': 'Show',
  'commun.masquer': 'Hide',
  'erreur.inattendue': 'An unexpected error occurred.',

  /* —— Language switcher —— */
  'langue.groupe': 'Language',
  'langue.fr': 'Français',
  'langue.en': 'English',

  /* —— Password —— */
  'mdp.afficher': 'Show password',
  'mdp.afficherConfirmation': 'Show password confirmation',

  /* —— Navigation —— */
  'nav.accueil': 'Home',
  'nav.projets': 'Projects',
  'nav.mesProjets': 'My projects',
  'nav.mesDemandes': 'My requests',
  'nav.bibliotheque': 'Library',
  'nav.talents': 'Talents',
  'nav.profil': 'My profile',
  'nav.principale': 'Main navigation',
  'nav.allerContenu': 'Skip to content',
  'nav.ouvrirMenu': 'Open menu',
  'nav.fermerMenu': 'Close menu',
  'nav.deconnexion': 'Log out',
  'nav.demandesAttente_one': '{count} pending join request',
  'nav.demandesAttente_other': '{count} pending join requests',

  /* —— Entry screen (sign in / sign up) —— */
  'auth.presentation': 'About AfricaBridge',
  'auth.accroche': 'Where African talent meets to build together.',
  'auth.description1':
    'AfricaBridge brings together African developers, designers and data scientists around projects that make an impact: agriculture, health, education, energy.',
  'auth.description2':
    'You create your profile, find the right people, join a team or start your own project. Then everything happens in one place: discussions, shared resources, comments.',

  /* —— Sign in —— */
  'connexion.titre': 'Sign in',
  'connexion.sansCompte': 'No account yet?',
  'connexion.lienInscription': 'Sign up',
  'connexion.email': 'Email address',
  'connexion.emailExemple': 'you@example.com',
  'connexion.motDePasse': 'Password',
  'connexion.seSouvenir': 'Remember me',
  'connexion.bouton': 'Sign in',
  'connexion.boutonEnCours': 'Signing in…',
  'connexion.tropDeTentatives': 'Too many attempts. Try again in {secondes} seconds.',
  'connexion.demo': 'Demo account: {email} · {motDePasse}',

  /* —— Sign up —— */
  'inscription.titre': 'Create an account',
  'inscription.dejaMembre': 'Already a member?',
  'inscription.lienConnexion': 'Sign in',
  'inscription.nom': 'Full name',
  'inscription.nomExemple': 'Eliana Lokoka',
  'inscription.motDePasseAide': 'At least 8 characters.',
  'inscription.confirmation': 'Confirm password',
  'inscription.pays': 'Country',
  'inscription.paysChoisir': 'Select your country',
  'inscription.bouton': 'Create my account',
  'inscription.boutonEnCours': 'Creating…',

  /* —— Page not found —— */
  'introuvable.titre': 'Page not found',
  'introuvable.texte': 'The requested address does not exist or has moved.',
  'introuvable.retour': 'Back to home',
}
