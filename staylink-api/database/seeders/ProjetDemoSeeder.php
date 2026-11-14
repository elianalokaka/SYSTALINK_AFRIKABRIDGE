<?php

namespace Database\Seeders;

use App\Models\Competence;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use RuntimeException;

class ProjetDemoSeeder extends Seeder
{
    public function run(): void
    {
        $utilisateurs = Utilisateur::query()->pluck('id', 'email');
        $competences = Competence::query()->pluck('id', 'nom');

        foreach ($this->projets() as $donnees) {
            $createurId = $this->idUtilisateur($utilisateurs, $donnees['createur']);

            $projet = Projet::query()->updateOrCreate(
                ['nom' => $donnees['nom']],
                [
                    'createur_id' => $createurId,
                    'description' => $donnees['description'],
                    'domaine' => $donnees['domaines'][0],
                    'objectifs' => $donnees['objectifs'],
                    'nombre_max_membres' => $donnees['nombre_max_membres'],
                    'statut' => $donnees['statut'],
                    'progression' => $donnees['progression'],
                    'date_fin' => $donnees['date_fin'],
                    'lien_realisation' => $donnees['lien_realisation'],
                ]
            );

            $projet->domaines()->delete();
            foreach ($donnees['domaines'] as $domaine) {
                $projet->domaines()->create(['domaine' => $domaine]);
            }

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
            $projet->competences()->sync($competenceIds);

            $this->assurerMembre($projet->id, $createurId, 'proprietaire');
            foreach ($donnees['membres'] as $email) {
                $this->assurerMembre(
                    $projet->id,
                    $this->idUtilisateur($utilisateurs, $email),
                    'membre'
                );
            }
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

    private function assurerMembre(int $projetId, int $utilisateurId, string $role): void
    {
        MembreProjet::query()->firstOrCreate(
            [
                'projet_id' => $projetId,
                'utilisateur_id' => $utilisateurId,
            ],
            ['role' => $role]
        );
    }

    /**
     * @return list<array{
     *     nom: string,
     *     createur: string,
     *     membres: list<string>,
     *     description: string,
     *     objectifs: string,
     *     domaines: list<string>,
     *     competences: list<string>,
     *     nombre_max_membres: int,
     *     statut: string,
     *     progression: int,
     *     date_fin: string|null,
     *     lien_realisation: string|null
     * }>
     */
    private function projets(): array
    {
        return [
            [
                'nom' => 'Smart Agriculture RDC',
                'createur' => 'jeanpierre.mbala@demo.africabridge.test',
                'membres' => [
                    'koffi.adjovi@demo.africabridge.test',
                    'fatou.ndiaye@demo.africabridge.test',
                ],
                'description' => 'Suivre l’humidité des parcelles et alerter les coopératives du Kongo-Central. Les relevés partent des capteurs vers un tableau de bord utilisable hors ligne.',
                'objectifs' => 'Relier capteurs, API et alertes SMS pour trois coopératives pilotes.',
                'domaines' => ['agriculture', 'iot'],
                'competences' => ['Python', 'Laravel', 'IoT', 'UI/UX'],
                'nombre_max_membres' => 6,
                'statut' => 'recrutement',
                'progression' => 25,
                'date_fin' => null,
                'lien_realisation' => null,
            ],
            [
                'nom' => 'Dossier patient hors ligne',
                'createur' => 'nadia.fotso@demo.africabridge.test',
                'membres' => [
                    'chiamaka.okafor@demo.africabridge.test',
                ],
                'description' => 'Dossier clinique simple pour un centre de santé à Yaoundé : identité, consultations, rappels. Fonctionne sans réseau pendant la journée, se synchronise le soir.',
                'objectifs' => 'Remplacer les cahiers papier sans dépendre d’une connexion permanente.',
                'domaines' => ['sante'],
                'competences' => ['PHP', 'Laravel', 'React'],
                'nombre_max_membres' => 5,
                'statut' => 'en_cours',
                'progression' => 55,
                'date_fin' => null,
                'lien_realisation' => null,
            ],
            [
                'nom' => 'Classe connectée Ouaga',
                'createur' => 'aicha.kabore@demo.africabridge.test',
                'membres' => [
                    'fatou.ndiaye@demo.africabridge.test',
                ],
                'description' => 'Parcours d’exercices pour collèges à Ouagadougou. L’enseignant prépare la séance, les élèves répondent sur téléphone partagé, les scores restent dans l’établissement.',
                'objectifs' => 'Livrer un pilote de 4 semaines dans deux classes de 4e.',
                'domaines' => ['education'],
                'competences' => ['UI/UX', 'Figma', 'React', 'Scrum'],
                'nombre_max_membres' => 5,
                'statut' => 'recrutement',
                'progression' => 10,
                'date_fin' => null,
                'lien_realisation' => null,
            ],
            [
                'nom' => 'Paiement coopératif Abidjan',
                'createur' => 'amina.traore@demo.africabridge.test',
                'membres' => [
                    'jeanpierre.mbala@demo.africabridge.test',
                ],
                'description' => 'Caisse commune pour une coopérative de commerçantes : cotisations, prêts internes, reçu mobile. L’interface évite le jargon bancaire.',
                'objectifs' => 'Tenir le journal des mouvements et un export comptable mensuel.',
                'domaines' => ['fintech', 'commerce'],
                'competences' => ['JavaScript', 'TypeScript', 'React', 'Laravel'],
                'nombre_max_membres' => 6,
                'statut' => 'recrutement',
                'progression' => 15,
                'date_fin' => null,
                'lien_realisation' => null,
            ],
            [
                'nom' => 'Mini-réseau solaire Accra',
                'createur' => 'samuel.owusu@demo.africabridge.test',
                'membres' => [
                    'koffi.adjovi@demo.africabridge.test',
                ],
                'description' => 'Prévoir la charge d’un mini-réseau solaire périurbain. Les données de production et de consommation alimentent une alerte avant la coupure.',
                'objectifs' => 'Réduire les coupures non planifiées sur un site pilote.',
                'domaines' => ['energie', 'iot'],
                'competences' => ['Python', 'Machine Learning', 'IoT', 'PostgreSQL'],
                'nombre_max_membres' => 5,
                'statut' => 'en_cours',
                'progression' => 40,
                'date_fin' => null,
                'lien_realisation' => null,
            ],
            [
                'nom' => 'Catalogue hors ligne Nairobi',
                'createur' => 'grace.wanjiku@demo.africabridge.test',
                'membres' => [
                    'amina.traore@demo.africabridge.test',
                ],
                'description' => 'Application mobile pour marchands : photos, prix, stocks. Le catalogue se met à jour au Wi-Fi du marché, les clients feuillettent sans data.',
                'objectifs' => 'Publier une version Flutter utilisable sur Android d’entrée de gamme.',
                'domaines' => ['commerce'],
                'competences' => ['Dart', 'Flutter', 'Git'],
                'nombre_max_membres' => 4,
                'statut' => 'recrutement',
                'progression' => 20,
                'date_fin' => null,
                'lien_realisation' => null,
            ],
            [
                'nom' => 'Qualité de l’air Bamako',
                'createur' => 'ibrahim.diallo@demo.africabridge.test',
                'membres' => [
                    'samuel.owusu@demo.africabridge.test',
                    'nadia.fotso@demo.africabridge.test',
                ],
                'description' => 'Réseau de capteurs bas coût à Bamako. Les mesures PM2.5 sont affichées par quartier, avec un historique de six mois pour les associations de quartier.',
                'objectifs' => 'Ouvrir les données et un rapport mensuel téléchargeable.',
                'domaines' => ['environnement', 'iot'],
                'competences' => ['Python', 'Django', 'IoT', 'PostgreSQL'],
                'nombre_max_membres' => 4,
                'statut' => 'termine',
                'progression' => 100,
                'date_fin' => '2026-06-30',
                'lien_realisation' => 'https://github.com/africabridge-demo/qualite-air-bamako',
            ],
        ];
    }
}
