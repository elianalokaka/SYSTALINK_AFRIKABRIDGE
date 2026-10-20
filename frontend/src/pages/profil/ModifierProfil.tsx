import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Button, Card, CardCorps, CardEntete, FormField, Input, Textarea } from '../../components/ui'
import { definirCompetences, envoyerPhoto, listeCompetences, modifierProfil } from '../../api/profil'
import { ErreurApi } from '../../api/erreurs'
import { useSession } from '../../features/auth/SessionProvider'
import { PAYS } from '../../lib/constants'
import {
  LISTE_DOMAINES,
  LISTE_NIVEAUX,
  LISTE_ROLES_PROFIL,
  LISTE_TYPES_LIEN,
  type TypeLien,
} from '../../lib/labels'
import type { CompetenceUtilisateur, Domaine, LienProfil, NiveauCompetence, RoleProfil } from '../../types'

/**
 * Base commune des `<select>`.
 *
 * ⚠️ AUCUNE largeur ici, volontairement. Une largeur en dur (`w-full`) entrait
 * en conflit avec celle ajoutée par l'appelant (`w-36`) : les deux classes
 * coexistaient, `w-full` gagnait, et le texte placé à côté était écrasé à zéro
 * — c'est exactement ce qui faisait disparaître le nom des compétences.
 * Chaque usage décide donc SA largeur.
 */
const CLASSE_SELECT =
  'h-9 rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1'

/** Variante pleine largeur, pour un champ seul dans sa colonne. */
const CLASSE_SELECT_PLEIN = `${CLASSE_SELECT} w-full`

/**
 * « Modifier mon profil » — trois blocs indépendants, chacun avec son propre
 * envoi et son propre état d'erreur :
 *   1. Informations  → `PATCH /users/me`
 *   2. Compétences   → `PUT /users/me/skills` (REMPLACE la liste)
 *   3. Photo         → `POST /users/me/photo` (2 Mo max)
 *
 * C'est la démonstration concrète du câblage FormField/erreurs documenté dans
 * le kit, et des règles d'upload du contrat.
 */
export function ModifierProfil() {
  const { profil, mettreAJourProfil } = useSession()
  const navigate = useNavigate()

  /* ── 1. Informations ──────────────────────────────────────────────────── */
  const [nom, setNom] = useState(profil?.nom ?? '')
  const [bio, setBio] = useState(profil?.bio ?? '')
  const [pays, setPays] = useState(profil?.pays ?? '')
  const [region, setRegion] = useState(profil?.region ?? '')
  const [role, setRole] = useState<RoleProfil>(profil?.role_profil ?? 'autre')
  const [domaines, setDomaines] = useState<Domaine[]>(profil?.domaines ?? [])
  const [liens, setLiens] = useState<LienProfil[]>(profil?.liens ?? [])
  const [chargementInfo, setChargementInfo] = useState(false)
  const [erreursInfo, setErreursInfo] = useState<Record<string, string>>({})

  /* ── 2. Compétences ───────────────────────────────────────────────────── */
  /* Le type généré rend les champs de `Competence` optionnels (le contrat n'a
     PAS de `required` sur ce schéma, contrairement à `LienProfil`). Notre alias
     `CompetenceUtilisateur` les rend requis : une compétence en RÉPONSE est
     toujours complète. L'assertion ci-dessous est donc sûre, pas une rustine. */
  const [competences, setCompetences] = useState<CompetenceUtilisateur[]>(
    (profil?.competences ?? []) as CompetenceUtilisateur[]
  )
  const [selection, setSelection] = useState('')
  const [niveauAjout, setNiveauAjout] = useState<NiveauCompetence>('intermediaire')
  const [chargementSkills, setChargementSkills] = useState(false)
  const [erreurSkills, setErreurSkills] = useState<string | null>(null)
  const catalogue = useQuery({ queryKey: ['skills'], queryFn: listeCompetences })

  /* ── 3. Photo ─────────────────────────────────────────────────────────── */
  const [fichier, setFichier] = useState<File | null>(null)
  const [apercu, setApercu] = useState<string | null>(null)
  const [chargementPhoto, setChargementPhoto] = useState(false)
  const [erreurPhoto, setErreurPhoto] = useState<string | null>(null)

  if (!profil) return null

  /* ── Handlers : Informations ──────────────────────────────────────────── */
  function basculerDomaine(domaine: Domaine) {
    setDomaines((prev) =>
      prev.includes(domaine) ? prev.filter((d) => d !== domaine) : [...prev, domaine]
    )
  }

  function changerLien(index: number, patch: Partial<LienProfil>) {
    setLiens((prev) => prev.map((lien, i) => (i === index ? { ...lien, ...patch } : lien)))
  }

  function ajouterLien() {
    setLiens((prev) => [...prev, { type: 'github', url: '' }])
  }

  async function onEnregistrerInformations(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargementInfo(true)
    setErreursInfo({})

    try {
      const maj = await modifierProfil({
        nom,
        bio: bio || null,
        pays,
        region: region || null,
        role_profil: role,
        domaines,
        liens: liens.filter((lien) => lien.url.trim() !== ''),
      })
      mettreAJourProfil(maj)
      navigate('/profil', { replace: true })
    } catch (erreur) {
      if (erreur instanceof ErreurApi && erreur.validation) {
        setErreursInfo(erreur.erreursParChamp())
      }
    } finally {
      setChargementInfo(false)
    }
  }

  /* ── Handlers : Compétences ───────────────────────────────────────────── */
  const disponibles = (catalogue.data ?? []).filter(
    (comp) => !competences.some((deja) => deja.id === comp.id)
  )

  function ajouterCompetence() {
    const id = Number(selection)
    const source = (catalogue.data ?? []).find((comp) => comp.id === id)
    if (!source) return
    setCompetences((prev) => [...prev, { ...source, niveau: niveauAjout }])
    setSelection('')
  }

  function changerNiveau(id: number, niveau: NiveauCompetence | null) {
    setCompetences((prev) => prev.map((comp) => (comp.id === id ? { ...comp, niveau } : comp)))
  }

  function retirerCompetence(id: number) {
    setCompetences((prev) => prev.filter((comp) => comp.id !== id))
  }

  async function onEnregistrerCompetences() {
    setChargementSkills(true)
    setErreurSkills(null)
    try {
      await definirCompetences({
        competences: competences.map((comp) => ({ competence_id: comp.id, niveau: comp.niveau })),
      })
      mettreAJourProfil({ competences })
    } catch (erreur) {
      setErreurSkills(erreur instanceof ErreurApi ? erreur.message : 'Une erreur est survenue.')
    } finally {
      setChargementSkills(false)
    }
  }

  /* ── Handlers : Photo ─────────────────────────────────────────────────── */
  function onChoisirFichier(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFichier(f)
    setApercu(f ? URL.createObjectURL(f) : null)
    setErreurPhoto(null)
  }

  async function onEnregistrerPhoto() {
    if (!fichier) return
    setChargementPhoto(true)
    setErreurPhoto(null)
    try {
      const photoUrl = await envoyerPhoto(fichier)
      mettreAJourProfil({ photo_url: photoUrl })
      setFichier(null)
      setApercu(null)
    } catch (erreur) {
      if (erreur instanceof ErreurApi && erreur.validation) {
        setErreurPhoto(erreur.messageChamp('photo') ?? erreur.message)
      } else {
        setErreurPhoto(erreur instanceof ErreurApi ? erreur.message : 'Une erreur est survenue.')
      }
    } finally {
      setChargementPhoto(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-fg-1">Modifier mon profil</h1>
        <p className="mt-1 text-sm text-fg-2">Les changements sont appliqués par bloc.</p>
      </div>

      {/* 1. Informations */}
      <Card>
        <CardEntete titre="Informations" />
        <CardCorps>
          <form onSubmit={onEnregistrerInformations} className="flex flex-col gap-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="nom" label="Nom complet" obligatoire erreur={erreursInfo.nom}>
                <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} invalide={Boolean(erreursInfo.nom)} />
              </FormField>

              <FormField id="region" label="Ville ou région" erreur={erreursInfo.region}>
                <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Dakar" />
              </FormField>
            </div>

            <FormField id="bio" label="Bio" aide="500 caractères maximum." erreur={erreursInfo.bio}>
              <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="pays" label="Pays" obligatoire erreur={erreursInfo.pays}>
                <select id="pays" value={pays} onChange={(e) => setPays(e.target.value)} className={CLASSE_SELECT_PLEIN}>
                  {PAYS.map((p) => (
                    <option key={p.code} value={p.code}>{p.nom}</option>
                  ))}
                </select>
              </FormField>

              <FormField id="role" label="Rôle" obligatoire erreur={erreursInfo.role_profil}>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value as RoleProfil)} className={CLASSE_SELECT_PLEIN}>
                  {LISTE_ROLES_PROFIL.map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>{libelle}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-fg-1">Domaines d’intérêt</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {LISTE_DOMAINES.map(([valeur, libelle]) => (
                  <label key={valeur} className="flex items-center gap-2 text-sm text-fg-2">
                    <input
                      type="checkbox"
                      checked={domaines.includes(valeur)}
                      onChange={() => basculerDomaine(valeur)}
                      className="h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
                    />
                    {libelle}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-fg-1">Liens</span>
                <Button type="button" taille="sm" variante="discret" onClick={ajouterLien}>
                  Ajouter un lien
                </Button>
              </div>
              <p className="text-xs text-fg-3">
                Ton GitHub, ton LinkedIn, ton portfolio… Ces liens apparaissent sur ton profil.
              </p>
              {liens.length === 0 && <p className="text-sm text-fg-3">Aucun lien.</p>}
              {liens.map((lien, index) => (
                <div key={index} className="flex items-end gap-2">
                  <select
                    aria-label="Type de lien"
                    value={lien.type}
                    onChange={(e) => changerLien(index, { type: e.target.value as TypeLien })}
                    className={`${CLASSE_SELECT} w-32 shrink-0`}
                  >
                    {LISTE_TYPES_LIEN.map(([valeur, libelle]) => (
                      <option key={valeur} value={valeur}>{libelle}</option>
                    ))}
                  </select>
                  <Input
                    aria-label="URL du lien"
                    value={lien.url}
                    onChange={(e) => changerLien(index, { url: e.target.value })}
                    placeholder="https://…"
                    className="min-w-0 flex-1"
                  />
                  <Button type="button" taille="sm" variante="discret" onClick={() => setLiens((prev) => prev.filter((_, i) => i !== index))}>
                    Retirer
                  </Button>
                </div>
              ))}
            </div>

            <Button type="submit" chargement={chargementInfo}>
              {chargementInfo ? 'Enregistrement…' : 'Enregistrer les informations'}
            </Button>
          </form>
        </CardCorps>
      </Card>

      {/* 2. Compétences */}
      <Card>
        <CardEntete titre="Compétences" compteur={competences.length} />
        <CardCorps className="flex flex-col gap-4">
          {competences.length === 0 && (
            <p className="text-sm text-fg-3">Aucune compétence pour l’instant.</p>
          )}
          <ul className="flex flex-col gap-2">
            {competences.map((comp) => (
              <li key={comp.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-fg-1">{comp.nom}</span>
                <select
                  aria-label={`Niveau de ${comp.nom}`}
                  value={comp.niveau ?? ''}
                  onChange={(e) =>
                    changerNiveau(comp.id, e.target.value === '' ? null : (e.target.value as NiveauCompetence))
                  }
                  className={`${CLASSE_SELECT} w-36 shrink-0`}
                >
                  {/* Option vide : un niveau non renseigné s'affiche comme tel,
                      au lieu de laisser croire qu'il vaut « Débutant ». */}
                  <option value="">Niveau…</option>
                  {LISTE_NIVEAUX.map(([valeur, libelle]) => (
                    <option key={valeur} value={valeur}>{libelle}</option>
                  ))}
                </select>
                <Button type="button" taille="sm" variante="discret" onClick={() => retirerCompetence(comp.id)}>
                  Retirer
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:items-end">
            <select
              aria-label="Ajouter une compétence"
              value={selection}
              onChange={(e) => setSelection(e.target.value)}
              className={`${CLASSE_SELECT} w-full sm:flex-1`}
            >
              <option value="" disabled>
                {disponibles.length > 0 ? 'Choisir une compétence…' : 'Toutes les compétences sont ajoutées'}
              </option>
              {disponibles.map((comp) => (
                <option key={comp.id} value={comp.id}>{comp.nom}</option>
              ))}
            </select>
            <select
              aria-label="Niveau"
              value={niveauAjout}
              onChange={(e) => setNiveauAjout(e.target.value as NiveauCompetence)}
              className={`${CLASSE_SELECT} w-full shrink-0 sm:w-36`}
            >
              {LISTE_NIVEAUX.map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </select>
            <Button type="button" variante="secondaire" disabled={selection === ''} onClick={ajouterCompetence}>
              Ajouter
            </Button>
          </div>

          {erreurSkills && (
            <p role="alert" className="rounded-md border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
              {erreurSkills}
            </p>
          )}

          <Button type="button" chargement={chargementSkills} disabled={chargementSkills} onClick={onEnregistrerCompetences}>
            {chargementSkills ? 'Enregistrement…' : 'Enregistrer mes compétences'}
          </Button>
        </CardCorps>
      </Card>

      {/* 3. Photo */}
      <Card>
        <CardEntete titre="Photo de profil" />
        <CardCorps className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Avatar nom={profil.nom} photoUrl={apercu ?? profil.photo_url} taille="lg" />
            <div className="flex flex-col gap-1 text-sm text-fg-2">
              <span>jpg, png ou webp — 2 Mo maximum.</span>
              {fichier && <span className="text-fg-1">{fichier.name}</span>}
            </div>
          </div>

          <input
            type="file"
            aria-label="Choisir une photo de profil"
            accept="image/jpeg,image/png,image/webp"
            onChange={onChoisirFichier}
            className="text-sm text-fg-2 file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-surface-2 file:px-3 file:py-1.5 file:text-sm file:text-fg-1 file:transition-colors hover:file:bg-surface-3"
          />

          {erreurPhoto && (
            <p role="alert" className="rounded-md border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
              {erreurPhoto}
            </p>
          )}

          <Button
            type="button"
            variante="secondaire"
            chargement={chargementPhoto}
            disabled={!fichier}
            onClick={onEnregistrerPhoto}
          >
            {chargementPhoto ? 'Envoi…' : 'Enregistrer la photo'}
          </Button>
        </CardCorps>
      </Card>
    </div>
  )
}
