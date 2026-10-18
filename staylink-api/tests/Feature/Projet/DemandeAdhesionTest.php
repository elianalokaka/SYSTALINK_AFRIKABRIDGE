<?php

namespace Tests\Feature\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemandeAdhesionTest extends TestCase
{
    use RefreshDatabase;

    public function test_deposer_une_demande_renvoie_201(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projetId = $this->projet($alice);

        $reponse = $this->actingAs($bob)->postJson(
            "/api/v1/projects/{$projetId}/join-requests",
            ['message' => 'Disponible 10h par semaine.']
        );

        $reponse->assertCreated();
        $reponse->assertJsonPath('statut', 'en_attente');
        $reponse->assertJsonPath('message', 'Disponible 10h par semaine.');
        $reponse->assertJsonPath('utilisateur.id', $bob->id);

        $this->assertDatabaseHas('candidatures', [
            'projet_id' => $projetId,
            'candidat_id' => $bob->id,
            'statut' => 'en_attente',
            'message_motivation' => 'Disponible 10h par semaine.',
        ]);
    }

    public function test_un_membre_ne_peut_pas_candidater(): void
    {
        $alice = $this->membre('alice@example.com');
        $projetId = $this->projet($alice);

        $this->actingAs($alice)
            ->postJson("/api/v1/projects/{$projetId}/join-requests")
            ->assertStatus(409);
    }

    public function test_une_demande_en_attente_ne_peut_pas_etre_renvoyee(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projetId = $this->projet($alice);

        $this->actingAs($bob)
            ->postJson("/api/v1/projects/{$projetId}/join-requests")
            ->assertCreated();

        $this->actingAs($bob)
            ->postJson("/api/v1/projects/{$projetId}/join-requests")
            ->assertStatus(409);
    }

    public function test_un_projet_termine_refuse_la_demande(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projetId = $this->projet($alice);

        Projet::query()->whereKey($projetId)->update(['statut' => 'termine']);

        $this->actingAs($bob)
            ->postJson("/api/v1/projects/{$projetId}/join-requests")
            ->assertStatus(409);
    }

    public function test_une_equipe_complete_refuse_la_demande(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $carol = $this->membre('carol@example.com');
        $projetId = $this->projet($alice, 2);

        MembreProjet::query()->create([
            'projet_id' => $projetId,
            'utilisateur_id' => $bob->id,
            'role' => 'membre',
        ]);

        $this->actingAs($carol)
            ->postJson("/api/v1/projects/{$projetId}/join-requests")
            ->assertStatus(409);
    }

    public function test_un_projet_inconnu_renvoie_404(): void
    {
        $bob = $this->membre('bob@example.com');

        $this->actingAs($bob)
            ->postJson('/api/v1/projects/99999/join-requests')
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

    private function projet(Utilisateur $createur, int $places = 5): int
    {
        $reponse = $this->actingAs($createur)->postJson('/api/v1/projects', [
            'nom' => 'Smart Agriculture RDC',
            'description' => 'Suivre les parcelles agricoles.',
            'domaines' => ['agriculture'],
            'objectifs' => 'Relier les producteurs.',
            'nombre_membres_souhaite' => $places,
        ]);

        $reponse->assertCreated();

        return $reponse->json('id');
    }
}