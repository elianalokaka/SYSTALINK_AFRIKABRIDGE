<?php

namespace Tests\Feature\Suivi;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuiviTest extends TestCase
{
    use RefreshDatabase;

    public function test_suivre_un_membre_renvoie_201(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');

        $reponse = $this->actingAs($alice)->postJson("/api/v1/users/{$bob->id}/follow");

        $reponse->assertCreated();
        $reponse->assertExactJson([
            'is_following' => true,
            'followers_count' => 1,
        ]);
    }

    public function test_se_suivre_soi_meme_renvoie_422(): void
    {
        $alice = $this->membre('alice@example.com');

        $reponse = $this->actingAs($alice)->postJson("/api/v1/users/{$alice->id}/follow");

        $reponse->assertUnprocessable();
        $reponse->assertJsonValidationErrors(['id']);
    }

    public function test_suivre_un_membre_deja_suivi_renvoie_409(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');

        $this->actingAs($alice)->postJson("/api/v1/users/{$bob->id}/follow")->assertCreated();

        $reponse = $this->actingAs($alice)->postJson("/api/v1/users/{$bob->id}/follow");

        $reponse->assertStatus(409);
        $reponse->assertExactJson([
            'is_following' => true,
            'followers_count' => 1,
        ]);
    }

    public function test_ne_plus_suivre_renvoie_200_meme_sans_lien(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');

        $reponse = $this->actingAs($alice)->deleteJson("/api/v1/users/{$bob->id}/follow");

        $reponse->assertOk();
        $reponse->assertExactJson([
            'is_following' => false,
            'followers_count' => 0,
        ]);
    }

    public function test_suivre_un_membre_inconnu_renvoie_404(): void
    {
        $alice = $this->membre('alice@example.com');

        $this->actingAs($alice)
            ->postJson('/api/v1/users/99999/follow')
            ->assertNotFound();
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