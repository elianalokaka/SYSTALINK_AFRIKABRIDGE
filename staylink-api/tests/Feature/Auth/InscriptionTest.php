<?php

namespace Tests\Feature\Auth;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_inscription_pose_le_cookie_et_hashe_le_mot_de_passe(): void
    {
        $reponse = $this->depuisLeFront()->postJson('/api/v1/auth/register', $this->donneesInscription());

        $reponse->assertCreated();
        $reponse->assertJsonMissingPath('role_profil');
        $this->assertCookieSessionHttpOnly($reponse);
        $this->assertAuthenticated();

        $utilisateur = Utilisateur::query()->where('email', 'eliana@example.com')->first();

        $this->assertNotNull($utilisateur);
        $this->assertNotSame('SecurePass123!', $utilisateur->mot_de_passe);
        $this->assertTrue(Hash::check('SecurePass123!', $utilisateur->mot_de_passe));
        $reponse->assertJsonMissing(['mot_de_passe']);
        $reponse->assertJsonPath('nom', 'Eliana Lokoka');
        $reponse->assertJsonMissingPath('prenom');
    }

    public function test_inscription_accepte_le_nom_complet_du_contrat_sans_prenom(): void
    {
        $reponse = $this->depuisLeFront()->postJson('/api/v1/auth/register', [
            'nom' => 'Eliana Lokoka',
            'email' => 'eliana.contrat@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'mot_de_passe_confirmation' => 'SecurePass123!',
            'pays' => 'CD',
        ]);

        $reponse->assertCreated();
        $reponse->assertJsonPath('nom', 'Eliana Lokoka');
        $reponse->assertJsonMissingPath('prenom');
        $this->assertAuthenticated();

        $utilisateur = Utilisateur::query()
            ->where('email', 'eliana.contrat@example.com')
            ->first();

        $this->assertNotNull($utilisateur);
        $this->assertSame('Eliana', $utilisateur->prenom);
        $this->assertSame('Lokoka', $utilisateur->nom);
    }

    public function test_inscription_refuse_un_email_deja_pris(): void
    {
        $this->depuisLeFront()->postJson('/api/v1/auth/register', $this->donneesInscription())->assertCreated();

        $reponse = $this->depuisLeFront()->postJson('/api/v1/auth/register', $this->donneesInscription());

        $reponse->assertUnprocessable();
        $reponse->assertJsonValidationErrors(['email']);
    }

    public function test_inscription_refuse_des_mots_de_passe_differents(): void
    {
        $reponse = $this->depuisLeFront()->postJson('/api/v1/auth/register', [
            ...$this->donneesInscription(),
            'mot_de_passe_confirmation' => 'AutrePass123!',
        ]);

        $reponse->assertUnprocessable();
        $reponse->assertJsonValidationErrors(['mot_de_passe']);
    }

    public function test_connexion_pose_le_cookie_si_le_mot_de_passe_est_bon(): void
    {
        Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);

        $reponse = $this->depuisLeFront()->postJson('/api/v1/auth/login', [
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'SecurePass123!',
        ]);

        $reponse->assertOk();
        $this->assertCookieSessionHttpOnly($reponse);
        $this->assertAuthenticated();
    }

    public function test_connexion_refuse_un_mauvais_mot_de_passe(): void
    {
        Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);

        $reponse = $this->depuisLeFront()->postJson('/api/v1/auth/login', [
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'MauvaisPass123!',
        ]);

        $reponse->assertUnprocessable();
        $reponse->assertJsonValidationErrors(['email']);
        $this->assertGuest();
    }

    private function depuisLeFront(): static
    {
        return $this->withHeader('Origin', 'http://localhost:5173');
    }

    private function assertCookieSessionHttpOnly($reponse): void
    {
        $reponse->assertCookie('africabridge_session');

        $cookie = collect($reponse->headers->getCookies())
            ->first(fn ($cookie) => $cookie->getName() === 'africabridge_session');

        $this->assertNotNull($cookie);
        $this->assertTrue($cookie->isHttpOnly());
    }

    private function donneesInscription(): array
    {
        return [
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'mot_de_passe_confirmation' => 'SecurePass123!',
            'pays' => 'CD',
        ];
    }
}
