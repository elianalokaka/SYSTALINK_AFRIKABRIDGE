# AfricaBridge (SYSTALINK) — Contexte projet & décisions

> **Ce fichier est lu automatiquement par l'agent à chaque session dans ce dossier**
> (plugin `agent-instructions`, marqueur de racine `.git`).
> Il porte le contexte et les décisions prises en amont, pour qu'aucune session ne reparte de zéro.
> **Ne pas le supprimer.**
>
> **Dernière mise à jour** : module 4 (`feat/equipes`) **codé, corrigé (cache, alerte propriétaire, mocks alignés) et type-checké (tsc 0)** — à valider à la main puis fusionner. Prochain module : `feat/messagerie`.

---

## 1. Le projet

| | |
|---|---|
| **Nom** | AfricaBridge |
| **Cadre** | Concours Systalink |
| **Objet** | Plateforme collaborative qui connecte les talents africains pour créer des équipes et réaliser des projets innovants |
| **Dépôt** | `https://github.com/elianalokaka/SYSTALINK_AFRIKABRIDGE.git` |
| **Branche d'intégration front** | **`frontend`** |
| **Backend** | Laravel 11+ — API REST (dev backend en parallèle) |
| **Authentification** | Laravel Sanctum en mode SPA : **session + cookies. AUCUN token, pas de JWT** |
| **Frontend** | React 19 + TypeScript + Vite + **Tailwind CSS v4** · **Poppins** · **react-icons (Lucide)** |
| **Équipe** | Arthur Manuana (frontend) + dev backend |

### Emplacements

| | |
|---|---|
| **RACINE** (dépôt) | `D:\parcours Génie Informatique Ulc - Icam\Projet_VIE\SYSTALINK_AFRIKABRIDGE` |
| **FRONT** (application) | `...\SYSTALINK_AFRIKABRIDGE\frontend` |

---

## 2. Le contrat API — SOURCE DE VÉRITÉ ABSOLUE

**Fichier : `openapi-africabridgefinal.yaml`** — à la racine du dépôt, version **1.2.0** (1 847 lignes).

> Règle d'or inscrite dans le contrat lui-même :
> *« Ce document fait autorité. Toute divergence entre le code et ce contrat est un bug. »*

> Analyse complète et carte fonctionnelle : **`docs/ANALYSE-CONTRAT.md`**.
> Vérification automatisée : **`scripts/conformite/`**.

### Périmètre
- **44 opérations** — vérifié : **33 en P0** (MVP) et **11 en P1** (bonus, se coupent en premier).
- Chaque opération porte `x-priorite`.
- P1 : follow (suivi entre devs), suggestions, commentaires, dashboard, `GET /stats`.

### Authentification (flux obligatoire)
```
1. GET  /sanctum/csrf-cookie   → pose le cookie XSRF-TOKEN (204)
2. POST /auth/login            → pose le cookie de session HttpOnly
3. Toutes les requêtes suivantes envoient les cookies automatiquement
4. POST /auth/logout           → invalide la session
```
- `/sanctum/csrf-cookie` est à la **RACINE**, hors du préfixe `/api/v1`.
- Le front **ne lit, ne stocke et ne renvoie JAMAIS** de token (pas de localStorage, pas de header Authorization).
- axios : `withCredentials: true` + `withXSRFToken: true`.
- En production, **URLs relatives** (`/api/v1`, `/sanctum`) : front et API sur la même origine (VPS unique).

### Sémantique d'erreur (verrouillée)
| Code | Sens | Réaction front |
|---|---|---|
| **401** | Session absente/expirée | Vider l'état utilisateur et rediriger vers la connexion |
| **419** | Jeton CSRF absent/périmé | Rappeler `/sanctum/csrf-cookie` puis **rejouer** la requête |
| 403 | Policy Laravel | Afficher « non autorisé » — **ne jamais déconnecter** |
| 404 | Introuvable | Page/section vide |
| **409** | Conflit métier (déjà membre, demande en attente, équipe complète…) | Message contextuel |
| **413** | Corps > 16 Mo (Nginx/PHP) | « Fichier trop volumineux (16 Mo maximum). » |
| **422** | Validation Laravel | `{ message, errors: { champ: [messages] } }` → erreurs par champ |
| **429** | Throttle | Respecter l'en-tête `Retry-After` |

### Formats de réponse
| Cas | Forme |
|---|---|
| Listes paginées | `{ data: [...], meta: { current_page, per_page, total, last_page } }` — 15 défaut, **50 max** |
| Collections bornées | `{ data: [...] }` sans `meta` |
| Messages | `{ data: [...], supprimes: [ids], meta: { server_time } }` — pagination **par curseur** |

### Points sensibles du contrat
- **Messages** : pas de temps réel (hors MVP). **Polling toutes les 5 s** avec `apres_id` + `depuis` + `supprimes`.
  Le front renvoie `meta.server_time` **tel quel** dans `depuis` au tour suivant. `depuis` est **absent du premier appel**.
- **`competence_ids`** en query string : sérialiser en `competence_ids[]=1&competence_ids[]=2`
  (nécessite un `paramsSerializer` axios avec brackets) sur `/users`, `/projects`, `/resources`.
- **Uploads** : photo 2 Mo max, ressource 10 Mo max → **422** sur le champ.
  Au-dessus de **16 Mo** → **413**. Nginx : `client_max_body_size 16m`.
  `POST` (pas `PATCH`) pour la photo : PHP ne lit pas multipart sur PATCH/PUT.
- **`POST /resources`** accepte **deux** content-types : `application/json` **ou** `multipart/form-data`
  selon qu'un fichier est joint.
- **`visibilite`** d'une ressource : **omettre le champ** quand on ne veut pas forcer.
  Le serveur applique `projet` si `projet_id` est présent, sinon `publique`.
- **Email** : présent **uniquement** dans `ProfilPrive` (`/auth/me`, login, register).
  `GET /users/{id}` ne doit JAMAIS contenir la clé `email`.
- **Champs P1 présents dans les réponses P0** : `is_following`, `followers_count`, `following_count`
  valent `false` / `0` tant que le follow n'est pas livré. **Ne rien construire dessus** — et surtout
  **ne pas les afficher** : un `0` affiché est un mensonge visuel.
- **Statuts projet** : valeurs techniques `recrutement` / `en_cours` / `termine`,
  libellés affichés **« Ouvert » / « En cours » / « Terminé »**.
  `termine` est **définitif** et interdit à la création.
- **`is_member`** et **`ma_demande_statut`** pilotent l'état des boutons d'un projet
  selon qui regarde. C'est la logique d'état la plus délicate du front.
- **`GET /users/suggestions` renvoie 403 si on n'est propriétaire d'AUCUN projet** (même sans `projet_id`).
  Ne pas appeler cette route sans projet possédé.
- **Données de démo (seeder)** : ~10 profils multi-pays, un designer UI/UX au Sénégal (SN),
  5-8 projets dont « Smart Agriculture RDC », au moins un projet `termine`.
  Le compte d'Eliana n'existe PAS dans le seeder : elle s'inscrit pendant la démo.

---

## 3. Décisions prises (validées)

| Décision | Détail |
|---|---|
| ❌ **Pas de landing page publique** | Tout passe par le compte. Seul `GET /stats` reste public (P1, optionnel). |
| ✅ **Développement en parallèle** | Le front se construit sur des **mocks fidèles au contrat**, sans attendre le backend. |
| ✅ **TypeScript** | **Obligatoire.** Les types sont générés depuis l'OpenAPI — c'est ce qui garantit le respect du contrat. |
| ✅ **TanStack Query** | Pour le data fetching (cache, retries, états, et le polling 5 s des messages). |
| ✅ **MSW (Mock Service Worker)** | Mocks interceptés **au niveau réseau**, pas dans les composants. |
| ❌ **DaisyUI : ABANDONNÉ** | Décision **retournée**. Voir l'encadré ci-dessous. |
| ✅ **react-icons** | Un **seul** set : **Lucide**. Jamais de mélange de sets. |
| ✅ **Poppins** | Police de toute l'interface, **auto-hébergée** via `@fontsource/poppins`. |
| ✅ **Code par module** | Une branche = un module complet et utilisable. **Pas** de composant isolé. |

### Pourquoi DaisyUI a été abandonné

Décision initiale : « DaisyUI avec un thème personnalisé ». **Retournée après avoir figé nos tokens** :

1. Ses noms entrent en collision avec les nôtres — son `accent` n'est pas notre accent.
2. Il **génère ses propres nuances** de survol/actif, ce qui casserait sans prévenir des
   contrastes que nous avons **mesurés**.
3. Ses composants par défaut ressemblent à ce que le projet refuse.
4. L'ajouter plus tard coûte une commande ; le retirer après 20 composants coûte des jours.

**À la place** : Tailwind seul + nos tokens. Pour les widgets complexes à venir (modale, menu
déroulant, infobulle), utiliser une bibliothèque **sans style** (Radix UI) qui apporte le
comportement et l'accessibilité **sans imposer de couleurs**.

---

## 3 bis. Position sur le design (exigence ferme)

**Pas de « look IA cliché ».** Une interface sans direction imposée retombe sur la moyenne
statistique : Inter, dégradés violet/bleu, cartes arrondies avec ombre, hero centré,
grille de 3 « fonctionnalités », emojis en guise d'icônes.

### Interdits explicites
- ❌ Dégradés (surtout violet → bleu, indigo → rose)
- ❌ `rounded-2xl` / `rounded-3xl` / boutons en pilule
- ❌ Ombres portées larges pour « décoller » les cartes
- ❌ Emojis utilisés comme icônes
- ❌ Police Inter par défaut / look « template SaaS »
- ❌ Hero centré avec gros titre + deux boutons côte à côte
- ❌ Grille de 3-4 cartes « fonctionnalités » (icône + titre + paragraphe)
- ❌ Glassmorphism / `backdrop-blur` décoratif
- ❌ Animations d'apparition au scroll sur chaque section
- ❌ Contenu de remplissage inventé (« Lorem ipsum », « Votre texte ici »)
- ❌ Barres de progression et badges décoratifs sans donnée réelle derrière

### À faire à la place
- ✅ Hiérarchie par la **typographie et l'espace**, pas par la couleur ni l'ombre
- ✅ **Une seule** couleur d'accent, usage rare (< 5 % de la surface)
- ✅ Densité assumée : de vraies données, pas du vide « aéré »
- ✅ États complets : survol, **focus visible**, actif, désactivé, vide, erreur, chargement
- ✅ Contraste texte/fond ≥ 4.5:1 **vérifié par calcul**
- ✅ Données d'exemple plausibles (noms, dates, montants réalistes)

### Registre visuel choisi

**Un outil de développeur crédible** — inspiré de **GitHub** et **Supabase**, pas d'un template SaaS.
Dense, fonctionnel, sombre, sans emphase décorative.

### Méthode
- **Le design est une entrée, pas une sortie.** Ne jamais inventer un style :
  si ce n'est pas spécifié → **demander**, ne pas deviner.
- Les **tokens** sont la **seule source de vérité**. Aucune valeur codée en dur, nulle part.
- **Fournir des captures de référence**, pas des descriptions écrites — l'agent lit les images.
- Construire les **primitives avant les écrans**, et faire **valider la direction visuelle**
  avant d'écrire des centaines de lignes.
- **Le process de collaboration** : l'utilisateur fournit un croquis **sans valeur** (wireframe) ;
  l'agent ne le recopie **jamais** — il s'en inspire et le traduit selon les contraintes du design
  system. Si le croquis contredit une contrainte (contraste, état manquant, cliché interdit),
  **le signaler** au lieu de l'exécuter en silence.

---

## 3 ter. Le design system — état réel

**Source de vérité des tokens : `frontend/src/index.css`** (bloc `@theme`).
**Planche de référence : `docs/design/orientation-palette.png`** — régénérable par
`python scripts/design/generer-palette.py`.

### La palette (contrastes WCAG 2.1 calculés, pas estimés)

| Rôle | Token | Hex |
|---|---|---|
| Fond général | `surface-0` | `#131211` |
| Barres, navigation | `surface-1` | `#191816` |
| Cartes, panneaux | `surface-2` | `#201e1b` |
| Survol, menus | `surface-3` | `#282521` |
| Actif, sélectionné | `surface-4` | `#312d28` |
| Texte principal | `fg-1` | `#eceae7` |
| Texte secondaire | `fg-2` | `#a9a39c` |
| Texte tertiaire | `fg-3` | `#958f88` |
| Bordures (séparateurs) | `border-subtle` | `#2c2b28` |
| Bordures (survol) | `border` | `#3a3833` |
| **Bordure de champ** | `border-strong` | `#6e6a64` |
| **Accent (action)** | `accent` | `#f55800` |
| Accent survol | `accent-hover` | `#ff6b1a` |
| Accent pression | `accent-press` | `#e85200` |
| **Texte sur aplat accent** | `accent-fg` | `#131211` |
| Succès (recrutement, acceptée) | `success` | `#3ecf8e` |
| Info (en cours) | `info` | `#58a6ff` |
| Attente (en attente) | `pending` | `#e3b341` |
| Erreur (refusée) | `danger` | `#f85149` |
| Neutre (terminé, archivé) | `neutral` | `#a9a39c` |

Rayons : `--radius-sm: 4px` · `--radius-md: 6px` (défaut) · `--radius-lg: 8px`.

### Les 4 règles de couleur non négociables

1. **Le libellé d'un bouton plein est SOMBRE** (`text-accent-fg`), jamais blanc.
   Du blanc sur `#f55800` donne **3.34:1** → échec WCAG. Vérifié par calcul.
2. **Les champs utilisent `border-border-strong`**, pas `border`. Quand la bordure est le seul
   repère d'un contrôle, WCAG 1.4.11 exige 3:1 (`border-strong` = 3.09:1, `border` = 1.60:1).
3. **L'accent est réservé à l'ACTION**, jamais à un état. Les états ont leur propre échelle
   sémantique. Sinon l'accent perd son sens.
4. **Le focus visible est posé UNE fois**, sur `:focus-visible` dans `index.css`.
   Aucun composant ne le redéfinit.

### Le kit de primitives (livré, module 0)

`frontend/src/components/ui/` — **sans domaine**, aucune ne connaît « projet » ou « talent » :

`Avatar` · `Badge` · `Button` · `Card` (+ `CardEntete`, `CardCorps`) · `EmptyState` ·
`FormField` · `Input` (+ `Textarea`) · `ProgressBar` · `Skeleton` (+ `SkeletonTexte`) ·
`Spinner` · `Tabs`

Import unique depuis `@/components/ui` (ou chemin relatif vers `components/ui`).
Fusion de classes : `cn()` dans `frontend/src/lib/cn.ts` (clsx + tailwind-merge).

**Règle d'emplacement d'un composant :**
> Un composant utilisé par un seul domaine reste près de ses pages.
> Dès qu'un deuxième endroit en a besoin, il monte dans `components/ui/`.

**Les primitives reçoivent leurs icônes en `ReactNode`** — elles n'importent jamais react-icons.
C'est ce qui découple le kit du set d'icônes.

---

## 4. Architecture du frontend (réelle)

```
frontend/
├── src/
│   ├── api/                    # ✅ client.ts (2 racines, 401/419 bornés) + auth.ts, profil.ts, projets.ts, equipes.ts
│   ├── components/
│   │   ├── ui/                 # ✅ PRIMITIVES du design system (11 composants)
│   │   └── layout/             # ✅ AppShell (barre supérieure + <Outlet/>)
│   ├── pages/                  # ✅ atelier · auth · accueil · profil · projets · equipes
│   ├── lib/                    # ✅ cn.ts · labels.ts · constants.ts · priorites.ts
│   ├── types/                  # ✅ api.types.ts (GÉNÉRÉ) + index.ts (alias Required/Omit)
│   ├── mocks/                  # ✅ browser · server · db · seed · handlers/{auth,profil,projets,equipes}
│   ├── styles/                 # (non utilisé : les tokens vivent dans index.css)
│   ├── index.css               # ✅ @theme + base + focus global
│   ├── main.tsx                # ✅ imports Poppins + démarrage MSW conditionnel
│   └── App.tsx                 # ✅ routes complètes (publiques + protégées sous AppShell)
├── index.html                  # ✅ lang="fr", titre AfricaBridge
└── vite.config.ts              # ✅ plugin react + @tailwindcss/vite
```

> Note : TanStack Query est utilisé directement dans les pages (pas de dossier `hooks/` dédié).
> Les composants propres à un domaine vivent **dans** `pages/<domaine>/` (ex. `BoutonRejoindre.tsx`).

**Convention de nommage** : dossiers et fichiers **techniques en anglais** (`components`, `pages`,
`hooks`, `api`, `Button.tsx`) · **composants en PascalCase**, un composant par fichier ·
le **français** pour les libellés affichés et les **valeurs d'énumération du contrat**.

**Principe non négociable :** aucun composant ne sait qu'un mock existe.
Toute la simulation vit dans `api/` + `mocks/`.

---

## 5. Le passage mock → backend réel

But : **zéro ligne de composant à changer.**

```ts
// main.tsx
if (import.meta.env.VITE_USE_MOCKS === 'true') {
  const { worker } = await import('./mocks/browser')
  await worker.start()
}
```

### ⚠️ `VITE_API_BASE_URL` désigne la RACINE, PAS `/api/v1`

```
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8000        ← SANS /api/v1
```

Le client axios dérive **deux** URL depuis cette racine :
- l'API : `${VITE_API_BASE_URL}/api/v1`
- Sanctum : `${VITE_API_BASE_URL}/sanctum`

C'est imposé par le contrat : `/sanctum/csrf-cookie` est à la **RACINE**. Mettre `/api/v1` dans
cette variable provoque une 404 sur l'appel CSRF et **rend le login impossible**.

En production : URLs **relatives** (même origine), donc variable **vide**.

Runbook complet : **`INTEGRATION.md`**.

---

## 6. Les fichiers qui portent le contexte

| Fichier | Pour qui | Rôle |
|---|---|---|
| `AGENTS.md` | agent | ce fichier — lu automatiquement à chaque session |
| `openapi-africabridgefinal.yaml` | tous | **le contrat, source de vérité absolue** |
| `docs/ANALYSE-CONTRAT.md` | front + backend | analyse du contrat + carte des 21 écrans + points ouverts |
| `ASSUMPTIONS.md` | front | 26 décisions prises faute de précision du contrat, **à vérifier contre le backend** |
| `INTEGRATION.md` | backend + jour J | runbook de bascule + **Règle des écarts** + checklist J2 |
| `scripts/conformite/` | front + backend | test de conformité OpenAPI (31 scénarios) + son auto-test (55 assertions) |
| `docs/design/orientation-palette.png` | front | la palette validée, régénérable |

### La Règle des écarts — à connaître

> Le contrat fait autorité. **Soit le backend corrige, soit on amende le YAML et on régénère les
> types. Jamais de rustine silencieuse dans le front.**

Procédure complète : `INTEGRATION.md` § 2. Les 4 catégories d'écart (bug front / bug backend /
silence du contrat / contradiction du contrat) et les 9 formes de rustine interdites y sont listées.

---

## 7. Convention de travail git

**L'utilisateur est SEUL maître du dépôt.** L'agent ne fait **jamais** de `add`, `commit`,
`push`, `branch`, `merge` ni `checkout`.

| Qui | Fait quoi |
|---|---|
| **Agent** | vérifier la branche courante en **lecture seule** avant d'écrire · créer et modifier les fichiers · livrer un **récap de lot** (fichiers + message de commit prêt) |
| **Utilisateur** | toutes les commandes git, **et la fusion sur l'interface GitHub** |

### Le cycle, pour chaque module

```
1. cd RACINE && git checkout frontend && git pull
2. git checkout -b feat/<module>
3. … on code le module complet …
4. git add . / git status / git commit / git push -u origin feat/<module>
5. GitHub : Pull Request  feat/<module> → frontend
6. GitHub : fusion (Squash and merge ou Merge commit)
7. cd RACINE && git checkout frontend && git pull      ← l'étape qu'on oublie
8. git branch -D feat/<module>
```

### Les 6 pièges à ne pas oublier

1. **Toutes les commandes git se tapent depuis la RACINE.** `git add .` est **relatif au dossier
   courant** : depuis `frontend/`, il n'ajoute que `frontend/` et rate `docs/`, `scripts/`, `AGENTS.md`.
2. **Les fichiers non suivis changent de branche avec toi.** Commiter sur la bonne branche
   **avant** de changer de branche.
3. **Toujours brancher depuis un `frontend` à jour** (`git pull` avant `checkout -b`).
4. **Après une fusion GitHub, le `frontend` local est périmé** → `git pull` obligatoire.
5. **`git branch -d` refuse après une fusion « squash »** → utiliser `-D`.
6. **`main` est très en retard** (elle n'a que le commit initial) → prévoir `frontend` → `main`
   à un jalon.

### Convention de nommage des branches

`feat/<module>` — en anglais, kebab-case. Exemples : `feat/api-et-auth`, `feat/projets`.

### Rappel technique

`node_modules` et `dist` sont exclus par `frontend/.gitignore`. **Vérifier avec `git status`
qu'aucun `node_modules` n'apparaît** avant de commiter.

---

## 8. Feuille de route des modules

| # | Branche | Contenu | État |
|---|---|---|---|
| **0** | `feat/design-system` | Poppins, icônes Lucide, tokens, 11 primitives, page atelier | ✅ fusionné |
| **1** | `feat/api-et-auth` | client axios (2 racines, 401/419 bornés), mocks MSW, **module Auth** complet | ✅ fusionné |
| **2** | `feat/profil` | mon profil, modification, compétences, photo | ✅ fusionné |
| **3** | `feat/projets` | explorer, créer, détail (onglets), modifier, mes projets | ✅ fusionné |
| **4** | `feat/equipes` | bouton « Rejoindre » (machine à états), onglets Équipe/Demandes, mes demandes | ✅ **code prêt · à tester puis fusionner** |
| **5** | `feat/messagerie` | discussion + **polling 5 s** + curseur | ✅ **code prêt · à tester puis fusionner** |
| **6** | `feat/ressources` | bibliothèque, partage | ⬜ |
| **7** | `feat/talents` | recherche de talents, profil public | ⬜ |
| **8** | `feat/dashboard` | tableau de bord (repli P0) + portfolio | ⬜ |
| **9+** | `feat/follow`, `feat/commentaires` | le P1, si le planning tient | ⬜ |

**Pourquoi cet ordre** : le design system d'abord (sinon chaque module réinvente ses boutons) ;
puis `api-et-auth` (c'est là que vit le code le plus risqué du projet — le rejeu 419, les deux
racines, le curseur). Prouver ça tôt évite de découvrir le problème la veille de la démo.

---

## 9. État actuel

### Fait
- Contrat API lu et **analysé intégralement** (1 847 lignes) → `docs/ANALYSE-CONTRAT.md`.
- `ASSUMPTIONS.md` (26 hypothèses) et `INTEGRATION.md` (runbook + Règle des écarts) écrits.
- Outillage de conformité OpenAPI écrit et **auto-testé** (`scripts/conformite/`).
- Types générés depuis l'OpenAPI (`npm run types:api`) + alias `Required`/`Omit` dans `types/index.ts`.
- `lib/labels.ts`, `lib/constants.ts`, `lib/priorites.ts` écrits.
- **Modules 0 à 3 livrés et fusionnés** (PR #4 → #7) : design-system, api-et-auth, profil, projets.
- **Module 4 (`feat/equipes`) codé + `tsc` 0** — sur la branche locale `feat/equipes`, **pas encore commité**.
  - Correction du bug « Projet introuvable » (cache périmé, `ASSUMPTIONS.md` A-17) : `lib/cache.ts`.
  - Le propriétaire est alerté des demandes reçues (A-16) : pastille « Mes projets », carte, onglet.
  - Message facultatif à l'envoi d'une demande ; erreurs 409 affichées partout (`messageErreur`).
  - Mocks alignés sur le contrat : filtre `statut`, 409 par cas, 404/403 sur l'annulation, cascade
    à la suppression, `role_equipe` sur `/me/projects`.
- **Module 5 (`feat/messagerie`) codé + `tsc` 0** : onglet « Discussion » (membres uniquement), polling 5 s
  par `refetchInterval`, curseurs `apres_id`/`depuis` (A-5, A-13, A-18), historique `avant_id`, suppression
  (auteur ou propriétaire). Mocks avec **coéquipier simulé** : il répond ~6-9 s après ton message ; un
  message commençant par `/bot` poste un message éphémère puis le supprime 8 s plus tard (pour VOIR `supprimes`).
- **Règles permanentes** : le site est **toujours responsive** (vérifier 320 / 375 / 768 px) · à la fin de
  chaque module, **rappeler à l'utilisateur de mettre le dépôt à jour** (commit, push, PR, fusion, `git pull`).
  - Règle : **toute nouvelle écriture appelle `rafraichirProjets()`** ; les clés de cache sont
    documentées en tête de `lib/cache.ts`.

### À faire, dans l'ordre
1. **Tester puis fusionner `feat/messagerie`** (onglet « Discussion » : envoi, polling 5 s, suppression, historique).
2. Puis `feat/ressources`, `feat/talents`, `feat/dashboard`, enfin le P1.
4. Vérifier les hypothèses 🔴 d'`ASSUMPTIONS.md` auprès du backend (2 critiques : `V-1`, `V-2`).

### Info utile
Le dev backend a des branches distantes actives : `feat/authentification-sanctum` et
`feat/structure-base-de-donnees`. **Le backend avance** — l'authentification Laravel pourrait
être testable plus tôt que prévu.

---

## 10. Points ouverts à trancher

1. **Tri par défaut** non spécifié dans le contrat sur `/users`, `/projects`, `/resources`
   → convention proposée : `created_at DESC` (voir `ASSUMPTIONS.md` `A-1`).
2. **Libellés d'affichage** manquants pour les 10 `RoleProfil` et 12 `Domaine`
   (seul `StatutProjet` a ses libellés dans le contrat) → `lib/labels.ts`.
3. **`GET /users/{id}/portfolio`** renvoie `Projet` complet alors que le commentaire parle
   d'« identité courte » → envisager un schéma `ProjetPortfolio` dédié.
4. **`RessourceUpdate`** ne permet pas de remplacer `fichier` ni de changer `type` / `visibilite`.
5. **Police monospace** : JetBrains Mono ou Monaspace ? Le token pointe pour l'instant sur la pile
   système. Le contrat a besoin de mono pour `contenu_code` — **à trancher**.
6. **`frontend/.oxlintrc.json`** : présent dans le modèle Vite, mais **aucune dépendance `oxlint`**
   dans `package.json` → inutilisé par les scripts npm. Conservé au cas où l'IDE s'en servirait.
   **À décider** : garder ou supprimer.
7. **`ma_demande_statut` après un départ** (`V-2`) : le contrat est muet. Si la demande reste
   `acceptee`, un membre qui quitte ne peut plus redemander (409). **Question critique pour le backend.**
8. **Hors périmètre confirmé** : mot de passe oublié, changement d'e-mail, suppression de compte,
   vérification d'e-mail, transfert de propriété d'un projet, notifications push.
9. **Source unique des enums** : les générer depuis l'OpenAPI plutôt que les recopier à la main.

---

## 11. Contraintes d'environnement

- **Crédit DeepSeek limité et expirant** (bonus offert, échéance proche).
  → Privilégier `deepseek-flash` pour le travail courant ; réserver `deepseek-v4-pro` aux tâches
  réellement complexes. Nouvelle session par sujet pour garder un contexte léger.
- **Ne pas coller de gros fichiers dans le chat** : donner les chemins, l'agent lit ce qui est utile.
- Le dossier du projet est sur **`D:\`** (hors OneDrive) — volontaire, pour éviter les conflits
  de synchronisation avec `node_modules`.

### Limites du sandbox de l'agent (important)

L'agent travaille dans un environnement **confiné**. Trois conséquences pratiques :

| Impossible pour l'agent | Conséquence |
|---|---|
| `npm install` (cache npm hors workspace → `EPERM`) | **l'utilisateur installe les paquets** |
| `vite build` (`spawn EPERM` — tubes inter-processus interdits) | **l'utilisateur lance le build et le dev server** |
| Écriture git (`.git/index.lock` inaccessible) | **l'utilisateur commite** — garde-fou structurel |

**Ce que l'agent PEUT vérifier** : `tsc -b` (typecheck complet), la lecture de tout fichier, la
génération d'images Python, les calculs de contraste, les scripts Node sans spawn.

**Règle qui en découle** : quand une vérification est impossible, **le dire explicitement** et
donner à l'utilisateur la commande exacte à lancer — jamais prétendre avoir vérifié.

### Appris à la dure

- `react-icons` v5 **préfixe chaque icône par le nom de son set** : `LuCheck`, `LuSearch`…
  Les noms bruts de Lucide (`Check`) n'existent pas → erreur de chargement du module.
- Les modifications parallèles sur un **même fichier** s'annulent : une seule édition à la fois.
- Toujours vérifier dans le paquet installé plutôt que de supposer une convention.
- **Après TOUTE modification d'un fichier de `mocks/`, redémarrer `npm run dev` + recharger
  (`Ctrl+Shift+R`)** : MSW fige sa liste de handlers au démarrage, le HMR ne la reconstruit pas.
  Sinon → « 404 storm » sur `/api/v1/*`.
- **Types générés LÂCHES** (le contrat déclare rarement `required`) : `Required<Schéma>` ne
  corrige que le niveau supérieur. Pour un champ imbriqué de type **TABLEAU**, l'intersection
  `& { x: T[] }` ne se réduit pas — utiliser `Omit<Required<S>, 'x'> & { x: T[] }`. Pour un
  **OBJET** imbriqué, l'intersection suffit.
- **Le bouton « Rejoindre » est LA machine à états du front** — voir
  `frontend/src/pages/projets/BoutonRejoindre.tsx` (tableau `is_member` × `ma_demande_statut` × `statut`).
