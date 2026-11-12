import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, CardCorps, FormField, Input, Textarea } from '../../components/ui'
import { creerProjet } from '../../api/projets'
import { definirCompetences, listeCatalogues } from '../../api/profil'
import { ErreurApi } from '../../api/erreurs'
import { useSession } from '../../features/auth/SessionProvider'
import { rafraichirProjets } from '../../lib/cache'
import { competenceCataloguePour, domaineCataloguePour, domainesAffiches, domainesPourEnvoi } from '../../lib/catalogue'
import type { ProjetCreate, StatutProjetCreation } from '../../types'

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
  const { profil, mettreAJourProfil } = useSession()
  const catalogue = useQuery({ queryKey: ['skills'], queryFn: listeCatalogues })

  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [objectifs, setObjectifs] = useState('')
  const [domaines, setDomaines] = useState<string[]>([])
  const [domaineLibre, setDomaineLibre] = useState('')
  const [competences, setCompetences] = useState<number[]>([])
  const [competenceLibre, setCompetenceLibre] = useState(false)
  const [nomCompetenceLibre, setNomCompetenceLibre] = useState('')
  const [membres, setMembres] = useState(5)
  const [statut, setStatut] = useState<StatutProjetCreation>('recrutement')
  const [chargement, setChargement] = useState(false)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)

  function basculerDomaine(domaine: string) {
    setDomaines((prev) =>
      prev.includes(domaine) ? prev.filter((d) => d !== domaine) : [...prev, domaine]
    )
  }

  function basculerCompetence(id: number) {
    setCompetences((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const competencesCatalogue = catalogue.data?.competences ?? []
  const correspondanceDomaine = domaineCataloguePour(domaineLibre)
  const correspondanceCompetence = competenceCataloguePour(nomCompetenceLibre, competencesCatalogue)
  const domainesCases = domainesAffiches(catalogue.data?.domaines, domaines)

  async function assurerCompetenceLibre(): Promise<number[]> {
    const nomSaisi = nomCompetenceLibre.trim()
    if (!competenceLibre || nomSaisi === '') return competences

    const existante = competenceCataloguePour(nomSaisi, competencesCatalogue)
    if (existante) {
      return competences.includes(existante.id) ? competences : [...competences, existante.id]
    }

    const deja = (profil?.competences ?? []).map((comp) => ({
      competence_id: comp.id,
      niveau: comp.niveau,
    }))
    const enregistrees = await definirCompetences({
      competences: [...deja, { nom: nomSaisi, niveau: 'intermediaire' }],
    })
    mettreAJourProfil({ competences: enregistrees })
    const rafraichi = await catalogue.refetch()
    const liste = rafraichi.data?.competences ?? enregistrees
    const creee =
      competenceCataloguePour(nomSaisi, liste) ??
      enregistrees.find((comp) => competenceCataloguePour(nomSaisi, [comp]))
    if (!creee) return competences
    return competences.includes(creee.id) ? competences : [...competences, creee.id]
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    setErreurs({})
    setErreurGlobale(null)

    try {
      const competenceIds = await assurerCompetenceLibre()

      const corps: ProjetCreate = {
        nom,
        description,
        objectifs,
        domaines: domainesPourEnvoi(domaines, domaineLibre) as ProjetCreate['domaines'],
        competence_ids: competenceIds,
        nombre_membres_souhaite: membres,
        statut,
      }

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {domainesCases.map(([valeur, libelle]) => {
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
                <label className={`flex items-center gap-2 text-sm ${!domaines.includes('autre') && domaines.length >= 3 ? 'text-fg-disabled' : 'text-fg-2'}`}>
                  <input
                    type="checkbox"
                    checked={domaines.includes('autre')}
                    disabled={!domaines.includes('autre') && domaines.length >= 3}
                    onChange={() => basculerDomaine('autre')}
                    className="h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
                  />
                  Autre
                </label>
              </div>
              {domaines.includes('autre') && (
                <FormField
                  id="domaine-libre"
                  label="Précise le domaine"
                  aide={
                    correspondanceDomaine
                      ? `Ce domaine existe déjà dans le catalogue : « ${correspondanceDomaine.libelle} ».`
                      : domaineLibre.trim()
                        ? `Ce domaine sera enregistré sous le nom « ${domaineLibre.trim()} ».`
                        : 'Écris le domaine. S’il existe déjà, le nom du catalogue s’affiche.'
                  }
                >
                  <Input
                    id="domaine-libre"
                    value={domaineLibre}
                    onChange={(e) => {
                      const saisie = e.target.value
                      setDomaineLibre(saisie)
                      const connu = domaineCataloguePour(saisie)
                      if (connu && !domaines.includes(connu.valeur) && domaines.length < 3) {
                        setDomaines((prev) => [...prev.filter((d) => d !== 'autre'), connu.valeur, 'autre'].slice(0, 3))
                      }
                    }}
                    placeholder="Ex. agroécologie"
                  />
                </FormField>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fg-1">Compétences recherchées</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {competencesCatalogue.map((comp) => (
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
              <label className="flex items-center gap-2 text-sm text-fg-2">
                <input
                  type="checkbox"
                  checked={competenceLibre}
                  onChange={(e) => {
                    setCompetenceLibre(e.target.checked)
                    setNomCompetenceLibre('')
                  }}
                  className="h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
                />
                Autre — la compétence n’est pas dans la liste
              </label>
              {competenceLibre && (
                <FormField
                  id="competence-libre"
                  label="Nom de la compétence"
                  aide={
                    correspondanceCompetence
                      ? `Cette compétence existe déjà : « ${correspondanceCompetence.nom} ».`
                      : nomCompetenceLibre.trim()
                        ? 'Cette compétence sera ajoutée au catalogue.'
                        : 'Écris le nom. S’il existe déjà (même avec une autre casse), le nom du catalogue s’affiche.'
                  }
                >
                  <Input
                    id="competence-libre"
                    value={nomCompetenceLibre}
                    onChange={(e) => setNomCompetenceLibre(e.target.value)}
                    placeholder="Ex. Rust"
                  />
                </FormField>
              )}
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
