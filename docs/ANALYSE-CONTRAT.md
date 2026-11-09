# AfricaBridge — Analyse du contrat API & carte fonctionnelle du frontend

> **Source analysée** : `openapi-africabridgefinal.yaml` — version **1.2.0**, 1 847 lignes.
> Lecture **intégrale** du fichier, pas d'un résumé : les comptages et les citations ci-dessous
> sont vérifiés sur le document lui-même.
> **Règle d'or rappelée par le contrat** : *« Ce document fait autorité. Toute divergence entre
> le code et ce contrat est un bug. »*
> Ce fichier est une **analyse**, pas une source de vérité : en cas de désaccord, le YAML gagne.

---

## 1. Synthèse exécutive

| Indicateur | Valeur constatée | Commentaire |
|---|---|---|
| Opérations totales | **44** | conforme à l'annonce d'`AGENTS.md` |
| Opérations **P0** (MVP) | **33** | périmètre livrable obligatoire |
| Opérations **P1** (bonus) | **11** | se coupent en premier |
| Tags (domaines) | **10** | `Auth`, `Profils & Compétences`, `Recherche de talents`, `Suivi entre développeurs`, `Projets`, `Équipes`, `Messagerie projet`, `Ressources`, `Portfolio`, `Dashboard` |
| Schémas de données | **45** | dont 5 énumérations partagées + `TypeRessource` + 8 schémas de pagination |
| Routes **publiques** (`security: []`) | **4** | `csrf-cookie`, `register`, `login`, `stats` |
| Opérations sans erreur déclarée | **1** | `GET /sanctum/csrf-cookie` (204 seul) — normal |
| Opérations à **double content-type** | **1** | `POST /resources` (JSON *ou* multipart) |

**Le fait structurant** : le frontend est un **produit authentifié**. Sur 44 opérations, une seule
(`GET /stats`, P1) est publique et ne sert qu'au pitch. Aucune landing page, aucun parcours
visiteur : c'est cohérent avec la décision déjà actée en §3 d'`AGENTS.md`.

---

## 2. Modèle d'authentification — le point le plus structurant

### 2.1 Le flux imposé

Le contrat verrouille un flux **Sanctum SPA par cookies de session**. Il n'y a **aucun token
applicatif** : ni JWT, ni Bearer, ni Personal Access Token.

```
1. GET  {racine}/sanctum/csrf-cookie   → 204, pose le cookie XSRF-TOKEN (lisible par JS)
2. POST /api/v1/auth/login             → 200, pose africabridge_session (HttpOnly)
3. …toutes les requêtes suivantes      → le navigateur envoie les cookies automatiquement
4. POST /api/v1/auth/logout            → 204, session invalidée
```

Citations du contrat à ne jamais perdre de vue :

> *« Le frontend ne lit, ne stocke et ne renvoie JAMAIS de token (pas de localStorage, pas de
> header Authorization). »*

> *« `/sanctum/csrf-cookie` est à la RACINE, hors du préfixe `/api/v1`. »*

Le schéma de sécurité déclaré est `SanctumCookie`, de type `apiKey` / `in: cookie` /
`name: africabridge_session`, avec durée de vie `SESSION_LIFETIME` (120 min par défaut).

### 2.2 Deux origines, deux configurations

Le contrat prévoit explicitement **deux serveurs** et deux régimes :

| Contexte | Base URL | Cookies |
|---|---|---|
| Développement | `http://localhost:8000/api/v1`, front Vite sur `5173` | origines croisées ⇒ `SANCTUM_STATEFUL_DOMAINS` et `CORS_ALLOWED_ORIGINS` doivent lister `localhost:5173` |
| Production (VPS Datacloud) | `https://{hote}/api/v1`, front servi à la racine | **même origine** ⇒ URLs **relatives**, CORS n'est qu'un filet |

`{hote}` vaut par défaut **`A_REMPLACER_AVANT_J2`** — un marqueur, pas une valeur déployable.
Le contrat prévient : *« Ne pas déployer avec cette valeur. »*

> **Conséquence pour le client axios** : la base URL du client n'est **pas** la même que celle de
> `/sanctum/csrf-cookie`. Le client a besoin de **deux** valeurs (racine de l'API et racine du
> serveur), ou d'une seule racine dont on dérive `/api/v1` et `/sanctum`. Cette dérivation doit
> être faite **une fois**, dans `api/client.ts`, et nulle part ailleurs.

### 2.3 Sémantique d'erreur — le contrat des intercepteurs

| Code | Déclencheur contractuel | Réaction front exigée |
|---|---|---|
| **401** | session absente/expirée | vider l'état utilisateur, rediriger vers la connexion |
| **419** | jeton CSRF absent/périmé | rappeler `/sanctum/csrf-cookie` **puis rejouer la requête** |
| 403 | Policy Laravel | afficher « non autorisé », ne pas déconnecter |
| 404 | ressource inconnue | page/section vide |
| **409** | conflit métier (déjà membre, demande en attente, équipe complète, demande déjà traitée, `termine` définitif, propriétaire qui quitte) | message contextuel — **pas** une erreur générique |
| **413** | corps > 16 Mo (Nginx/PHP) | « Fichier trop volumineux (16 Mo maximum). » |
| **422** | validation Laravel | `{ message, errors: { champ: [messages] } }` → erreurs **par champ** |
| **429** | throttle | respecter `Retry-After` (en-tête déclaré) |

**Deux subtilités que le contrat impose explicitement :**

1. **`POST /users/{id}/follow` renvoie 409 quand on suit déjà la personne, et le contrat précise
   que « le front traite ce 409 comme un succès »** — le corps de la 409 est un `FollowState`
   valide. C'est le seul endroit où un 409 n'est pas une erreur à afficher.
2. **413 ≠ 422.** Le 413 est une limite *d'infrastructure* (16 Mo, Nginx/PHP) ; le 422 est une
   limite *métier* (2 Mo photo, 10 Mo ressource) et arrive **sur le champ** (`errors.photo`,
   `errors.fichier`). Le contrat insiste : `upload_max_filesize=12M`, `post_max_size=16M`,
   `client_max_body_size 16m`. Un même fichier de 3 Mo passe la limite d'infra mais échoue la
   limite métier ⇒ **422**. Le front doit gérer les deux, séparément.

### 2.4 Le piège du 419

Rejouer une requête après un 419 est la partie la plus facile à écrire **mal**. Trois règles :

- Le rejeu doit être **borné à une seule tentative**. Un 419 en boucle est une boucle infinie de
  requêtes contre le backend.
- Le rafraîchissement CSRF doit être **mutualisé** : si cinq requêtes prennent un 419 en
  parallèle (cas réel d'une page qui charge plusieurs ressources), il faut **une** promesse de
  rafraîchissement partagée, pas cinq appels à `/sanctum/csrf-cookie`.
- Une requête **multipart** rejouée doit conserver son `FormData` intact. Un `FormData` déjà
  consommé ne se rejoue pas : il faut le reconstruire, ce qui impose de garder une fabrique de
  corps et non un corps déjà sérialisé.

---

## 3. Inventaire complet des 44 opérations

`P0` = MVP. `P1` = bonus, se coupe en premier.

### 3.1 Auth — 5 opérations `[Auth]`

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P0 | `GET /sanctum/csrf-cookie` | 204 | **hors `/api/v1`**, public, appel unique au boot + après tout 419 |
| P0 | `POST /auth/register` | 201, 419, 422 | public · renvoie `ProfilPrive` · **session ouverte directement** |
| P0 | `POST /auth/login` | 200, 419, 422, **429** | public · champ `se_souvenir` (remember me) · throttle **5/min par email+IP** |
| P0 | `POST /auth/logout` | 204, 401, 419 | `Auth::logout()` + `invalidate()` + `regenerateToken()` |
| P0 | `GET /auth/me` | 200, 401 | **LA** route de l'utilisateur courant. Il n'existe **pas** de `GET /users/me` |

> **Piège encodé dans le contrat** : `GET /auth/me` est la seule façon de lire son propre profil.
> Le contrat explique pourquoi : `/users/me` serait ambigu avec `/users/{id}`. Il précise même
> côté backend : *« déclarer cette route AVANT `/users/{id}` »*.
> **`/users/me` existe en `PATCH` uniquement** (modifier son profil) — pas de `GET`.

### 3.2 Profils & Compétences — 5 opérations

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P0 | `GET /skills` | 200, 401 | catalogue **non paginé** `{ data: [...] }` · filtres `q`, `categorie` |
| P0 | `PATCH /users/me` | 200, 401, 419, 422 | `PATCH` partiel · renvoie `ProfilPrive` · **email et mot de passe non modifiables ici** |
| P0 | `PUT /users/me/skills` | 200, 401, 419, 422 | **`sync()` : remplace la liste complète**, pas un ajout |
| P0 | `POST /users/me/photo` | 200, 401, **413**, 419, 422 | `POST` et **pas `PATCH`** (PHP ne lit pas multipart sur PATCH/PUT) · jpg/png/webp, 2 Mo |
| P0 | `GET /users/{id}` | 200, 401, 404 | renvoie `Profil` — **la clé `email` est structurellement absente** |

### 3.3 Recherche de talents — 2 opérations

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P0 | `GET /users` | 200, 401 | filtres : `q`, `competence_ids`, `competence_match`, `domaine`, `pays`, `region`, `role_profil`, `page`, `per_page` · **l'utilisateur connecté est exclu des résultats** |
| P1 | `GET /users/suggestions` | 200, 401, **403**, 404 | `projet_id` (dont je suis **propriétaire**, sinon 403), `limit` 1-20 défaut 10 |

### 3.4 Suivi entre développeurs (follow) — 4 opérations, **toutes P1**

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P1 | `POST /users/{id}/follow` | 201, 401, 404, **409**, 419, 422 | 409 = déjà suivi ⇒ **traiter comme un succès** · 422 = se suivre soi-même |
| P1 | `DELETE /users/{id}/follow` | 200, 401, 404, 419 | **idempotent** : 200 même si la relation n'existait pas |
| P1 | `GET /users/{id}/followers` | 200, 401, 404 | paginé `UtilisateurPage` |
| P1 | `GET /users/{id}/following` | 200, 401, 404 | paginé `UtilisateurPage` |

### 3.5 Projets — 7 opérations

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P0 | `GET /projects` | 200, 401 | `ProjetPage` (cartes) · filtres `q`, `domaine`, `statut`, `competence_ids`, `places_disponibles`, pagination |
| P0 | `POST /projects` | 201, 401, 419, 422 | créateur ⇒ `proprietaire` automatique · `termine` refusé (422) |
| P1 | `GET /projects/suggestions` | 200, 401 | `limit` 1-20 défaut 10 · cartes `ProjetCarte` |
| P0 | `GET /projects/{id}` | 200, 401, 404 | **`Projet` complet** — pas la carte |
| P0 | `PATCH /projects/{id}` | 200, 401, **403**, 404, 419, 422 | **propriétaire uniquement** · `termine` définitif |
| P0 | `DELETE /projects/{id}` | 204, 401, 403, 404, 419 | propriétaire · **soft delete** |
| P0 | `GET /me/projects` | 200, 401 | filtres `role_equipe`, `statut`, pagination |

### 3.6 Équipes — 7 opérations, **toutes P0**

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P0 | `POST /projects/{id}/join-requests` | 201, 401, 404, **409**, 419, 422 | corps optionnel (`message` ≤ 500) · 409 si déjà membre / demande en attente / projet `termine` / équipe complète |
| P0 | `GET /projects/{id}/join-requests` | 200, 401, **403**, 404 | **propriétaire uniquement** · `statut` défaut **`en_attente`** |
| P0 | `PATCH /join-requests/{id}` | 200, 401, 403, 404, **409**, 419, 422 | `decision` ∈ `acceptee`/`refusee` · `acceptee` crée `project_members` (transaction) |
| P0 | `DELETE /join-requests/{id}` | 204, 401, 403, 404, **409**, 419 | **auteur uniquement** · seules les `en_attente` sont annulables |
| P0 | `GET /me/join-requests` | 200, 401 | mes demandes **envoyées** · filtre `statut`, pagination |
| P0 | `GET /projects/{id}/members` | 200, 401, 404 | **non paginé** `{ data: [...] }` |
| P0 | `DELETE /projects/{id}/members/{userId}` | 204, 401, 403, 404, **409**, 419 | propriétaire retire qui il veut ; un membre ne retire que lui-même · **le propriétaire ne peut PAS quitter son projet (409)** |

### 3.7 Messagerie projet — 3 opérations, **toutes P0**

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P0 | `GET /projects/{id}/messages` | 200, 401, **403**, 404 | **membres uniquement** · curseur `apres_id` / `avant_id` / `depuis` / `limit` (1-100, défaut 50) |
| P0 | `POST /projects/{id}/messages` | 201, 401, 403, 404, 419, 422 | `contenu` 1-2000 |
| P0 | `DELETE /projects/{id}/messages/{messageId}` | 204, 401, 403, 404, 419 | auteur **ou** propriétaire du projet · **soft delete** |

### 3.8 Ressources — 8 opérations

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P0 | `GET /resources` | 200, 401, **403**, — | filtres `q`, `type`, `competence_ids`, `projet_id`, `auteur_id` · **pas de 404 déclaré** · `projet_id` ⇒ 403 si je n'en suis pas membre |
| P0 | `POST /resources` | 201, 401, 403, **413**, 419, 422 | **double content-type** `application/json` *ou* `multipart/form-data` |
| P0 | `GET /resources/{id}` | 200, 401, 403, 404 | |
| P0 | `PATCH /resources/{id}` | 200, 401, 403, 404, 419, 422 | auteur **ou** propriétaire du projet lié |
| P0 | `DELETE /resources/{id}` | 204, 401, 403, 404, 419 | mêmes droits |
| P1 | `GET /resources/{id}/comments` | 200, 401, 403, 404 | paginé |
| P1 | `POST /resources/{id}/comments` | 201, 401, 403, 404, 419, 422 | `contenu` 1-1000 |
| P1 | `DELETE /comments/{id}` | 204, 401, 403, 404, 419 | auteur du commentaire **ou** auteur de la ressource |

### 3.9 Portfolio — 1 opération

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P0 | `GET /users/{id}/portfolio` | 200, 401, 404 | **borné, non paginé** `{ data: [...] }` · renvoie des `Projet` **complets** |

### 3.10 Dashboard — 2 opérations, **toutes P1**

| Prio | Opération | Réponses | Notes |
|---|---|---|---|
| P1 | `GET /stats` | 200, **429** | **public** · cache 5 min · throttle 60/min |
| P1 | `GET /me/dashboard` | 200, 401 | agrégats en un appel · **repli P0 documenté dans le contrat** |

---

## 4. Le P1 est-il vraiment optionnel ? — analyse de dépendance

C'est la question stratégique la plus importante du contrat, et la réponse est **non, pas
totalement**. Le P1 se répartit en trois familles très différentes :

| Famille | Opérations | Coût de l'absence | Verdict |
|---|---|---|---|
| **A — Repli propre documenté** | `GET /stats`, `GET /me/dashboard` | Le contrat **donne lui-même** la recette de remplacement avec des routes P0 | ✅ **vraiment** coupable |
| **B — Champ fantôme, à ignorer** | champs `is_following`, `followers_count`, `following_count` présents dans `Talent` / `Profil` / `Dashboard` | valent `false`/`0` : si on ne construit rien dessus, rien ne casse | ✅ coupable, **à condition de ne rien afficher** |
| **C — Fonctionnalité visible** | 4 opérations follow + 3 opérations commentaires + 2 suggestions | **des pans d'interface disparaissent** (onglets Abonnés/Abonnements, fil de commentaires, blocs « suggérés ») | ⚠️ **coupable mais assumé** : ce sont des écrans entiers à retirer |

**La règle de conception qui en découle** : les écrans P1 doivent être **retirables sans
casser le reste**. Concrètement, un onglet P1 absent ne doit pas laisser un onglet vide, un
séparateur orphelin ou un compteur `0` trompeur. Un `followers_count: 0` affiché à côté d'un
profil qui a manifestement des collaborations est un **mensonge visuel** : mieux vaut **ne pas
afficher la ligne du tout** tant que le P1 n'est pas livré.

> C'est exactement ce que veut dire l'avertissement du contrat : *« Ne rien construire dessus. »*
> Le piège n'est pas technique, il est de **présentation**.

### 4.1 Le repli du dashboard, tel que le contrat le prescrit

Le contrat écrit noir sur blanc la procédure de repli, à recopier telle quelle dans l'adaptateur :

```
REPLI SI NON LIVRÉ : le front construit le tableau de bord avec des routes P0 :
  GET /me/projects          (mes projets)
  GET /me/join-requests     (mes demandes envoyées)
  Les demandes reçues se lisent via GET /projects/{id}/join-requests, projet par projet.
  Le front bascule sur GET /me/dashboard dès qu'il est livré.
```

**Le point douloureux est identifié** : `demandes_recues_en_attente` est un simple entier dans
`Dashboard`, mais en repli il exige **un appel par projet dont je suis propriétaire**. Sur un
compte avec 5 projets, c'est 5 requêtes supplémentaires au chargement du tableau de bord.

> **Recommandation** : implémenter les deux chemins **dès le premier jour** derrière une seule
> fonction (`fetchDashboard()`), avec le chemin P1 tenté d'abord et bascule automatique sur 404
> (route non livrée). Le jour de la livraison du P1, **aucun composant ne change**. Le repli
> multi-requêtes doit être lancé en **parallèle** et **tolérant à l'échec** : un projet dont les
> demandes échouent ne doit pas faire tomber tout le tableau de bord.

---

## 5. Contraintes transversales à implémenter une seule fois

Ces points touchent plusieurs domaines. Chacun doit vivre à **un seul endroit** du code.

### 5.1 Sérialisation des tableaux en query string

Le contrat le répète **quatre fois** (`/users`, `/projects`, `/resources`, et par extension tout
`competence_ids`), avec la syntaxe exacte :

> *« NOTE FRONT: pour les tableaux, sérialiser en `competence_ids[]=1&competence_ids[]=2`
> (paramsSerializer axios avec brackets). »*

⇒ un `paramsSerializer` **unique** dans `api/client.ts`. Deux exigences qu'une implémentation
naïve rate :

- **Ne pas envoyer `competence_ids[]=undefined`** quand un filtre est vide ou non défini.
- Un filtre « aucun résultat possible » (tableau vide) doit être traité explicitement : envoyer
  la clé absente, pas un tableau vide, sinon le serveur interprète un filtre au lieu de rien.

### 5.2 Pagination — deux régimes

| Régime | Forme | Où |
|---|---|---|
| **Page** | `{ data, meta: { current_page, per_page, total, last_page } }` | `/users`, `/users/{id}/followers`, `/users/{id}/following`, `/projects`, `/me/projects`, `/projects/{id}/join-requests`, `/me/join-requests`, `/resources`, `/resources/{id}/comments` |
| **Curseur** | `{ data, supprimes, meta: { server_time } }` | `/projects/{id}/messages` **uniquement** |
| **Borné** (ni l'un ni l'autre) | `{ data }` | `/skills`, `/users/suggestions`, `/projects/suggestions`, `/projects/{id}/members`, `/users/{id}/portfolio` |

`per_page` : défaut **15**, maximum **50** (le `maximum: 50` est dans le schéma du paramètre).
Les messages ont leur propre `limit` : 1-100, défaut **50**.

### 5.3 Le polling des messages — zone à risque n°1 du projet

C'est, de l'avis de cette analyse, **la partie la plus délicate du frontend**. Le contrat impose :

> *« POLLING (toutes les 5 s) : `apres_id` = dernier id affiché, `depuis` = `meta.server_time` du
> tour précédent. Le front ajoute `data` et retire les ids listés dans `supprimes`. »*

Les règles de mise en œuvre, déduites strictement du contrat :

1. **Le premier appel ne doit PAS envoyer `depuis`.** Le contrat précise pour `supprimes` :
   *« Tableau vide si `depuis` est absent. »* Envoyer `depuis` au premier tour n'a pas de sens et
   invite le serveur à balayer l'historique des suppressions.
2. **`meta.server_time` se renvoie tel quel.** Le contrat est explicite : *« Le front la renvoie
   telle quelle dans `depuis` au poll suivant. »* ⇒ **ne pas** la convertir en `Date`, **ne pas**
   la reformater, **ne pas** la re-sérialiser. Stocker la chaîne brute et la renvoyer.
3. **`apres_id` doit être le plus grand id jamais vu**, pas simplement le dernier message affiché.
   Si un message est supprimé puis qu'un autre arrive, la progression doit rester monotone.
4. **Fusion idempotente.** Un poll peut recouvrir un message déjà affiché (chevauchement de
   curseur, rejeu après 419). L'ajout doit dédupliquer **par `id`**.
5. **Ordre d'affichage** : les messages arrivent *« triés du plus ancien au plus récent »*.
6. **L'historique se charge par `avant_id`** — donc **en remontant**: on insère en tête de liste,
   pas en queue. C'est l'inverse du polling.
7. **Un `403` sur cette route n'est pas une erreur** : c'est le signal « je ne suis plus membre »
   (retiré de l'équipe pendant la consultation). Il doit **arrêter le polling** proprement et
   rafraîchir l'état du projet, pas afficher une alerte rouge toutes les 5 secondes.
8. **Le polling doit s'arrêter** : onglet caché (`document.hidden`), composant démonté, erreur
   d'authentification. Cinq secondes est court — un timer orphelin interroge le backend pour rien.

> **Question ouverte** : le contrat fixe 5 s sans prévoir d'adaptation. Il faut décider si le
> polling se met en pause quand l'onglet est inactif. Cette décision relève d'`ASSUMPTIONS.md`.

### 5.4 Uploads — trois seuils, deux content-types

| Limite | Nature | Code | Cible |
|---|---|---|---|
| 2 Mo | métier (photo) | **422** | `errors.photo` |
| 10 Mo | métier (ressource) | **422** | `errors.fichier` |
| 16 Mo | infrastructure (Nginx/PHP) | **413** | `message` seul |

- **`POST /users/me/photo`** : multipart, champ `photo`. Réponse `{ photo_url }` — **remplacer
  l'ancienne photo du stockage** côté serveur, mais le front doit **invalider** son cache d'image
  (l'URL peut être identique après remplacement ⇒ risque d'image périmée en cache navigateur).
- **`POST /resources`** : si un fichier est joint ⇒ `multipart/form-data` ; sinon ⇒
  `application/json`. **Ne pas envoyer un `FormData` vide** : le `Content-Type` multipart avec un
  corps JSON-able est une source classique de 422 incompréhensible.
- `fichier` accepte pdf, docx, zip, png, jpg. **Obligatoire si `type = document`** (422 sinon).

### 5.5 Les règles de `visibilite` sur les ressources

Le contrat donne une consigne **explicite au frontend** :

> *« RÈGLE: ne pas envoyer `visibilite = publique` par défaut quand la ressource part d'un projet.
> Omettre le champ : le serveur applique `projet` si `projet_id` est présent, sinon `publique`. »*

⇒ le formulaire doit **omettre la clé** quand l'utilisateur n'a pas touché au choix, et ne
l'envoyer que sur choix explicite. Une case à cocher par défaut non cochée qui enverrait
`visibilite: 'publique'` **casserait la confidentialité attendue** d'une ressource d'équipe.

Matrice :

| `projet_id` | `visibilite` envoyée | Résultat |
|---|---|---|
| absent | absente | `publique` |
| présent | absente | **`projet`** (défaut serveur) |
| absent | `projet` | **422** |
| absent | `publique` | `publique` |
| présent | `publique` | `publique` (partage explicite hors équipe) |

### 5.6 Dates et identifiants

- Dates en **ISO 8601 UTC** (le contrat le déclare en convention). L'affichage doit convertir en
  heure locale **au rendu**, jamais dans la couche données — sinon le curseur `depuis` casse.
- Identifiants : **entiers** (bigint auto-incrémenté). Pas de string, pas d'UUID.
- `date_fin` est un `format: date` (jour seul), pas un `date-time`. Ne pas lui appliquer le même
  formatage qu'à `created_at`.

### 5.7 Le catalogue de compétences est fermé

> *« Catalogue fermé, alimenté par seeder (pas de création libre dans le MVP). »*

⇒ le sélecteur de compétences est un **choix dans une liste**, jamais un champ libre avec
création à la volée. `maxItems: 30` sur `CompetencesUpdate`.

---

## 6. Carte fonctionnelle du frontend

> Les noms d'écrans ci-dessous sont **dérivés du `# CIBLE:` de chaque opération** — le contrat
> indique lui-même à quel écran chaque route sert. Aucun écran n'est inventé : la colonne
> « Justification » cite l'opération qui le rend nécessaire.
> Les **principes visuels** relèvent de la doctrine design d'`AGENTS.md` (§3 bis) et ne sont pas
> redéfinis ici.

### 6.1 Navigation principale (5 entrées)

| Entrée | Écran | Opérations | Justification contractuelle |
|---|---|---|---|
| **Tableau de bord** | `Dashboard` | `GET /me/dashboard` (P1) ou repli `GET /me/projects` + `GET /me/join-requests` | *« page Dashboard après connexion »* |
| **Talents** | `Talents` (recherche) | `GET /users`, `GET /skills` | *« page Trouver des talents »* |
| **Projets** | `Projets` (explorer) | `GET /projects`, `GET /skills` | *« page Explorer les projets »* |
| **Bibliothèque** | `Ressources` | `GET /resources`, `GET /skills` | *« page Bibliothèque »* |
| **Mon profil** | `ProfilPrive` | `GET /auth/me` | *« état global React »* |

**Menus secondaires** : *Mes projets* (`GET /me/projects`), *Mes demandes*
(`GET /me/join-requests`), *Créer un projet* (`POST /projects`), *Partager une ressource*
(`POST /resources`), *Se déconnecter* (`POST /auth/logout`).

### 6.2 Tableau complet des écrans

| # | Écran | Route suggérée | Prio min. | Opérations mobilisées |
|---|---|---|---|---|
| 1 | Connexion | `/connexion` | **P0** | `GET /sanctum/csrf-cookie`, `POST /auth/login` |
| 2 | Inscription | `/inscription` | **P0** | `GET /sanctum/csrf-cookie`, `POST /auth/register` |
| 3 | Tableau de bord | `/` ou `/tableau-de-bord` | **P0** (repli) / P1 | `GET /auth/me`, `GET /me/projects`, `GET /me/join-requests`, `GET /projects/{id}/join-requests` ×N ; P1 : `GET /me/dashboard`, `GET /projects/suggestions` |
| 4 | Talents — recherche | `/talents` | **P0** | `GET /users`, `GET /skills` ; P1 : `GET /users/suggestions` |
| 5 | Profil public d'un membre | `/talents/:id` | **P0** | `GET /users/{id}`, `GET /users/{id}/portfolio` ; P1 : follow ×2, followers, following |
| 6 | Modifier mon profil | `/profil/modifier` | **P0** | `GET /auth/me`, `PATCH /users/me`, `PUT /users/me/skills`, `GET /skills`, `POST /users/me/photo` |
| 7 | Explorer les projets | `/projets` | **P0** | `GET /projects`, `GET /skills` |
| 8 | Créer un projet | `/projets/nouveau` | **P0** | `POST /projects`, `GET /skills` |
| 9 | Détail projet — **Vue** | `/projets/:id` | **P0** | `GET /projects/{id}`, `GET /projects/{id}/members` |
| 10 | Détail projet — **Équipe** | `/projets/:id/equipe` | **P0** | `GET /projects/{id}/members`, `DELETE /projects/{id}/members/{userId}` |
| 11 | Détail projet — **Discussion** | `/projets/:id/discussion` | **P0** | `GET`/`POST /projects/{id}/messages`, `DELETE …/messages/{messageId}` |
| 12 | Détail projet — **Ressources** | `/projets/:id/ressources` | **P0** | `GET /resources?projet_id=`, `POST /resources` ; P1 : commentaires |
| 13 | Détail projet — **Demandes** (propriétaire) | `/projets/:id/demandes` | **P0** | `GET /projects/{id}/join-requests`, `PATCH /join-requests/{id}` |
| 14 | Détail projet — **Édition** (propriétaire) | `/projets/:id/modifier` | **P0** | `PATCH /projects/{id}`, `DELETE /projects/{id}` |
| 15 | Mes projets | `/mes-projets` | **P0** | `GET /me/projects` |
| 16 | Mes demandes | `/mes-demandes` | **P0** | `GET /me/join-requests`, `DELETE /join-requests/{id}` |
| 17 | Bibliothèque de ressources | `/ressources` | **P0** | `GET /resources`, `GET /skills` |
| 18 | Détail d'une ressource | `/ressources/:id` | **P0** | `GET /resources/{id}` ; `PATCH`/`DELETE` si auteur ; P1 : commentaires |
| 19 | Partager une ressource | `/ressources/nouvelle` | **P0** | `POST /resources`, `GET /skills` |
| 20 | Profil public — **Abonnés / Abonnements** | onglets du #5 | **P1** | `GET /users/{id}/followers`, `GET /users/{id}/following` |
| 21 | Page publique / pitch | `/decouvrir` | **P1** | `GET /stats` (public) |

Total : **21 entrées d'écran** dans le tableau = **19 écrans P0** + **2 entrées P1** (les onglets
Abonnés/Abonnements sont des onglets du profil public, pas des écrans autonomes).

### 6.3 Le cœur fonctionnel : les 4 parcours bout en bout

Ces quatre parcours traversent le plus grand nombre d'écrans et concentrent les règles métier.

**Parcours 1 — Rejoindre un projet (le plus critique)**
`Talents` → clic sur un projet (`GET /projects`) → `GET /projects/{id}` → bouton
« Rejoindre ce projet » (`POST /projects/{id}/join-requests`) → le propriétaire voit la demande
(`GET /projects/{id}/join-requests`) → accepte (`PATCH /join-requests/{id}`) → le demandeur devient
membre → la discussion et les ressources du projet s'ouvrent.

**Parcours 2 — Créer une équipe**
`POST /projects` (créateur ⇒ `proprietaire`) → `GET /projects/suggestions` (P1) ou
`GET /users` filtré sur les compétences recherchées → le propriétaire reçoit des demandes →
accepte/refuse → l'équipe se remplit jusqu'à `nombre_membres_souhaite`.

**Parcours 3 — Collaborer**
`GET /projects/{id}/messages` → `POST` → **polling 5 s** → suppression de message
(soft delete, propagée par `supprimes`). En parallèle : `POST /resources` rattaché au projet →
consultation par les membres.

**Parcours 4 — Portfolio et clôture**
`PATCH /projects/{id}` avec `statut: termine` ⇒ `date_fin = aujourd'hui`, `progression = 100`,
**définitif** → le projet apparaît dans `GET /users/{id}/portfolio` de **tous** ses membres →
`lien_realisation` mis en avant.

### 6.4 La logique d'état la plus délicate : le bouton « Rejoindre »

`AGENTS.md` signale ce point comme *« la logique d'état la plus délicate du front »*, et
l'analyse du contrat le confirme : **trois champs** se combinent.

| Champ | Source | Valeurs |
|---|---|---|
| `statut` | `Projet` / `ProjetCarte` | `recrutement` / `en_cours` / `termine` |
| `is_member` | `Projet`, `ProjetCarte` | booléen |
| `ma_demande_statut` | `Projet`, `ProjetCarte` | `en_attente` / `acceptee` / `refusee` / `null` |

Matrice d'état du bouton, dérivée des règles du contrat :

| `is_member` | `ma_demande_statut` | `statut` | Bouton | Réf. contractuelle |
|---|---|---|---|---|
| `true` | — | — | **« Aller à la discussion »** (ou Quitter) | *« members uniquement »* sur les messages |
| `false` | `en_attente` | — | **« Demande en attente »** + Annuler | `DELETE /join-requests/{id}` |
| `false` | `refusee` | `recrutement`/`en_cours` | **« Rejoindre »** à nouveau | seul `en_attente` est bloqué par le 409 |
| `false` | `null` | `recrutement`/`en_cours` | **« Rejoindre ce projet »** | 409 si équipe complète |
| `false` | `acceptee` | — | incohérent ⇒ rafraîchir | `acceptee` crée la ligne membre |
| `false` | — | `termine` | **désactivé** | *« n'accepte plus de demandes »*, 409 |
| `false` | — | — | **désactivé** | `nombre_membres_actuel >= nombre_membres_souhaite` ⇒ 409 |

> **Point d'attention** : la ligne `acceptee` + `is_member: false` est **contradictoire**. Elle
> signale une réponse obsolète ou incomplète, pas un cas normal. Le front doit la traiter comme
> un signal de rafraîchissement, jamais comme un état à peindre.
> **Autre point d'attention** : après avoir quitté un projet
> (`DELETE /projects/{id}/members/{userId}`), le contrat **ne dit pas** que `ma_demande_statut`
> repasse à `null`. À vérifier ⇒ `ASSUMPTIONS.md`.

### 6.5 Table de dépendance écran → opérations P1

Ce que chaque écran **perd** si le P1 n'est pas livré — la vue de pilotage pour décider des
coupes :

| Écran | Élément P1 | Comportement de repli imposé |
|---|---|---|
| Tableau de bord | `GET /me/dashboard` | repli P0 documenté (§4.1) |
| Tableau de bord | `GET /projects/suggestions` | bloc « Projets pour vous » retiré |
| Talents | `GET /users/suggestions` | bloc « Talents suggérés » retiré |
| Profil public | follow (`POST`/`DELETE`) | bouton Suivre **absent** |
| Profil public | `followers_count`, `following_count` | **ne pas afficher** (0 est trompeur) |
| Profil public | onglets Abonnés/Abonnements | onglets retirés |
| Détail ressource | `commentaires_count` | champ présent en P0, mais **toujours 0** sans P1 ⇒ ne pas l'afficher comme compteur actif |
| Détail ressource | `GET`/`POST /resources/{id}/comments` | fil de commentaires retiré |
| Détail ressource | `DELETE /comments/{id}` | idem |
| Page publique | `GET /stats` | `/decouvrir` retirée (aucune autre source de chiffres) |

---

## 7. Contraintes de sécurité à ne jamais enfreindre

| # | Règle | Origine |
|---|---|---|
| 1 | **Jamais de token** : ni lecture, ni stockage, ni envoi. Pas de `localStorage`, pas d'en-tête `Authorization`. | description d'`info` |
| 2 | **Jamais d'`email` hors `ProfilPrive`.** `GET /users/{id}` ne doit **jamais** contenir la clé `email`. `GET /users?q=` cherche nom et bio, **pas les e-mails**. | `ProfilPrive`, `/users/{id}` |
| 3 | L'état « moi » vient de **`GET /auth/me`**, jamais de `GET /users/{id}` avec son propre id. | `/auth/me` |
| 4 | **`GET /projects/{id}/messages` est réservé aux membres** — le front ne doit pas monter l'onglet Discussion si `is_member` est faux. | Policy messagerie |
| 5 | **`GET /projects/{id}/join-requests` est réservé au propriétaire** — ne monter l'onglet Demandes que si `createur.id === moi.id`. | Policy équipes |
| 6 | **Ne pas implémenter de contrôle d'accès côté client comme sécurité.** `is_member`, `is_following`, `role_equipe` ne sont que des aides à l'affichage : la décision reste serveur (403/Policy). | modèle de Policy Laravel |
| 7 | 403 ⇒ « non autorisé », **pas** une déconnexion. Seul un **401** déconnecte. | sémantique d'erreur |

> **Risque concret sur le point 3** : une page « Mon profil » construite sur `GET /users/{id}`
> afficherait un profil **sans e-mail** (et donc différent de l'écran d'édition) tout en
> ressemblant à un bug. L'écran « Mon profil » et l'écran « Profil public » sont **deux écrans
> distincts**, alimentés par **deux opérations distinctes** — même s'ils se ressemblent.

---

## 8. Écarts, ambiguïtés et pièges relevés dans le contrat

Ces points ne sont **pas** des demandes de modification du contrat : c'est la matière première
d'`ASSUMPTIONS.md` et de la discussion avec le dev backend.

### 8.1 Écarts réels (le contrat se contredit ou se répète)

| # | Constat | Impact | Traitement proposé |
|---|---|---|---|
| A1 | **`ProjetCarte` n'a pas `date_fin`, mais `ProjetResume` en a-t-il ?** Non : `ProjetResume` = `id`, `nom`, `domaines`, `statut`, `progression`, `nombre_membres_souhaite`, `nombre_membres_actuel`. Le portfolio (`GET /users/{id}/portfolio`) renvoie des `Projet` **complets** alors que son commentaire parle d'« identité courte ». | Charge inutile, et `ProjetCarte` n'expose pas `date_fin` là où un portfolio en aurait besoin | demander un schéma `ProjetPortfolio` dédié, ou assumer la charge |
| B1 | **`GET /resources` ne déclare pas de `404`** alors que toutes les autres routes `{id}` en ont un — cohérent, la route n'a pas d'id. **En revanche `GET /resources` déclare un `403`** lié au seul cas `projet_id`. | un 403 sur `/resources` signifie « pas membre de ce projet », pas « interdit » | message contextuel, pas générique |
| B2 | **`GET /projects/{id}/members` est non paginé** et `nombre_membres_souhaite` va jusqu'à **50**. | acceptable, mais croissance non bornée | assumer (≤ 50 par construction) |
| B3 | **`RessourceUpdate` ne permet pas** de remplacer `fichier` ni de changer `type` ou `visibilite`. | un document joint ne peut pas être remplacé ; une ressource de projet ne peut pas être publiée après coup | à confirmer : comportement voulu ou oubli |
| B4 | **`Ressource.commentaires_count` est en P0**, mais l'API des commentaires est P1. | le champ existera et vaudra `0` | **ne pas l'afficher** tant que le P1 n'est pas livré |
| B5 | **`Talent.followers_count` et `is_following` sont dans un schéma P0** (`Talent`, utilisé par `GET /users`), mais le follow est P1. | ils vaudront `false`/`0` | ne rien construire dessus (le contrat le dit) |
| B6 | **`DemandeAdhesionCreate` n'est pas `required`** comme `requestBody` (contrairement aux autres). | corps facultatif ⇒ une demande sans message doit être acceptée | traiter `message` comme réellement optionnel |
| B7 | **`GET /users/suggestions` exige d'être propriétaire** (403 sinon) — y compris quand `projet_id` est **absent**. | un utilisateur sans projet **propriétaire** obtient 403, pas une liste vide | le front doit **ne pas appeler** cette route sans projet possédé, ou absorber le 403 en silence |

> **B7 est le piège le plus vicieux du contrat** : la route s'appelle « suggestions de
> collaborateurs » ; on l'attend sur n'importe quel profil. Or sans projet dont on est
> propriétaire, elle renvoie **403**. Un composant qui l'appelle au montage de la page Talents
> produira une erreur visible pour tout utilisateur n'ayant pas encore créé de projet.

### 8.2 Ce que le contrat ne dit pas (à trancher)

| # | Sujet | Proposition |
|---|---|---|
| Q1 | **Tri par défaut** de `GET /users`, `/projects`, `/resources` | `created_at DESC` — à confirmer contre le backend |
| Q2 | **Libellés d'affichage** des 10 `RoleProfil` et 12 `Domaine` | seul `StatutProjet` a ses libellés dans le contrat (`Ouvert`/`En cours`/`Terminé`) |
| Q3 | **Libellés** de `TypeRessource` (7), `categorie` de compétence (7), `niveau` (3), `statut` de demande (3) | table `labels.ts`, à valider |
| Q4 | Après `DELETE /projects/{id}/members/{userId}` sur soi-même, **`ma_demande_statut` redevient-il `null` ?** | sinon l'utilisateur ne peut plus redemander (409 « demande en attente ») — **à vérifier en priorité** |
| Q5 | Le **polling 5 s** se met-il en pause quand l'onglet est inactif ? | oui, sur `document.hidden` — décision front assumée |
| Q6 | `GET /projects` avec `statut=termine` **et** `places_disponibles=true` : quelle priorité ? | envoyer les deux filtres, ne pas les combiner côté front |
| Q7 | Ordre de `GET /me/projects` par défaut | le contrat dit « mes projets », sans tri → proposer `updated_at DESC` |
| Q8 | Un projet **soft-deleted** apparaît-il encore dans `/me/projects` ou le portfolio ? | supposer **non**, à confirmer |
| Q9 | Un **membre retiré** par le propriétaire peut-il redemander ? | probablement oui (aucune `join_requests` en attente), à confirmer |
| Q10 | Le `message` d'une demande refusée est-il conservé et relisible par le demandeur ? | `GET /me/join-requests` renvoie `DemandeAdhesion` complet ⇒ probablement oui |

---

## 9. Recommandations d'architecture frontend

Ces recommandations **découlent** de l'analyse et s'inscrivent dans l'architecture déjà validée
en §4 d'`AGENTS.md`. Elles ne la remplacent pas.

### 9.1 Découpage des modules `api/`

Un module par **tag** du contrat (10 tags = 10 modules), pas un par écran :

```
api/
  client.ts       # deux racines (API + sanctum), paramsSerializer brackets,
                  # intercepteurs 401 / 419 (rejeu borné, promesse CSRF partagée)
  auth.ts         # 5 opérations
  skills.ts       # GET /skills
  users.ts        # Profils & Compétences + Recherche de talents (7 op.)
  follow.ts       # 4 opérations P1
  projects.ts     # 7 opérations
  teams.ts        # 7 opérations
  messages.ts     # 3 opérations  ← polling + curseur, isolé
  resources.ts    # 8 opérations
  portfolio.ts    # 1 opération
  dashboard.ts    # 2 opérations + repli P0 masqué
```

**`dashboard.ts` est le seul module qui cache une stratégie** : il tente le P1 et bascule sur le
repli P0. Aucun composant ne doit savoir lequel a répondu.

### 9.2 Points durs à traiter, par ordre de risque

| Risque | Où | Pourquoi c'est risqué |
|---|---|---|
| **1. Polling + curseur de messages** | `messages.ts` + hook dédié | 8 règles à respecter simultanément (§5.3) ; une erreur = messages dupliqués, disparus ou boucle infinie |
| **2. Rejeu 419** | `client.ts` | boucle infinie si non borné ; appels CSRF en rafale si non mutualisé ; `FormData` non rejouable |
| **3. `paramsSerializer` brackets** | `client.ts` | le contrat le répète 4 fois : c'est un point de rupture du filtrage par compétences |
| **4. Machine à états du bouton Rejoindre** | écran 9 | 3 champs, 7 états, dont un état contradictoire à rafraîchir |
| **5. Uploads à 3 seuils** | écrans 6, 19 | distinguer 422 (`errors.photo`/`errors.fichier`) de 413 (`message`) |
| **6. `visibilite` omise** | écran 19 | erreur de confidentialité silencieuse, pas une erreur visible |
| **7. Repli dashboard multi-requêtes** | `dashboard.ts` | N+1 requêtes, à paralléliser et à rendre tolérant à l'échec |
| **8. Coexistence « Mon profil » / « Profil public »** | écrans 5 et 6 | deux opérations, deux schémas, un seul aspect visuel |

### 9.3 Stratégie de bascule P1 → P0

Plutôt que des `if (featureFlag)` dispersés, prévoir **un seul point de vérité** :

```
lib/priorites.ts   # P0_TOUJOURS_LIVRE = true ; P1_FOLLOW, P1_COMMENTAIRES,
                   # P1_SUGGESTIONS, P1_DASHBOARD, P1_STATS = false par défaut
```

Les écrans P1 lisent ces constantes pour **monter ou démonter** leurs blocs. Le jour où le
backend livre une opération P1, on bascule **une constante** — pas dix composants.

### 9.4 Génération des types depuis l'OpenAPI

Le contrat contient **45 schémas** : **5 énumérations partagées** (`Domaine`, `RoleProfil`,
`RoleEquipe`, `StatutProjet`, `StatutProjetCreation`), `TypeRessource`, **8 schémas de pagination**
(`PaginationMeta` + 7 `*Page`), et des enums **en ligne** non extraits en schéma nommé
(`categorie` de compétence, `niveau`, `visibilite`, `statut` de demande, `decision`,
`LienProfil.type`). Les **recopier à la main** est la principale source de divergence possible.

⇒ `openapi-typescript` sur `openapi-africabridgefinal.yaml`, sortie dans
`types/api.types.ts`, en **script npm versionné**. Et les libellés (`labels.ts`) doivent être
typés **depuis** ces enums générés, pour qu'un ajout d'enum côté contrat **casse la compilation**
au lieu de produire un libellé manquant à l'écran.

---

## 10. Plan d'action proposé

| Étape | Livrable | Dépend de |
|---|---|---|
| 1 | `ASSUMPTIONS.md` — les 10 questions de §8.2, avec la convention retenue par défaut | cette analyse |
| 2 | `INTEGRATION.md` — runbook de bascule mock → backend (2 variables d'env. + checklist J2 du contrat) | cette analyse |
| 3 | **Faire trancher Q4 par le backend** (redemande après départ/refus) — c'est la seule question dont la réponse peut changer la conception | dev backend |
| 4 | Scaffold + génération des types depuis l'OpenAPI | étapes 1-2 |
| 5 | `api/client.ts` (racines, brackets, intercepteurs 401/419 bornés) + `mocks/` | étape 4 |
| 6 | Primitives UI + validation de la direction visuelle **avant** les écrans | doctrine design (`AGENTS.md` §3 bis) |
| 7 | Écrans P0 dans l'ordre des 4 parcours de §6.3 | étapes 5-6 |
| 8 | Écrans P1 derrière `lib/priorites.ts` | étape 7 |

**Ordre de priorité des parcours** (§6.3) : 1 → 3 → 2 → 4. Le parcours « Rejoindre un projet »
d'abord, parce qu'il traverse le plus d'écrans P0 et concentre le plus de règles métier ; le
portfolio en dernier, parce qu'il dépend de la clôture d'un projet (statut `termine`, définitif).

---

## Annexe A — Énumérations du contrat (à générer, pas à recopier)

| Enum | Valeurs |
|---|---|
| `Domaine` (12) | `agriculture`, `sante`, `education`, `fintech`, `energie`, `transport`, `iot`, `intelligence_artificielle`, `commerce`, `environnement`, `administration`, `autre` |
| `RoleProfil` (10) | `developpeur_frontend`, `developpeur_backend`, `fullstack`, `designer_ui_ux`, `ingenieur_iot`, `data_scientist`, `chef_de_projet`, `etudiant`, `entrepreneur`, `autre` |
| `RoleEquipe` (2) | `proprietaire`, `membre` |
| `StatutProjet` (3) | `recrutement` → **« Ouvert »**, `en_cours` → **« En cours »**, `termine` → **« Terminé »** |
| `StatutProjetCreation` (2) | `recrutement` (défaut), `en_cours` — **`termine` refusé à la création** |
| `TypeRessource` (7) | `code`, `lien`, `tutoriel`, `api`, `document`, `article`, `autre` |
| `visibilite` (2) | `projet`, `publique` |
| `categorie` de compétence (7) | `langage`, `framework`, `outil`, `domaine_technique`, `design`, `gestion_projet`, `autre` |
| `niveau` de compétence (3) | `debutant`, `intermediaire`, `avance` (nullable) |
| `statut` de demande (3) | `en_attente`, `acceptee`, `refusee` |
| `decision` (2) | `acceptee`, `refusee` |
| `LienProfil.type` (6) | `github`, `gitlab`, `linkedin`, `portfolio`, `twitter`, `autre` |

## Annexe B — Contraintes de validation (FormRequest)

| Champ | Règle contractuelle |
|---|---|
| `nom` (user) | ≤ 120 |
| `email` | format email, **unique** |
| `mot_de_passe` | ≥ 8, avec `mot_de_passe_confirmation` (règle `confirmed`) |
| `pays` | ISO 3166-1 alpha-2, **exactement 2 caractères** |
| `bio` | ≤ 500 (complète) · `bio_courte` ≤ 160 (tronquée, recherche) |
| `region` | ≤ 120 |
| `liens` | ≤ 10 entrées, `url` au format URI |
| `competences` (skills) | ≤ 30 entrées |
| `nom` (projet) | ≤ 150 · `description` ≤ 3000 · `objectifs` ≤ 2000 |
| `domaines` (projet) | **1 à 3** (tableau) — **`domaines` au pluriel** |
| `nombre_membres_souhaite` | **2 à 50** · ne peut pas être < nombre de membres actuels |
| `progression` | 0 à 100 |
| `message` (demande) | ≤ 500, nullable |
| `contenu` (message projet) | 1 à 2000 |
| `titre` (ressource) | ≤ 200 · `description` ≤ 2000 · `contenu_code` ≤ 20000 |
| `contenu` (commentaire) | 1 à 1000 |
| `page` | ≥ 1, défaut 1 |
| `per_page` | 1 à 50, défaut **15** |
| `limit` (messages) | 1 à 100, défaut **50** |
| `limit` (suggestions) | 1 à 20, défaut **10** |
| photo | jpg/png/webp, **2 Mo max** → 422 `errors.photo` |
| fichier | pdf/docx/zip/png/jpg, **10 Mo max** → 422 `errors.fichier` · obligatoire si `type=document` |
| corps entier | **> 16 Mo → 413** |

---

*Document d'analyse produit à partir de la lecture intégrale d'`openapi-africabridgefinal.yaml`
(v1.2.0, 1 847 lignes). Les comptages (44 opérations, 33 P0 / 11 P1, 10 tags) ont été vérifiés
par relevé automatique sur le fichier. Les questions ouvertes de §8.2 sont à porter dans
`ASSUMPTIONS.md`.*
