<?php

namespace Tests\Feature\Statistiques;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class StatistiquesPubliquesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cache.default' => 'array']);
    }

    public function test_stats_sont_publiques_et_retournent_uniquement_les_agregats_du_contrat(): void
    {
        $proprietaire = $this->utilisateur('proprietaire@example.com', 'CD');
        $membreDeux = $this->utilisateur('membre2@example.com', 'CD');
        $membreTrois = $this->utilisateur('membre3@example.com', 'FR');

        $this->projet($proprietaire, 'Equipe solo');
        $equipeDeux = $this->projet($proprietaire, 'Equipe de deux');
        $equipeTrois = $this->projet($proprietaire, 'Equipe de trois');

        $this->ajouterMembre($equipeDeux, $membreDeux);
        $this->ajouterMembre($equipeTrois, $membreDeux);
        $this->ajouterMembre($equipeTrois, $membreTrois);

        $this->getJson('/api/v1/stats')
            ->assertOk()
            ->assertExactJson([
                'membres_count' => 3,
                'pays_count' => 2,
                'projets_count' => 3,
                'equipes_formees_count' => 2,
            ]);
    }

    public function test_stats_sont_mises_en_cache_pendant_cinq_minutes(): void
    {
        Cache::forget('stats:public');

        try {
            $this->utilisateur('premier@example.com', 'CD');

            $this->getJson('/api/v1/stats')
                ->assertOk()
                ->assertJsonPath('membres_count', 1);

            $this->utilisateur('deuxieme@example.com', 'FR');

            $this->getJson('/api/v1/stats')
                ->assertOk()
                ->assertJsonPath('membres_count', 1);

            $this->travel(4)->minutes();

            $this->getJson('/api/v1/stats')
                ->assertOk()
                ->assertJsonPath('membres_count', 1);

            $this->travel(2)->minutes();

            $this->getJson('/api/v1/stats')
                ->assertOk()
                ->assertJsonPath('membres_count', 2);
        } finally {
            Cache::forget('stats:public');
        }
    }

    public function test_stats_retournent_des_compteurs_a_zero_sans_donnees(): void
    {
        $this->getJson('/api/v1/stats')
            ->assertOk()
            ->assertExactJson([
                'membres_count' => 0,
                'pays_count' => 0,
                'projets_count' => 0,
                'equipes_formees_count' => 0,
            ]);
    }

    public function test_stats_limitent_le_nombre_de_requetes_a_soixante_par_minute(): void
    {
        for ($requete = 1; $requete <= 60; $requete++) {
            $this->getJson('/api/v1/stats')->assertOk();
        }

        $this->getJson('/api/v1/stats')
            ->assertTooManyRequests();
    }

    private function utilisateur(string $email, string $pays): Utilisateur
    {
        return Utilisateur::query()->create([
            'nom' => 'Lokaka',
            'prenom' => 'Eliana',
            'email' => $email,
            'mot_de_passe' => 'SecurePass123!',
            'pays' => $pays,
        ]);
    }

    private function projet(Utilisateur $proprietaire, string $nom): Projet
    {
        $projet = Projet::query()->create([
            'createur_id' => $proprietaire->id,
            'nom' => $nom,
            'description' => 'Projet de test.',
            'domaine' => 'agriculture',
            'objectifs' => 'Tester les statistiques.',
            'nombre_max_membres' => 5,
            'statut' => 'en_cours',
            'progression' => 40,
        ]);

        $this->ajouterMembre($projet, $proprietaire);

        return $projet;
    }

    private function ajouterMembre(Projet $projet, Utilisateur $utilisateur): void
    {
        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $utilisateur->id,
            'role' => $utilisateur->id === $projet->createur_id ? 'proprietaire' : 'membre',
        ]);
    }
}
