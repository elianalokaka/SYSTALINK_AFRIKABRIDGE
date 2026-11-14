import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, CardCorps, FormField, Input, Textarea } from '../../components/ui'
import { creerRessource, modifierRessource } from '../../api/ressources'
import { listeCompetences } from '../../api/profil'
import { mesProjets } from '../../api/projets'
import { ErreurApi, messageErreur } from '../../api/erreurs'
import { rafraichirRessources } from '../../lib/cache'
import { useLibelles } from '../../lib/labels'
import type { Ressource, TypeRessource, VisibiliteRessource } from '../../types'
import { useNomCompetence } from '../../lib/competences'
import { useI18n } from '../../i18n'
import { champsDuType, EXTENSIONS_FICHIER, TAILLE_MAX_FICHIER } from './outils'

const CLASSE_SELECT = 'h-9 w-full rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'
const LANGAGES = ['php', 'javascript', 'typescript', 'python', 'java', 'sql', 'bash', 'html', 'css']

/**
 * Formulaire « Partager une ressource » (création) et « Modifier » (édition).
 *
 * Création : tous les champs, selon le type choisi.
 * Édition  : le contrat (`RessourceUpdate`) ne permet de changer NI le type, NI
 *            le fichier, NI la visibilité — ces champs ne sont donc pas proposés.
 *
 * `visibilite` n'est envoyée QUE si l'utilisateur partage hors de son équipe :
 * dans tous les autres cas on l'omet et le serveur décide (AGENTS.md § 2).
 */
export function FormulaireRessource({ ressource }: { ressource?: Ressource }) {
  const { t } = useI18n()
  const L = useLibelles()
  const nomComp = useNomCompetence()
  const edition = ressource !== undefined
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [params] = useSearchParams()

  const [type, setType] = useState<TypeRessource>(ressource?.type ?? 'lien')
  const [titre, setTitre] = useState(ressource?.titre ?? '')
  const [description, setDescription] = useState(ressource?.description ?? '')
  const [url, setUrl] = useState(ressource?.url ?? '')
  const [code, setCode] = useState(ressource?.contenu_code ?? '')
  const [langage, setLangage] = useState(ressource?.langage ?? '')
  const [fichier, setFichier] = useState<File | null>(null)
  const [competences, setCompetences] = useState<number[]>(ressource?.competences.map((c) => c.id) ?? [])
  const [projetId, setProjetId] = useState(params.get('projet') ?? '')
  const [partagerHorsEquipe, setPartagerHorsEquipe] = useState(false)

  const [chargement, setChargement] = useState(false)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)

  const catalogue = useQuery({ queryKey: ['skills'], queryFn: listeCompetences })
  const projets = useQuery({
    queryKey: ['mes-projets', 'formulaire-ressource'],
    queryFn: () => mesProjets({ per_page: 50 }),
    enabled: !edition,
  })

  const champs = champsDuType(type)

  function choisirFichier(f: File | null) {
    setErreurs((e) => ({ ...e, fichier: '' }))
    if (!f) return setFichier(null)
    const extension = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!EXTENSIONS_FICHIER.includes(extension)) {
      setFichier(null)
      return setErreurs((e) => ({ ...e, fichier: t('formRessource.formatsAcceptes') }))
    }
    if (f.size > TAILLE_MAX_FICHIER) {
      setFichier(null)
      return setErreurs((e) => ({ ...e, fichier: t('formRessource.fichierTropGros') }))
    }
    setFichier(f)
  }

  function basculerCompetence(id: number) {
    setCompetences((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreurs({})
    setErreurGlobale(null)

    if (!titre.trim()) return setErreurs({ titre: t('formRessource.titreObligatoire') })
    if (!edition && type === 'document' && !fichier) {
      return setErreurs({ fichier: t('formRessource.fichierObligatoire') })
    }

    setChargement(true)
    try {
      let resultat: Ressource
      if (edition) {
        resultat = await modifierRessource(ressource.id, {
          titre: titre.trim(),
          description: description.trim() || null,
          ...(champs.url ? { url: url.trim() || null } : {}),
          ...(champs.code ? { contenu_code: code || null, langage: langage.trim() || null } : {}),
          competence_ids: competences,
        })
      } else {
        const visibilite: VisibiliteRessource | undefined =
          projetId && partagerHorsEquipe ? 'publique' : undefined
        resultat = await creerRessource({
          type,
          titre: titre.trim(),
          description: description.trim() || null,
          url: champs.url ? url.trim() || null : null,
          contenu_code: champs.code ? code || null : null,
          langage: champs.code ? langage.trim() || null : null,
          fichier: champs.fichier ? fichier : null,
          projet_id: projetId ? Number(projetId) : null,
          visibilite,
          competence_ids: competences,
        })
      }
      rafraichirRessources(queryClient)
      navigate(`/ressources/${resultat.id}`, { replace: true })
    } catch (erreur) {
      if (erreur instanceof ErreurApi && erreur.validation) {
        setErreurs(erreur.erreursParChamp())
      } else {
        setErreurGlobale(
          messageErreur(erreur, {
            403: t('formRessource.interdit'),
            413: t('formRessource.tropVolumineux'),
          })
        )
      }
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={edition ? `/ressources/${ressource.id}` : '/ressources'} className="mb-3 inline-flex min-h-9 items-center text-sm text-fg-2 hover:text-fg-1">
          ← {edition ? t('formRessource.retourRessource') : t('biblio.titre')}
        </Link>
        <h1 className="text-lg font-semibold text-fg-1">
          {edition ? t('formRessource.titreEdition') : t('formRessource.titreCreation')}
        </h1>
        <p className="mt-1 text-sm text-fg-2">
          {edition
            ? t('formRessource.introEdition')
            : t('formRessource.introCreation')}
        </p>
      </div>

      <Card>
        <CardCorps>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {edition ? (
              <div className="flex items-center gap-2 text-sm text-fg-2">
                {t('formRessource.type')}<Badge variante="accent">{L.typeRessource[ressource.type]}</Badge>
              </div>
            ) : (
              <FormField id="type" label={t('formRessource.typeLabel')} obligatoire erreur={erreurs.type}>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as TypeRessource)
                    setErreurs({})
                  }}
                  className={CLASSE_SELECT}
                >
                  {L.listeTypesRessource.map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>
                      {libelle}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField id="titre" label={t('formRessource.titre')} obligatoire aide={t('formRessource.titreAide')} erreur={erreurs.titre}>
              <Input id="titre" value={titre} maxLength={200} onChange={(e) => setTitre(e.target.value)} />
            </FormField>

            <FormField
              id="description"
              label={t('formRessource.description')}
              aide={t('formRessource.descriptionAide')}
              erreur={erreurs.description}
            >
              <Textarea
                id="description"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('formRessource.descriptionExemple')}
              />
            </FormField>

            {champs.url && (
              <FormField
                id="url"
                label={t('formRessource.url')}
                obligatoire={champs.urlObligatoire}
                aide={t('formRessource.urlAide')}
                erreur={erreurs.url}
              >
                <Input
                  id="url"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </FormField>
            )}

            {champs.code && (
              <>
                <FormField id="langage" label={t('formRessource.langage')} erreur={erreurs.langage}>
                  <Input
                    id="langage"
                    list="langages"
                    placeholder={t('formRessource.langageExemple')}
                    value={langage}
                    onChange={(e) => setLangage(e.target.value)}
                  />
                  <datalist id="langages">
                    {LANGAGES.map((l) => (
                      <option key={l} value={l} />
                    ))}
                  </datalist>
                </FormField>
                <FormField
                  id="code"
                  label={t('formRessource.code')}
                  aide={t('formRessource.codeCompteur', { n: code.length })}
                  erreur={erreurs.contenu_code}
                >
                  <Textarea
                    id="code"
                    rows={10}
                    maxLength={20000}
                    spellCheck={false}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-xs"
                  />
                </FormField>
              </>
            )}

            {champs.fichier && !edition && (
              <FormField
                id="fichier"
                label={t('formRessource.fichier')}
                obligatoire
                aide={t('formRessource.fichierAide')}
                erreur={erreurs.fichier}
              >
                <input
                  id="fichier"
                  type="file"
                  accept={EXTENSIONS_FICHIER.map((x) => `.${x}`).join(',')}
                  onChange={(e) => choisirFichier(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-fg-2 file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border file:border-border-strong file:bg-surface-3 file:px-3 file:text-sm file:text-fg-1"
                />
                {fichier && (
                  <p className="mt-1 text-xs text-fg-3">
                    {t('formRessource.fichierTaille', { nom: fichier.name, taille: (fichier.size / 1024 / 1024).toFixed(2) })}
                  </p>
                )}
              </FormField>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fg-1">{t('formRessource.competences')}</span>
              <p className="text-xs text-fg-3">{t('formRessource.competencesAide')}</p>
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
              {erreurs.competence_ids && <p className="text-xs text-danger">{erreurs.competence_ids}</p>}
            </div>

            {!edition && (
              <FormField
                id="projet"
                label={t('formRessource.ouPartager')}
                erreur={erreurs.projet_id}
                aide={t('formRessource.ouPartagerAide')}
              >
                <select
                  id="projet"
                  value={projetId}
                  onChange={(e) => {
                    setProjetId(e.target.value)
                    setPartagerHorsEquipe(false)
                  }}
                  className={CLASSE_SELECT}
                >
                  <option value="">{t('formRessource.bibliothequePublique')}</option>
                  {(projets.data?.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {t('formRessource.projetNom', { nom: p.nom })}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            {!edition && projetId && (
              <label className="flex items-start gap-2 text-sm text-fg-2">
                <input
                  type="checkbox"
                  checked={partagerHorsEquipe}
                  onChange={(e) => setPartagerHorsEquipe(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
                />
                <span>
                  {t('formRessource.rendrePublique1')}<strong className="font-medium text-fg-1">{t('formRessource.rendrePublique2')}</strong>{t('formRessource.rendrePublique3')}
                  {erreurs.visibilite && <span className="block text-xs text-danger">{erreurs.visibilite}</span>}
                </span>
              </label>
            )}

            {erreurGlobale && (
              <p role="alert" className="rounded-md border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
                {erreurGlobale}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variante="secondaire"
                onClick={() => navigate(edition ? `/ressources/${ressource.id}` : '/ressources')}
              >
                {t('commun.annuler')}
              </Button>
              <Button type="submit" chargement={chargement}>
                {edition ? t('formRessource.enregistrer') : t('formRessource.publier')}
              </Button>
            </div>
          </form>
        </CardCorps>
      </Card>
    </div>
  )
}
