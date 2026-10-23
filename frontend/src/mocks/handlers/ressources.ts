import { http, HttpResponse } from 'msw'
import {
  catalogueCompetences,
  creerRessourceDb,
  estMembre,
  idUtilisateurConnecte,
  listerRessourcesDb,
  modifierRessourceDb,
  peutGererRessource,
  peutVoirRessource,
  projetParId,
  ressourceParIdDb,
  supprimerRessourceDb,
  type DonneesRessource,
} from '../db'
import type { TypeRessource, VisibiliteRessource } from '../../types'

/**
 * Mocks du module Ressources — fidèles au contrat :
 *   - GET : publiques + celles de MES projets ; `projet_id` ⇒ 403 si non membre ;
 *   - POST : JSON ou multipart ; `document` ⇒ fichier obligatoire ; 10 Mo ⇒ 422 sur `fichier`,
 *     16 Mo ⇒ 413 ; `visibilite` omise ⇒ `projet` si `projet_id`, sinon `publique` ;
 *     `projet` sans `projet_id` ⇒ 422 ; `projet_id` d'un projet dont je ne suis pas membre ⇒ 403 ;
 *   - PATCH / DELETE : auteur OU propriétaire du projet lié (403 sinon).
 */

const TYPES: TypeRessource[] = ['code', 'lien', 'tutoriel', 'api', 'document', 'article', 'autre']
const EXTENSIONS = ['pdf', 'docx', 'zip', 'png', 'jpg', 'jpeg']
const MO = 1024 * 1024

function validation(errors: Record<string, string[]>) {
  return HttpResponse.json({ message: 'The given data was invalid.', errors }, { status: 422 })
}

function paginer<T>(items: T[], page: number, perPage: number) {
  const debut = (page - 1) * perPage
  return {
    data: items.slice(debut, debut + perPage),
    meta: {
      current_page: page,
      per_page: perPage,
      total: items.length,
      last_page: Math.max(1, Math.ceil(items.length / perPage)),
    },
  }
}

function urlValide(valeur: string): boolean {
  try {
    const u = new URL(valeur)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function lireCommeDataUrl(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resolve(lecteur.result as string)
    lecteur.onerror = () => reject(lecteur.error ?? new Error('Lecture du fichier impossible'))
    lecteur.readAsDataURL(fichier)
  })
}

/** Normalise JSON ou multipart en un objet de champs + un éventuel fichier. */
async function lireCorps(request: Request): Promise<{ champs: Record<string, unknown>; fichier: File | null }> {
  if ((request.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    const formulaire = await request.formData()
    const champs: Record<string, unknown> = {}
    for (const [cle, valeur] of formulaire.entries()) {
      if (valeur instanceof File) continue
      if (cle.endsWith('[]')) {
        const nom = cle.slice(0, -2)
        champs[nom] = [...((champs[nom] as string[] | undefined) ?? []), valeur]
      } else {
        champs[cle] = valeur
      }
    }
    const fichier = formulaire.get('fichier')
    return { champs, fichier: fichier instanceof File ? fichier : null }
  }
  return { champs: (await request.json().catch(() => ({}))) as Record<string, unknown>, fichier: null }
}

const texte = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null)

export const handlersRessources = [
  /* Bibliothèque. */
  http.get('/api/v1/resources', ({ request }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const sp = new URL(request.url).searchParams
    const projetId = sp.get('projet_id') ? Number(sp.get('projet_id')) : undefined
    if (projetId !== undefined && !estMembre(projetId, userId)) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const type = sp.get('type') ?? undefined
    if (type && !TYPES.includes(type as TypeRessource)) {
      return validation({ type: ['Type de ressource invalide.'] })
    }

    /* Axios sérialise `competence_ids` en `competence_ids[]=1&competence_ids[]=2`. */
    const competenceIds = sp.getAll('competence_ids[]').map(Number).filter((n) => Number.isInteger(n))
    const page = Math.max(1, Number(sp.get('page') ?? '1') || 1)
    const perPage = Math.min(50, Math.max(1, Number(sp.get('per_page') ?? '15') || 15))

    const liste = listerRessourcesDb(userId, {
      q: sp.get('q') ?? undefined,
      type,
      competence_ids: competenceIds,
      projet_id: projetId,
      auteur_id: sp.get('auteur_id') ? Number(sp.get('auteur_id')) : undefined,
    })
    return HttpResponse.json(paginer(liste, page, perPage), { status: 200 })
  }),

  /* Détail. */
  http.get('/api/v1/resources/:id', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const ressource = ressourceParIdDb(Number(params.id))
    if (!ressource) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (!peutVoirRessource(userId, ressource)) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }
    return HttpResponse.json(ressource, { status: 200 })
  }),

  /* Partager une ressource. */
  http.post('/api/v1/resources', async ({ request }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const { champs, fichier } = await lireCorps(request)

    /* 413 : au-dessus de 16 Mo, Nginx/PHP refuse AVANT la validation. */
    if (fichier && fichier.size > 16 * MO) {
      return HttpResponse.json({ message: 'Payload Too Large.' }, { status: 413 })
    }

    const erreurs: Record<string, string[]> = {}
    const type = champs.type as TypeRessource
    if (!TYPES.includes(type)) erreurs.type = ['Le type est invalide.']

    const titre = texte(champs.titre)
    if (!titre) erreurs.titre = ['Le titre est obligatoire.']
    else if (titre.length > 200) erreurs.titre = ['Le titre ne doit pas dépasser 200 caractères.']

    const description = texte(champs.description)
    if (description && description.length > 2000) erreurs.description = ['La description ne doit pas dépasser 2000 caractères.']

    const url = texte(champs.url)
    if (url && !urlValide(url)) erreurs.url = ["L'URL n'est pas valide (http ou https)."]

    const contenuCode = texte(champs.contenu_code)
    if (contenuCode && contenuCode.length > 20000) erreurs.contenu_code = ['Le code ne doit pas dépasser 20 000 caractères.']

    if (fichier) {
      const extension = fichier.name.split('.').pop()?.toLowerCase() ?? ''
      if (!EXTENSIONS.includes(extension)) erreurs.fichier = ['Le fichier doit être un pdf, docx, zip, png ou jpg.']
      else if (fichier.size > 10 * MO) erreurs.fichier = ['Le fichier ne doit pas dépasser 10 Mo.']
    }
    if (type === 'document' && !fichier) erreurs.fichier = ['Un fichier est obligatoire pour un document.']
    if (['lien', 'tutoriel', 'api'].includes(type) && !url && !fichier && !contenuCode) {
      erreurs.url = ["L'URL est obligatoire pour ce type de ressource."]
    }

    const projetId = champs.projet_id !== undefined && champs.projet_id !== null && champs.projet_id !== '' ? Number(champs.projet_id) : null
    if (projetId !== null && (!Number.isInteger(projetId) || !projetParId(projetId))) erreurs.projet_id = ["Ce projet n'existe pas."]

    const visibiliteDemandee = champs.visibilite as VisibiliteRessource | undefined
    if (visibiliteDemandee !== undefined && !['projet', 'publique'].includes(visibiliteDemandee)) {
      erreurs.visibilite = ['La visibilité est invalide.']
    } else if (visibiliteDemandee === 'projet' && projetId === null) {
      erreurs.visibilite = ['Une ressource « projet » doit être rattachée à un projet.']
    }

    const competenceIds = (Array.isArray(champs.competence_ids) ? champs.competence_ids : []).map(Number)
    const catalogue = new Set(catalogueCompetences().map((c) => c.id))
    if (competenceIds.some((id) => !catalogue.has(id))) erreurs['competence_ids'] = ['Une compétence est invalide.']

    if (Object.keys(erreurs).length > 0) return validation(erreurs)

    if (projetId !== null && !estMembre(projetId, userId)) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const donnees: DonneesRessource = {
      type,
      titre: titre!,
      description,
      url,
      contenu_code: contenuCode,
      langage: texte(champs.langage),
      fichier_url: fichier ? await lireCommeDataUrl(fichier) : null,
      projet_id: projetId,
      visibilite: visibiliteDemandee ?? (projetId !== null ? 'projet' : 'publique'),
      competence_ids: competenceIds,
    }
    return HttpResponse.json(creerRessourceDb(userId, donnees), { status: 201 })
  }),

  /* Modifier (auteur ou propriétaire du projet lié). */
  http.patch('/api/v1/resources/:id', async ({ request, params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const ressource = ressourceParIdDb(Number(params.id))
    if (!ressource) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (!peutGererRessource(userId, ressource)) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }

    const corps = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const erreurs: Record<string, string[]> = {}
    if ('titre' in corps) {
      const titre = texte(corps.titre)
      if (!titre) erreurs.titre = ['Le titre est obligatoire.']
      else if (titre.length > 200) erreurs.titre = ['Le titre ne doit pas dépasser 200 caractères.']
    }
    if (typeof corps.description === 'string' && corps.description.length > 2000) erreurs.description = ['La description ne doit pas dépasser 2000 caractères.']
    if (typeof corps.url === 'string' && corps.url !== '' && !urlValide(corps.url)) erreurs.url = ["L'URL n'est pas valide (http ou https)."]
    if (typeof corps.contenu_code === 'string' && corps.contenu_code.length > 20000) erreurs.contenu_code = ['Le code ne doit pas dépasser 20 000 caractères.']
    if (Object.keys(erreurs).length > 0) return validation(erreurs)

    const patch: Parameters<typeof modifierRessourceDb>[1] = {}
    if ('titre' in corps) patch.titre = String(corps.titre).trim()
    if ('description' in corps) patch.description = texte(corps.description)
    if ('url' in corps) patch.url = texte(corps.url)
    if ('contenu_code' in corps) patch.contenu_code = texte(corps.contenu_code)
    if ('langage' in corps) patch.langage = texte(corps.langage)
    if (Array.isArray(corps.competence_ids)) patch.competence_ids = corps.competence_ids.map(Number)

    return HttpResponse.json(modifierRessourceDb(ressource.id, patch), { status: 200 })
  }),

  /* Supprimer (auteur ou propriétaire du projet lié). */
  http.delete('/api/v1/resources/:id', ({ params }) => {
    const userId = idUtilisateurConnecte()
    if (!userId) return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })

    const ressource = ressourceParIdDb(Number(params.id))
    if (!ressource) return HttpResponse.json({ message: 'Resource not found.' }, { status: 404 })
    if (!peutGererRessource(userId, ressource)) {
      return HttpResponse.json({ message: 'This action is unauthorized.' }, { status: 403 })
    }
    supprimerRessourceDb(ressource.id)
    return new HttpResponse(null, { status: 204 })
  }),
]
