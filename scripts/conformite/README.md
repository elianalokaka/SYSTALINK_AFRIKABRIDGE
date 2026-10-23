# Test de conformité OpenAPI — AfricaBridge

Ce dossier contient l'outillage qui rend **vérifiable** la règle d'or du projet :

> *« Ce document fait autorité. Toute divergence entre le code et ce contrat est un bug. »*
> — `openapi-africabridgefinal.yaml`

Une règle sans outil qui la vérifie n'est qu'une intention. Ces deux scripts la transforment en
tests exécutables.

---

## Les deux scripts

| Fichier | Rôle | Quand l'utiliser |
|---|---|---|
| `verifier-conformite.mjs` | interroge une API **en marche** et valide ses réponses contre les schémas du contrat | à chaque fois que l'API ou les mocks changent ; **obligatoire avant la démo** |
| `auto-test.mjs` | vérifie que le **validateur lui-même** détecte les divergences | avant de faire confiance à un rapport de conformité |

**Zéro dépendance.** Node 18+ suffit : `fetch` natif et gestion manuelle des cookies. Aucun
`npm install`, aucun accès réseau requis pour l'outil.

---

## Démarrage rapide

```bash
# 1. Vérifier que l'outil est fiable (55 assertions)
node scripts/conformite/auto-test.mjs

# 2. Tester le vrai backend Laravel
node scripts/conformite/verifier-conformite.mjs \
  --api http://localhost:8000 \
  --email demo@example.com --mot-de-passe 'MotDePasse123!'

# 3. Tester les mocks du front (le serveur Vite doit tourner)
node scripts/conformite/verifier-conformite.mjs \
  --api http://localhost:5173 \
  --email demo@example.com --mot-de-passe 'MotDePasse123!'
```

**Codes de sortie** : `0` conforme · `1` **divergence détectée** · `2` erreur d'exécution.

> ⚠️ `--api` désigne la **racine** du serveur, **sans** `/api/v1`. Le script en dérive lui-même
> l'API (`/api/v1`) et Sanctum (`/sanctum`), conformément au contrat qui place
> `/sanctum/csrf-cookie` **à la racine**.

---

## Pourquoi tester aussi les mocks

Le front se construit sur des mocks MSW, en parallèle du backend. Un mock qui s'écarte du contrat
**fait valider des écrans qui casseront le jour J** — et le front ne s'en apercevra qu'au moment de
la bascule, c'est-à-dire au pire moment.

Passer les mocks au **même** validateur que l'API ferme cette faille **avant** que le backend
n'existe. C'est la raison d'être de l'option `--prefixe`.

---

## Options

| Option | Effet | Défaut |
|---|---|---|
| `--api <url>` | racine du serveur, **sans** `/api/v1` | `http://localhost:8000` |
| `--prefixe <p>` | préfixe de l'API | `/api/v1` |
| `--email <e>` | compte des scénarios authentifiés | — |
| `--mot-de-passe <p>` | mot de passe de ce compte | — |
| `--spec <fichier>` | chemin du contrat OpenAPI | `openapi-africabridgefinal.yaml` |
| `--ecritures` | exécute aussi les scénarios **qui écrivent** en base | désactivé |
| `--sans-auth` | scénarios publics uniquement | désactivé |
| `--verbeux` | affiche aussi les vérifications conformes | désactivé |
| `--json <fichier>` | écrit le rapport complet | — |
| `-h`, `--aide` | affiche l'aide | — |

Équivalents en variables d'environnement : `AB_API`, `AB_EMAIL`, `AB_MOT_DE_PASSE`, `AB_PREFIXE`.

### À propos de `--ecritures`

Certains scénarios **créent des enregistrements** pour vérifier une règle (par exemple :
`statut: termine` doit être refusé à la création). Ils sont **désactivés par défaut**, car ils
polluent la base. Les enregistrements créés portent le préfixe `CONFORMITÉ — … (à supprimer)`.

> Les scénarios d'écriture **ne remplacent pas** un nettoyage : après une campagne avec
> `--ecritures`, relancer `php artisan migrate:fresh --seed` pour repartir d'une base saine.

---

## Ce qui est vérifié

**Schémas** — chaque réponse est validée contre son schéma : types, champs obligatoires,
énumérations, bornes, formats, et **propriétés non prévues par le contrat**.

**Les pièges signalés par le contrat :**

- `GET /users/{id}` ne contient **jamais** d'`email` (violation de sécurité si présent)
- `GET /auth/me` est le **seul** endroit où l'`email` doit apparaître
- une session absente donne **401**, pas 403
- `competence_ids[]=1&competence_ids[]=2` (brackets) est accepté
- le statut de projet est la **valeur technique**, jamais le libellé « Ouvert »
- `statut: termine` refusé à la création (422)
- les 422 respectent `{ message, errors: { champ: [...] } }`
- `MessageFil` fournit `data` + `supprimes` + `meta.server_time`, `supprimes` **vide** sans `depuis`
- les messages sont triés **du plus ancien au plus récent**
- `apres_id` / `avant_id` filtrent **strictement**
- le portfolio ne contient **que** des projets `termine`
- `GET /stats` est accessible **sans session**
- les compteurs de follow valent **0** tant que le P1 n'est pas livré
- les collections **bornées** n'ont **pas** de `meta` ; les collections **paginées** l'ont complet

La liste exhaustive des **31 scénarios** est dans `INTEGRATION.md` §3.4.

---

## Ce qui n'est PAS vérifié

Par honnêteté sur les limites de l'outil :

| Non couvert | Où c'est traité |
|---|---|
| Autorisations fines (Policy par propriétaire) | recette manuelle, tests backend |
| Uploads réels (2 Mo / 10 Mo / 16 Mo, 413 vs 422) | recette manuelle (`INTEGRATION.md` §4.4) |
| Concurrence et transactions | tests backend |
| Performances (N+1) | revue backend |
| Exactitude des agrégats de `/stats` | tests backend |

---

## En cas de divergence

**Ne pas corriger le front avant d'avoir classé l'écart.** La procédure officielle est la
**« Règle des écarts »** de [`INTEGRATION.md`](../../INTEGRATION.md) §2 :

> Le contrat fait autorité. **Soit le backend corrige, soit on amende le YAML et on régénère les
> types. Jamais de rustine silencieuse dans le front.**

Pour un ticket backend, joindre le rapport JSON :

```bash
node scripts/conformite/verifier-conformite.mjs --api <url> \
  --email <e> --mot-de-passe <p> --json rapport-conformite.json
```

---

## Architecture des fichiers

```
scripts/conformite/
├── README.md                    # ce fichier
├── verifier-conformite.mjs      # le test de conformité (exécutable, exporte ses fonctions)
└── auto-test.mjs                # l'auto-test du validateur (55 assertions)
```

`verifier-conformite.mjs` est **importable** : il n'exécute son programme principal que s'il est
lancé directement (garde `import.meta.url`). C'est ce qui permet à `auto-test.mjs` de réutiliser
le lecteur YAML et le validateur sans lancer de requêtes HTTP.

### Détail technique : le lecteur YAML

Le script embarque un analyseur YAML minimal (sous-ensemble OpenAPI strictement indenté). Il ne
traite **pas** les ancres, les balises ni les blocs `|`/`>` multi-lignes — ce contrat n'en utilise
pas. Si le contrat en introduisait un jour, l'auto-test échouerait sur le comptage des schémas
(45 attendus), ce qui rendrait la régression **immédiatement visible**.

### Détail technique : le validateur

Implémentation du sous-ensemble JSON Schema utilisé par ce contrat :
`$ref`, `allOf`, `type`, `nullable`, `enum`, `const`, `required`, `properties`, `items`,
`minItems`, `maxItems`, `minLength`, `maxLength`, `minimum`, `maximum`, `additionalProperties`,
et les `format` (`email`, `uri`, `date`, `date-time`).

`oneOf` / `anyOf` / `not` / `patternProperties` ne sont **pas** implémentés : le contrat ne les
utilise pas. Si c'était le cas, l'auto-test le signalerait.

---

## Intégration à la CI (à venir)

Le script est autonome aujourd'hui parce que l'environnement de développement est hors ligne.
Quand le projet aura ses dépendances :

```jsonc
{
  "scripts": {
    "types:api": "openapi-typescript openapi-africabridgefinal.yaml -o src/types/api.types.ts",
    "test:conformite:auto": "node scripts/conformite/auto-test.mjs",
    "test:conformite:mocks": "node scripts/conformite/verifier-conformite.mjs --api http://localhost:5173 --email $DEMO_EMAIL --mot-de-passe $DEMO_MDP",
    "test:conformite:api": "node scripts/conformite/verifier-conformite.mjs --api $API_URL --email $DEMO_EMAIL --mot-de-passe $DEMO_MDP"
  }
}
```

**Recommandation forte** : brancher `test:conformite:mocks` dans la CI. Un mock qui s'écarte du
contrat doit **casser la construction**, pas produire des écrans faux.
