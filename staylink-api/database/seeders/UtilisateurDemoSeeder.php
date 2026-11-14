<?php

namespace Database\Seeders;

use App\Models\Competence;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use RuntimeException;

class UtilisateurDemoSeeder extends Seeder
{
    /**
     * Mot de passe commun du jury (à noter). Eliana n'a PAS de compte.
     */
    public const MOT_DE_PASSE_DEMO = 'Demo1234!';

    public function run(): void
    {
        $ids = Competence::query()->pluck('id', 'nom');

        foreach ($this->profils() as $profil) {
            $competences = [];
            foreach ($profil['competences'] as $nom => $niveau) {
                $competenceId = $ids[$nom] ?? null;
                if ($competenceId === null) {
                    throw new RuntimeException(
                        "Compétence « {$nom} » absente : lancer CompetenceSeeder d'abord."
                    );
                }
                $competences[$competenceId] = ['niveau' => $niveau];
            }

            $utilisateur = Utilisateur::query()->updateOrCreate(
                ['email' => $profil['email']],
                [
                    'nom' => $profil['nom'],
                    'prenom' => $profil['prenom'],
                    'mot_de_passe' => self::MOT_DE_PASSE_DEMO,
                    'pays' => $profil['pays'],
                    'region' => $profil['region'],
                    'role_profil' => $profil['role_profil'],
                    'domaine' => $profil['domaine'],
                    'titre_professionnel' => $profil['titre'],
                    'biographie' => $profil['bio'],
                    'email_verifie_le' => now(),
                ]
            );

            $utilisateur->competences()->sync($competences);
            $utilisateur->domaines()->delete();
            $utilisateur->domaines()->create(['domaine' => $profil['domaine']]);
        }
    }

    /**
     * @return list<array{
     *     prenom: string,
     *     nom: string,
     *     email: string,
     *     pays: string,
     *     region: string,
     *     role_profil: string,
     *     domaine: string,
     *     titre: string,
     *     bio: string,
     *     competences: array<string, string>
     * }>
     */
    private function profils(): array
    {
        return [
            [
                'prenom' => 'Fatou',
                'nom' => 'Ndiaye',
                'email' => 'fatou.ndiaye@demo.africabridge.test',
                'pays' => 'SN',
                'region' => 'Dakar',
                'role_profil' => 'designer_ui_ux',
                'domaine' => 'education',
                'titre' => 'Designer UI/UX',
                'bio' => 'Designer UI/UX à Dakar. Interfaces accessibles pour l’éducation et les services publics.',
                'competences' => [
                    'UI/UX' => 'avance',
                    'Figma' => 'avance',
                    'React' => 'intermediaire',
                ],
            ],
            [
                'prenom' => 'Jean-Pierre',
                'nom' => 'Mbala',
                'email' => 'jeanpierre.mbala@demo.africabridge.test',
                'pays' => 'CD',
                'region' => 'Kinshasa',
                'role_profil' => 'developpeur_backend',
                'domaine' => 'agriculture',
                'titre' => 'Développeur backend',
                'bio' => 'Backend Laravel et Python à Kinshasa. Suit les parcelles et les coopératives agricoles.',
                'competences' => [
                    'PHP' => 'avance',
                    'Laravel' => 'avance',
                    'Python' => 'intermediaire',
                    'PostgreSQL' => 'avance',
                ],
            ],
            [
                'prenom' => 'Amina',
                'nom' => 'Traoré',
                'email' => 'amina.traore@demo.africabridge.test',
                'pays' => 'CI',
                'region' => 'Abidjan',
                'role_profil' => 'developpeur_frontend',
                'domaine' => 'fintech',
                'titre' => 'Développeuse frontend',
                'bio' => 'Frontend React à Abidjan. Parcours de paiement mobile et tableaux de bord clairs.',
                'competences' => [
                    'JavaScript' => 'avance',
                    'TypeScript' => 'avance',
                    'React' => 'avance',
                ],
            ],
            [
                'prenom' => 'Nadia',
                'nom' => 'Fotso',
                'email' => 'nadia.fotso@demo.africabridge.test',
                'pays' => 'CM',
                'region' => 'Yaoundé',
                'role_profil' => 'fullstack',
                'domaine' => 'sante',
                'titre' => 'Développeuse fullstack',
                'bio' => 'Fullstack à Yaoundé. Dossiers patients hors ligne et rappels de rendez-vous.',
                'competences' => [
                    'JavaScript' => 'avance',
                    'PHP' => 'intermediaire',
                    'Laravel' => 'intermediaire',
                    'React' => 'avance',
                ],
            ],
            [
                'prenom' => 'Koffi',
                'nom' => 'Adjovi',
                'email' => 'koffi.adjovi@demo.africabridge.test',
                'pays' => 'BJ',
                'region' => 'Cotonou',
                'role_profil' => 'ingenieur_iot',
                'domaine' => 'iot',
                'titre' => 'Ingénieur IoT',
                'bio' => 'Capteurs et réseaux bas débit à Cotonou. Chaîne capteur → API → alerte.',
                'competences' => [
                    'IoT' => 'avance',
                    'Réseaux' => 'avance',
                    'Python' => 'avance',
                    'Docker' => 'intermediaire',
                ],
            ],
            [
                'prenom' => 'Aïcha',
                'nom' => 'Kaboré',
                'email' => 'aicha.kabore@demo.africabridge.test',
                'pays' => 'BF',
                'region' => 'Ouagadougou',
                'role_profil' => 'chef_de_projet',
                'domaine' => 'education',
                'titre' => 'Cheffe de projet',
                'bio' => 'Cheffe de projet à Ouagadougou. Cadence Scrum et livrables parlants pour les enseignants.',
                'competences' => [
                    'Scrum' => 'avance',
                    'Git' => 'intermediaire',
                ],
            ],
            [
                'prenom' => 'Samuel',
                'nom' => 'Owusu',
                'email' => 'samuel.owusu@demo.africabridge.test',
                'pays' => 'GH',
                'region' => 'Accra',
                'role_profil' => 'data_scientist',
                'domaine' => 'energie',
                'titre' => 'Data scientist',
                'bio' => 'Données énergétiques à Accra. Prévision de charge et qualité des séries temporelles.',
                'competences' => [
                    'Python' => 'avance',
                    'Machine Learning' => 'avance',
                    'PostgreSQL' => 'intermediaire',
                ],
            ],
            [
                'prenom' => 'Grace',
                'nom' => 'Wanjiku',
                'email' => 'grace.wanjiku@demo.africabridge.test',
                'pays' => 'KE',
                'region' => 'Nairobi',
                'role_profil' => 'autre',
                'domaine' => 'commerce',
                'titre' => 'Développeuse mobile',
                'bio' => 'Flutter à Nairobi. Catalogues marchands et mode hors ligne pour les zones mal couvertes.',
                'competences' => [
                    'Dart' => 'avance',
                    'Flutter' => 'avance',
                    'Git' => 'avance',
                ],
            ],
            [
                'prenom' => 'Ibrahim',
                'nom' => 'Diallo',
                'email' => 'ibrahim.diallo@demo.africabridge.test',
                'pays' => 'ML',
                'region' => 'Bamako',
                'role_profil' => 'developpeur_backend',
                'domaine' => 'environnement',
                'titre' => 'Développeur backend',
                'bio' => 'Django à Bamako. Suivi de la qualité de l’air et des points d’eau.',
                'competences' => [
                    'Python' => 'avance',
                    'Django' => 'avance',
                    'PostgreSQL' => 'intermediaire',
                ],
            ],
            [
                'prenom' => 'Chiamaka',
                'nom' => 'Okafor',
                'email' => 'chiamaka.okafor@demo.africabridge.test',
                'pays' => 'NG',
                'region' => 'Lagos',
                'role_profil' => 'fullstack',
                'domaine' => 'fintech',
                'titre' => 'Développeuse fullstack',
                'bio' => 'Fullstack à Lagos. Comptes, virements et journal d’audit lisible.',
                'competences' => [
                    'Java' => 'avance',
                    'Kotlin' => 'intermediaire',
                    'JavaScript' => 'intermediaire',
                    'Git' => 'avance',
                ],
            ],
        ];
    }
}
