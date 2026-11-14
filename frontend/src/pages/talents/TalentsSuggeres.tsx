import { useQuery } from '@tanstack/react-query'
import { Card, CardCorps, CardEntete, SkeletonTexte } from '../../components/ui'
import { ErreurApi } from '../../api/erreurs'
import { mesProjets } from '../../api/projets'
import { suggestionsTalents } from '../../api/talents'
import { estLivre } from '../../lib/priorites'
import type { Competence, TalentSuggere } from '../../types'
import { CarteTalent } from './CarteTalent'

/**
 * Encadré « Talents suggérés » (`GET /users/suggestions`).
 *
 * Invisible si le P1 n'est pas livré, si on n'est propriétaire d'aucun projet
 * (403 du contrat : on n'appelle pas la route), ou si le serveur répond 403.
 */

function correspondances(talent: TalentSuggere, recherchees?: Competence[]): Competence[] {
  if (talent.competences_correspondantes?.length) return talent.competences_correspondantes
  if (!recherchees?.length) return []
  const ids = new Set(recherchees.map((competence) => competence.id))
  return talent.competences.filter((competence) => ids.has(competence.id))
}

export function TalentsSuggeres({
  projetId,
  competencesRecherchees,
  enabled = true,
}: {
  projetId?: number
  competencesRecherchees?: Competence[]
  enabled?: boolean
}) {
  const possedes = useQuery({
    queryKey: ['mes-projets', 'proprietaire', { per_page: 1 }],
    queryFn: () => mesProjets({ role_equipe: 'proprietaire', per_page: 1 }),
    enabled: estLivre('suggestions') && enabled && projetId === undefined,
  })

  const proprietaireDUnProjet =
    projetId !== undefined || (possedes.data !== undefined && possedes.data.meta.total > 0)

  const suggestions = useQuery({
    queryKey: ['suggestions-talents', projetId ?? null],
    queryFn: () => suggestionsTalents({ projet_id: projetId, limit: 6 }),
    enabled: estLivre('suggestions') && enabled && proprietaireDUnProjet,
    retry: (tentatives, erreur) =>
      !(erreur instanceof ErreurApi && (erreur.nonAutorise || erreur.introuvable)) && tentatives < 1,
  })

  if (!estLivre('suggestions') || !enabled) return null
  if (projetId === undefined && possedes.isPending) return null
  if (!proprietaireDUnProjet) return null
  if (suggestions.error instanceof ErreurApi && suggestions.error.nonAutorise) return null

  return (
    <Card>
      <CardEntete titre="Talents suggérés" compteur={suggestions.data?.length} />
      <CardCorps>
        {suggestions.isPending ? (
          <SkeletonTexte lignes={3} />
        ) : suggestions.isError ? (
          <p className="text-sm text-fg-3">Suggestions indisponibles pour le moment.</p>
        ) : suggestions.data.length === 0 ? (
          <p className="text-sm text-fg-3">Aucun talent ne correspond aux compétences recherchées pour l’instant.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {suggestions.data.map((talent) => {
              const commun = correspondances(talent, competencesRecherchees)
              return (
                <li key={talent.id} className="min-w-0">
                  {commun.length > 0 && (
                    <p className="mb-2 text-xs text-fg-3">
                      Correspond : {commun.map((competence) => competence.nom).join(', ')}
                    </p>
                  )}
                  <CarteTalent talent={talent} />
                </li>
              )
            })}
          </ul>
        )}
      </CardCorps>
    </Card>
  )
}
