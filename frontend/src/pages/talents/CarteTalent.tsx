import { Avatar, Badge, Card, CardCorps } from '../../components/ui'
import { nomDePays } from '../../lib/constants'
import { LIBELLES_ROLE_PROFIL } from '../../lib/labels'
import type { Talent } from '../../types'

/**
 * Carte d'un talent en liste. Comme `CarteProjet`, elle n'est pas cliquable en
 * soi : la page qui la rend l'enveloppe dans un `<Link>`.
 *
 * `followers_count` / `is_following` ne sont PAS affichés : le follow est P1,
 * ces champs valent 0/false tant qu'il n'est pas livré (cf. ASSUMPTIONS.md).
 */
export function CarteTalent({ talent }: { talent: Talent }) {
  const lieu = [talent.region, nomDePays(talent.pays)].filter(Boolean).join(', ')

  return (
    <Card className="h-full transition-colors hover:border-border-strong">
      <CardCorps className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar nom={talent.nom} photoUrl={talent.photo_url} taille="md" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-fg-1">{talent.nom}</h3>
            <p className="truncate text-xs text-fg-2">{lieu}</p>
          </div>
        </div>

        <div>
          <Badge variante="info">{LIBELLES_ROLE_PROFIL[talent.role_profil]}</Badge>
        </div>

        {talent.bio_courte && <p className="line-clamp-2 break-words text-sm text-fg-2">{talent.bio_courte}</p>}

        {talent.competences.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 border-t border-border-subtle pt-3">
            {talent.competences.slice(0, 4).map((comp) => (
              <Badge key={comp.id} variante="neutre">
                {comp.nom}
              </Badge>
            ))}
            {talent.competences.length > 4 && (
              <span className="self-center text-xs text-fg-3">+{talent.competences.length - 4}</span>
            )}
          </div>
        )}
      </CardCorps>
    </Card>
  )
}
