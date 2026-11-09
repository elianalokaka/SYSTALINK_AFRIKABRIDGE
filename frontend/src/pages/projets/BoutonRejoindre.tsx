import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, FormField, Textarea } from '../../components/ui'
import { annulerDemande, demanderAdhesion, mesDemandes } from '../../api/equipes'
import { messageErreur } from '../../api/erreurs'
import { rafraichirProjets } from '../../lib/cache'
import type { Projet } from '../../types'

const LONGUEUR_MAX_MESSAGE = 500

/**
 * LE bouton « Rejoindre » — la logique d'état la plus délicate du front
 * (AGENTS.md § 2). Trois champs se combinent : `is_member`, `ma_demande_statut`,
 * `statut` (+ l'effectif de l'équipe).
 *
 *   is_member  ma_demande_statut  situation           → bouton
 *   ─────────  ─────────────────  ────────────────    ──────────────────────────
 *   true       —                  —                   badge « Membre »
 *   false      en_attente         —                   « Demande en attente » + Annuler
 *   false      refusee / null     recrutement/cours   « Rejoindre » (on peut redemander)
 *   false      —                  termine             désactivé (projet terminé)
 *   false      —                  équipe complète     désactivé (équipe complète)
 *
 * « Rejoindre » ouvre un petit formulaire : le message au propriétaire est
 * FACILITATEUR (le contrat le déclare optionnel) mais c'est ce que le chef de
 * projet lit pour décider.
 */
export function BoutonRejoindre({ projet }: { projet: Projet }) {
  const queryClient = useQueryClient()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [message, setMessage] = useState('')

  /* Pour « Annuler », il faut l'id de MA demande en attente sur ce projet.
     `ma_demande_statut` ne donne que le statut, pas l'id : on le retrouve dans
     « mes demandes » (clé partagée avec l'écran MesDemandes). */
  const demandes = useQuery({
    queryKey: ['mes-demandes'],
    queryFn: () => mesDemandes(),
    enabled: projet.ma_demande_statut === 'en_attente',
  })
  const demandeEnAttente = demandes.data?.data.find(
    (demande) => demande.projet.id === projet.id && demande.statut === 'en_attente'
  )

  async function onEnvoyer() {
    setChargement(true)
    setErreur(null)
    try {
      const texte = message.trim()
      await demanderAdhesion(projet.id, texte ? { message: texte } : {})
      setFormulaireOuvert(false)
      setMessage('')
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setChargement(false)
    }
    /* Succès OU conflit (409 : l'état serveur a changé) → on recale l'écran. */
    rafraichirProjets(queryClient, projet.id)
  }

  async function onAnnuler() {
    if (!demandeEnAttente) return
    setChargement(true)
    setErreur(null)
    try {
      await annulerDemande(demandeEnAttente.id)
    } catch (e) {
      setErreur(
        messageErreur(e, { 409: 'Cette demande a déjà été traitée.', 404: 'Cette demande n’existe plus.' })
      )
    } finally {
      setChargement(false)
    }
    rafraichirProjets(queryClient, projet.id)
  }

  if (projet.is_member) {
    return <Badge variante="info">Membre</Badge>
  }

  if (projet.ma_demande_statut === 'en_attente') {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-2">
          <Badge variante="attente">Demande en attente</Badge>
          <Button taille="sm" variante="discret" chargement={chargement} onClick={onAnnuler}>
            Annuler
          </Button>
        </div>
        {erreur && <p className="text-xs text-danger">{erreur}</p>}
      </div>
    )
  }

  const termine = projet.statut === 'termine'
  const complete = projet.nombre_membres_actuel >= projet.nombre_membres_souhaite

  if (formulaireOuvert && !termine && !complete) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-2">
        <FormField
          label="Message au chef de projet (facultatif)"
          id="message-adhesion"
          aide={`${message.length}/${LONGUEUR_MAX_MESSAGE}`}
        >
          <Textarea
            id="message-adhesion"
            rows={3}
            maxLength={LONGUEUR_MAX_MESSAGE}
            placeholder="Présente-toi en une phrase : ce que tu sais faire, ta disponibilité…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </FormField>
        {erreur && (
          <p role="alert" className="text-xs text-danger">
            {erreur}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variante="discret"
            disabled={chargement}
            onClick={() => {
              setFormulaireOuvert(false)
              setErreur(null)
            }}
          >
            Fermer
          </Button>
          <Button chargement={chargement} onClick={onEnvoyer}>
            Envoyer ma demande
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button disabled={termine || complete} onClick={() => setFormulaireOuvert(true)}>
        {termine ? 'Projet terminé' : complete ? 'Équipe complète' : 'Rejoindre ce projet'}
      </Button>
      {erreur && (
        <p role="alert" className="text-xs text-danger">
          {erreur}
        </p>
      )}
    </div>
  )
}
