# AfricaBridge — ASSUMPTIONS (hypothèses locales à vérifier)

> **Rôle de ce fichier** : recenser **toutes** les décisions que le frontend doit prendre
> **faute de précision du contrat**, pour qu'elles soient **écrites, localisées et vérifiables** —
> et non dispersées, implicites et contradictoires dans les composants.
>
> **Le contrat fait autorité** (`openapi-africabridgefinal.yaml`, v1.2.0). Ce fichier ne le
> contredit jamais : il comble ses silences. Toute divergence entre le code et le contrat est un
> **bug** — et si une hypothèse d'ici se révèle fausse, c'est **le front qui s'aligne**, jamais
> l'inverse (voir la « Règle des écarts » dans `INTEGRATION.md`).
>
> **Périmètre strict** : conventions techniques, sémantique d'erreur, libellés, tolérance.
> **Aucune décision d'apparence** ne figure ici — couleurs, polices, espacements et rayons
> relèvent exclusivement du design system (tokens), qui n'est pas encore figé.

| | |
|---|---|
| **Source** | `openapi-africabridgefinal.yaml` v1.2.0 — 1 847 lignes, 44 opérations |
| **Analyse de référence** | [`docs/ANALYSE-CONTRAT.md`](ANALYSE-CONTRAT.md), §8 en particulier |
| **Statut** | hypothèses **proposées**, non encore confrontées au backend |
| **Destinataire de la vérification** | dev backend AfricaBridge |

---

## 1. Comment lire ce fichier

### 1.1 Les deux natures d'hypothèse

| Marque | Nature | Qui tranche | Si l'hypothèse est fausse |
|---|---|---|---|
| 🟢 **CONVENTION** | Le contrat est **silencieux**, le choix est **libre** et sans impact métier | l'équipe front | on change la valeur, **aucun autre fichier ne bouge** |
| 🔴 **À VÉRIFIER** | Le contrat est **ambigu ou muet sur une règle métier** | le **backend** | le comportement change, **du code change** |

> **La distinction est utile en pratique** : une 🟢 se corrige en une ligne dans
> `lib/constants.ts`. Une 🔴 peut invalider une logique d'état entière. Elles ne se traitent donc
> pas au même moment de la discussion.

### 1.2 La règle de localisation

**Chaque hypothèse vit à un seul endroit du code.** Une hypothèse recopiée dans trois composants
n'est plus une hypothèse : c'est une dette invisible.

| Fichier | Contient |
|---|---|
| `lib/constants.ts` | listes figées, seuils, valeurs de repli, codes pays ISO |
| `lib/labels.ts` | enum → libellé affiché (typé **depuis** les types générés) |
| `lib/priorites.ts` | disponibilité des opérations P1 |
| `api/*.ts` | tri par défaut, tolérance, stratégies de repli |

### 1.3 Convention de nommage

`A-<n>` pour une convention, `V-<n>` pour une vérification. Les identifiants sont **stables** :
ils servent de référence dans les échanges avec le backend et dans les tests.

---

## 2. Tableau de synthèse

| Id | Marque | Sujet | Décision retenue | Impact si faux |
|---|---|---|---|---|
| `A-1` | 🟢 | Tri par défaut | `created_at DESC` | faible |
| `A-2` | 🟢 | Libellés des enums | table `labels.ts` typée | faible |
| `A-3` | 🟢 | Libellés des statuts de projet | **imposés par le contrat** | nul |
| `A-4` | 🟢 | Pause du polling | pause si onglet inactif | faible |
| `A-5` | 🟢 | Curseur `depuis` | chaîne brute, jamais convertie | **élevé** |
| `A-6` | 🟢 | Rejeu 419 | borné à 1 tentative, rafraîchissement partagé | élevé |
| `A-7` | 🟢 | Sémantique 403 / 401 | 403 = contexte, 401 = déconnexion | moyen |
| `A-8` | 🟢 | 403 sur les ressources | pas une erreur d'accès | moyen |
| `A-9` | 🟢 | Messages d'erreur | afficher `errors` de Laravel tel quel | moyen |
| `A-10` | 🟢 | Compteurs P1 à zéro | **masquer**, jamais afficher `0` | moyen |
| `A-11` | 🟢 | Fuseau d'affichage | conversion à l'affichage, UTC en données | moyen |
| `A-12` | 🟢 | Suggestion sans projet | ne pas appeler la route | moyen |
| `A-13` | 🟢 | Historique des messages | insertion en tête (`avant_id`) | faible |
| `A-14` | 🟢 | Sérialisation des tableaux | brackets, clés vides omises | élevé |
| `A-15` | 🟢 | Repli du dashboard | parallèle + tolérant à l'échec | moyen |
| `A-16` | 🟢 | Alerte « demandes reçues » | compteur calculé (N appels) | moyen |
| `A-17` | 🟢 | Fraîcheur du cache après écriture | invalidation explicite (`lib/cache.ts`) | **élevé** |
| `A-18` | 🟢 | Polling de la discussion | `refetchInterval` 5 s, curseur monotone | **élevé** |
| `A-19` | 🟢 | Visibilité d'une ressource | `visibilite` omis par défaut ; `publique` seulement si case cochée | moyen |
| `V-1` | 🔴 | **Redemande après départ ou refus** | autorisée | **critique** |
| `V-2` | 🔴 | `ma_demande_statut` après départ | redevient `null` | **critique** |
| `V-3` | 🔴 | Tri réel des listes | confirmé par le backend | faible |
| `V-4` | 🔴 | Projets supprimés (soft delete) | exclus des listes | moyen |
| `V-5` | 🔴 | Ordre de `GET /me/projects` | `updated_at DESC` | faible |
| `V-6` | 🔴 | Message d'une demande refusée | conservé et relisible | faible |
| `V-7` | 🔴 | Combinaison `statut` + `places_disponibles` | filtres indépendants | faible |
| `V-8` | 🔴 | Membre retiré par le propriétaire | redevient non-membre à part entière | élevé |
| `V-9` | 🔴 | Langue des messages de validation | français | moyen |
| `V-10` | 🔴 | Compteurs d'agrégats | cohérents avec les listes | faible |
| `V-11` | 🔴 | Identité « c'est moi » | comparaison d'`id` fiable | moyen |
| `V-12` | 🔴 | Premier appel de la discussion (sans curseur) | renvoie les `limit` DERNIERS messages | **élevé** |

---

## 3. Conventions frontend 🟢

### A-1 — Tri par défaut des listes

**Décision** : lorsque le contrat ne spécifie aucun tri, on suppose `created_at DESC`
(le plus récent en premier).

**Contrat** : silencieux. Les seuls tris documentés sont
`GET /users/{id}/portfolio` (`ORDER BY date_fin DESC`) et les suggestions (« par compétences en
commun, puis nom »).

**Portée** : `GET /users`, `GET /projects`, `GET /resources`.

> **Important** : on **ne retrie jamais côté front une réponse paginée.** Retrier une page
> isolée produit un ordre faux à l'échelle de la collection. Le tri est une **entrée serveur**.
> Si l'ordre reçu ne convient pas, c'est `V-3` qu'il faut lever, pas un `.sort()` dans un composant.

### A-2 — Libellés des énumérations

**Décision** : tous les libellés affichés vivent dans `lib/labels.ts`, typés **depuis** les types
générés (jamais recopiés à la main).

**Contrat** : ne fournit les libellés que pour `StatutProjet`. Manquent :
`RoleProfil` (10), `Domaine` (12), `RoleEquipe` (2), `TypeRessource` (7), `categorie` de
compétence (7), `niveau` (3), `statut` de demande (3), `LienProfil.type` (6).

**Exigence** : la table doit être **exhaustive par construction**. Grâce au typage, ajouter une
valeur d'enum au contrat doit **casser la compilation** — et non produire un libellé vide à
l'écran. `Record<RoleProfil, string>` et non `Partial<...>`.

**Convention de rédaction** : libellés en français, casse de phrase (« Développeur frontend »,
pas « développeur_frontend » ni « DEVELOPPEUR FRONTEND »), sans abréviation non standard.

### A-3 — Libellés des statuts de projet

**Décision** : appliquer **strictement** le contrat, sans initiative.

| Valeur technique | Libellé affiché |
|---|---|
| `recrutement` | **« Ouvert »** |
| `en_cours` | **« En cours »** |
| `termine` | **« Terminé »** |

> ⚠️ **Ne jamais afficher la valeur technique.** Le contrat précise explicitement
> *« Libellés affichés : recrutement = « Ouvert »… »*. Afficher « Recrutement » est une
> divergence, donc un bug. Contre-intuitif mais volontaire : c'est une décision produit.

### A-4 — Pause du polling des messages

**Décision** : le polling de 5 s se **met en pause** quand `document.hidden` est vrai, et
**reprend** au retour de visibilité avec un appel immédiat.

**Contrat** : impose la cadence de 5 s, sans prévoir l'inactivité.

**Justification** : un onglet en arrière-plan qui interroge le serveur toutes les 5 s pour rien
est un gaspillage pur — et un point de contention inutile le jour de la démo.

**Le polling s'arrête aussi** lorsque : le composant est démonté, un **401** survient, ou un
**403** survient (voir `A-8`).

### A-5 — Le curseur `depuis` n'est jamais transformé

**Décision** : `meta.server_time` est stocké **tel quel, en chaîne**, et renvoyé tel quel dans
`depuis` au poll suivant. **Aucune** conversion en `Date`, **aucun** reformatage, **aucune**
re-sérialisation.

**Contrat** : *« Le front la renvoie telle quelle dans `depuis` au poll suivant. »*

**Justification** : convertir puis reformater introduit des pertes de précision (millisecondes,
suffixe de fuseau) et peut faire manquer des suppressions. Le serveur compare une date qu'il a
lui-même produite : lui rendre autre chose est une erreur.

**Corollaire** : `depuis` est **absent du premier appel** — le contrat précise
*« Tableau vide si `depuis` est absent. »*

### A-6 — Rejeu après 419

**Décision** : trois règles, dans `api/client.ts` uniquement.

1. **Rejeu borné à une seule tentative.** Un second 419 n'est pas rejoué : il remonte en erreur.
2. **Rafraîchissement CSRF mutualisé** : une **seule** promesse partagée pour tous les 419
   concurrents, pas un appel par requête.
3. **Corps rejouable** : conserver une **fabrique** de corps, jamais un `FormData` déjà consommé
   (un `FormData` ne se rejoue pas).

**Contrat** : impose le rappel de `/sanctum/csrf-cookie` puis le rejeu, sans borner ni mutualiser.

**Justification** : sans (1), une boucle infinie de requêtes. Sans (2), N appels à
`/sanctum/csrf-cookie` pour N requêtes simultanées. Sans (3), les uploads échouent au rejeu.

### A-7 — 403 ≠ 401

**Décision** :

| Code | Traitement |
|---|---|
| **401** | session absente/expirée ⇒ **vider l'état utilisateur** et rediriger vers la connexion |
| **403** | *« non autorisé »* **contextuel** ⇒ rester sur place, aucun impact sur la session |

**Justification** : le 403 est une **Policy Laravel** — l'utilisateur est bien authentifié, il n'a
simplement pas le droit. Le déconnecter serait un contresens, et une source de déconnexions
incompréhensibles.

### A-8 — Les 403 « métier » ne sont pas des erreurs d'interface

**Décision** : trois 403 ont un sens **fonctionnel** et ne doivent **pas** être présentés comme
des erreurs :

| Route | Signification du 403 | Traitement |
|---|---|---|
| `GET /projects/{id}/messages` | je ne suis plus membre | **arrêter le polling**, rafraîchir le projet |
| `GET /resources?projet_id=N` | je ne suis pas membre de ce projet | section vide, pas d'alerte |
| `GET /users/suggestions` | je ne suis propriétaire d'aucun projet | **ne pas afficher le bloc** |

> **Le cas de `GET /users/suggestions` est le piège le plus vicieux du contrat** (voir
> `ANALYSE-CONTRAT.md` §8.1) : elle renvoie **403 même sans `projet_id`**. D'où `A-12`.

### A-9 — Messages de validation

**Décision** : afficher les messages du backend **tels quels**, en les rattachant au champ quand
`errors[champ]` existe. Un message générique de repli n'est utilisé **que** si `errors` est absent.

**Contrat** : impose la forme `{ message, errors: { champ: [messages] } }` sans garantir la langue.

**Justification** : traduire ou reformuler côté front créerait une **deuxième** source de vérité
et masquerait les messages précis du backend. Voir `V-9` pour la langue.

### A-10 — Les compteurs P1 valent zéro : on les masque

**Décision** : tant que le P1 n'est pas livré, `followers_count`, `following_count` et
`commentaires_count` (présents dans des schémas **P0**) sont **masqués**, jamais affichés à `0`.

**Contrat** : *« Tant que le follow n'est pas livré, renvoyer 0 »* et *« Ne rien construire
dessus. »*

**Justification** : afficher `0 abonné` sur un profil qui expose manifestement des
collaborations est un **mensonge visuel**. Un zéro n'est pas neutre : il affirme quelque chose de
faux. On masque la ligne entière.

**Pilotage** : via `lib/priorites.ts`, pour que la bascule soit une **constante**, pas dix
composants.

### A-11 — Dates : UTC en données, local à l'affichage

**Décision** : les dates du contrat (ISO 8601 UTC) sont **stockées et transmises telles quelles** ;
la conversion en heure locale se fait **au rendu**.

**Portée** : `A-5` en dépend directement — convertir dans la couche données casserait le curseur.

**Détail** : `date_fin` est un `format: date` (**jour seul**), pas un `date-time`. Elle ne reçoit
pas le même formatage que `created_at`.

### A-12 — Ne pas appeler une route dont on sait qu'elle répondra 403

**Décision** : `GET /users/suggestions` n'est appelée **que** si l'utilisateur est propriétaire
d'**au moins un** projet. Sinon, le bloc « Talents suggérés » n'est simplement pas monté.

**Justification** : déclencher volontairement une requête qu'on sait condamnée produit du bruit
dans les logs, un état d'erreur à gérer pour rien, et une latence perçue.

**Nuance** : si le backend livre un jour des suggestions sans projet, la condition tombe — c'est
précisément `V-10`/`V-11` qu'il faut confronter, pas contourner.

### A-13 — Chargement de l'historique des messages

**Décision** : l'historique se charge avec `avant_id` et s'**insère en tête** de liste — à
l'inverse du polling, qui **ajoute en queue** (les messages arrivent *« triés du plus ancien au
plus récent »*).

**Fusion** : déduplication **par `id`**, dans les deux sens. Un poll peut recouvrir un message
déjà affiché (chevauchement de curseur, ou rejeu après 419).

**Progression** : `apres_id` = le **plus grand id jamais vu**, pas le dernier message affiché —
pour rester monotone après une suppression.

### A-14 — Sérialisation des tableaux en query string

**Décision** : un `paramsSerializer` **unique** dans `api/client.ts`, produisant
`competence_ids[]=1&competence_ids[]=2`.

**Contrat** : le répète quatre fois (*« paramSerializer axios avec brackets »*).

**Deux exigences qu'une implémentation naïve rate** :

- **Omettre** les clés `undefined`/`null` — jamais `competence_ids[]=undefined`.
- Un filtre vide ⇒ **clé absente**, pas tableau vide (un tableau vide est un filtre, pas une
  absence de filtre).

### A-15 — Repli du tableau de bord

**Décision** : `api/dashboard.ts` tente `GET /me/dashboard` (P1) puis **bascule silencieusement**
sur le repli P0, dont la recette est donnée par le contrat lui-même. Les appels de repli partent
**en parallèle** et sont **tolérants à l'échec** : un projet dont les demandes échouent ne fait
pas tomber tout le tableau de bord.

**Contrat** : prescrit le repli (`GET /me/projects` + `GET /me/join-requests`, puis
`GET /projects/{id}/join-requests` projet par projet) et annonce la bascule
*« dès qu'il est livré »*.

**Mise en œuvre (module 8)** : `chargerTableauDeBord()` ; `priorites.dashboard` vaut `false` tant que le P1
n'est pas livré. Une réponse de `GET /me/dashboard` sans la forme du contrat (ou un 404) retombe sur le
repli. Un chiffre indisponible s'affiche « — », jamais « 0 ». Les appels « demandes reçues » partagent
le cache `['demandes-recues']` avec le badge de navigation.

**Conséquence assumée** : le repli coûte **N appels** (N = mes projets dont je suis propriétaire).
C'est le seul endroit du front où une requête par élément est acceptable — et elle disparaît le
jour où le P1 arrive, **sans qu'aucun composant ne change**.

### A-16 — Alerte « demandes reçues » du propriétaire

**Décision** : le contrat n'a ni notification ni e-mail (hors périmètre confirmé). Le propriétaire
est donc alerté par un **compteur** : pastille sur « Mes projets » (barre de navigation), pastille
« N demandes à traiter » sur chaque carte, compteur sur l'onglet « Demandes ». Il est calculé par
`features/equipes/useDemandesRecues.ts` : `GET /me/projects?role_equipe=proprietaire`, puis
`GET /projects/{id}/join-requests?statut=en_attente&per_page=1` **en parallèle** (seul `meta.total`
compte), tolérant à l'échec projet par projet. Les projets `termine` sont ignorés.

**Contrat** : fournit les routes, pas le total. `GET /me/dashboard` (P1) l'expose
(`demandes_recues_en_attente`).

**Conséquence assumée** : N appels, N = mes projets possédés non terminés (cache 30 s, rechargé
après chaque écriture). Même logique que `A-15` : le jour où le P1 arrive, seul le hook change.

### A-17 — Fraîcheur du cache après une écriture

**Décision** : `staleTime = 30 s` sert une donnée en cache sans appel. Toute écriture sur un projet
ou une équipe appelle `rafraichirProjets()` (`lib/cache.ts`) ; une suppression appelle en plus
`oublierProjet()` ; chaque changement de compte (connexion, inscription, déconnexion, expiration)
appelle `purgerCacheSession()` pour qu'un utilisateur ne lise jamais le cache du précédent.

**Pourquoi** : sans cela, un projet créé restait absent des listes, un projet supprimé restait
cliquable, et l'écran passait de « projet affiché » à « Projet introuvable » dès que le rechargement
en arrière-plan répondait 404. Ce n'était **pas** un artefact du mock : le même scénario se
produirait avec Laravel.

**Règle d'affichage associée** : « Projet introuvable » n'apparaît que sur une vraie réponse **404**.
Une panne réseau ou 5xx garde les données déjà affichées (ou propose « Réessayer »).

### A-19 — Visibilité d'une ressource à la création

**Décision** : `visibilite` n'est **jamais envoyé** par défaut (le serveur applique sa règle :
ressource de projet ⇒ équipe, sinon publique). Il n'est envoyé (`publique`) que si l'auteur coche
« Rendre aussi publique » sur une ressource de projet. Onglet « Ressources » d'un projet :
`403` ⇒ section vide (cf. `A-8`). Commentaires (P1) non affichés : `commentaires_count` ignoré.

### A-18 — Polling de la discussion

**Décision** : l'état de la discussion (messages + curseurs) vit dans le cache TanStack Query sous
`['discussion', projetId]`. Le polling est le `refetchInterval` (5 s, valeur du contrat) de cette
requête : il se **met en pause** quand l'onglet du navigateur est masqué, **reprend avec un poll
immédiat** au retour, et **s'arrête** sur un 403/404 (plus membre, projet supprimé). Les règles de
fusion sont des fonctions pures dans `features/messagerie/fil.ts`.

**Règles de curseur** (en plus de `A-5` et `A-13`) :
1. `apres_id` = plus grand id **jamais vu par un appel serveur**.
2. **Envoyer un message n'avance PAS le curseur** : si un coéquipier a écrit juste avant moi,
   avancer jusqu'à mon id lui ferait sauter son message. Mon message est ajouté à l'écran, et le
   poll suivant le renverra en doublon, absorbé par la fusion par id.
3. La fusion se fait sur l'état le plus récent **relu après** l'attente réseau (un poll lent ne
   doit pas écraser l'historique chargé ou le message envoyé entre-temps).
4. Poll plein (≥ 50 messages) ⇒ on rattrape immédiatement au lieu d'attendre 5 s.

**Conséquence assumée** : un poll toutes les 5 s **par discussion ouverte**, uniquement tant que
l'onglet « Discussion » est affiché.

### V-12 — Premier appel sans curseur 🔴

Le contrat dit que les messages sont « triés du plus ancien au plus récent » mais ne dit pas quels
messages renvoie un appel **sans** `apres_id` ni `avant_id`. Hypothèse du front : **les `limit`
derniers** (donc la fin de la conversation), l'historique se chargeant ensuite avec `avant_id`.
Si le backend renvoie les `limit` **premiers**, le fil s'ouvrirait sur le début de la conversation.
**À confirmer** (question prête : « sans curseur, `GET /messages` renvoie-t-il les 50 derniers ? »).

---

## 4. Points à vérifier auprès du backend 🔴

> Les deux premiers sont **critiques** : leur réponse peut modifier la logique d'état du bouton
> « Rejoindre », qui est la plus délicate du front (`ANALYSE-CONTRAT.md` §6.4).

### V-1 — Peut-on redemander à rejoindre après un refus ? *(critique)*

**Hypothèse retenue** : **oui**.

**Fondement** : le seul blocage documenté est *« Une seule demande `en_attente` par couple
(projet, utilisateur) »*. Une demande `refusee` n'est donc pas `en_attente` ⇒ une nouvelle demande
est possible. Et `ma_demande_statut` peut valoir `refusee`, ce qui n'aurait guère de sens si
l'état était définitif.

**Si l'hypothèse est fausse** : le bouton doit rester **désactivé** après un refus, avec une
explication. Sinon l'utilisateur clique et reçoit un 409 opaque.

**Impact si faux** : 🟠 moyen à élevé — un état de plus dans la matrice du bouton.

### V-2 — Que devient `ma_demande_statut` après avoir quitté un projet ? *(critique)*

**Hypothèse retenue** : `DELETE /projects/{id}/members/{userId}` sur soi-même **supprime** la
demande d'adhésion liée ⇒ `ma_demande_statut` redevient **`null`**.

**Contrat** : **muet**. Il précise seulement que `ma_demande_statut` est la *« dernière demande de
l'utilisateur connecté sur ce projet »*.

**Si l'hypothèse est fausse** : la demande reste `acceptee`, `is_member` devient `false` — c'est
l'**état contradictoire** identifié en §6.4. Pire : l'utilisateur ne peut plus redemander
(409 « demande en attente ») alors qu'il n'est plus membre. **Il serait piégé hors du projet.**

**À demander précisément** : que fait le backend de la ligne `join_requests` quand un membre
quitte ou est retiré ?

### V-3 — Tri réel des listes

**Hypothèse** : `created_at DESC` (`A-1`). **À confirmer** : le tri effectif de `GET /users`,
`GET /projects`, `GET /resources`.

**Enjeu** : si le backend trie autrement, le front ne doit **pas** compenser (`A-1`).

### V-4 — Visibilité des projets supprimés

**Hypothèse** : un projet *soft-deleted* (`DELETE /projects/{id}`) **n'apparaît plus** dans
`GET /projects`, `GET /me/projects` ni `GET /users/{id}/portfolio`.

**Contrat** : précise *« suppression logique »* et *« Messages, demandes et ressources liés
restent archivés »*, sans dire ce que devient le projet dans les listes.

### V-5 — Ordre de `GET /me/projects`

**Hypothèse** : `updated_at DESC` (les projets récemment actifs d'abord), cohérent avec l'esprit
du dashboard (*« 5 projets les plus récemment actifs »*).

### V-6 — Le message d'une demande refusée est-il relisible ?

**Hypothèse** : **oui**, le demandeur revoit son message et la décision dans
`GET /me/join-requests` (le schéma `DemandeAdhesion` contient `message`, `statut`, `traitee_at`).

### V-7 — `statut` et `places_disponibles` se combinent-ils ?

**Hypothèse** : ce sont **deux filtres indépendants** qui se cumulent (`statut=recrutement` **et**
places disponibles). Le front les envoie tous les deux sans logique propre.

**Point d'attention** : `places_disponibles=true` **seul** ne garantit pas d'exclure les projets
`termine` — un projet terminé n'a pas forcément atteint son effectif souhaité. D'où le réflexe
d'envoyer aussi `statut=recrutement` sur l'écran « Trouver une équipe ».

### V-8 — Un membre retiré par le propriétaire

**Hypothèse** : un membre **retiré** redevient un utilisateur comme un autre : il peut
**redemander** à rejoindre.

**Corollaire de `V-2`** : la même question se pose pour la ligne `join_requests` d'origine.

**Enjeu** : un utilisateur retiré par erreur et **incapable de redemander** est un incident de
démo.

### V-9 — Langue des messages de validation

**Hypothèse** : les messages sont en **français** (le contrat en donne des exemples en français :
*« Fichier trop volumineux (16 Mo maximum). »*).

**Enjeu** : Laravel renvoie ses messages par défaut **en anglais** s'il n'y a pas de fichier de
traduction. Si c'est le cas, `A-9` (afficher tel quel) produirait une interface bilingue
incohérente. **À trancher avec le backend**, pas à rattraper côté front.

### V-10 — Cohérence des agrégats

**Hypothèse** : les compteurs (`projets_realises_count`, `nombre_membres_actuel`,
`commentaires_count`, `projets_count`) sont **cohérents** avec les listes correspondantes.

**Enjeu** : un compteur qui ment (badge « 3 » menant à une liste de 2) détruit la confiance plus
vite qu'une fonctionnalité absente.

### V-11 — Le drapeau « c'est moi »

**Hypothèse** : comparer `projet.createur.id` (ou `utilisateur.id`) à `me.id` issu de
`GET /auth/me` est **fiable** pour déterminer le rôle.

**Contrat** : fournit `role_equipe` dans `Membre` et `createur` dans `Projet`, mais **pas** de
booléen `is_owner` global.

**Point d'attention** : `GET /users/{id}` **ne contient jamais d'`email`** — y compris pour
soi-même. L'identité « moi » se lit donc **exclusivement** via `GET /auth/me` (`A-7`, et
`ANALYSE-CONTRAT.md` §7). Comparer des e-mails est **impossible** : ne jamais l'écrire.

---

## 5. Hors périmètre — confirmé

Ces sujets sont **explicitement exclus** du contrat. Ils ne doivent apparaître ni dans une
interface, ni dans une hypothèse, ni dans un mock :

mot de passe oublié · changement d'e-mail · changement de mot de passe · suppression de compte ·
vérification d'e-mail · transfert de propriété d'un projet · notifications push · temps réel
(WebSocket) · landing page publique · création libre de compétences · édition de l'e-mail dans le
profil · remplacement du fichier d'une ressource.

> **Le réflexe à avoir** : si une maquette ou une demande suggère l'un de ces éléments,
> **le signaler** au lieu de l'implémenter discrètement.

---

## 6. Protocole de vérification

### 6.1 Comment une hypothèse est levée

1. **Question posée** au dev backend, avec l'identifiant (`V-2`) et l'hypothèse écrite — jamais
   une question ouverte.
2. **Réponse obtenue** ⇒ trois issues possibles :

| Issue | Action |
|---|---|
| **Confirmée** | la marque 🔴 devient ✅ ; le code ne change pas ; on gagne de la certitude |
| **Infirmée, le contrat est clair** | c'était un **bug du front** ⇒ on corrige, et on l'ajoute à la recette |
| **Infirmée, le contrat est muet ou ambigu** | c'est un **écart** ⇒ procédure de la « Règle des écarts » (`INTEGRATION.md`) |

3. **Le fichier est mis à jour** dans la même itération. Une hypothèse levée mais non consignée
   est une hypothèse perdue.

### 6.2 Vérification automatisée

| Outil | Ce qu'il vérifie |
|---|---|
| **Script de conformité OpenAPI** (`INTEGRATION.md`) | que les **réponses réelles** respectent les schémas du contrat — donc que `V-3`, `V-4`, `V-7`, `V-10` sont tenues |
| **Mocks MSW** | que le front se comporte correctement **sans** le backend |
| **Recette manuelle** | les hypothèses non testables automatiquement (`V-1`, `V-2`, `V-8`, `V-9`) |

> **Le script de conformité a une double vie** : il valide la vraie API **et** les mocks. Un mock
> non conforme au contrat est un piège à retardement — il fait valider des écrans qui casseront le
> jour J. C'est la raison pour laquelle les mocks doivent passer le **même** validateur que l'API.

### 6.3 Ce qui doit être vérifié avant la démo

- [ ] `V-1`, `V-2`, `V-8` — la logique du bouton « Rejoindre » et le piège du membre retiré
- [ ] `V-9` — la langue des messages
- [ ] `A-14` — le filtrage par compétences (brackets) sur les trois routes concernées
- [ ] `A-5` — le curseur `depuis` (messages **supprimés** qui disparaissent réellement)
- [ ] `A-6` — le rejeu 419 (session longue : laisser expirer le CSRF et vérifier qu'aucune boucle
      n'apparaît)

---

*Fichier vivant. Toute hypothèse non listée ici est une hypothèse non assumée : elle doit être
ajoutée avant d'être codée. À confronter au backend, puis à figer.*
