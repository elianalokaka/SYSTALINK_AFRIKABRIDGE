import { useCallback, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Avatar, Button, Card, EmptyState, SkeletonTexte, Textarea } from '../../components/ui'
import { messageErreur } from '../../api/erreurs'
import { useDiscussion } from '../../features/messagerie/useDiscussion'
import { useSession } from '../../features/auth/SessionProvider'
import type { Message } from '../../types'

const LONGUEUR_MAX = 2000
/** Deux messages du même auteur à moins de 5 min d'écart forment un seul groupe. */
const ECART_GROUPE_MS = 5 * 60 * 1000
/** En dessous de cette distance du bas, on considère que l'utilisateur « suit » le fil. */
const SEUIL_BAS_PX = 80

/* ── Dates : conversion à l'AFFICHAGE uniquement, les données restent en UTC (A-11) ── */

const heure = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

function libelleJour(iso: string): string {
  const jour = new Date(iso)
  const aujourdhui = new Date()
  const hier = new Date()
  hier.setDate(aujourdhui.getDate() - 1)
  if (jour.toDateString() === aujourdhui.toDateString()) return "Aujourd'hui"
  if (jour.toDateString() === hier.toDateString()) return 'Hier'
  return jour.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/**
 * Onglet « Discussion » d'un projet — réservé aux membres.
 *
 * Responsive : la zone des messages a une hauteur bornée par la fenêtre
 * (`dvh`, tient compte de la barre d'adresse mobile) et défile ; la saisie reste
 * collée dessous. Les bulles ne dépassent jamais ~85 % de la largeur.
 */
export function Discussion({ projetId, proprietaireId }: { projetId: number; proprietaireId: number }) {
  const { profil } = useSession()
  const fil = useDiscussion(projetId)
  const { messages } = fil

  const conteneur = useRef<HTMLDivElement>(null)
  const suitLeBas = useRef(true)
  const dernierIdVu = useRef<number | null>(null)
  const [nouveaux, setNouveaux] = useState(0)

  const [saisie, setSaisie] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const descendre = useCallback((douceur: ScrollBehavior = 'smooth') => {
    const el = conteneur.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: douceur })
    suitLeBas.current = true
    setNouveaux(0)
  }, [])

  function surDefilement() {
    const el = conteneur.current
    if (!el) return
    suitLeBas.current = el.scrollHeight - el.scrollTop - el.clientHeight < SEUIL_BAS_PX
    if (suitLeBas.current) setNouveaux(0)
  }

  /* À chaque changement du dernier message : on descend si l'utilisateur suivait
     le fil (ou si le message est le sien) ; sinon on propose « Nouveaux messages ».
     Les messages ajoutés EN TÊTE (historique) ne changent pas le dernier id : le
     défilement n'est pas touché. */
  const dernier = messages[messages.length - 1]
  useLayoutEffect(() => {
    if (!dernier) return
    const premier = dernierIdVu.current === null
    const change = dernierIdVu.current !== dernier.id
    dernierIdVu.current = dernier.id
    if (!change) return
    if (premier || suitLeBas.current || dernier.auteur.id === profil?.id) {
      descendre(premier ? 'auto' : 'smooth')
    } else {
      setNouveaux((n) => n + 1)
    }
  }, [dernier, profil?.id, descendre])

  async function envoyer(e?: FormEvent) {
    e?.preventDefault()
    const contenu = saisie.trim()
    if (!contenu || envoiEnCours) return
    setEnvoiEnCours(true)
    setErreur(null)
    try {
      await fil.envoyer(contenu)
      setSaisie('')
    } catch (e) {
      setErreur(
        messageErreur(e, {
          403: "Tu ne fais plus partie de ce projet : tu ne peux plus écrire.",
          422: 'Le message doit contenir entre 1 et 2000 caractères.',
        })
      )
    } finally {
      setEnvoiEnCours(false)
    }
  }

  /* Entrée envoie ; Maj+Entrée va à la ligne. */
  function surTouche(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void envoyer()
    }
  }

  async function supprimer(message: Message) {
    if (!window.confirm('Supprimer ce message pour tout le monde ?')) return
    setErreur(null)
    try {
      await fil.supprimer(message.id)
    } catch (e) {
      setErreur(messageErreur(e, { 403: "Tu ne peux supprimer que tes messages (ou tous, si tu es propriétaire)." }))
    }
  }

  if (fil.chargement) {
    return (
      <Card>
        <div className="p-4">
          <SkeletonTexte lignes={6} />
        </div>
      </Card>
    )
  }

  if (fil.erreurFatale) {
    return (
      <Card>
        <EmptyState
          titre="Discussion indisponible"
          description={messageErreur(fil.erreurFatale, {
            403: 'La discussion est réservée aux membres du projet.',
            404: "Ce projet n'existe plus.",
          })}
          action={
            <Button variante="secondaire" onClick={fil.reessayer}>
              Réessayer
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      {fil.reconnexion && (
        <p role="status" className="border-b border-border-subtle bg-pending-bg px-4 py-2 text-xs text-pending">
          Connexion perdue — nouvelle tentative automatique…
        </p>
      )}

      <div className="relative">
        <div
          ref={conteneur}
          onScroll={surDefilement}
          className="flex h-[min(60dvh,34rem)] min-h-64 flex-col gap-1 overflow-y-auto px-3 py-4 sm:px-4"
          aria-live="polite"
          aria-label="Messages de la discussion"
        >
          {messages.length > 0 && !fil.historiqueComplet && (
            <div className="mb-2 flex justify-center">
              <Button
                taille="sm"
                variante="discret"
                chargement={fil.historiqueEnCours}
                onClick={() => void fil.chargerHistorique()}
              >
                Messages précédents
              </Button>
            </div>
          )}

          {messages.length === 0 ? (
            <EmptyState
              titre="Aucun message pour l'instant"
              description="Lance la discussion : présente-toi ou propose une première tâche à l'équipe."
            />
          ) : (
            messages.map((message, index) => (
              <LigneMessage
                key={message.id}
                message={message}
                precedent={messages[index - 1]}
                moi={message.auteur.id === profil?.id}
                peutSupprimer={message.auteur.id === profil?.id || proprietaireId === profil?.id}
                onSupprimer={() => void supprimer(message)}
              />
            ))
          )}
        </div>

        {nouveaux > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            <Button taille="sm" className="pointer-events-auto shadow-lg" onClick={() => descendre()}>
              ↓ {nouveaux === 1 ? 'Nouveau message' : `${nouveaux} nouveaux messages`}
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={envoyer} className="flex flex-col gap-2 border-t border-border-subtle p-3">
        {erreur && (
          <p role="alert" className="text-xs text-danger">
            {erreur}
          </p>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            aria-label="Ton message"
            rows={2}
            maxLength={LONGUEUR_MAX}
            placeholder="Écris un message… (Entrée pour envoyer, Maj+Entrée pour passer à la ligne)"
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            onKeyDown={surTouche}
            className="min-h-11 max-h-40 flex-1 resize-none"
          />
          <Button type="submit" chargement={envoiEnCours} disabled={saisie.trim().length === 0}>
            Envoyer
          </Button>
        </div>
        {saisie.length > LONGUEUR_MAX - 200 && (
          <p className="text-right text-xs tabular-nums text-fg-3">
            {saisie.length}/{LONGUEUR_MAX}
          </p>
        )}
      </form>
    </Card>
  )
}

function LigneMessage({
  message,
  precedent,
  moi,
  peutSupprimer,
  onSupprimer,
}: {
  message: Message
  precedent: Message | undefined
  moi: boolean
  peutSupprimer: boolean
  onSupprimer: () => void
}) {
  const nouveauJour = !precedent || libelleJour(precedent.created_at) !== libelleJour(message.created_at)
  const nouveauGroupe =
    nouveauJour ||
    precedent.auteur.id !== message.auteur.id ||
    new Date(message.created_at).getTime() - new Date(precedent.created_at).getTime() > ECART_GROUPE_MS

  return (
    <>
      {nouveauJour && (
        <div className="my-2 flex items-center gap-3 text-xs text-fg-3">
          <span className="h-px flex-1 bg-border-subtle" />
          <span className="capitalize">{libelleJour(message.created_at)}</span>
          <span className="h-px flex-1 bg-border-subtle" />
        </div>
      )}

      <div className={`group flex gap-2 ${moi ? 'flex-row-reverse' : ''} ${nouveauGroupe ? 'mt-2' : ''}`}>
        <div className="w-8 shrink-0">
          {nouveauGroupe && !moi && <Avatar nom={message.auteur.nom} photoUrl={message.auteur.photo_url} taille="sm" />}
        </div>

        <div className={`flex min-w-0 max-w-[85%] flex-col ${moi ? 'items-end' : 'items-start'}`}>
          {nouveauGroupe && (
            <p className="mb-0.5 text-xs text-fg-3">
              {!moi && <span className="font-medium text-fg-2">{message.auteur.nom} · </span>}
              {heure(message.created_at)}
            </p>
          )}
          <div className="flex items-center gap-1.5">
            {moi && peutSupprimer && <BoutonSupprimer onClick={onSupprimer} />}
            <p
              className={`whitespace-pre-wrap break-words rounded-md border px-3 py-2 text-sm text-fg-1 ${
                moi ? 'border-border bg-surface-4' : 'border-border-subtle bg-surface-3'
              }`}
            >
              {message.contenu}
            </p>
            {!moi && peutSupprimer && <BoutonSupprimer onClick={onSupprimer} />}
          </div>
        </div>
      </div>
    </>
  )
}

/** Visible au survol (souris) ET au focus clavier ; toujours visible sur écran tactile. */
function BoutonSupprimer({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Supprimer ce message"
      className="shrink-0 rounded-md px-1.5 py-1 text-xs text-fg-3 transition-colors hover:bg-danger-bg hover:text-danger focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
    >
      Supprimer
    </button>
  )
}
