import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, SkeletonTexte } from '../../components/ui'
import { detailRessource } from '../../api/ressources'
import { useSession } from '../../features/auth/SessionProvider'
import { FormulaireRessource } from './FormulaireRessource'

/** « Modifier une ressource » — l'accès réel est contrôlé par le serveur (403). */
export function RessourceEdition() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profil } = useSession()
  const requete = useQuery({
    queryKey: ['ressource', id],
    queryFn: () => detailRessource(Number(id)),
    enabled: id != null,
  })

  if (requete.isPending) {
    return (
      <Card>
        <CardCorps>
          <SkeletonTexte lignes={6} />
        </CardCorps>
      </Card>
    )
  }

  if (!requete.data) {
    return (
      <EmptyState
        titre="Ressource introuvable"
        description="Elle n'existe plus, ou tu n'y as pas accès."
        action={
          <Button variante="secondaire" onClick={() => navigate('/ressources')}>
            Retour à la bibliothèque
          </Button>
        }
      />
    )
  }

  /* `key` : si on passe d'une ressource à une autre, le formulaire repart de zéro. */
  return <FormulaireRessource key={requete.data.id + (profil?.id ?? 0)} ressource={requete.data} />
}
