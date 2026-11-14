import { Link } from 'react-router'
import { Avatar, Badge, Card, CardCorps } from '../../components/ui'
import { useNomDePays } from '../../lib/pays'
import { useLibelles } from '../../lib/labels'
import { estLivre } from '../../lib/priorites'
import type { Talent } from '../../types'
import { BoutonSuivre } from './BoutonSuivre'
import { useI18n } from '../../i18n'
import { useNomCompetence } from '../../lib/competences'

/**
 * Carte d'un talent en liste.
 *
 * Toute la carte est cliquable (motif du « lien étiré » : le `<Link>` du nom
 * couvre la carte via `after:absolute`), sans envelopper la carte entière dans
 * un `<a>` : un bouton « Suivre » DANS un lien serait du HTML invalide et
 * inaccessible. Le pied de carte passe au-dessus du lien (`relative z-10`).
 * `isolate` confine ce z-index à la carte : sans lui, le bouton passait par-dessus
 * l'en-tête collant de l'application au défilement.
 *
 * `followers_count` / `is_following` ne sont affichés que si le suivi est livré
 * (`priorites.follow`) : sinon ils valent 0/false et afficher « 0 » mentirait
 * (cf. ASSUMPTIONS.md A-10).
 */
export function CarteTalent({ talent }: { talent: Talent }) {
  const L = useLibelles()
  const { t } = useI18n()
  const nomComp = useNomCompetence()
  const nomDePays = useNomDePays()
  const lieu = [talent.region, nomDePays(talent.pays)].filter(Boolean).join(', ')

  return (
    <Card className="relative isolate h-full transition-colors hover:border-border-strong">
      <CardCorps className="flex h-full flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar nom={talent.nom} photoUrl={talent.photo_url} taille="md" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-fg-1">
              <Link
                to={`/talents/${talent.id}`}
                className="after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
              >
                {talent.nom}
              </Link>
            </h2>
            <p className="truncate text-xs text-fg-2">{lieu}</p>
          </div>
        </div>

        <div>
          <Badge variante="info">{L.role[talent.role_profil]}</Badge>
        </div>

        {talent.bio_courte && <p className="line-clamp-2 break-words text-sm text-fg-2">{talent.bio_courte}</p>}

        {talent.competences.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 border-t border-border-subtle pt-3">
            {talent.competences.slice(0, 4).map((comp) => (
              <Badge key={comp.id} variante="neutre">
                {nomComp(comp.nom)}
              </Badge>
            ))}
            {talent.competences.length > 4 && (
              <span className="self-center text-xs text-fg-3">+{talent.competences.length - 4}</span>
            )}
          </div>
        )}

        {estLivre('follow') && (
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
            <span className="text-xs tabular-nums text-fg-3">{t('reseau.abonnes', { count: talent.followers_count })}</span>
            <BoutonSuivre membre={talent} />
          </div>
        )}
      </CardCorps>
    </Card>
  )
}
