<?php

namespace Database\Seeders;

use App\Models\Competence;
use App\Models\Message;
use App\Models\Projet;
use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use RuntimeException;

class RessourceEtMessageDemoSeeder extends Seeder
{
    public function run(): void
    {
        $utilisateurs = Utilisateur::query()->pluck('id', 'email');
        $projets = Projet::query()->pluck('id', 'nom');
        $competences = Competence::query()->pluck('id', 'nom');

        foreach ($this->ressources() as $donnees) {
            $auteurId = $this->idUtilisateur($utilisateurs, $donnees['auteur']);
            $projetId = $donnees['projet'] === null
                ? null
                : $this->idProjet($projets, $donnees['projet']);

            $ressource = Ressource::query()->updateOrCreate(
                ['titre' => $donnees['titre']],
                [
                    'utilisateur_id' => $auteurId,
                    'projet_id' => $projetId,
                    'description' => $donnees['description'],
                    'type' => $donnees['type'],
                    'url' => $donnees['url'],
                    'contenu_code' => $donnees['contenu_code'],
                    'langage' => $donnees['langage'],
                    'visibilite' => $donnees['visibilite'],
                ]
            );

            $competenceIds = [];
            foreach ($donnees['competences'] as $nom) {
                $competenceId = $competences[$nom] ?? null;
                if ($competenceId === null) {
                    throw new RuntimeException(
                        "Compétence « {$nom} » absente : lancer CompetenceSeeder d'abord."
                    );
                }
                $competenceIds[] = $competenceId;
            }
            $ressource->competences()->sync($competenceIds);
        }

        $discussionId = $this->idProjet($projets, 'Smart Agriculture RDC');
        foreach ($this->messages() as $message) {
            Message::query()->firstOrCreate(
                [
                    'projet_id' => $discussionId,
                    'expediteur_id' => $this->idUtilisateur($utilisateurs, $message['expediteur']),
                    'contenu' => $message['contenu'],
                ]
            );
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<string, int>  $utilisateurs
     */
    private function idUtilisateur($utilisateurs, string $email): int
    {
        $id = $utilisateurs[$email] ?? null;
        if ($id === null) {
            throw new RuntimeException(
                "Profil « {$email} » absent : lancer UtilisateurDemoSeeder d'abord."
            );
        }

        return (int) $id;
    }

    /**
     * @param  \Illuminate\Support\Collection<string, int>  $projets
     */
    private function idProjet($projets, string $nom): int
    {
        $id = $projets[$nom] ?? null;
        if ($id === null) {
            throw new RuntimeException(
                "Projet « {$nom} » absent : lancer ProjetDemoSeeder d'abord."
            );
        }

        return (int) $id;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function ressources(): array
    {
        return [
            [
                'titre' => 'Guide FAO des sols tropicaux',
                'auteur' => 'jeanpierre.mbala@demo.africabridge.test',
                'projet' => 'Smart Agriculture RDC',
                'description' => 'Référence ouverte pour calibrer les seuils d’humidité du pilote Kongo-Central.',
                'type' => 'lien',
                'url' => 'https://www.fao.org/soils-portal/fr/',
                'contenu_code' => null,
                'langage' => null,
                'visibilite' => 'projet',
                'competences' => ['Python', 'IoT'],
            ],
            [
                'titre' => 'Lecture capteur d’humidité',
                'auteur' => 'koffi.adjovi@demo.africabridge.test',
                'projet' => 'Smart Agriculture RDC',
                'description' => 'Snippet Python pour publier une mesure vers l’API du projet.',
                'type' => 'code',
                'url' => null,
                'contenu_code' => "def publier(mesure: float) -> dict:\n    return {\"humidite\": round(mesure, 2), \"unite\": \"%\"}\n",
                'langage' => 'python',
                'visibilite' => 'projet',
                'competences' => ['Python', 'IoT'],
            ],
            [
                'titre' => 'Documentation Flutter hors ligne',
                'auteur' => 'grace.wanjiku@demo.africabridge.test',
                'projet' => null,
                'description' => 'Piste officielle pour le cache local du catalogue Nairobi.',
                'type' => 'tutoriel',
                'url' => 'https://docs.flutter.dev/data-and-backend/state-mgmt/simple',
                'contenu_code' => null,
                'langage' => null,
                'visibilite' => 'publique',
                'competences' => ['Flutter', 'Dart'],
            ],
            [
                'titre' => 'Agrégat PM2.5 quotidien',
                'auteur' => 'ibrahim.diallo@demo.africabridge.test',
                'projet' => 'Qualité de l’air Bamako',
                'description' => 'Requête Django utilisée pour le rapport mensuel du projet terminé.',
                'type' => 'code',
                'url' => null,
                'contenu_code' => "Mesure.objects.filter(ville='Bamako').values('quartier').annotate(moyenne=Avg('pm25'))\n",
                'langage' => 'python',
                'visibilite' => 'projet',
                'competences' => ['Python', 'Django'],
            ],
        ];
    }

    /**
     * @return list<array{expediteur: string, contenu: string}>
     */
    private function messages(): array
    {
        return [
            [
                'expediteur' => 'jeanpierre.mbala@demo.africabridge.test',
                'contenu' => 'Les trois coopératives du Kongo-Central sont d’accord pour le pilote. On pose les capteurs la semaine prochaine.',
            ],
            [
                'expediteur' => 'koffi.adjovi@demo.africabridge.test',
                'contenu' => 'J’ai un LoRa qui tient 48 h sur batterie. Je pousse le snippet de lecture dans les ressources.',
            ],
            [
                'expediteur' => 'fatou.ndiaye@demo.africabridge.test',
                'contenu' => 'Je prépare un écran lisible au soleil, avec les alertes en grand. Maquette ce soir.',
            ],
            [
                'expediteur' => 'jeanpierre.mbala@demo.africabridge.test',
                'contenu' => 'Parfait. On vise une démo interne vendredi, sans SMS encore.',
            ],
        ];
    }
}
