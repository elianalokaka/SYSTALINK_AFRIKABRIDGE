import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardCorps, FormField, Input, Textarea } from '../../components/ui'
import { creerProjet } from '../../api/projets'
import { listeCompetences } from '../../api/profil'
import { ErreurApi } from '../../api/erreurs'
import { rafraichirProjets } from '../../lib/cache'
import { useLibelles } from '../../lib/labels'
import { useI18n } from '../../i18n'
import { useNomCompetence } from '../../lib/competences'
import type { Domaine, ProjetCreate, StatutProjetCreation } from '../../types'

const CLASSE_SELECT = 'h-9 rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'

/**
 * « Créer un projet » — le formulaire reflète EXACTEMENT `ProjetCreate`.
 *
 * Règles du contrat à respecter :
 *   - `domaines` : 1 à 3 (tableau) ;
 *   - `nombre_membres_souhaite` : 2 à 50 ;
 *   - `statut` : uniquement `recrutement` (défaut) ou `en_cours` — `termine`
 *     est REFUSÉ à la création, donc absent du sélecteur ;
 *   - le créateur devient automatiquement `proprietaire`.
 */
export function ProjetCreation() {
  const { t } = useI18n()
  const L = useLibelles()
  const nomComp = useNomCompetence()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const catalogue = useQuery({ queryKey: ['skills'], queryFn: listeCompetences })

  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [objectifs, setObjectifs] = useState('')
  const [domaines, setDomaines] = useState<Domaine[]>([])
  const [competences, setCompetences] = useState<number[]>([])
  const [membres, setMembres] = useState(5)
  const [statut, setStatut] = useState<StatutProjetCreation>('recrutement')
  const [chargement, setChargement] = useState(false)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)

  function basculerDomaine(domaine: Domaine) {
    setDomaines((prev) =>
      prev.includes(domaine) ? prev.filter((d) => d !== domaine) : [...prev, domaine]
    )
  }

  function basculerCompetence(id: number) {
    setCompetences((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setErreurs({})
    setErreurGlobale(null)

    const corps: ProjetCreate = {
      nom,
      description,
      objectifs,
      domaines,
      competence_ids: competences,
      nombre_membres_souhaite: membres,
      statut,
    }

    try {
      const projet = await creerProjet(corps)
      /* Sans ça, le nouveau projet resterait absent des listes pendant 30 s. */
      rafraichirProjets(queryClient)
      navigate(`/projets/${projet.id}`, { replace: true })
    } catch (erreur) {
      if (erreur instanceof ErreurApi && erreur.validation) {
        setErreurs(erreur.erreursParChamp())
      } else {
        setErreurGlobale(erreur instanceof ErreurApi ? erreur.message : t('erreur.survenue'))
      }
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-fg-1">{t('projetCreation.titre')}</h1>
        <p className="mt-1 text-sm text-fg-2">
          {t('projetCreation.intro')}
        </p>
      </div>

      <Card>
        <CardCorps>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <FormField id="nom" label={t('projetCreation.nom')} obligatoire erreur={erreurs.nom}>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder={t('projetCreation.nomExemple')}
                invalide={Boolean(erreurs.nom)}
              />
            </FormField>

            <FormField
              id="description"
              label={t('projetCreation.description')}
              obligatoire
              aide={t('projetCreation.descriptionAide')}
              erreur={erreurs.description}
            >
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder={t('projetCreation.descriptionExemple')}
              />
            </FormField>

            <FormField
              id="objectifs"
              label={t('projetCreation.objectifs')}
              obligatoire
              aide={t('projetCreation.objectifsAide')}
              erreur={erreurs.objectifs}
            >
              <Textarea
                id="objectifs"
                value={objectifs}
                onChange={(e) => setObjectifs(e.target.value)}
                rows={3}
                placeholder={t('projetCreation.objectifsExemple')}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="membres"
                label={t('projetCreation.membres')}
                obligatoire
                aide={t('projetCreation.membresAide')}
                erreur={erreurs.nombre_membres_souhaite}
              >
                <Input
                  id="membres"
                  type="number"
                  min={2}
                  max={50}
                  value={membres}
                  onChange={(e) => setMembres(Number(e.target.value))}
                />
              </FormField>

              <FormField id="statut" label={t('projetCreation.statut')} obligatoire erreur={erreurs.statut}>
                <select
                  id="statut"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutProjetCreation)}
                  className={`${CLASSE_SELECT} w-full`}
                >
                  <option value="recrutement">{t('projetCreation.statutOuvert')}</option>
                  <option value="en_cours">{L.statutProjet.en_cours}</option>
                </select>
              </FormField>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-fg-1">{t('projetCreation.domaines')}</span>
                <span className="text-xs text-fg-3">{domaines.length}/3</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {L.listeDomaines.map(([valeur, libelle]) => {
                  const coche = domaines.includes(valeur)
                  const desactive = !coche && domaines.length >= 3
                  return (
                    <label
                      key={valeur}
                      className={`flex items-center gap-2 text-sm ${desactive ? 'text-fg-disabled' : 'text-fg-2'}`}
                    >
                      <input
                        type="checkbox"
                        checked={coche}
                        disabled={desactive}
                        onChange={() => basculerDomaine(valeur)}
                        className="h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
                      />
                      {libelle}
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fg-1">{t('projetCreation.competences')}</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(catalogue.data ?? []).map((comp) => (
                  <label key={comp.id} className="flex items-center gap-2 text-sm text-fg-2">
                    <input
                      type="checkbox"
                      checked={competences.includes(comp.id)}
                      onChange={() => basculerCompetence(comp.id)}
                      className="h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
                    />
                    {nomComp(comp.nom)}
                  </label>
                ))}
              </div>
            </div>

            {erreurGlobale && (
              <p role="alert" className="rounded-md border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
                {erreurGlobale}
              </p>
            )}

            <Button type="submit" chargement={chargement}>
              {chargement ? t('projetCreation.boutonEnCours') : t('projetCreation.bouton')}
            </Button>
          </form>
        </CardCorps>
      </Card>
    </div>
  )
}
