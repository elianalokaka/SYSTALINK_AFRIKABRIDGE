import { Link } from 'react-router'
import { Button, Card, CardCorps } from '../components/ui'

/**
 * Page 404 : une adresse inconnue n'est plus redirigée en silence vers l'accueil
 * (l'utilisateur ne comprenait pas pourquoi il atterrissait là). On le lui dit,
 * et on lui propose une issue.
 */
export function PageIntrouvable() {
  return (
    <Card>
      <CardCorps className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-fg-1">Page introuvable</h1>
        <p className="max-w-md text-sm text-fg-2">L'adresse demandée n'existe pas ou a changé.</p>
        <Link to="/">
          <Button>Retour à l'accueil</Button>
        </Link>
      </CardCorps>
    </Card>
  )
}
