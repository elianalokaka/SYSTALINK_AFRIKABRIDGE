import { http, HttpResponse } from 'msw'
import {
  catalogueCompetences,
  definirCompetences,
  definirPhoto,
  mettreAJourProfil,
  utilisateurConnecte,
} from '../db'
import type { CompetencesUpdate, ProfilUpdate } from '../../types'

/**
 * Mocks du module Profils & Compétences.
 *
 * Fidèles à la sémantique du contrat :
 *   - `GET /skills` → collection BORNÉE `{ data }` (pas de meta)
 *   - `PATCH /users/me` → met à jour le profil de la session
 *   - `PUT /users/me/skills` → remplace la liste complète (sync)
 *   - `POST /users/me/photo` → 422 au-delà de 2 Mo sur le champ `photo`
 */

/** 422 au format Laravel : { message, errors: { champ: [messages] } }. */
function reponseValidation(message: string, errors: Record<string, string[]>) {
  return HttpResponse.json({ message, errors }, { status: 422 })
}

function lireCommeDataUrl(fichier: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resolve(lecteur.result as string)
    lecteur.onerror = () => reject(lecteur.error ?? new Error('Lecture du fichier impossible'))
    lecteur.readAsDataURL(fichier)
  })
}

export const handlersProfil = [
  /* 1. Le catalogue fermé des compétences. */
  http.get('/api/v1/skills', () => {
    return HttpResponse.json({ data: catalogueCompetences() }, { status: 200 })
  }),

  /* 2. Modifier mon profil (PATCH partiel). */
  http.patch('/api/v1/users/me', async ({ request }) => {
    const profil = utilisateurConnecte()
    if (!profil) {
      return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    }

    const patch = (await request.json()) as ProfilUpdate
    const misAJour = mettreAJourProfil(profil.id, patch)
    return HttpResponse.json(misAJour, { status: 200 })
  }),

  /* 3. Définir mes compétences (remplacement complet). */
  http.put('/api/v1/users/me/skills', async ({ request }) => {
    const profil = utilisateurConnecte()
    if (!profil) {
      return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    }

    const corps = (await request.json()) as CompetencesUpdate
    definirCompetences(profil.id, corps.competences)
    return HttpResponse.json({ competences: profil.competences }, { status: 200 })
  }),

  /* 4. Envoyer ou remplacer ma photo. */
  http.post('/api/v1/users/me/photo', async ({ request }) => {
    const profil = utilisateurConnecte()
    if (!profil) {
      return HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })
    }

    const formulaire = await request.formData()
    const fichier = formulaire.get('photo')

    if (!(fichier instanceof File)) {
      return reponseValidation('The photo field is required.', {
        photo: ['La photo est requise.'],
      })
    }

    /* 2 Mo max — la limite MÉTIER. Au-dessus, le vrai backend renverra 422 sur
       le champ `photo` (et 413 seulement au-dessus de 16 Mo, Nginx/PHP). */
    if (fichier.size > 2 * 1024 * 1024) {
      return reponseValidation('The photo field must not be greater than 2048 kilobytes.', {
        photo: ['La photo ne doit pas dépasser 2 Mo.'],
      })
    }

    const dataUrl = await lireCommeDataUrl(fichier)
    definirPhoto(profil.id, dataUrl)
    return HttpResponse.json({ photo_url: dataUrl }, { status: 200 })
  }),
]
