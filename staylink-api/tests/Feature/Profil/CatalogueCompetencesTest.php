<?php

namespace Tests\Feature\Profil;

use App\Models\Competence;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogueCompetencesTest extends TestCase
{
    use RefreshDatabase;

    public function test_le_catalogue_exige_une_session(): void
    {
        $this->getJson('/api/v1/skills')
            ->assertUnauthorized();
    }

    public function test_le_catalogue_renvoie_une_collection_bornee(): void
    {
        Competence::query()->create(['nom' => 'Python', 'categorie' => 'langage']);
        Competence::query()->create(['nom' => 'Laravel', 'categorie' => 'framework']);

        $reponse = $this->actingAs($this->membre('alice@example.com'))
            ->getJson('/api/v1/skills');

        $reponse->assertOk();
        $reponse->assertJsonPath('data.0.nom', 'Laravel');
        $reponse->assertJsonPath('data.1.nom', 'Python');
        $reponse->assertJsonMissingPath('meta');
        $reponse->assertJsonStructure([
            'data' => [
                '*' => ['id', 'nom', 'categorie'],
            ],
            'domaines',
        ]);
        $this->assertContains('agriculture', $reponse->json('domaines'));
    }

    public function test_un_domaine_libre_apparait_dans_le_catalogue(): void
    {
        $alice = $this->membre('domaine-catalogue@example.com');
        $alice->domaines()->create(['domaine' => 'Agroécologie']);

        $reponse = $this->actingAs($alice)->getJson('/api/v1/skills');

        $reponse->assertOk();
        $this->assertContains('Agroécologie', $reponse->json('domaines'));
    }

    public function test_le_catalogue_filtre_par_nom_et_categorie(): void
    {
        Competence::query()->create(['nom' => 'Python', 'categorie' => 'langage']);
        Competence::query()->create(['nom' => 'PHP', 'categorie' => 'langage']);
        Competence::query()->create(['nom' => 'Laravel', 'categorie' => 'framework']);

        $alice = $this->membre('alice@example.com');

        $this->actingAs($alice)
            ->getJson('/api/v1/skills?q=py')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nom', 'Python');

        $this->actingAs($alice)
            ->getJson('/api/v1/skills?categorie=framework')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nom', 'Laravel');
    }

    public function test_une_categorie_inconnue_renvoie_422(): void
    {
        $this->actingAs($this->membre('alice@example.com'))
            ->getJson('/api/v1/skills?categorie=inconnu')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['categorie']);
    }

    private function membre(string $email): Utilisateur
    {
        return Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => $email,
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);
    }
}
