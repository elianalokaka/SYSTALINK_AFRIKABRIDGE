import { useState, type ReactNode } from 'react'
/* react-icons v5 préfixe chaque icône par le nom de son set : `Lu` pour Lucide.
   On les alias ici pour découpler le JSX du nom de la bibliothèque — le jour
   où on change de set, cette seule ligne change, pas les 18 usages. */
import {
  LuCheck as Check,
  LuChevronRight as ChevronRight,
  LuInbox as Inbox,
  LuPlus as Plus,
  LuSearch as Search,
  LuUsers as Users,
  LuX as X,
} from 'react-icons/lu'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardCorps,
  CardEntete,
  EmptyState,
  FormField,
  Input,
  ProgressBar,
  Skeleton,
  SkeletonTexte,
  Spinner,
  Tabs,
  Textarea,
} from '../../components/ui'

/**
 * ATELIER — page de validation du design system.
 *
 * Ce n'est PAS un écran du produit. C'est l'outil qui prouve que chaque
 * primitive existe et possède tous ses états, avant qu'on écrive les écrans
 * réels. Elle sert aussi de documentation vivante : le code de câblage des
 * formulaires y est montré en exemple.
 *
 * Elle disparaîtra (ou passera derrière une route de développement) quand les
 * vrais écrans existeront.
 */

function Section({ titre, note, children }: { titre: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border-subtle pb-2">
        <h2 className="text-xs font-semibold tracking-widest text-fg-1 uppercase">{titre}</h2>
        {note && <p className="text-xs text-fg-3">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <span className="w-24 shrink-0 pt-1.5 text-xs text-fg-3">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function Atelier() {
  const [ongletActif, setOngletActif] = useState('vue')

  return (
    <div className="min-h-dvh bg-surface-0">
      <header className="border-b border-border-subtle bg-surface-1">
        <div className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-5">
          <h1 className="text-lg font-semibold text-fg-1">
            Atelier <span className="text-accent">AfricaBridge</span>
          </h1>
          <p className="text-xs text-fg-3">
            Validation du design system — page de développement, pas un écran du produit.
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-8">
        {/* ── Typographie ────────────────────────────────────────────────── */}
        <Section titre="Typographie" note="Poppins — la hiérarchie vient du corps et de la graisse, pas de la couleur">
          <div className="flex flex-col gap-2">
            <p className="text-2xl font-semibold tracking-tight text-fg-1">
              Smart Agriculture RDC
            </p>
            <p className="text-base text-fg-1">Titre de section ou intitulé de carte</p>
            <p className="text-sm text-fg-1">
              Texte courant : c'est le corps par défaut de l'interface.
            </p>
            <p className="text-sm text-fg-2">Texte secondaire — métadonnées, dates, compteurs</p>
            <p className="text-xs text-fg-3">Texte tertiaire — légendes, aides, mentions</p>
            <p className="font-mono text-xs text-fg-2">
              proposer_une_competence(&apos;iot&apos;) — monospace pour le code
            </p>
          </div>
        </Section>

        {/* ── Boutons ────────────────────────────────────────────────────── */}
        <Section
          titre="Boutons"
          note="Le libellé d'un bouton plein est SOMBRE — du blanc sur l'orange donne 3.34:1 et échoue WCAG"
        >
          <Ligne label="Variantes">
            <Button variante="principal">Rejoindre ce projet</Button>
            <Button variante="secondaire">Annuler</Button>
            <Button variante="discret">Plus tard</Button>
            <Button variante="danger">Quitter le projet</Button>
          </Ligne>

          <Ligne label="Tailles">
            <Button taille="sm">Petit</Button>
            <Button taille="md">Moyen</Button>
            <Button taille="lg">Grand</Button>
          </Ligne>

          <Ligne label="États">
            <Button chargement>Envoi…</Button>
            <Button disabled>Désactivé</Button>
            <Button variante="secondaire" disabled>
              Désactivé
            </Button>
            <Button iconeGauche={<Plus size={16} />}>Créer un projet</Button>
            <Button variante="secondaire" iconeDroite={<ChevronRight size={16} />}>
              Explorer
            </Button>
          </Ligne>

          <Ligne label="Espace réservé">
            <p className="text-xs text-fg-3">
              Appuie sur <kbd className="rounded-sm border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-xs">Tab</kbd>{' '}
              pour voir l&apos;anneau de focus orange — il vient d&apos;une règle globale unique.
            </p>
          </Ligne>
        </Section>

        {/* ── Badges ─────────────────────────────────────────────────────── */}
        <Section
          titre="Badges d'état"
          note="Les statuts réels du contrat API — l'accent n'est jamais utilisé pour un état"
        >
          <Ligne label="Projet">
            <Badge variante="succes">Ouvert</Badge>
            <Badge variante="info">En cours</Badge>
            <Badge variante="neutre">Terminé</Badge>
          </Ligne>
          <Ligne label="Demande">
            <Badge variante="attente">En attente</Badge>
            <Badge variante="succes">Acceptée</Badge>
            <Badge variante="danger">Refusée</Badge>
          </Ligne>
          <Ligne label="Avec icône">
            <Badge variante="info">En cours</Badge>
            <Badge variante="succes">
              <Check size={12} /> Vérifié
            </Badge>
          </Ligne>
        </Section>

        {/* ── Cartes ─────────────────────────────────────────────────────── */}
        <Section titre="Cartes" note="Aucune ombre portée : surface plus claire + 1 px de bordure">
          <Card>
            <CardEntete titre="Projets en recrutement" compteur={3} />
            <CardCorps className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nom="Aminata Diallo" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg-1">Smart Agriculture RDC</p>
                    <p className="truncate text-xs text-fg-3">Agriculture · IoT — Kinshasa</p>
                  </div>
                </div>
                <Badge variante="succes">Ouvert</Badge>
              </div>
              <ProgressBar valeur={40} />
              <div className="flex items-center gap-2">
                <Button taille="sm">Rejoindre</Button>
                <Button taille="sm" variante="discret">
                  Voir le détail
                </Button>
              </div>
            </CardCorps>
          </Card>
        </Section>

        {/* ── Avatars ────────────────────────────────────────────────────── */}
        <Section
          titre="Avatars"
          note="photo_url est nullable dans le contrat : le repli sur initiales est un cas normal"
        >
          <Ligne label="Tailles">
            <Avatar nom="Aminata Diallo" taille="sm" />
            <Avatar nom="Aminata Diallo" taille="md" />
            <Avatar nom="Aminata Diallo" taille="lg" />
          </Ligne>
          <Ligne label="Repli initiales">
            <Avatar nom="Eliana Lokoka" />
            <Avatar nom="Arthur" />
            <Avatar nom="Smart Agriculture RDC" />
          </Ligne>
        </Section>

        {/* ── Onglets ────────────────────────────────────────────────────── */}
        <Section titre="Onglets" note="Soulignement, jamais de pilule — c'est le motif du détail projet">
          <Tabs
            actif={ongletActif}
            onChange={setOngletActif}
            onglets={[
              { id: 'vue', libelle: 'Vue' },
              { id: 'equipe', libelle: 'Équipe', compteur: 4, icone: <Users size={14} /> },
              { id: 'discussion', libelle: 'Discussion', compteur: 12 },
              { id: 'ressources', libelle: 'Ressources', compteur: 3 },
              { id: 'demandes', libelle: 'Demandes', compteur: 2 },
            ]}
          />
          <p className="text-xs text-fg-3">
            Onglet actif : <span className="font-mono text-fg-2">{ongletActif}</span>
          </p>
        </Section>

        {/* ── Formulaires ────────────────────────────────────────────────── */}
        <Section titre="Formulaires" note="La bordure est le seul repère du champ : elle doit atteindre 3:1">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="atelier-nom" label="Nom du projet" obligatoire aide="150 caractères maximum.">
              <Input
                id="atelier-nom"
                placeholder="Smart Agriculture RDC"
                aria-describedby="atelier-nom-aide"
              />
            </FormField>

            <FormField
              id="atelier-email"
              label="Adresse e-mail"
              obligatoire
              erreur="Cette adresse e-mail est déjà utilisée."
            >
              <Input
                id="atelier-email"
                type="email"
                defaultValue="eliana@example.com"
                invalide
                aria-describedby="atelier-email-erreur"
              />
            </FormField>

            <FormField id="atelier-pays" label="Pays" aide="Code ISO alpha-2.">
              <Input id="atelier-pays" defaultValue="CD" aria-describedby="atelier-pays-aide" />
            </FormField>

            <FormField id="atelier-desactive" label="Champ désactivé">
              <Input id="atelier-desactive" defaultValue="Non modifiable" disabled />
            </FormField>

            <FormField
              id="atelier-objectifs"
              label="Objectifs"
              className="sm:col-span-2"
              aide="Décris le problème que le projet résout."
            >
              <Textarea
                id="atelier-objectifs"
                placeholder="Améliorer le rendement des exploitations familiales…"
                aria-describedby="atelier-objectifs-aide"
              />
            </FormField>
          </div>
        </Section>

        {/* ── États ──────────────────────────────────────────────────────── */}
        <Section titre="États : vide et chargement" note="Un état vide propose toujours une suite">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <EmptyState
                icone={<Inbox size={28} />}
                titre="Aucune demande pour l'instant"
                description="Les demandes d'adhésion apparaîtront ici dès qu'un talent voudra rejoindre ton projet."
                action={
                  <Button taille="sm" variante="secondaire" iconeGauche={<Search size={14} />}>
                    Trouver des talents
                  </Button>
                }
              />
            </Card>

            <Card>
              <CardEntete titre="Chargement" />
              <CardCorps className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <SkeletonTexte lignes={2} />
                  </div>
                </div>
                <Skeleton className="h-1.5 w-full" />
                <div className="flex items-center gap-2 text-xs text-fg-3">
                  <Spinner taille="sm" /> Chargement de la liste…
                </div>
              </CardCorps>
            </Card>
          </div>
        </Section>

        {/* ── Icônes ─────────────────────────────────────────────────────── */}
        <Section titre="Icônes" note="Lucide uniquement — un seul set, jamais de mélange">
          <Ligne label="Tailles">
            <Search size={14} className="text-fg-2" />
            <Search size={16} className="text-fg-2" />
            <Search size={20} className="text-fg-2" />
            <Search size={24} className="text-fg-2" />
          </Ligne>
          <Ligne label="Jeu">
            <Plus size={18} className="text-fg-2" />
            <Check size={18} className="text-fg-2" />
            <X size={18} className="text-fg-2" />
            <Users size={18} className="text-fg-2" />
            <Inbox size={18} className="text-fg-2" />
            <ChevronRight size={18} className="text-fg-2" />
          </Ligne>
          <Ligne label="Alignement">
            <Button iconeGauche={<Plus size={16} />}>Icône alignée au libellé</Button>
            <Button variante="secondaire" iconeGauche={<Users size={16} />}>
              4 membres
            </Button>
          </Ligne>
        </Section>
      </main>

      <footer className="mx-auto max-w-5xl px-6 pb-10">
        <p className="border-t border-border-subtle pt-4 text-xs text-fg-3">
          Contrastes vérifiés WCAG 2.1 · référence : docs/design/orientation-palette.png
        </p>
      </footer>
    </div>
  )
}
