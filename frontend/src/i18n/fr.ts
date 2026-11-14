/**
 * Dictionnaire FRANÇAIS — la LANGUE DE RÉFÉRENCE.
 *
 * Toute nouvelle phrase s'ajoute ICI d'abord ; `en.ts` est typé sur ces clés :
 * oublier une traduction anglaise est une ERREUR DE COMPILATION (`npm run build`),
 * pas un trou découvert en démonstration.
 *
 * Conventions
 *  - Clés : `zone.element` en camelCase (`connexion.titre`).
 *  - Variables : `{nom}`  → `t('cle', { nom: 'Aminata' })`.
 *  - Pluriels : deux clés suffixées `_one` / `_other`, appelées avec `{ count }`.
 *    `t('nav.demandesAttente', { count: 3 })` choisit selon la langue active.
 *  - Ne traduit PAS : les contenus écrits par les utilisateurs (bio, messages,
 *    commentaires…) ni les messages d'erreur de validation renvoyés par le serveur.
 *
 * Voir `INTEGRATION.md` § 10 (internationalisation).
 */
export const fr = {
  /* —— Commun —— */
  'commun.chargement': 'Chargement…',
  'commun.annuler': 'Annuler',
  'commun.supprimer': 'Supprimer',
  'commun.afficher': 'Afficher',
  'commun.masquer': 'Masquer',
  'erreur.inattendue': 'Une erreur inattendue est survenue.',

  /* —— Sélecteur de langue —— */
  'langue.groupe': 'Langue',
  'langue.fr': 'Français',
  'langue.en': 'English',

  /* —— Mot de passe —— */
  'mdp.afficher': 'Afficher le mot de passe',
  'mdp.afficherConfirmation': 'Afficher la confirmation du mot de passe',

  /* —— Navigation —— */
  'nav.accueil': 'Accueil',
  'nav.projets': 'Projets',
  'nav.mesProjets': 'Mes projets',
  'nav.mesDemandes': 'Mes demandes',
  'nav.bibliotheque': 'Bibliothèque',
  'nav.talents': 'Talents',
  'nav.profil': 'Mon profil',
  'nav.principale': 'Navigation principale',
  'nav.allerContenu': 'Aller au contenu',
  'nav.ouvrirMenu': 'Ouvrir le menu',
  'nav.fermerMenu': 'Fermer le menu',
  'nav.deconnexion': 'Déconnexion',
  'nav.demandesAttente_one': '{count} demande d’adhésion en attente',
  'nav.demandesAttente_other': '{count} demandes d’adhésion en attente',

  /* —— Écran d'entrée (connexion / inscription) —— */
  'auth.presentation': 'Présentation d’AfricaBridge',
  'auth.accroche': 'Là où les talents africains se rencontrent pour construire ensemble.',
  'auth.description1':
    'AfricaBridge réunit les développeurs, designers et data scientists d’Afrique autour de projets à impact : agriculture, santé, éducation, énergie.',
  'auth.description2':
    'Tu crées ton profil, tu trouves les bonnes personnes, tu rejoins une équipe ou tu lances ton projet. Ensuite, tout se passe au même endroit : discussions, ressources partagées, commentaires.',

  /* —— Connexion —— */
  'connexion.titre': 'Connexion',
  'connexion.sansCompte': 'Pas encore de compte ?',
  'connexion.lienInscription': 'Inscris-toi',
  'connexion.email': 'Adresse e-mail',
  'connexion.emailExemple': 'toi@exemple.com',
  'connexion.motDePasse': 'Mot de passe',
  'connexion.seSouvenir': 'Se souvenir de moi',
  'connexion.bouton': 'Se connecter',
  'connexion.boutonEnCours': 'Connexion…',
  'connexion.tropDeTentatives': 'Trop de tentatives. Réessaie dans {secondes} secondes.',
  'connexion.demo': 'Compte de démonstration : {email} · {motDePasse}',

  /* —— Inscription —— */
  'inscription.titre': 'Créer un compte',
  'inscription.dejaMembre': 'Déjà membre ?',
  'inscription.lienConnexion': 'Connecte-toi',
  'inscription.nom': 'Nom complet',
  'inscription.nomExemple': 'Eliana Lokoka',
  'inscription.motDePasseAide': '8 caractères minimum.',
  'inscription.confirmation': 'Confirmer le mot de passe',
  'inscription.pays': 'Pays',
  'inscription.paysChoisir': 'Sélectionne ton pays',
  'inscription.bouton': 'Créer mon compte',
  'inscription.boutonEnCours': 'Création…',

  /* —— Page introuvable —— */
  'introuvable.titre': 'Page introuvable',
  'introuvable.texte': 'L’adresse demandée n’existe pas ou a changé.',
  'introuvable.retour': 'Retour à l’accueil',
}
