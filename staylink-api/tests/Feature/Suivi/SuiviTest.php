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

    public function test_lister_les_abonnes_exige_une_session(): void
    {
        $this->getJson('/api/v1/users/1/followers')
            ->assertUnauthorized();
    }

    public function test_lister_les_abonnes_d_un_inconnu_renvoie_404(): void
    {
        $alice = $this->membre('alice@example.com');

        $this->actingAs($alice)
            ->getJson('/api/v1/users/99999/followers')
            ->assertNotFound();
    }

    public function test_lister_les_abonnes_est_pagine_du_plus_recent(): void
    {
        $cible = $this->membre('cible@example.com');
        $ancien = $this->membre('ancien@example.com');
        $recent = $this->membre('recent@example.com');
        $spectateur = $this->membre('spectateur@example.com');

        $this->actingAs($ancien)->postJson("/api/v1/users/{$cible->id}/follow")->assertCreated();
        $this->actingAs($recent)->postJson("/api/v1/users/{$cible->id}/follow")->assertCreated();

        $reponse = $this->actingAs($spectateur)
            ->getJson("/api/v1/users/{$cible->id}/followers?per_page=15");

        $reponse->assertOk();
        $reponse->assertJsonPath('data.0.id', $recent->id);
        $reponse->assertJsonPath('data.0.nom', 'Eliana Lokoka');
        $reponse->assertJsonMissingPath('data.0.email');
        $reponse->assertJsonPath('data.1.id', $ancien->id);
        $reponse->assertJsonPath('meta.current_page', 1);
        $reponse->assertJsonPath('meta.per_page', 15);
        $reponse->assertJsonPath('meta.total', 2);
        $reponse->assertJsonPath('meta.last_page', 1);
    }

    public function test_lister_les_abonnements_renvoie_les_membres_suivis(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');

        $this->actingAs($alice)->postJson("/api/v1/users/{$bob->id}/follow")->assertCreated();

        $this->actingAs($alice)
            ->getJson("/api/v1/users/{$alice->id}/following")
            ->assertOk()
            ->assertJsonPath('data.0.id', $bob->id)
            ->assertJsonPath('meta.total', 1);
    }

    public function test_lister_le_reseau_refuse_plus_de_50_par_page(): void
    {
        $alice = $this->membre('alice@example.com');

        $this->actingAs($alice)
            ->getJson("/api/v1/users/{$alice->id}/followers?per_page=51")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }
}