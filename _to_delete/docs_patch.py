import pathlib
p = pathlib.Path('ASSUMPTIONS.md'); s = p.read_text(encoding='utf-8')
row = "| `A-17` | 🟢 | Fraîcheur du cache après écriture | invalidation explicite (`lib/cache.ts`) | **élevé** |\n"
assert row in s
s = s.replace(row, row +
"| `A-18` | 🟢 | Polling de la discussion | `refetchInterval` 5 s, curseur monotone | **élevé** |\n", 1)
row = "| `V-11` | 🔴 | Identité « c'est moi » | comparaison d'`id` fiable | moyen |\n"
assert row in s
s = s.replace(row, row +
"| `V-12` | 🔴 | Premier appel de la discussion (sans curseur) | renvoie les `limit` DERNIERS messages | **élevé** |\n", 1)
marker = "---\n\n## 4. Points à vérifier auprès du backend 🔴"
section = """### A-18 — Polling de la discussion

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

"""
assert marker in s
s = s.replace(marker, section + marker, 1)
p.write_text(s, encoding='utf-8')

p = pathlib.Path('AGENTS.md'); s = p.read_text(encoding='utf-8')
old = "| **5** | `feat/messagerie` | discussion + **polling 5 s** + curseur | ⬜ **suivant** |"
assert old in s
s = s.replace(old, "| **5** | `feat/messagerie` | discussion + **polling 5 s** + curseur | ✅ **code prêt · à tester puis fusionner** |", 1)
old = "1. **Tester puis fusionner `feat/equipes`** (bouton « Rejoindre », onglets Équipe/Demandes, mes demandes).\n2. **Module 5 : `feat/messagerie`** — discussion + **polling 5 s** + curseur (le code le plus risqué après l'auth).\n3. Puis `feat/ressources`, `feat/talents`, `feat/dashboard`, enfin le P1."
if old in s:
    s = s.replace(old, "1. **Tester puis fusionner `feat/messagerie`** (onglet « Discussion » : envoi, polling 5 s, suppression, historique).\n2. Puis `feat/ressources`, `feat/talents`, `feat/dashboard`, enfin le P1.", 1)
old = "    à la suppression, `role_equipe` sur `/me/projects`."
assert old in s
s = s.replace(old, old + """
- **Module 5 (`feat/messagerie`) codé + `tsc` 0** : onglet « Discussion » (membres uniquement), polling 5 s
  par `refetchInterval`, curseurs `apres_id`/`depuis` (A-5, A-13, A-18), historique `avant_id`, suppression
  (auteur ou propriétaire). Mocks avec **coéquipier simulé** : il répond ~6-9 s après ton message ; un
  message commençant par `/bot` poste un message éphémère puis le supprime 8 s plus tard (pour VOIR `supprimes`).
- **Règles permanentes** : le site est **toujours responsive** (vérifier 320 / 375 / 768 px) · à la fin de
  chaque module, **rappeler à l'utilisateur de mettre le dépôt à jour** (commit, push, PR, fusion, `git pull`).""", 1)
p.write_text(s, encoding='utf-8')
print('docs ok')
