import { useState } from 'react'
import { Link } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, CardCorps, EmptyState, SkeletonTexte } from '../../components/ui'
import { annulerDemande, mesDemandes } from '../../api/equipes'
import { messageErreur } from '../../api/erreurs'
import { rafraichirProjets } from '../../lib/cache'
import { libelleStatutDemande, varianteStatutDemande } from './statutDemande'

/**
 * « Mes demandes » — les demandes d'adhésion que J'AI envoyées.
 *
 * C'est ici qu'on annule une demande en attente. Le statut `refusee` est
 * conservé (on peut voir la décision), et un refus permet de redemander.
 */
export function MesDemandes() {
  const queryClient = useQueryClient()
  const requete = useQuery({ queryKey: ['mes-demandes'], queryFn: () => mesDemandes() })

  const [erreur, setErreur] = useState<string | null>(null)

  async function onAnnuler(id: number) {
    setErreur(null)
    try {
      await annulerDemande(id)
    } catch (e) {
      setErreur(
        messageErreur(e, { 409: 'Cette demande a déjà été traitée.', 404: 'Cette demande n’existe plus.' })
      )
    }
    /* Aussi les fiches projet : leur `ma_demande_statut` vient de changer. */
    rafraichirProjets(queryClient)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-fg-1">Mes demandes</h1>
        <p className="mt-1 text-sm text-fg-2">Les demandes d'adhésion que tu as envoyées.</p>
      </div>

      {erreur && (
        <p role="alert" className="text-sm text-danger">
          {erreur}
        </p>
      )}

      {requete.isPending ? (
        <Card>
          <CardCorps>
            <SkeletonTexte lignes={4} />
          </CardCorps>
        </Card>
      ) : requete.data && requete.data.data.length > 0 ? (
        <div className="flex flex-col gap-3">
          {requete.data.data.map((demande) => (
            <Card key={demande.id}>
              <CardCorps className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/projets/${demande.projet.id}`}
                    className="text-sm font-medium text-fg-1 hover:text-accent"
                  >
                    {demande.projet.nom}
                  </Link>
                  <p className="mt-0.5 text-xs text-fg-3">
                    {demande.message || 'Sans message.'} · envoyée le{' '}
                    {new Date(demande.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variante={varianteStatutDemande(demande.statut)}>
                    {libelleStatutDemande(demande.statut)}
                  </Badge>
                  {demande.statut === 'en_attente' && (
                    <Button taille="sm" variante="discret" onClick={() => onAnnuler(demande.id)}>
                      Annuler
                    </Button>
                  )}
                </div>
              </CardCorps>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            titre="Aucune demande"
            description="Explore les projets et rejoins une équipe qui te ressemble."
            action={
              <Link to="/projets">
                <Button>Explorer les projets</Button>
              </Link>
            }
          />
        </Card>
      )}
    </div>
  )
}
