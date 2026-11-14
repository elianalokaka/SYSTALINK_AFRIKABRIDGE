import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, Card, CardCorps, ChampMotDePasse, FormField, Input } from '../../components/ui'
import { useTitreDocument } from '../../components/layout/useSuiviDeRoute'
import { ErreurApi } from '../../api/erreurs'
import { useI18n } from '../../i18n'
import { MiseEnPageAuth } from './MiseEnPageAuth'
import { useSession } from '../../features/auth/SessionProvider'
import type { UserLogin } from '../../types'

/**
 * Écran de connexion.
 *
 * Le premier écran réel du produit — mais déjà régi par les mêmes règles que
 * les autres : une seule couleur d'action, focus visible global, erreurs par
 * champ, état de chargement, et une mise en page RESPONSIVE (carte centrée qui
 * tient sur mobile comme sur grand écran).
 *
 * RAPPEL DU CONTRAT : il n'y a pas de « j'ai oublié mon mot de passe ».
 * C'est un hors-périmètre confirmé — on ne l'ajoute pas discrètement.
 */
export function Connexion() {
  const { t } = useI18n()
  useTitreDocument(t('connexion.titre'))
  const { seConnecter } = useSession()
  const navigate = useNavigate()
  const [chargement, setChargement] = useState(false)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)

  async function onSubmit(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault()
    setChargement(true)
    setErreurs({})
    setErreurGlobale(null)

    const formulaire = new FormData(evenement.currentTarget)
    const corps: UserLogin = {
      email: String(formulaire.get('email') ?? ''),
      mot_de_passe: String(formulaire.get('mot_de_passe') ?? ''),
      se_souvenir: formulaire.get('se_souvenir') === 'on',
    }

    try {
      await seConnecter(corps)
      navigate('/', { replace: true })
    } catch (erreur) {
      if (erreur instanceof ErreurApi) {
        if (erreur.validation) setErreurs(erreur.erreursParChamp())
        else if (erreur.tropDeRequetes) {
          setErreurGlobale(t('connexion.tropDeTentatives', { secondes: erreur.retryAfter ?? 60 }))
        } else setErreurGlobale(erreur.message)
      } else {
        setErreurGlobale(t('erreur.inattendue'))
      }
    } finally {
      setChargement(false)
    }
  }

  return (
    <MiseEnPageAuth>
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-fg-1">{t('connexion.titre')}</h1>
          <p className="mt-1 text-sm text-fg-2">
            {t('connexion.sansCompte')}{' '}
            <Link to="/inscription" className="text-accent hover:text-accent-hover">
              {t('connexion.lienInscription')}
            </Link>
          </p>
        </div>

        <Card>
          <CardCorps>
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <FormField id="email" label={t('connexion.email')} obligatoire erreur={erreurs.email}>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder={t('connexion.emailExemple')}
                  invalide={Boolean(erreurs.email)}
                  aria-describedby={erreurs.email ? 'email-erreur' : undefined}
                />
              </FormField>

              <FormField
                id="mot-de-passe"
                label={t('connexion.motDePasse')}
                obligatoire
                erreur={erreurs.mot_de_passe}
              >
                <ChampMotDePasse
                  id="mot-de-passe"
                  name="mot_de_passe"
                  autoComplete="current-password"
                  invalide={Boolean(erreurs.mot_de_passe)}
                  aria-describedby={erreurs.mot_de_passe ? 'mot-de-passe-erreur' : undefined}
                />
              </FormField>

              <label className="flex items-center gap-2 text-sm text-fg-2">
                <input
                  type="checkbox"
                  name="se_souvenir"
                  className="h-4 w-4 rounded-sm border border-border-strong bg-surface-1"
                />
                {t('connexion.seSouvenir')}
              </label>

              {erreurGlobale && (
                <p role="alert" className="rounded-md border border-danger bg-danger-bg px-3 py-2 text-sm text-danger">
                  {erreurGlobale}
                </p>
              )}

              <Button type="submit" chargement={chargement} pleineLargeur>
                {chargement ? t('connexion.boutonEnCours') : t('connexion.bouton')}
              </Button>
            </form>
          </CardCorps>
        </Card>

        <p className="mt-4 text-center text-xs text-fg-3">
          {t('connexion.demo', { email: 'aminata@example.com', motDePasse: 'Demo1234!' })}
        </p>
    </MiseEnPageAuth>
  )
}
