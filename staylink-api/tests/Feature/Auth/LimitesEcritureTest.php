<?php

namespace Tests\Feature\Auth;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LimitesEcritureTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_trent_et_unieme_modification_de_profil_est_refusee(): void
    {
        $utilisateur = Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'plafond-ecriture@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);

        for ($essai = 1; $essai <= 30; $essai++) {
            $this->actingAs($utilisateur)
                ->patchJson('/api/v1/users/me', ['region' => 'Dakar'])
                ->assertOk();
        }

        $this->actingAs($utilisateur)
            ->patchJson('/api/v1/users/me', ['region' => 'Dakar'])
            ->assertStatus(429);
    }
}
