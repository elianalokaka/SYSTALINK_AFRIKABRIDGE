import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, SkeletonTexte } from '../../components/ui'
import { detailRessource } from '../../api/ressources'
import { useSession } from '../../features/auth/SessionProvider'
import { FormulaireRessource } from './FormulaireRessource'
import { useI18n } from '../../i18n'

/** « Modifier une ressource » — l'accès réel est contrôlé par le serveur (403). */
export function RessourceEdition() {
  const { t } = useI18n()
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
        titre={t('ressource.introuvableTitre')}
        description={t('ressourceEdition.introuvableTexte')}
        action={
          <Button variante="secondaire" onClick={() => navigate('/ressources')}>
            {t('ressource.retourBibliotheque')}
          </Button>
        }
      />
    )
  }

  /* `key` : si on passe d'une ressource à une autre, le formulaire repart de zéro. */
  return <FormulaireRessource key={requete.data.id + (profil?.id ?? 0)} ressource={requete.data} />
}
