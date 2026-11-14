import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardCorps, EmptyState, FormField, Input, SkeletonTexte, Textarea } from '../../components/ui'
import { detailProjet, modifierProjet } from '../../api/projets'
import { ErreurApi } from '../../api/erreurs'
import { rafraichirProjets } from '../../lib/cache'
import type { Projet, StatutProjet } from '../../types'
import { useI18n } from '../../i18n'
import { useLibelles } from '../../lib/labels'

const CLASSE_SELECT = 'h-9 rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'

/**
 * « Modifier un projet » — réservé au propriétaire (Policy côté backend).
 *
 * C'est ici que vit la clôture d'un projet : passer à `termine` pose
 * automatiquement `date_fin` et `progression = 100` (règle du contrat), et
 * c'est DÉFINITIF — le contrat interdit de quitter `termine`.
 */
export function ProjetEdition() {
  const { t } = useI18n()
  const { id } = useParams()
  const navigate = useNavigate()
  const requete = useQuery({
    queryKey: ['projet', id],
    queryFn: () => detailProjet(Number(id)),
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
        titre={t('projetEdition.introuvable')}
        action={<Button variante="secondaire" onClick={() => navigate('/projets')}>{t('projetEdition.retour')}</Button>}
      />
    )
  }

  return (
    <FormulaireEdition
      projet={requete.data}
      onEnregistre={() => navigate(`/projets/${id}`, { replace: true })}
    />
  )
}

function FormulaireEdition({ projet, onEnregistre }: { projet: Projet; onEnregistre: () => void }) {
  const { t } = useI18n()
  const L = useLibelles()
  const queryClient = useQueryClient()
  const [nom, setNom] = useState(projet.nom)
  const [description, setDescription] = useState(projet.description)
  const [objectifs, setObjectifs] = useState(projet.objectifs)
  const [statut, setStatut] = useState<StatutProjet>(projet.statut)
  const [progression, setProgression] = useState(projet.progression)
  const [lien, setLien] = useState(projet.lien_realisation ?? '')
  const [chargement, setChargement] = useState(false)
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setErreurGlobale(null)

    try {
      await modifierProjet(projet.id, {
        nom,
        description,
        objectifs,
        statut,
        progression,
        lien_realisation: lien.trim() || null,
      })
      rafraichirProjets(queryClient, projet.id)
      onEnregistre()
    } catch (erreur) {
      setErreurGlobale(erreur instanceof ErreurApi ? erreur.message : t('erreur.survenue'))
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-fg-1">{t('projetEdition.titre')}</h1>
        <p className="mt-1 text-sm text-fg-2">
          {t('projetEdition.intro')}
        </p>
      </div>

      <Card>
        <CardCorps>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <FormField id="nom" label={t('projetCreation.nom')} obligatoire>
              <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            </FormField>

            <FormField id="description" label={t('projetCreation.description')} obligatoire>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </FormField>

            <FormField id="objectifs" label={t('projetCreation.objectifs')} obligatoire>
              <Textarea id="objectifs" value={objectifs} onChange={(e) => setObjectifs(e.target.value)} rows={3} />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField id="statut" label={t('projetCreation.statut')} obligatoire>
                <select
                  id="statut"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutProjet)}
                  className={`${CLASSE_SELECT} w-full`}
                >
                  <option value="recrutement">{L.statutProjet.recrutement}</option>
                  <option value="en_cours">{L.statutProjet.en_cours}</option>
                  <option value="termine">{L.statutProjet.termine}</option>
                </select>
              </FormField>

              <FormField id="progression" label={t('projetEdition.progression')} aide={t('projetEdition.progressionAide')}>
                <Input
                  id="progression"
                  type="number"
                  min={0}
                  max={100}
                  value={progression}
                  onChange={(e) => setProgression(Math.min(100, Math.max(0, Number(e.target.value))))}
                />
              </FormField>
            </div>

            <FormField id="lien" label={t('projetEdition.lien')} aide={t('projetEdition.lienAide')}>
              <Input
                id="lien"
                value={lien}
                onChange={(e) => setLien(e.target.value)}
                placeholder="https://…"
              />
            </FormField>

            {erreurGlobale && (
              <p role="alert" className="rounded-md border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
                {erreurGlobale}
              </p>
            )}

            <Button type="submit" chargement={chargement}>
              {chargement ? t('modifierProfil.enregistrement') : t('projetEdition.bouton')}
            </Button>
          </form>
        </CardCorps>
      </Card>
    </div>
  )
}
