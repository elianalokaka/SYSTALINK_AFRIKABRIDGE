import { useNavigate } from 'react-router'
import { Avatar, Badge, Button, Card, CardCorps, CardEntete } from '../../components/ui'
import { useSession } from '../../features/auth/SessionProvider'
import { nomDePays } from '../../lib/constants'
import {
  LIBELLES_DOMAINE,
  LIBELLES_NIVEAU,
  LIBELLES_ROLE_PROFIL,
  LIBELLES_TYPE_LIEN,
} from '../../lib/labels'

/**
 * « Mon profil » — vue en lecture du compte connecté.
 *
 * Alimenté par la session (`ProfilPrive`) : c'est le SEUL écran qui a le droit
 * d'afficher l'email. Le profil public (`GET /users/{id}`) n'en aura jamais —
 * règle de sécurité du contrat.
 *
 * Les états vides sont assumés : une section sans donnée affiche un libellé
 * discret au lieu de disparaître sans explication.
 */
export function MonProfil() {
  const { profil } = useSession()
  const navigate = useNavigate()

  if (!profil) return null

  const regionPays = [nomDePays(profil.pays), profil.region].filter(Boolean).join(' · ')

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardCorps className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar nom={profil.nom} photoUrl={profil.photo_url} taille="lg" className="self-start" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold text-fg-1">{profil.nom}</h1>
              <Badge variante="info">{LIBELLES_ROLE_PROFIL[profil.role_profil]}</Badge>
            </div>

            <p className="mt-1 text-sm text-fg-2">{regionPays || 'Lieu non renseigné'}</p>

            {profil.bio ? (
              <p className="mt-3 text-sm text-fg-1">{profil.bio}</p>
            ) : (
              <p className="mt-3 text-sm text-fg-3">Aucune bio pour l’instant.</p>
            )}

            <p className="mt-3 text-xs text-fg-3">{profil.email}</p>
          </div>

          <div className="shrink-0">
            <Button variante="secondaire" onClick={() => navigate('/profil/modifier')}>
              Modifier mon profil
            </Button>
          </div>
        </CardCorps>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardEntete titre="Domaines d’intérêt" compteur={profil.domaines.length} />
          <CardCorps>
            {profil.domaines.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {profil.domaines.map((domaine) => (
                  <Badge key={domaine} variante="neutre">
                    {LIBELLES_DOMAINE[domaine]}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-fg-3">Aucun domaine d’intérêt.</p>
            )}
          </CardCorps>
        </Card>

        <Card>
          <CardEntete titre="Liens" compteur={profil.liens.length} />
          <CardCorps className="flex flex-col gap-2">
            {profil.liens.length > 0 ? (
              profil.liens.map((lien) => (
                <div key={lien.url} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-fg-2">{LIBELLES_TYPE_LIEN[lien.type]}</span>
                  <a
                    href={lien.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-accent hover:text-accent-hover"
                  >
                    {lien.url}
                  </a>
                </div>
              ))
            ) : (
              <p className="text-sm text-fg-3">Aucun lien.</p>
            )}
          </CardCorps>
        </Card>
      </div>

      <Card>
        <CardEntete titre="Compétences" compteur={profil.competences.length} />
        <CardCorps>
          {profil.competences.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {profil.competences.map((comp) => (
                <li
                  key={comp.id}
                  className="flex items-center justify-between gap-3 border-b border-border-subtle pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="text-fg-1">{comp.nom}</span>
                  <Badge variante="neutre">
                    {comp.niveau ? LIBELLES_NIVEAU[comp.niveau] : 'Non précisé'}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-3">
              Aucune compétence. Ajoute-en pour apparaître dans les recherches de talents.
            </p>
          )}
        </CardCorps>
      </Card>
    </div>
  )
}
