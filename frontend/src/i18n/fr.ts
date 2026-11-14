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

  /* —— Libellés : role —— */
  'enum.role.developpeur_frontend': 'Développeur frontend',
  'enum.role.developpeur_backend': 'Développeur backend',
  'enum.role.fullstack': 'Développeur full-stack',
  'enum.role.designer_ui_ux': 'Designer UI/UX',
  'enum.role.ingenieur_iot': 'Ingénieur IoT',
  'enum.role.data_scientist': 'Data scientist',
  'enum.role.chef_de_projet': 'Chef de projet',
  'enum.role.etudiant': 'Étudiant',
  'enum.role.entrepreneur': 'Entrepreneur',
  'enum.role.autre': 'Autre',
  /* —— Libellés : domaine —— */
  'enum.domaine.agriculture': 'Agriculture',
  'enum.domaine.sante': 'Santé',
  'enum.domaine.education': 'Éducation',
  'enum.domaine.fintech': 'Fintech',
  'enum.domaine.energie': 'Énergie',
  'enum.domaine.transport': 'Transport',
  'enum.domaine.iot': 'IoT',
  'enum.domaine.intelligence_artificielle': 'Intelligence artificielle',
  'enum.domaine.commerce': 'Commerce',
  'enum.domaine.environnement': 'Environnement',
  'enum.domaine.administration': 'Administration',
  'enum.domaine.autre': 'Autre',
  /* —— Libellés : statutProjet —— */
  'enum.statutProjet.recrutement': 'Ouvert',
  'enum.statutProjet.en_cours': 'En cours',
  'enum.statutProjet.termine': 'Terminé',
  /* —— Libellés : statutDemande —— */
  'enum.statutDemande.en_attente': 'En attente',
  'enum.statutDemande.acceptee': 'Acceptée',
  'enum.statutDemande.refusee': 'Refusée',
  /* —— Libellés : categorie —— */
  'enum.categorie.langage': 'Langage',
  'enum.categorie.framework': 'Framework',
  'enum.categorie.outil': 'Outil',
  'enum.categorie.domaine_technique': 'Domaine technique',
  'enum.categorie.design': 'Design',
  'enum.categorie.gestion_projet': 'Gestion de projet',
  'enum.categorie.autre': 'Autre',
  /* —— Libellés : niveau —— */
  'enum.niveau.debutant': 'Débutant',
  'enum.niveau.intermediaire': 'Intermédiaire',
  'enum.niveau.avance': 'Avancé',
  'enum.niveau.nonPrecise': 'Non précisé',
  /* —— Libellés : typeLien —— */
  'enum.typeLien.github': 'GitHub',
  'enum.typeLien.gitlab': 'GitLab',
  'enum.typeLien.linkedin': 'LinkedIn',
  'enum.typeLien.portfolio': 'Portfolio',
  'enum.typeLien.twitter': 'Twitter',
  'enum.typeLien.autre': 'Autre',
  /* —— Libellés : typeRessource —— */
  'enum.typeRessource.code': 'Code',
  'enum.typeRessource.lien': 'Lien',
  'enum.typeRessource.tutoriel': 'Tutoriel',
  'enum.typeRessource.api': 'API',
  'enum.typeRessource.document': 'Document',
  'enum.typeRessource.article': 'Article',
  'enum.typeRessource.autre': 'Autre',
  /* —— Libellés : visibilite —— */
  'enum.visibilite.projet': 'Réservée à l\'équipe',
  'enum.visibilite.publique': 'Publique',

  /* —— Commun (2) —— */
  'commun.precedent': 'Précédent',
  'commun.suivant': 'Suivant',
  'commun.reessayer': 'Réessayer',
  'commun.reinitialiserFiltres': 'Réinitialiser les filtres',
  'commun.pagination': 'Pagination',
  'commun.page': 'Page {page} / {total}',
  'commun.verifierConnexion': 'Vérifie ta connexion puis réessaie.',

  /* —— Réseau de suivi —— */
  'reseau.abonnes_one': '{count} abonné',
  'reseau.abonnes_other': '{count} abonnés',
  'reseau.abonnements_one': '{count} abonnement',
  'reseau.abonnements_other': '{count} abonnements',
  'reseau.titre': 'Réseau',
  'reseau.ongletAbonnes': 'Abonnés',
  'reseau.ongletAbonnements': 'Abonnements',
  'reseau.chargementImpossible': 'Impossible de charger cette liste',
  'reseau.pagination': 'Pagination du réseau',
  'reseau.aucunAbonne': 'Aucun abonné pour l’instant.',
  'reseau.neSuitPersonne': 'Ne suit personne pour l’instant.',
  'suivre.suivre': 'Suivre',
  'suivre.suivi': 'Suivi',
  'suivre.nom': 'Suivre {nom}',
  'suivre.tuSuis': 'Tu suis maintenant {nom}.',
  'suivre.tuNeSuisPlus': 'Tu ne suis plus {nom}.',
  'suivre.membreDisparu': 'Ce membre n’existe plus.',

  /* —— Mes demandes —— */
  'demandes.titre': 'Mes demandes',
  'demandes.intro': 'Les demandes d’adhésion que tu as envoyées.',
  'demandes.dejaTraitee': 'Cette demande a déjà été traitée.',
  'demandes.introuvable': 'Cette demande n’existe plus.',
  'demandes.sansMessage': 'Sans message.',
  'demandes.envoyeeLe': 'envoyée le {date}',
  'demandes.annuler': 'Annuler',
  'demandes.videTitre': 'Aucune demande',
  'demandes.videTexte': 'Explore les projets et rejoins une équipe qui te ressemble.',
  'demandes.explorer': 'Explorer les projets',

  /* —— Talents —— */
  'talents.titre': 'Trouver des talents',
  'talents.membres_one': '{count} membre',
  'talents.membres_other': '{count} membres',
  'talents.correspondantRecherche': 'correspondant à ta recherche',
  'talents.rechercherMembre': 'Rechercher un membre',
  'talents.nomOuBio': 'Nom ou bio…',
  'talents.filtrerProfil': 'Filtrer par profil',
  'talents.tousProfils': 'Tous les profils',
  'talents.filtrerDomaine': 'Filtrer par domaine',
  'talents.tousDomaines': 'Tous les domaines',
  'talents.filtrerPays': 'Filtrer par pays',
  'talents.tousPays': 'Tous les pays',
  'talents.filtrerRegion': 'Filtrer par région',
  'talents.regionOuVille': 'Région ou ville…',
  'talents.competences': 'Compétences',
  'talents.doitMaitriser': 'Doit maîtriser',
  'talents.correspondance': 'Correspondance des compétences',
  'talents.auMoinsUne': 'au moins une compétence',
  'talents.toutes': 'toutes les compétences',
  'talents.erreurTitre': 'Impossible de charger les talents',
  'talents.aucunTitre': 'Aucun membre ne correspond',
  'talents.aucunTexte': 'Essaie d’élargir tes critères ou de retirer une compétence.',

  /* —— Profil public —— */
  'profilPublic.retour': '← Talents',
  'profilPublic.introuvableTitre': 'Membre introuvable',
  'profilPublic.chargementImpossible': 'Impossible de charger ce profil',
  'profilPublic.introuvableTexte': 'Ce membre n’existe pas ou n’est plus disponible.',
  'profilPublic.voirTalents': 'Voir les talents',
  'profilPublic.sansBio': 'Ce membre n’a pas encore de bio.',
  'profilPublic.membreDepuis': 'Membre depuis le {date}',
  'profilPublic.aucuneCompetence': 'Aucune compétence renseignée.',
  'profilPublic.lienInvalide': 'Lien non valide',
  'profilPublic.projetsRealises': 'Projets réalisés',
  'profilPublic.projetsIndispo': 'Projets réalisés indisponibles pour le moment.',
  'profilPublic.termineLe': 'Terminé le {date}',
  'profilPublic.voirRealisation': 'Voir la réalisation · {domaine}',
  'profilPublic.aucunProjet': 'Aucun projet terminé pour l’instant.',

  /* —— Mon profil —— */
  'profil.lieuNonRenseigne': 'Lieu non renseigné',
  'profil.aucuneBio': 'Aucune bio pour l’instant.',
  'profil.modifier': 'Modifier mon profil',
  'profil.domaines': 'Domaines d’intérêt',
  'profil.aucunDomaine': 'Aucun domaine d’intérêt.',
  'profil.liens': 'Liens',
  'profil.aucunLien': 'Aucun lien.',
  'profil.competences': 'Compétences',
  'profil.aucuneCompetence': 'Aucune compétence. Ajoute-en pour apparaître dans les recherches de talents.',

  /* —— Modifier le profil —— */
  'modifierProfil.titre': 'Modifier mon profil',
  'modifierProfil.intro': 'Les changements sont appliqués par bloc.',
  'modifierProfil.informations': 'Informations',
  'modifierProfil.nom': 'Nom complet',
  'modifierProfil.region': 'Ville ou région',
  'modifierProfil.regionExemple': 'Dakar',
  'modifierProfil.bio': 'Bio',
  'modifierProfil.bioAide': '500 caractères maximum.',
  'modifierProfil.pays': 'Pays',
  'modifierProfil.role': 'Rôle',
  'modifierProfil.domaines': 'Domaines d’intérêt',
  'modifierProfil.liens': 'Liens',
  'modifierProfil.ajouterLien': 'Ajouter un lien',
  'modifierProfil.liensAide': 'Ton GitHub, ton LinkedIn, ton portfolio… Ces liens apparaissent sur ton profil.',
  'modifierProfil.aucunLien': 'Aucun lien.',
  'modifierProfil.typeLien': 'Type de lien',
  'modifierProfil.urlLien': 'URL du lien',
  'modifierProfil.retirer': 'Retirer',
  'modifierProfil.enregistrement': 'Enregistrement…',
  'modifierProfil.enregistrerInfos': 'Enregistrer les informations',
  'modifierProfil.competences': 'Compétences',
  'modifierProfil.aucuneCompetence': 'Aucune compétence pour l’instant.',
  'modifierProfil.niveauDe': 'Niveau de {nom}',
  'modifierProfil.niveauVide': 'Niveau…',
  'modifierProfil.ajouterCompetence': 'Ajouter une compétence',
  'modifierProfil.choisirCompetence': 'Choisir une compétence…',
  'modifierProfil.toutesAjoutees': 'Toutes les compétences sont ajoutées',
  'modifierProfil.niveau': 'Niveau',
  'modifierProfil.ajouter': 'Ajouter',
  'modifierProfil.enregistrerCompetences': 'Enregistrer mes compétences',
  'modifierProfil.photo': 'Photo de profil',
  'modifierProfil.photoAide': 'jpg, png ou webp — 2 Mo maximum.',
  'modifierProfil.choisirPhoto': 'Choisir une photo de profil',
  'modifierProfil.envoi': 'Envoi…',
  'modifierProfil.enregistrerPhoto': 'Enregistrer la photo',
  'erreur.survenue': 'Une erreur est survenue.',
}
