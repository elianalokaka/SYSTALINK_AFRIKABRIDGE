import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, Card, CardCorps, ChampMotDePasse, FormField, Input } from '../../components/ui'
import { useTitreDocument } from '../../components/layout/useSuiviDeRoute'
import { ErreurApi } from '../../api/erreurs'
import { useI18n } from '../../i18n'
import { MiseEnPageAuth } from './MiseEnPageAuth'
import { useSession } from '../../features/auth/SessionProvider'
import { useNomsDePays } from '../../lib/pays'
import type { UserRegister } from '../../types'

/**
 * Écran d'inscription.
 *
 * Le formulaire reflète EXACTEMENT le schéma `UserRegister` du contrat :
 * `nom`, `email`, `mot_de_passe`, `mot_de_passe_confirmation`, `pays`.
 * Rien de plus — pas de champ « role » ni de case à cocher fantaisiste :
 * un champ non prévu par le contrat serait une divergence, donc un bug.
 *
 * Après inscription, la session est OUVERTE directement (règle du contrat) :
 * pas de seconde étape de connexion.
 */
export function Inscription() {
  const { t } = useI18n()
  const pays = useNomsDePays()
  useTitreDocument(t('inscription.titre'))
  const { sInscrire } = useSession()
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
    const corps: UserRegister = {
      nom: String(formulaire.get('nom') ?? ''),
      email: String(formulaire.get('email') ?? ''),
      mot_de_passe: String(formulaire.get('mot_de_passe') ?? ''),
      mot_de_passe_confirmation: String(formulaire.get('mot_de_passe_confirmation') ?? ''),
      pays: String(formulaire.get('pays') ?? ''),
    }

    try {
      await sInscrire(corps)
      navigate('/', { replace: true })
    } catch (erreur) {
      if (erreur instanceof ErreurApi) {
        if (erreur.validation) setErreurs(erreur.erreursParChamp())
        else setErreurGlobale(erreur.message)
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
          <h1 className="text-lg font-semibold text-fg-1">{t('inscription.titre')}</h1>
          <p className="mt-1 text-sm text-fg-2">
            {t('inscription.dejaMembre')}{' '}
            <Link to="/connexion" className="text-accent hover:text-accent-hover">
              {t('inscription.lienConnexion')}
            </Link>
          </p>
        </div>

        <Card>
          <CardCorps>
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <FormField id="nom" label={t('inscription.nom')} obligatoire erreur={erreurs.nom}>
                <Input
                  id="nom"
                  name="nom"
                  autoComplete="name"
                  placeholder={t('inscription.nomExemple')}
                  invalide={Boolean(erreurs.nom)}
                  aria-describedby={erreurs.nom ? 'nom-erreur' : undefined}
                />
              </FormField>

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
                aide={t('inscription.motDePasseAide')}
                erreur={erreurs.mot_de_passe}
              >
                <ChampMotDePasse
                  id="mot-de-passe"
                  name="mot_de_passe"
                  autoComplete="new-password"
                  invalide={Boolean(erreurs.mot_de_passe)}
                  aria-describedby={
                    erreurs.mot_de_passe ? 'mot-de-passe-erreur' : 'mot-de-passe-aide'
                  }
                />
              </FormField>

              <FormField
                id="mot-de-passe-confirmation"
                label={t('inscription.confirmation')}
                obligatoire
                erreur={erreurs.mot_de_passe_confirmation}
              >
                <ChampMotDePasse
                  nomBascule={t('mdp.afficherConfirmation')}
                  id="mot-de-passe-confirmation"
                  name="mot_de_passe_confirmation"
                  autoComplete="new-password"
                  invalide={Boolean(erreurs.mot_de_passe_confirmation)}
                  aria-describedby={
                    erreurs.mot_de_passe_confirmation
                      ? 'mot-de-passe-confirmation-erreur'
                      : undefined
                  }
                />
              </FormField>

              <FormField id="pays" label={t('inscription.pays')} obligatoire erreur={erreurs.pays}>
                <select
                  id="pays"
                  name="pays"
                  defaultValue=""
                  aria-invalid={erreurs.pays ? 'true' : undefined}
                  aria-describedby={erreurs.pays ? 'pays-erreur' : undefined}
                  className="h-9 w-full rounded-md border border-border-strong bg-surface-1 px-3 text-sm text-fg-1 aria-[invalid=true]:border-danger"
                >
                  <option value="" disabled>
                    {t('inscription.paysChoisir')}
                  </option>
                  {pays.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.nom}
                    </option>
                  ))}
                </select>
              </FormField>

              {erreurGlobale && (
                <p
                  role="alert"
                  className="rounded-md border border-danger bg-danger-bg px-3 py-2 text-sm text-danger"
                >
                  {erreurGlobale}
                </p>
              )}

              <Button type="submit" chargement={chargement} pleineLargeur>
                {chargement ? t('inscription.boutonEnCours') : t('inscription.bouton')}
              </Button>
            </form>
          </CardCorps>
        </Card>
    </MiseEnPageAuth>
  )
}
