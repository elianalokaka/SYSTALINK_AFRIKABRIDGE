<?php

namespace Tests\Feature\Projet;

use App\Models\MembreProjet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DecisionDemandeTest extends TestCase
{
    use RefreshDatabase;

    public function test_accepter_ajoute_le_candidat_comme_membre(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projetId = $this->projet($alice, 5);
        $demandeId = $this->demande($bob, $projetId);

        $reponse = $this->actingAs($alice)->patchJson(
            "/api/v1/join-requests/{$demandeId}",
            ['decision' => 'acceptee']
        );

        $reponse->assertOk();
        $reponse->assertJsonPath('statut', 'acceptee');
        $this->assertNotNull($reponse->json('traitee_at'));

        $this->assertDatabaseHas('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $bob->id,
            'role' => 'membre',
        ]);
    }

    public function test_refuser_n_ajoute_pas_de_membre(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projetId = $this->projet($alice, 5);
        $demandeId = $this->demande($bob, $projetId);

        $reponse = $this->actingAs($alice)->patchJson(
            "/api/v1/join-requests/{$demandeId}",
            ['decision' => 'refusee']
        );

        $reponse->assertOk();
        $reponse->assertJsonPath('statut', 'refusee');

        $this->assertDatabaseMissing('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $bob->id,
        ]);
    }

    public function test_un_autre_membre_recoit_403(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $carol = $this->membre('carol@example.com');
        $projetId = $this->projet($alice, 5);
        $demandeId = $this->demande($bob, $projetId);

        $this->actingAs($carol)
            ->patchJson("/api/v1/join-requests/{$demandeId}", ['decision' => 'acceptee'])
            ->assertForbidden();

        $this->assertDatabaseMissing('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $bob->id,
        ]);
    }

    public function test_une_demande_deja_traitee_renvoie_409(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projetId = $this->projet($alice, 5);
        $demandeId = $this->demande($bob, $projetId);

        $this->actingAs($alice)
            ->patchJson("/api/v1/join-requests/{$demandeId}", ['decision' => 'acceptee'])
            ->assertOk();

        $this->actingAs($alice)
            ->patchJson("/api/v1/join-requests/{$demandeId}", ['decision' => 'refusee'])
            ->assertStatus(409);

        $this->assertSame(1, MembreProjet::query()->where('utilisateur_id', $bob->id)->count());
    }

    public function test_accepter_une_equipe_complete_renvoie_409(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $dave = $this->membre('dave@example.com');
        $projetId = $this->projet($alice, 2);
        $demandeId = $this->demande($bob, $projetId);

        MembreProjet::query()->create([
            'projet_id' => $projetId,
            'utilisateur_id' => $dave->id,
            'role' => 'membre',
        ]);

        $this->actingAs($alice)
            ->patchJson("/api/v1/join-requests/{$demandeId}", ['decision' => 'acceptee'])
            ->assertStatus(409);

        $this->assertDatabaseMissing('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $bob->id,
        ]);
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

    private function projet(Utilisateur $createur, int $places): int
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

    private function demande(Utilisateur $candidat, int $projetId): int
    {
        $reponse = $this->actingAs($candidat)->postJson(
            "/api/v1/projects/{$projetId}/join-requests"
        );

        $reponse->assertCreated();

        return $reponse->json('id');
    }
}