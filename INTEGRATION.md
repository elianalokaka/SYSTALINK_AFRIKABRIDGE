# AfricaBridge — INTEGRATION (runbook de connexion au backend réel)

> **Rôle de ce fichier** : permettre à l'équipe front de **brancher le vrai backend en 10 minutes**,
> de savoir **ce qui peut casser**, et de savoir **quoi faire quand le code et le contrat
> divergent** (section 2, « Règle des écarts »).
>
> **Destinataires** : l'équipe front (bascule des mocks), le dev backend (checklist J2),
> et quiconque constate un écart.

| | |
|---|---|
| **Contrat** | `openapi-africabridgefinal.yaml` v1.2.0 — **source de vérité absolue** |
| **Analyse** | [`docs/ANALYSE-CONTRAT.md`](docs/ANALYSE-CONTRAT.md) |
| **Hypothèses front** | [`ASSUMPTIONS.md`](ASSUMPTIONS.md) |
| **Test de conformité** | [`scripts/conformite/`](scripts/conformite/) |
| **Architecture cible** | [`AGENTS.md`](AGENTS.md) §4 |

---

## 1. La bascule mock → backend (le but : zéro ligne de composant à changer)

### 1.1 Le principe non négociable

> **Aucun composant ne sait qu'un mock existe.**
> Toute la simulation vit dans `api/` + `mocks/`.

C'est ce qui rend la bascule possible. Si un `if (import.meta.env.VITE_USE_MOCKS)` apparaît dans un
composant, le contrat d'architecture est rompu.

### 1.2 La bascule — deux variables d'environnement

```bash
# .env.local (développement avec mocks)
VITE_USE_MOCKS=true
VITE_API_BASE_URL=            # inutilisé tant que les mocks répondent
```

```bash
# .env.local (développement avec le vrai backend Laravel)
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8000
```

> ⚠️ **`VITE_API_BASE_URL` désigne la RACINE du serveur, pas `/api/v1`.**
> Le client axios doit dériver **deux** URL depuis cette racine :
> - l'API : `${VITE_API_BASE_URL}/api/v1`
> - Sanctum : `${VITE_API_BASE_URL}/sanctum`
>
> C'est imposé par le contrat : `/sanctum/csrf-cookie` est à la **RACINE**, hors du préfixe
> `/api/v1`. Si on met `/api/v1` dans `VITE_API_BASE_URL`, l'appel CSRF tombera sur une 404 et
> **le login sera impossible** — c'est l'erreur de configuration la plus probable.

**En production** : URLs **relatives** (`/api/v1`, `/sanctum`), front et API sur la même origine
sur le VPS. Donc `VITE_API_BASE_URL` **vide**, et rien à configurer.

### 1.3 Démarrage du backend

```bash
cd <dossier-backend>
php artisan migrate:fresh --seed      # jeu de démonstration reproductible
php artisan serve                      # http://localhost:8000
```

Le `.env` de développement doit contenir (valeurs du contrat) :

```dotenv
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000
SESSION_DRIVER=database
SESSION_DOMAIN=localhost
SESSION_COOKIE=africabridge_session
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 1.4 Réglage de `main.tsx`

```ts
// Démarrage conditionnel de MSW — le seul endroit du projet qui connaît les mocks
if (import.meta.env.VITE_USE_MOCKS === 'true') {
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}
```

### 1.5 Vérification immédiate (2 minutes)

```bash
# 1. L'API répond-elle ?
curl -i http://localhost:8000/api/v1/skills          # sans session → 401 attendu

# 2. Le flux CSRF fonctionne-t-il ?
curl -i http://localhost:8000/sanctum/csrf-cookie    # 204 + Set-Cookie: XSRF-TOKEN
```

Puis, dans le navigateur : se connecter, recharger la page (la session doit **survivre** au
rechargement, via `GET /auth/me`).

---

## 2. Règle des écarts

> ### ⚖️ Le contrat fait autorité.
> **Soit le backend corrige, soit on amende le YAML et on régénère les types.
> Jamais de rustine silencieuse dans le front.**

Cette section est la procédure officielle du projet. Elle existe parce que le réflexe naturel face
à une divergence — *« je m'adapte côté front, on verra plus tard »* — transforme une divergence
identifiée en dette invisible. Six semaines plus tard, plus personne ne sait qui a raison, et le
contrat devient un document décoratif.

### 2.1 Ce qui compte comme un écart

Toute différence entre ce que le contrat déclare et ce qui est **observé** :

| Nature | Exemple concret |
|---|---|
| **Forme** | un champ renommé, absent, ou en plus (`description` au lieu de `description_courte` dans une liste) |
| **Type** | `progression` renvoyée en chaîne `"40"` au lieu de l'entier `40` |
| **Valeur** | `statut: "Ouvert"` (le libellé) au lieu de `"recrutement"` (la valeur technique) |
| **Code HTTP** | 403 au lieu de 401 sur une session absente ; 200 au lieu de 409 sur un conflit métier |
| **Forme d'enveloppe** | `meta` présent sur une collection déclarée **bornée** ; `{ data }` absent |
| **Règle métier** | `termine` accepté à la création ; un projet non `termine` dans un portfolio |
| **Sécurité** | une clé `email` présente dans `GET /users/{id}` |
| **Silence du contrat** | le contrat ne dit rien (tri par défaut, libellés manquants) ⇒ ce n'est **pas** un écart du backend, c'est une **hypothèse front** |

> **La dernière ligne est la plus importante.** Un silence du contrat n'est pas un bug du backend :
> c'est une décision à prendre côté front, et elle se consigne dans
> [`ASSUMPTIONS.md`](ASSUMPTIONS.md). Confondre les deux fait perdre du temps à tout le monde.

### 2.2 La procédure — 6 étapes

**① CONSTATER**
Le script de conformité tourne et produit un rapport. La divergence est **datée, localisée,
reproduite** — pas « ça ne marche pas ».

```bash
node scripts/conformite/verifier-conformite.mjs \
  --api http://localhost:8000 --email <compte> --mot-de-passe <mdp> \
  --json rapport-conformite.json
```

**② NE PAS MASQUER**
Interdiction de modifier le front pour s'adapter **avant** d'avoir classé l'écart (étape ③).
Le seul geste autorisé : **ajouter un test** qui reproduit l'écart.

**③ CLASSER**
L'écart relève d'**une seule** des quatre catégories, et chacune a un responsable unique :

| # | Catégorie | Responsable | Action |
|---|---|---|---|
| **A** | **Bug front** — le front n'implémente pas correctement le contrat | front | corriger, ajouter un test de non-régression |
| **B** | **Bug backend** — le backend ne respecte pas le contrat | backend | corriger côté Laravel ; le front **ne bouge pas** |
| **C** | **Silence du contrat** — le contrat ne dit rien | front | décider, consigner dans `ASSUMPTIONS.md` ; **aucune modification du YAML** |
| **D** | **Erreur / contradiction du contrat** — le contrat est ambigu, contradictoire, ou irréaliste | **équipe** | amender le YAML, **incrémenter la version**, régénérer les types (étape ⑤) |

> **Le test de départage entre B et D** : *« si le backend corrige, est-ce que quelque chose
> d'autre casse ? »* Non ⇒ c'est **B** (le backend s'aligne). Oui, ou le contrat se contredit
> lui-même ⇒ c'est **D** (le contrat est amendé).

**④ CORRIGER DU BON CÔTÉ**

- **Catégorie A** ⇒ on corrige le front.
- **Catégorie B** ⇒ on **ouvre un ticket backend** avec :
  - l'identifiant du scénario (`PROJET-02`, `MSG-01`…)
  - l'extrait de contrat violé (fichier + ligne)
  - la réponse observée (le JSON exact)
  - la réponse attendue
  - le rapport JSON du script
  Un écart de catégorie B **bloque la conformité** : il n'est jamais « contourné ».

**⑤ AMENDER LE CONTRAT (catégorie D seulement)**

```
1. Éditer openapi-africabridgefinal.yaml — la modification MINIMALE qui lève l'ambiguïté
2. Incrémenter info.version  (1.2.0 → 1.2.1 correction, → 1.3.0 ajout de champ)
3. Documenter le changement dans info.description, sous le numéro de version
4. Faire valider par l'équipe (front + backend) — un contrat unilatéral n'est pas un contrat
5. Régénérer les types : les erreurs de compilation indiquent TOUT ce qui doit changer
6. Aligner les mocks et relancer le script de conformité
7. Consigner la ligne dans le journal §2.5
```

> **L'étape 5 est le bénéfice réel de la règle.** Parce que les types sont **générés** depuis
> l'OpenAPI, une modification du contrat se propage en **erreurs de compilation** — et non en bugs
> silencieux découverts pendant la démo. C'est ce qui rend l'amendement plus sûr qu'une rustine.

**⑥ VÉRIFIER ET CLORE**
Le scénario correspondant passe. **Si l'écart n'était pas couvert par un scénario, on en ajoute
un** — un écart trouvé une fois doit être impossible à réintroduire sans être détecté.

### 2.3 Les rustines silencieuses — interdites

Ce sont les formes que prend une rustine. Chacune **détruit la valeur du contrat** :

| ❌ Interdit | Pourquoi c'est grave |
|---|---|
| Changer un type généré **à la main** | la prochaine régénération écrase la correction ; le contrat et le code divergent sans trace |
| Faire `as any` / `as unknown as X` pour faire taire une erreur de type | supprime exactement l'alerte qui signalait l'écart |
| `if (backendRenvoieTruc) … else …` dans un composant | un `if` de contournement **est** une rustine, même commentée |
| Traduire une réponse dans `api/` pour « la remettre en forme » | le contrat décrit le **fil** ; le réécrire masque la divergence au lieu de la corriger |
| Accepter `"Ouvert"` **et** `"recrutement"` dans le même `switch` | tolérer deux formes, c'est garantir que les deux existeront |
| Désactiver ou affaiblir un scénario de conformité | le test est le seul garde-fou : l'affaiblir, c'est supprimer le garde-fou |
| Stocker un token en `localStorage` « en attendant » | viole la règle d'authentification du contrat (aucun token, jamais) |
| Corriger le YAML **sans** régénérer les types | le contrat change, le code ne suit pas : divergence garantie |
| Consigner un écart dans un ticket **sans** scénario de test | rien ne garantit qu'il sera revu |

### 2.4 La seule tolérance admise : l'écart déclaré

Un écart **peut** être toléré temporairement — mais **jamais silencieusement**. Les trois
conditions cumulatives :

1. **Un scénario de test existe** et il est marqué `IGNORÉ` avec la raison exacte.
2. **Il est référencé dans `ASSUMPTIONS.md`** par un identifiant (`V-<n>`).
3. **La ligne de code concernée porte un marqueur explicite** :

```ts
// ⚠️ ÉCART DÉCLARÉ — voir ASSUMPTIONS.md V-2
// Le contrat ne dit pas si ma_demande_statut redevient null après un départ.
// Hypothèse retenue : oui. À vérifier avec le backend. Ticket #<n>.
// Retirer ce contournement dès que la réponse est connue.
```

**Un marqueur `⚠️ ÉCART DÉCLARÉ` sans identifiant `ASSUMPTIONS.md` est un bug**, pas un écart
déclaré. Il doit être refusé en revue.

### 2.5 Journal des amendements du contrat

À remplir **à chaque** amendement (catégorie D). Un contrat sans journal est un contrat dont
personne ne connaît l'histoire.

| Version | Date | Champ / route | Avant | Après | Motif | Décidé par |
|---|---|---|---|---|---|---|
| 1.2.0 | — | — | — | — | *version de référence de ce runbook* | — |
| | | | | | | |

---

## 3. Test de conformité OpenAPI

### 3.1 Ce que c'est

[`scripts/conformite/verifier-conformite.mjs`](scripts/conformite/verifier-conformite.mjs) interroge
une API **réellement en marche** et valide ses réponses **contre les schémas du contrat**. Il rend
vérifiable la phrase du contrat : *« Toute divergence entre le code et ce contrat est un bug. »*

**Zéro dépendance** : Node 18+ suffit (`fetch` natif, gestion manuelle des cookies). Aucun
`npm install`, aucun accès réseau requis pour l'outil lui-même — il fonctionne donc même dans un
environnement confiné.

### 3.2 Deux cibles, un seul outil

| Cible | Commande | Ce que ça prouve |
|---|---|---|
| **Le vrai backend** | `--api http://localhost:8000` | l'API respecte le contrat |
| **Les mocks MSW** | `--api http://localhost:5173 --prefixe /api/v1` | **les mocks ne mentent pas** |

> **La seconde cible est un apport décisif.** Le front se construit sur des mocks : si un mock
> s'écarte du contrat, il fait valider des écrans qui **casseront le jour J**. Passer les mocks au
> **même** validateur que l'API ferme cette faille avant même que le backend n'existe.

### 3.3 Usage

```bash
# Contre le backend local
node scripts/conformite/verifier-conformite.mjs \
  --api http://localhost:8000 \
  --email demo@example.com --mot-de-passe 'MotDePasse123!'

# Contre les mocks du front (Vite doit tourner)
node scripts/conformite/verifier-conformite.mjs \
  --api http://localhost:5173 --email demo@example.com --mot-de-passe 'MotDePasse123!'

# Inclure les scénarios qui ÉCRIVENT en base (crée des enregistrements « CONFORMITÉ — à supprimer »)
node scripts/conformite/verifier-conformite.mjs --api http://localhost:8000 \
  --email demo@example.com --mot-de-passe 'MotDePasse123!' --ecritures

# Rapport JSON exploitable (à joindre à un ticket backend)
node scripts/conformite/verifier-conformite.mjs --api http://localhost:8000 \
  --email demo@example.com --mot-de-passe 'MotDePasse123!' --json rapport-conformite.json
```

| Option | Effet |
|---|---|
| `--api <url>` | racine du serveur, **sans** `/api/v1` (défaut : `http://localhost:8000`) |
| `--prefixe <p>` | préfixe de l'API (défaut : `/api/v1`) |
| `--email` / `--mot-de-passe` | compte des scénarios authentifiés |
| `--ecritures` | exécute aussi les scénarios **qui écrivent** en base |
| `--sans-auth` | scénarios publics uniquement |
| `--verbeux` | affiche aussi les vérifications conformes |
| `--json <fichier>` | écrit le rapport complet |

**Codes de sortie** : `0` conforme · `1` **divergence détectée** · `2` erreur d'exécution.

### 3.4 Ce que le script vérifie

**Structure et schémas** — chaque réponse est validée contre son schéma (`ProfilPrive`, `TalentPage`,
`Projet`, `MessageFil`, `Ressource`, `Dashboard`…) : types, champs obligatoires, énumérations,
bornes, formats, et **propriétés non prévues**.

**Les pièges que le contrat signale explicitement :**

| Scénario | Ce qui est vérifié |
|---|---|
| `AUTH-01` | `/sanctum/csrf-cookie` répond **204** et pose bien `XSRF-TOKEN` |
| `AUTH-02` | `GET /auth/me` contient bien l'`email` (c'est le **seul** endroit où il doit être) |
| `AUTH-03` | une session absente donne **401**, pas 403 |
| `PROFIL-02` | **`GET /users/{id}` ne contient JAMAIS `email`** — violation de sécurité |
| `TALENT-01` | `GET /users` **exclut l'utilisateur connecté** de ses propres résultats |
| `TALENT-02` | `competence_ids[]=1&competence_ids[]=2` (brackets) répond 200 et non 422 |
| `TALENT-04` | `competence_match` hors `any|all` est rejeté en 422 |
| `PROJET-02` | le statut est la **valeur technique**, jamais le libellé « Ouvert » |
| `PROJET-04` | `statut: termine` à la création est refusé en **422** |
| `PROJET-05` | les 422 respectent `{ message, errors: { champ: [...] } }` avec les bons champs |
| `EQUIPE-01` | les membres : **un seul** `proprietaire` (le créateur), et `{ data }` **sans `meta`** |
| `MSG-01` | `MessageFil` = `data` + `supprimes` + `meta.server_time`, et `supprimes` **vide** sans `depuis` |
| `MSG-02` | messages triés **du plus ancien au plus récent** (ids croissants) |
| `MSG-03` | `apres_id` filtre **strictement** (`id > apres_id`) |
| `MSG-04` | `avant_id` filtre **strictement** (`id < avant_id`) |
| `RESS-02` | `POST /resources` **JSON** accepté ; `visibilite` = `publique` sans `projet_id` |
| `RESS-03` | `type=document` sans fichier ⇒ 422 **sur le champ `fichier`** |
| `DASH-01` | `GET /stats` accessible **sans session** (route publique) |
| `DASH-02` | les compteurs de follow valent **0** tant que le P1 n'est pas livré |
| `PAGE-01` | `meta` de pagination **complet** (les 4 clés numériques) |
| `PORT-01` | le portfolio ne contient **que** des projets `termine` |
| `SECU-01` | aucune route protégée n'est accessible sans session (échantillon) |

### 3.5 Ce que le script ne fait PAS

L'honnêteté sur les limites fait partie de l'outil :

| Non couvert | Raison | Où c'est traité |
|---|---|---|
| Les **règles d'autorisation fines** (Policy par propriétaire) | exige des jeux de données et des comptes multiples | recette manuelle + tests backend |
| Les **upload réels** (2 Mo / 10 Mo / 16 Mo, 413 vs 422) | nécessite des fichiers de test volumineux | recette manuelle (checklist §5) |
| La **concurrence** et les **transactions** | `acceptee` + `project_members` atomiques, etc. | tests backend |
| Les **performances** (N+1, pagination lourde) | hors périmètre de la conformité | revue backend |
| Le **contenu métier** de `GET /stats` | le script vérifie la forme, pas l'exactitude des agrégats | tests backend |
| Les **écritures** sans `--ecritures` | elles polluent la base | option explicite |

**Scénarios complémentaires** (les 31 scénarios au total, les autres vérifiant la forme des schémas) :

| Scénario | Ce qui est vérifié |
|---|---|
| `AUTH-00` | le flux `csrf-cookie` + `login` lui-même (généré uniquement si la connexion échoue) |
| `PROFIL-01` | `GET /skills` : collection **bornée** (`{ data }` sans `meta`) et `Competence` conforme |
| `PROJET-01` | `GET /projects` : `ProjetPage` conforme, et **cartes légères** (`description_courte`, pas `description`) |
| `PROJET-03` | `GET /projects/{id}` : `Projet` complet, `domaines` entre 1 et 3, `is_member` booléen |
| `PROJET-06` | `nombre_membres_souhaite = 1` refusé en 422 (minimum 2) |
| `TALENT-03` | `competence_match=all` accepté |
| `TALENT-05` | `per_page=100` borné à 50 (ou rejeté) — le contrat impose 50 maximum |
| `RESS-01` | `GET /resources` : `RessourcePage` conforme |
| `PAGE-02` | `GET /me/join-requests` : `DemandePage` conforme |
| `SECU-02` | un projet inexistant donne 404 ou 403, jamais 200 |

### 3.6 L'auto-test du validateur

```bash
node scripts/conformite/auto-test.mjs
```

**Pourquoi ce fichier existe** : un validateur qui accepte tout est **pire** qu'aucun validateur —
il donne un faux sentiment de conformité. Cet auto-test vérifie sur **55 assertions** que le
validateur :

- détecte les pièges réels (`allOf` imbriqués, `nullable`, enums, bornes, clés étrangères,
  localisation précise par index de tableau) ;
- **ne produit pas de faux positifs** sur des charges conformes ;
- lit correctement le **vrai** contrat (45 schémas, 44 opérations, 33 P0 / 11 P1).

> Le nombre d'assertions est **compté par le script** et affiché en fin d'exécution : il ne peut
> pas se désynchroniser de la réalité. Ne jamais écrire ce chiffre en dur ailleurs.

> **À lancer avant de faire confiance à un rapport de conformité.** Si l'auto-test échoue, le
> rapport n'a aucune valeur.

### 3.7 Intégration à la suite de tests du projet

Le script est autonome aujourd'hui, parce que l'environnement de développement est hors ligne.
**Quand le projet aura ses dépendances**, le même contrôle doit rejoindre la CI :

```jsonc
// package.json — cible
{
  "scripts": {
    "types:api": "openapi-typescript openapi-africabridgefinal.yaml -o src/types/api.types.ts",
    "test:conformite": "node scripts/conformite/verifier-conformite.mjs --api $API_URL",
    "test:conformite:auto": "node scripts/conformite/auto-test.mjs",
    "test": "vitest run"
  }
}
```

**Recommandation** : ajouter un contrôle de conformité **des mocks** dans la CI
(`--api http://localhost:5173`), pour qu'un mock qui s'écarte du contrat **casse la construction**
au lieu de faire valider des écrans faux.

---

## 4. Checklist J2 — prérequis de déploiement

Extraite du contrat (section `info`). **Tout doit être coché avant la démo.**

### 4.1 Laravel

- [ ] Laravel 11+ avec `$middleware->statefulApi()` dans `bootstrap/app.php`
- [ ] `php artisan session:table && php artisan migrate` — **obligatoire** (`SESSION_DRIVER=database`)
- [ ] Routes sensibles protégées par `auth:sanctum`
- [ ] `/users/me` déclarée **avant** `/users/{id}` ; `/users/suggestions` idem ;
      `/projects/suggestions` avant `/projects/{id}`
- [ ] **Aucun `GET /users/me`** (le contrat l'interdit : l'utilisateur courant se lit via `GET /auth/me`)

### 4.2 `.env` de production (même machine, même origine)

```dotenv
APP_URL=https://{hote}
SANCTUM_STATEFUL_DOMAINS={hote}
SESSION_DRIVER=database
SESSION_DOMAIN=null
SESSION_COOKIE=africabridge_session
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
CORS_ALLOWED_ORIGINS=https://{hote}
```

- [ ] `{hote}` = nom d'hôte DNS **réel** confirmé par Systalink — **jamais** `A_REMPLACER_AVANT_J2`
- [ ] `SESSION_COOKIE` définie — sans elle, Laravel dérive le nom de `APP_NAME` et le cookie
      change de nom entre environnements
- [ ] `SESSION_DOMAIN=null` — cookie limité à l'hôte, sans sous-domaine `app.` / `api.`
- [ ] `SESSION_SECURE_COOKIE=true` (dérogation `false` **seulement** si HTTPS est impossible —
      à noter comme dérogation, pas comme réglage normal)

### 4.3 Nginx

```nginx
location /        { # fichiers du build React (SPA : try_files vers index.html) }
location /api/    { # proxy vers PHP-FPM Laravel }
location /sanctum/ { # proxy vers PHP-FPM Laravel — À LA RACINE, pas sous /api/
client_max_body_size 16m;

error_page 413 = @payload_too_large;
location @payload_too_large {
  default_type application/json;
  return 413 '{"message":"Fichier trop volumineux (16 Mo maximum)."}';
}
```

- [ ] `client_max_body_size 16m`
- [ ] **`location /sanctum/`** présent — l'oublier rend le login impossible
- [ ] Redirection HTTP → HTTPS
- [ ] Certificat HTTPS actif (Let's Encrypt ou certificat fourni)
- [ ] SPA : toute route inconnue renvoie `index.html` (sinon un rechargement sur `/projets/3`
      donne une 404 Nginx)

### 4.4 PHP

```ini
upload_max_filesize = 12M
post_max_size = 16M
```

**Les trois seuils, à ne pas confondre :**

| Limite | Nature | Code | Cible |
|---|---|---|---|
| 2 Mo | métier (photo) | 422 | `errors.photo` |
| 10 Mo | métier (ressource) | 422 | `errors.fichier` |
| **16 Mo** | infrastructure (Nginx/PHP) | **413** | `message` seul |

### 4.5 CORS — `config/cors.php`

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],
'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),
'supports_credentials' => true,
```

- [ ] **Jamais `allowed_origins = '*'`** — incompatible avec `supports_credentials`
- [ ] En dev, `http://localhost:5173` autorisé, sinon le navigateur bloque `GET /sanctum/csrf-cookie`

### 4.6 Stockage et persistance

- [ ] Fichiers sur le **disque persistant** du VPS (`storage/app/public` ou `/var/africabridge/storage`)
- [ ] Ce dossier **exclu du script de déploiement** (sinon les fichiers sont effacés à chaque mise à jour)
- [ ] `storage:link` effectué (URL publique des fichiers)
- [ ] **Sauvegarde de ce dossier prévue à J19**

### 4.7 Jeu de démonstration (seeder)

- [ ] Catalogue de compétences complet (au minimum Python, JavaScript, IoT, Réseaux, UI/UX)
- [ ] ~10 profils multi-pays (CD, SN, CI, CM, BJ…)
- [ ] **Un designer UI/UX au Sénégal (SN)** — la recherche « UI/UX + Sénégal » doit le renvoyer
- [ ] 5 à 8 projets (agriculture, santé, éducation, finance…), dont **« Smart Agriculture RDC »**
- [ ] **Au moins un projet `termine`** (date_fin, progression 100, lien_realisation, ≥ 2 membres)
- [ ] Quelques ressources (liens, code) et quelques messages
- [ ] Comptes de démonstration pour le jury, **mots de passe notés dans la documentation**
- [ ] **Le compte d'Eliana N'EXISTE PAS** — elle s'inscrit pendant la démo

### 4.8 Après le seeder — lancer la conformité

```bash
node scripts/conformite/verifier-conformite.mjs --api https://{hote} \
  --email <compte-demo> --mot-de-passe '<mdp>' --json conformite-j2.json
```

Un code de sortie **0** est un prérequis de la démonstration.

---

## 5. Après la bascule — ce qui peut casser

| Symptôme | Cause probable | Vérification |
|---|---|---|
| Login impossible, `/sanctum/csrf-cookie` en **404** | `VITE_API_BASE_URL` contient `/api/v1` | l'URL CSRF doit être à la **racine** |
| Login OK mais **toutes** les requêtes suivantes en 401 | cookies non envoyés | `withCredentials: true` ; `SameSite` ; origine identique |
| **419** en boucle | rejeu non borné | `A-6` : une seule tentative, rafraîchissement partagé |
| 419 sur les écritures seulement | en-tête `X-XSRF-TOKEN` absent | axios `withXSRFToken: true` |
| Le filtrage par compétences renvoie une erreur 422 | sérialisation des tableaux | doit être `competence_ids[]=1&competence_ids[]=2` |
| Les messages supprimés restent à l'écran | `depuis` non envoyé, ou converti | `A-5` : renvoyer `meta.server_time` **tel quel** |
| Upload photo en 413 | limite d'infrastructure | le 413 est le **corps > 16 Mo**, pas la limite métier |
| Upload ressource en 422 sans message clair | limite métier (10 Mo) | lire `errors.fichier` |
| Rechargement sur une route profonde → 404 Nginx | SPA non configurée | `try_files … /index.html` |
| `email` affiché sur un profil public | fuite de donnée | **violation de sécurité** — cf. `PROFIL-02` |
| Types TypeScript en erreur après régénération | le contrat a changé | c'est **voulu** : suivre la Règle des écarts §2.2 ⑤ |

---

## 6. Retour aux mocks

La bascule est **réversible** — c'est ce qui permet de travailler sans le backend :

```bash
VITE_USE_MOCKS=true
VITE_API_BASE_URL=
```

Aucun composant ne change dans les deux sens. Si ce n'est pas le cas, l'architecture
(`AGENTS.md` §4) a été enfreinte : **c'est le bug à corriger en priorité.**

---

## 7. Ordre d'exécution recommandé

| Étape | Action | Responsable |
|---|---|---|
| 1 | Réglages `main.tsx` + `api/client.ts` (deux racines, brackets, intercepteurs bornés) | front |
| 2 | Mocks MSW **validés par le script de conformité** | front |
| 3 | Écrans P0 (les 4 parcours de `ANALYSE-CONTRAT.md` §6.3) | front |
| 4 | Backend prêt ⇒ checklist §4, puis `--json` | backend |
| 5 | Bascule `VITE_USE_MOCKS=false` | front |
| 6 | Conformité contre l'API réelle ⇒ **0 divergence** exigé | front + backend |
| 7 | Levée des hypothèses 🔴 d'`ASSUMPTIONS.md` | front + backend |
| 8 | Recette P1 (follow, commentaires, suggestions, dashboard) | front |

---

*Runbook vivant. Toute divergence constatée et non consignée selon §2 est un écart non traité —
c'est-à-dire une dette qui sera payée pendant la démonstration.*
