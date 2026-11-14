import { Link } from 'react-router'
import { Button, Card, CardCorps } from '../components/ui'
import { useI18n } from '../i18n'

/**
 * Page 404 : une adresse inconnue n'est plus redirigée en silence vers l'accueil
 * (l'utilisateur ne comprenait pas pourquoi il atterrissait là). On le lui dit,
 * et on lui propose une issue.
 */
export function PageIntrouvable() {
  const { t } = useI18n()
  return (
    <Card>
      <CardCorps className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-fg-1">{t('introuvable.titre')}</h1>
        <p className="max-w-md text-sm text-fg-2">{t('introuvable.texte')}</p>
        <Link to="/">
          <Button>{t('introuvable.retour')}</Button>
        </Link>
      </CardCorps>
    </Card>
  )
}
