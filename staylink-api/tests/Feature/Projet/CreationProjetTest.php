<?php

namespace Tests\Feature\Projet;

use App\Models\MembreProjet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreationProjetTest extends TestCase
{
    use RefreshDatabase;

    public function test_creer_un_projet_ajoute_le_createur_comme_proprietaire(): void
    {
        $alice = $this->membre('alice@example.com');

        $reponse = $this->actingAs($alice)->postJson('/api/v1/projects', $this->donnees());

        $reponse->assertCreated();
        $reponse->assertJsonPath('statut', 'recrutement');
        $reponse->assertJsonPath('nombre_membres_souhaite', 5);
        $reponse->assertJsonPath('nombre_membres_actuel', 1);
        $reponse->assertJsonPath('is_member', true);
        $reponse->assertJsonPath('domaines', ['agriculture', 'iot']);

        $projetId = $reponse->json('id');

        $this->assertDatabaseHas('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $alice->id,
            'role' => 'proprietaire',
        ]);

        $this->assertSame(1, MembreProjet::query()->where('projet_id', $projetId)->count());
    }

    public function test_un_domaine_libre_est_enregistre_sous_son_nom(): void
    {
        $alice = $this->membre('projet-domaine-libre@example.com');

        $this->actingAs($alice)
            ->postJson('/api/v1/projects', [
                ...$this->donnees(),
                'domaines' => ['Agroécologie'],
            ])
            ->assertCreated()
            ->assertJsonPath('domaines', ['Agroécologie']);
    }

    public function test_creer_un_projet_refuse_moins_de_deux_membres(): void
    {
        $alice = $this->membre('alice@example.com');

        $reponse = $this->actingAs($alice)->postJson('/api/v1/projects', [
            ...$this->donnees(),
            'nombre_membres_souhaite' => 1,
        ]);

        $reponse->assertUnprocessable();
        $reponse->assertJsonValidationErrors(['nombre_membres_souhaite']);
        $this->assertDatabaseCount('projets', 0);
    }

    public function test_creer_un_projet_refuse_le_statut_termine(): void
    {
        $alice = $this->membre('alice@example.com');

        $reponse = $this->actingAs($alice)->postJson('/api/v1/projects', [
            ...$this->donnees(),
            'statut' => 'termine',
        ]);

        $reponse->assertUnprocessable();
        $reponse->assertJsonValidationErrors(['statut']);
        $this->assertDatabaseCount('projets', 0);
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

    private function donnees(): array
    {
        return [
            'nom' => 'Smart Agriculture RDC',
            'description' => 'Suivre les parcelles agricoles.',
            'domaines' => ['agriculture', 'iot'],
            'objectifs' => 'Relier les producteurs.',
            'nombre_membres_souhaite' => 5,
        ];
    }
}