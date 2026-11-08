import { Avatar, Badge, Card, CardCorps } from '../../components/ui'
import { LIBELLES_TYPE_RESSOURCE, LIBELLES_VISIBILITE_RESSOURCE } from '../../lib/labels'
import type { Ressource } from '../../types'
import { estLivre } from '../../lib/priorites'
import { libelleCommentaires } from './commentaires'
import { dateCourte } from './outils'

/**
 * Carte d'une ressource en liste. Comme `CarteProjet`, elle n'est pas
 * cliquable en soi : la page qui la rend l'enveloppe dans un `<Link>`.
 */
export function CarteRessource({ ressource }: { ressource: Ressource }) {
  return (
    <Card className="h-full transition-colors hover:border-border-strong">
      <CardCorps className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variante="accent">{LIBELLES_TYPE_RESSOURCE[ressource.type]}</Badge>
          {ressource.visibilite === 'projet' && (
            <Badge variante="info">{LIBELLES_VISIBILITE_RESSOURCE.projet}</Badge>
          )}
        </div>

        <h2 className="line-clamp-2 break-words text-sm font-semibold text-fg-1">{ressource.titre}</h2>

        {ressource.description && (
          <p className="line-clamp-2 break-words text-sm text-fg-2">{ressource.description}</p>
        )}

        {ressource.competences.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ressource.competences.slice(0, 3).map((comp) => (
              <Badge key={comp.id} variante="neutre">
                {comp.nom}
              </Badge>
            ))}
            {ressource.competences.length > 3 && (
              <span className="text-xs text-fg-3">+{ressource.competences.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border-subtle pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar nom={ressource.auteur.nom} photoUrl={ressource.auteur.photo_url} taille="sm" />
            <span className="truncate text-xs text-fg-2">{ressource.auteur.nom}</span>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-fg-3">
            {estLivre('commentaires') && ressource.commentaires_count > 0 && `${libelleCommentaires(ressource.commentaires_count)} · `}
            {dateCourte(ressource.created_at)}
          </span>
        </div>
      </CardCorps>
    </Card>
  )
}
