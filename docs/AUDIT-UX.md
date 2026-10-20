# Audit UX / UI / accessibilité — AfricaBridge (frontend)

> Audit du 20/10/2026 sur la branche `feat/audit-ux`, après les 8 modules P0.
> Référentiels croisés : heuristiques de Nielsen, principes de Norman, lois de la Gestalt, de Fitts,
> de Hick-Hyman, de Miller, de Jakob, et WCAG 2.1/2.2 (A/AA).

**Contexte supposé** : plateforme collaborative (type SaaS) pour développeurs africains ; l'objectif
de l'utilisateur est de trouver une équipe ou des talents, puis de collaborer. Cible : ordinateur **et**
mobile (réseaux parfois lents), jury de concours.

**Méthode** : 15 écrans mesurés par script (Playwright) en 1280 px et 375 px, connecté, avec le jeu de
démonstration : contrastes réels calculés sur les couleurs rendues, noms accessibles, titres, repères
(landmarks), identifiants dupliqués, taille des cibles, indicateur de focus sur 25 à 40 éléments
tabulables par page, parcours clavier. Complété par la lecture du code des composants.
**Non vérifié** : lecteur d'écran réel (NVDA/VoiceOver), zoom texte 200 %, espacement du texte,
appareils tactiles physiques, performance de chargement.

## Synthèse exécutive

Base saine : contrastes conformes partout, focus visible partout, langue déclarée, un `h1` par page, champs
étiquetés, erreurs annoncées, aucun débordement de 320 à 1920 px. **Avant corrections** : 1 critique, 5 majeurs,
3 mineurs, 3 améliorations — essentiellement des défauts propres aux applications monopages (titre, focus,
404) et au clavier. **Après corrections** (cette branche) : 1 critique et 5 majeurs corrigés, 2 mineurs
corrigés. Note globale : **6,5/10 avant → 8/10 après**.

## Constats détaillés

**[Critique] Champ « photo de profil » sans nom accessible** — *corrigé*
- Localisation : `/profil/modifier`, section « Photo de profil »
- Référentiel : WCAG 1.3.1 / 3.3.2 / 4.1.2 (niveau A) ; Nielsen n°6
- Constat : `<input type="file">` sans `label` ni `aria-label`.
- Impact : un lecteur d'écran annonce « bouton, aucun fichier » : impossible de savoir à quoi il sert.
- Recommandation appliquée : `aria-label="Choisir une photo de profil"`.

**[Majeur] Titre d'onglet identique sur toutes les pages** — *corrigé*
- Localisation : toutes les pages (`<title>AfricaBridge</title>`)
- Référentiel : WCAG 2.4.2 Titre de page (A) ; Nielsen n°1
- Constat : 15 pages mesurées, 15 titres identiques.
- Impact : historique, onglets multiples et lecteurs d'écran ne distinguent plus les pages.
- Recommandation appliquée : titre « Page · AfricaBridge » qui suit le `h1` (y compris quand il arrive après le
  chargement des données : « Smart Agriculture RDC »).

**[Majeur] Aucun lien d'évitement, focus abandonné à chaque navigation** — *corrigé*
- Localisation : ossature (`AppShell`)
- Référentiel : WCAG 2.4.1 Contourner des blocs (A), 2.4.3 Ordre du focus (A), 4.1.3 Messages d'état (AA)
- Constat : 8 liens de navigation à traverser avant chaque contenu ; après un changement de route, le focus
  reste sur le lien cliqué et la page garde son défilement.
- Impact : utilisateurs clavier et lecteur d'écran perdus à chaque page.
- Recommandation appliquée : lien « Aller au contenu » (visible au clavier), focus et retour en haut au
  changement de route.

**[Majeur] Onglets non conformes au motif ARIA « Tabs »** — *corrigé*
- Localisation : détail d'un projet (Vue, Équipe, Discussion, Ressources, Demandes) ; filtres de « Mes projets »
- Référentiel : WCAG 2.1.1 / 4.1.2 (A) ; Norman (mapping, feedback)
- Constat : `role="tab"` sans flèches, sans `tabindex` itinérant, sans `tabpanel` relié.
- Impact : 5 arrêts de tabulation au lieu d'1 ; relation onglet↔contenu inconnue du lecteur d'écran.
- Recommandation appliquée : ← → Début Fin, `tabindex` itinérant, `aria-controls` / `aria-labelledby`.

**[Majeur] Adresse inconnue : redirection silencieuse vers l'accueil** — *corrigé*
- Localisation : toute route inexistante
- Référentiel : Nielsen n°9 (aide au diagnostic) et n°1 ; Jakob
- Constat : `path="*"` renvoyait vers `/` sans explication.
- Impact : l'utilisateur ne comprend pas pourquoi il atterrit sur l'accueil.
- Recommandation appliquée : page « Page introuvable » avec retour à l'accueil.

**[Majeur] Cibles tactiles trop petites** — *corrigé*
- Localisation : logo (89×20 px), liens « ← Retour » (×20 px), liens de listes (×20 px), contrôles de 36 px, cases 16 px
- Référentiel : loi de Fitts ; WCAG 2.5.8 (AA, 24 px) et 2.5.5 (44 px)
- Constat : plus de 80 % des contrôles font moins de 44 px de haut sur mobile.
- Impact : erreurs de pression, surtout au pouce.
- Recommandation appliquée : 44 px minimum sous 640 px ou en écran tactile (boutons, champs, onglets,
  cases étiquetées) ; logo et liens à 28–36 px ; les puces de filtre restent à 36 px.

**[Mineur] Hiérarchie de titres : `h1` puis `h3`** — *corrigé* (cartes projet, ressource, talent → `h2`)
- Référentiel : WCAG 1.3.1 (technique G141) ; Gestalt (structure)

**[Mineur] Chargement non annoncé** — *corrigé* (`role="status"` + « Chargement… » masqué visuellement)
- Référentiel : WCAG 4.1.3 ; Nielsen n°1

**[Mineur] Boutons « ← Retour » codés en `<button>`** — *corrigé* (liens `<a>`)
- Référentiel : Jakob ; Norman (affordance) : un lien s'ouvre dans un nouvel onglet, un bouton non.

**[Amélioration] Mouvement réduit** — *corrigé* (`prefers-reduced-motion` respecté ; WCAG 2.3.3)

**[Amélioration] Page de développement `/atelier` publique** — *corrigé* (absente du build de production)

**[Mineur] Aucun focus sur le premier champ en erreur après un envoi** — *non corrigé*
- Localisation : formulaires (inscription, projet, ressource, profil)
- Référentiel : WCAG 3.3.1 (les erreurs sont annoncées par `role="alert"`) ; Nielsen n°9
- Recommandation : déplacer le focus sur le premier champ invalide. Effort moyen.

**[Mineur] Confirmations de suppression via `window.confirm`** — *non corrigé* (3 endroits)
- Référentiel : Nielsen n°4 (cohérence visuelle), n°5 ; focus non restitué proprement
- Recommandation : boîte de dialogue maison (`role="alertdialog"`). Effort moyen.

**[Amélioration] Densité de « Trouver des talents » et de « Créer un projet »** — *non corrigé*
- Référentiel : Hick-Hyman, Miller
- Constat : 42 contrôles sur `/talents`, 46 sur `/projets/nouveau`.
- Recommandation : replier les filtres secondaires sous un bouton « Plus de filtres » ; découper la création
  en deux étapes (Essentiel / Équipe et compétences).

**[Amélioration] Pas d'affichage du mot de passe** — *non corrigé* (Nielsen n°5, WCAG 3.3.7 en AA 2.2)

## Tableau récapitulatif

| Sévérité | Problème | Référentiel | Page | État |
|---|---|---|---|---|
| Critique | Champ photo sans nom | WCAG 1.3.1/4.1.2 | /profil/modifier | corrigé |
| Majeur | Titre de page identique | WCAG 2.4.2 | toutes | corrigé |
| Majeur | Pas de lien d'évitement ni de focus | WCAG 2.4.1/2.4.3 | ossature | corrigé |
| Majeur | Onglets sans clavier ni panneaux | WCAG 2.1.1/4.1.2 | /projets/:id | corrigé |
| Majeur | 404 silencieuse | Nielsen 9 | routes inconnues | corrigé |
| Majeur | Cibles tactiles | Fitts, WCAG 2.5.8 | toutes (mobile) | corrigé |
| Mineur | `h1` puis `h3` | WCAG 1.3.1 | listes | corrigé |
| Mineur | Chargement non annoncé | WCAG 4.1.3 | toutes | corrigé |
| Mineur | « Retour » en bouton | Jakob | détails | corrigé |
| Mineur | Focus après erreur de formulaire | WCAG 3.3.1 | formulaires | à faire |
| Mineur | `window.confirm` | Nielsen 4/5 | 3 suppressions | à faire |
| Amélioration | Mouvement réduit ; `/atelier` | WCAG 2.3.3 | global | corrigé |
| Amélioration | Densité filtres / formulaire long | Hick, Miller | /talents, /projets/nouveau | à faire |
| Amélioration | Afficher le mot de passe | WCAG 3.3.7 | /connexion | à faire |

## Points forts (conformes, mesurés)

- **Contrastes** : aucun texte sous 4,5:1 (les boutons désactivés sont exemptés par WCAG 1.4.3). Accent #f55800 à 5,59:1.
- **Focus** : contour de 2 px visible sur 100 % des éléments tabulés (25 à 40 par page testée).
- **Structure** : `lang="fr"`, un `main`, un `h1` par page, aucun identifiant dupliqué, aucune image sans `alt`.
- **Formulaires** : tous les champs étiquetés (sauf la photo, corrigée), erreurs annoncées (`role="alert"`),
  `autocomplete` sur connexion et inscription (WCAG 1.3.5).
- **Liens externes** : `rel="noopener noreferrer"`, protocole http(s) seulement.
- **Responsive** : aucun débordement de 320 à 1920 px ; navigation en menu déroulant sous 1024 px.
- **États** : chaque liste a un état vide avec une issue, chaque erreur réseau propose « Réessayer »,
  couleurs sémantiques cohérentes pour les statuts.

## Plan d'action restant

1. Focus sur le premier champ invalide (effort moyen).
2. Boîte de dialogue de confirmation accessible à la place de `window.confirm` (moyen).
3. « Plus de filtres » repliable sur `/talents` (faible).
4. Création de projet en deux étapes (moyen).
5. Bouton afficher / masquer le mot de passe (faible).
6. Test réel au lecteur d'écran (NVDA ou VoiceOver) avant le concours (faible, 30 min).
