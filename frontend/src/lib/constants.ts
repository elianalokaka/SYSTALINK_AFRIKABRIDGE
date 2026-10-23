/**
 * Listes figées du projet.
 *
 * Ces données sont STABLES et partagées : elles ne vivent pas dans un composant.
 * Le contrat code le pays en ISO 3166-1 alpha-2 (2 lettres) — on affiche le
 * nom en clair, on envoie le code.
 */

export interface Pays {
  code: string
  nom: string
}

/** Pays de démonstration — le seeder du contrat couvre CD, SN, CI, CM, BJ… */
export const PAYS: Pays[] = [
  { code: 'BJ', nom: 'Bénin' },
  { code: 'BF', nom: 'Burkina Faso' },
  { code: 'CM', nom: 'Cameroun' },
  { code: 'CI', nom: 'Côte d’Ivoire' },
  { code: 'GA', nom: 'Gabon' },
  { code: 'ML', nom: 'Mali' },
  { code: 'MA', nom: 'Maroc' },
  { code: 'CD', nom: 'RD Congo' },
  { code: 'RW', nom: 'Rwanda' },
  { code: 'SN', nom: 'Sénégal' },
  { code: 'TG', nom: 'Togo' },
  { code: 'TN', nom: 'Tunisie' },
]

export function nomDePays(code: string): string {
  return PAYS.find((pays) => pays.code === code)?.nom ?? code
}
