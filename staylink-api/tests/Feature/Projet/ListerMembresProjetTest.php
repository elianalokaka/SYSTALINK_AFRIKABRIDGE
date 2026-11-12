<?php

namespace Tests\Feature\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListerMembresProjetTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_liste_exige_une_session(): void
    {
        $this->getJson('/api/v1/projects/1/members')
            ->assertUnauthorized();
    }

    public function test_un_projet_inconnu_renvoie_404(): void
    {
        $jean = $this->membre('jean@example.com');

        $this->actingAs($jean)
            ->getJson('/api/v1/projects/999999/members')
            ->assertNotFound();
    }

    public function test_la_liste_est_bornee_avec_un_seul_proprietaire(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $jean = $this->membre('jean@example.com');
        $projet = $this->projet($fatou);

        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $jean->id,
            'role' => 'membre',
        ]);

        $reponse = $this->actingAs($jean)
            ->getJson("/api/v1/projects/{$projet->id}/members");

        $reponse->assertOk();
        $reponse->assertJsonCount(2, 'data');
        $reponse->assertJsonMissingPath('meta');
        $reponse->assertJsonPath('data.0.role_equipe', 'proprietaire');
        $reponse->assertJsonPath('data.0.utilisateur.id', $fatou->id);
        $reponse->assertJsonPath('data.1.role_equipe', 'membre');
        $reponse->assertJsonPath('data.1.utilisateur.id', $jean->id);
        $reponse->assertJsonMissingPath('data.0.utilisateur.email');
        $this->assertNotEmpty($reponse->json('data.0.rejoint_le'));
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

    private function projet(Utilisateur $createur): Projet
    {
        $projet = Projet::query()->create([
            'createur_id' => $createur->id,
            'nom' => 'Smart Agriculture RDC',
            'description' => 'Suivre les parcelles.',
            'domaine' => 'agriculture',
            'objectifs' => 'Objectifs',
            'nombre_max_membres' => 5,
            'statut' => 'recrutement',
            'progression' => 0,
        ]);

        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $createur->id,
            'role' => 'proprietaire',
        ]);

        return $projet;
    }
}
