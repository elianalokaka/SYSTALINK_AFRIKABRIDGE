# AfricaBridge (SYSTALINK) — Contexte projet & décisions

> **Ce fichier est lu automatiquement par l'agent à chaque session dans ce dossier**
> (plugin `agent-instructions`, marqueur de racine `.git`).
> Il porte le contexte et les décisions prises en amont, pour qu'aucune session ne reparte de zéro.
> **Ne pas le supprimer.**

---

## 1. Le projet

| | |
|---|---|
| **Nom** | AfricaBridge |
| **Cadre** | Concours Systalink |
| **Objet** | Plateforme collaborative qui connecte les talents africains pour créer des équipes et réaliser des projets innovants |
| **Dépôt** | `https://github.com/elianalokaka/SYSTALINK_AFRIKABRIDGE.git` (branche `main`) |
| **Backend** | Laravel 11+ — API REST |
| **Authentification** | Laravel Sanctum en mode SPA : **session + cookies. AUCUN token, pas de JWT** |
| **Frontend** | React + TypeScript + Tailwind + DaisyUI |
| **Équipe** | Arthur Manuana (frontend) + dev backend |

---

## 2. Le contrat API — SOURCE DE VÉRITÉ ABSOLUE

**Fichier : `openapi-africabridgefinal.yaml`** — à placer à la racine de ce dépôt.

> Règle d'or inscrite dans le contrat lui-même :
> *« Ce document fait autorité. Toute divergence entre le code et ce contrat est un bug. »*

### Périmètre
- **~44 opérations** : **33 en P0** (MVP) et **11 en P1** (bonus, se coupent en premier en cas de retard).
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
| **401** | Session absente/expirée | Rediriger vers la connexion |
| **419** | Jeton CSRF absent/périmé | Rappeler `/sanctum/csrf-cookie` puis **rejouer** la requête |
| 403 | Policy Laravel | Afficher « non autorisé » |
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
  Le front renvoie `meta.server_time` **tel quel** dans `depuis` au tour suivant.
- **`competence_ids`** en query string : sérialiser en `competence_ids[]=1&competence_ids[]=2`
  (nécessite un `paramsSerializer` axios avec brackets) sur `/users`, `/projects`, `/resources`.
- **Uploads** : photo 2 Mo max, ressource 10 Mo max → **422** sur le champ.
  Au-dessus de **16 Mo** → **413**. Nginx : `client_max_body_size 16m`.
  `POST` (pas `PATCH`) pour la photo : PHP ne lit pas multipart sur PATCH/PUT.
- **`POST /resources`** accepte **deux** content-types : `application/json` **ou** `multipart/form-data`
  selon qu'un fichier est joint.
- **Email** : présent **uniquement** dans `ProfilPrive` (`/auth/me`, login, register).
  `GET /users/{id}` ne doit JAMAIS contenir la clé `email`.
- **Champs P1 présents dans les réponses P0** : `is_following`, `followers_count`, `following_count`
  valent `false` / `0` tant que le follow n'est pas livré. **Ne rien construire dessus.**
- **Statuts projet** : valeurs techniques `recrutement` / `en_cours` / `termine`,
  libellés affichés **« Ouvert » / « En cours » / « Terminé »**.
  `termine` est **définitif** et interdit à la création.
- **`is_member`** et **`ma_demande_statut`** pilotent l'état des boutons d'un projet
  selon qui regarde. C'est la logique d'état la plus délicate du front.
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
| ✅ **DaisyUI** | Oui, mais avec un **thème personnalisé**. Jamais le thème par défaut (look « cliché IA »). |

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
- ✅ Contraste texte/fond ≥ 4.5:1 **vérifié**
- ✅ Données d'exemple plausibles (noms, dates, montants réalistes)

### Méthode
- **Le design est une entrée, pas une sortie.** Ne jamais inventer un style :
  si ce n'est pas spécifié → **demander**, ne pas deviner.
- Les **tokens** (couleurs, polices, espacements, rayons) sont la **seule source de vérité**.
  Aucune valeur codée en dur, nulle part.
- **Fournir des captures de référence**, pas des descriptions écrites — l'agent lit les images
  (jusqu'à 20 par message).
- Construire les **primitives avant les écrans**, et faire **valider la direction visuelle**
  avant d'écrire des centaines de lignes.
- **DaisyUI : thème personnalisé obligatoire**, jamais le thème par défaut.

> La doctrine détaillée (tokens, protocole en 5 étapes, checklist de recette) sera écrite
> dans son propre fichier lors de la phase design.

---

## 4. Architecture cible (validée — pas encore créée)

```
src/
  api/                    # client typé (axios), un module par domaine
    client.ts             # baseURL, withCredentials, withXSRFToken, intercepteurs 401/419
    auth.ts  users.ts  projects.ts  teams.ts
    messages.ts  resources.ts  portfolio.ts  dashboard.ts
  types/
    api.types.ts          # ← GÉNÉRÉ depuis l'OpenAPI (source de vérité)
  mocks/
    browser.ts            # setupWorker (dev)
    server.ts             # setupServer (tests)
    db.ts                 # base en mémoire, STATEFUL (login, création, messages…)
    seed.ts               # reflète le seeder du contrat
    handlers/             # un fichier par domaine
  features/               # pages + composants par module
  hooks/                  # TanStack Query, un hook par ressource
  lib/
    labels.ts             # enum → libellés (RoleProfil, Domaine, StatutProjet…)
    constants.ts          # pays ISO, listes figées
  ASSUMPTIONS.md          # nos choix locaux à vérifier contre le back
  INTEGRATION.md          # le runbook de connexion au vrai backend
  main.tsx                # boot + démarrage conditionnel de MSW
```

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

Le jour J, on change **deux variables d'environnement** :
```
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

En production : URLs **relatives** (même origine), donc rien à configurer.

---

## 6. Les deux fichiers de sécurité

| Fichier | Pour qui | Rôle |
|---|---|---|
| `ASSUMPTIONS.md` | Équipe front | Les décisions prises faute de précision du contrat (ex. tri par défaut), **à vérifier contre le backend** |
| `INTEGRATION.md` | Dev backend + jour J | Le runbook « je branche le vrai backend en 10 minutes » |

---

## 7. État actuel

**Fait**
- Contrat API lu et analysé intégralement (1 847 lignes).
- Décisions d'architecture arrêtées (voir §3).
- Workspace de travail configuré : `D:\parcours Génie Informatique Ulc - Icam\Projet_VIE\SYSTALINK_AFRIKABRIDGE`.
- Dépôt cloné (ne contient que le README à ce stade).

**À faire, dans l'ordre**
1. Placer `openapi-africabridgefinal.yaml` à la racine du dépôt.
2. Finaliser le plan de structure (décisions, pas encore de code).
3. Écrire `ASSUMPTIONS.md` + `INTEGRATION.md`.
4. **Seulement ensuite** : scaffold du projet + mocks + écrans d'exemple.

---

## 8. Points ouverts à trancher

1. **Tri par défaut** non spécifié dans le contrat sur `/users`, `/projects`, `/resources`
   → convention proposée : `created_at DESC`.
2. **Libellés d'affichage** manquants pour les 10 `RoleProfil` et 12 `Domaine`
   (seul `StatutProjet` a ses libellés dans le contrat).
3. **`GET /users/{id}/portfolio`** renvoie `Projet` complet alors que le commentaire parle
   d'« identité courte » → envisager un schéma `ProjetPortfolio` dédié.
4. **`RessourceUpdate`** ne permet pas de remplacer `fichier` ni de changer `type` / `visibilite`.
5. **Hors périmètre confirmé** : mot de passe oublié, changement d'e-mail, suppression de compte,
   vérification d'e-mail, transfert de propriété d'un projet, notifications push.
6. **Source unique des enums** : les générer depuis l'OpenAPI plutôt que les recopier à la main.

---

## 9. Contraintes d'environnement

- **Crédit DeepSeek limité et expirant** (bonus offert, échéance proche).
  → Privilégier `deepseek-flash` pour le travail courant ; réserver `deepseek-v4-pro` aux tâches
  réellement complexes. Nouvelle session par sujet pour garder un contexte léger.
- **Ne pas coller de gros fichiers dans le chat** : donner les chemins, l'agent lit ce qui est utile.
- Le dossier du projet est sur **`D:\`** (hors OneDrive) — volontaire, pour éviter les conflits
  de synchronisation avec `node_modules`.
