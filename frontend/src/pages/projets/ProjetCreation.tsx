import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardCorps, FormField, Input, Textarea } from '../../components/ui'
import { creerProjet } from '../../api/projets'
import { listeCompetences } from '../../api/profil'
import { ErreurApi } from '../../api/erreurs'
import { rafraichirProjets } from '../../lib/cache'
import { LISTE_DOMAINES } from '../../lib/labels'
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
        setErreurGlobale(erreur instanceof ErreurApi ? erreur.message : 'Une erreur est survenue.')
      }
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-fg-1">Créer un projet</h1>
        <p className="mt-1 text-sm text-fg-2">
          Décris ton idée et les compétences que tu recherches. Tu deviendras automatiquement propriétaire.
        </p>
      </div>

      <Card>
        <CardCorps>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <FormField id="nom" label="Nom du projet" obligatoire erreur={erreurs.nom}>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Smart Agriculture RDC"
                invalide={Boolean(erreurs.nom)}
              />
            </FormField>

            <FormField
              id="description"
              label="Description"
              obligatoire
              aide="3000 caractères maximum."
              erreur={erreurs.description}
            >
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Quel problème ton projet résout-il ?"
              />
            </FormField>

            <FormField
              id="objectifs"
              label="Objectifs"
              obligatoire
              aide="2000 caractères maximum."
              erreur={erreurs.objectifs}
            >
              <Textarea
                id="objectifs"
                value={objectifs}
                onChange={(e) => setObjectifs(e.target.value)}
                rows={3}
                placeholder="Que veux-tu accomplir concrètement ?"
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="membres"
                label="Membres recherchés"
                obligatoire
                aide="Entre 2 et 50."
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

              <FormField id="statut" label="Statut" obligatoire erreur={erreurs.statut}>
                <select
                  id="statut"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutProjetCreation)}
                  className={`${CLASSE_SELECT} w-full`}
                >
                  <option value="recrutement">Ouvert — je recrute</option>
                  <option value="en_cours">En cours</option>
                </select>
              </FormField>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-fg-1">Domaines</span>
                <span className="text-xs text-fg-3">{domaines.length}/3</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {LISTE_DOMAINES.map(([valeur, libelle]) => {
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
              <span className="text-sm font-medium text-fg-1">Compétences recherchées</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(catalogue.data ?? []).map((comp) => (
                  <label key={comp.id} className="flex items-center gap-2 text-sm text-fg-2">
                    <input
                      type="checkbox"
                      checked={competences.includes(comp.id)}
                      onChange={() => basculerCompetence(comp.id)}
                      className="h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
                    />
                    {comp.nom}
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
              {chargement ? 'Création…' : 'Créer le projet'}
            </Button>
          </form>
        </CardCorps>
      </Card>
    </div>
  )
}
