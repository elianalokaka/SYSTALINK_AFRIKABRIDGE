<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LimitesAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_sixieme_inscription_depuis_la_meme_ip_est_refusee(): void
    {
        for ($essai = 1; $essai <= 5; $essai++) {
            $this->depuis('203.0.113.10')
                ->postJson('/api/v1/auth/register', [])
                ->assertUnprocessable();
        }

        $this->depuis('203.0.113.10')
            ->postJson('/api/v1/auth/register', [])
            ->assertStatus(429);
    }

    public function test_vingt_et_une_connexions_depuis_la_meme_ip_sont_plafonnees(): void
    {
        for ($essai = 1; $essai <= 20; $essai++) {
            $this->depuis('203.0.113.20')
                ->postJson('/api/v1/auth/login', [
                    'email' => "essai{$essai}@example.com",
                    'mot_de_passe' => 'MauvaisPass123!',
                ])
                ->assertUnprocessable();
        }

        $this->depuis('203.0.113.20')
            ->postJson('/api/v1/auth/login', [
                'email' => 'autre@example.com',
                'mot_de_passe' => 'MauvaisPass123!',
            ])
            ->assertStatus(429);
    }

    private function depuis(string $ip): static
    {
        return $this->withServerVariables(['REMOTE_ADDR' => $ip]);
    }
}
