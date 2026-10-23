import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface FormFieldProps {
  /** Doit être IDENTIQUE à l'`id` du champ enfant — c'est le lien label/champ. */
  id: string
  label: string
  /** Le champ lui-même (`<Input>`, `<Textarea>`, `<select>`…). */
  children: ReactNode
  /** Message d'erreur. Provient de `errors[champ][0]` d'une réponse 422. */
  erreur?: string
  /** Texte d'aide affiché sous le champ, masqué si une erreur est présente. */
  aide?: string
  obligatoire?: boolean
  className?: string
}

/**
 * Enveloppe de champ de formulaire : label + champ + aide ou erreur.
 *
 * ─── CÂBLAGE ATTENDU (à reproduire à l'identique partout) ───────────────────
 * Le FormField ne peut pas deviner le champ qu'on lui passe : c'est à
 * l'appelant de transmettre `id`, `invalide` et `aria-describedby`.
 *
 *   <FormField id="email" label="Adresse e-mail" erreur={erreurs.email} obligatoire>
 *     <Input
 *       id="email"
 *       type="email"
 *       name="email"
 *       invalide={Boolean(erreurs.email)}
 *       aria-describedby={erreurs.email ? 'email-erreur' : undefined}
 *     />
 *   </FormField>
 *
 * Les identifiants suivent la convention : `<id>-erreur` et `<id>-aide`.
 * ───────────────────────────────────────────────────────────────────────────
 */
export function FormField({
  id,
  label,
  children,
  erreur,
  aide,
  obligatoire = false,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg-1">
        {label}
        {obligatoire && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {/* L'aide disparaît quand une erreur la remplace : jamais les deux. */}
      {aide && !erreur && (
        <p id={`${id}-aide`} className="text-xs text-fg-3">
          {aide}
        </p>
      )}

      {erreur && (
        <p id={`${id}-erreur`} role="alert" className="text-xs text-danger">
          {erreur}
        </p>
      )}
    </div>
  )
}
