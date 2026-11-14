<?php

namespace Database\Seeders;

use App\Models\Competence;
use Illuminate\Database\Seeder;

class CompetenceSeeder extends Seeder
{
    /**
     * Catalogue de démonstration. Les catégories sont celles du contrat
     * (langage, framework, outil, domaine_technique, design, gestion_projet, autre).
     *
     * Minimum INTEGRATION.md §4.7 : Python, JavaScript, IoT, Réseaux, UI/UX.
     */
    public function run(): void
    {
        $catalogue = [
            ['nom' => 'Python', 'categorie' => 'langage'],
            ['nom' => 'JavaScript', 'categorie' => 'langage'],
            ['nom' => 'TypeScript', 'categorie' => 'langage'],
            ['nom' => 'PHP', 'categorie' => 'langage'],
            ['nom' => 'Java', 'categorie' => 'langage'],
            ['nom' => 'Kotlin', 'categorie' => 'langage'],
            ['nom' => 'Dart', 'categorie' => 'langage'],
            ['nom' => 'Laravel', 'categorie' => 'framework'],
            ['nom' => 'React', 'categorie' => 'framework'],
            ['nom' => 'Vue', 'categorie' => 'framework'],
            ['nom' => 'Django', 'categorie' => 'framework'],
            ['nom' => 'Flutter', 'categorie' => 'framework'],
            ['nom' => 'Git', 'categorie' => 'outil'],
            ['nom' => 'Docker', 'categorie' => 'outil'],
            ['nom' => 'PostgreSQL', 'categorie' => 'outil'],
            ['nom' => 'Figma', 'categorie' => 'outil'],
            ['nom' => 'IoT', 'categorie' => 'domaine_technique'],
            ['nom' => 'Réseaux', 'categorie' => 'domaine_technique'],
            ['nom' => 'Machine Learning', 'categorie' => 'domaine_technique'],
            ['nom' => 'UI/UX', 'categorie' => 'design'],
            ['nom' => 'Scrum', 'categorie' => 'gestion_projet'],
        ];

        foreach ($catalogue as $competence) {
            Competence::query()->updateOrCreate(
                ['nom' => $competence['nom']],
                ['categorie' => $competence['categorie']]
            );
        }
    }
}
