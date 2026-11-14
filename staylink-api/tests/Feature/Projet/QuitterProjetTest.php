<?php

namespace Tests\Feature\Projet;

use App\Models\MembreProjet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuitterProjetTest extends TestCase
{
    use RefreshDatabase;

    public function test_le_proprietaire_ne_peut_pas_quitter_son_projet(): void
    {
        $proprietaire = $this->membre('proprietaire@example.com');
        $projetId = $this->projet($proprietaire);

        $this->actingAs($proprietaire)
            ->deleteJson("/api/v1/projects/{$projetId}/members/{$proprietaire->id}")
            ->assertStatus(409);

        $this->assertDatabaseHas('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $proprietaire->id,
            'role' => 'proprietaire',
        ]);
    }

    public function test_le_proprietaire_peut_retirer_un_autre_membre(): void
    {
        $proprietaire = $this->membre('proprietaire@example.com');
        $membre = $this->membre('membre@example.com');
        $projetId = $this->projet($proprietaire);
        $this->ajouterMembre($projetId, $membre);

        $this->actingAs($proprietaire)
            ->deleteJson("/api/v1/projects/{$projetId}/members/{$membre->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $membre->id,
        ]);
    }

    public function test_un_membre_peut_quitter_son_projet(): void
    {
        $proprietaire = $this->membre('proprietaire@example.com');
        $membre = $this->membre('membre@example.com');
        $projetId = $this->projet($proprietaire);
        $this->ajouterMembre($projetId, $membre);

        $this->actingAs($membre)
            ->deleteJson("/api/v1/projects/{$projetId}/members/{$membre->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $membre->id,
        ]);
    }

    public function test_un_membre_ne_peut_pas_retirer_un_autre_membre(): void
    {
        $proprietaire = $this->membre('proprietaire@example.com');
        $membre = $this->membre('membre@example.com');
        $autreMembre = $this->membre('autre@example.com');
        $projetId = $this->projet($proprietaire);
        $this->ajouterMembre($projetId, $membre);
        $this->ajouterMembre($projetId, $autreMembre);

        $this->actingAs($membre)
            ->deleteJson("/api/v1/projects/{$projetId}/members/{$autreMembre->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('membres_projet', [
            'projet_id' => $projetId,
            'utilisateur_id' => $autreMembre->id,
        ]);
    }

    public function test_un_non_membre_ne_peut_pas_quitter_un_projet(): void
    {
        $proprietaire = $this->membre('proprietaire@example.com');
        $nonMembre = $this->membre('non-membre@example.com');
        $projetId = $this->projet($proprietaire);

        $this->actingAs($nonMembre)
            ->deleteJson("/api/v1/projects/{$projetId}/members/{$nonMembre->id}")
            ->assertNotFound();
    }

    public function test_un_membre_inexistant_renvoie_404(): void
    {
        $proprietaire = $this->membre('proprietaire@example.com');
        $projetId = $this->projet($proprietaire);

        $this->actingAs($proprietaire)
            ->deleteJson("/api/v1/projects/{$projetId}/members/99999")
            ->assertNotFound();
    }

    public function test_un_projet_inexistant_renvoie_404(): void
    {
        $membre = $this->membre('membre@example.com');

        $this->actingAs($membre)
            ->deleteJson("/api/v1/projects/99999/members/{$membre->id}")
            ->assertNotFound();
    }

    public function test_un_utilisateur_non_authentifie_renvoie_401(): void
    {
        $this->deleteJson('/api/v1/projects/99999/members/99999')
            ->assertUnauthorized();
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

    private function projet(Utilisateur $proprietaire): int
    {
        $reponse = $this->actingAs($proprietaire)->postJson('/api/v1/projects', [
            'nom' => 'Smart Agriculture RDC',
            'description' => 'Suivre les parcelles agricoles.',
            'domaines' => ['agriculture'],
            'objectifs' => 'Relier les producteurs.',
            'nombre_membres_souhaite' => 5,
        ]);

        $reponse->assertCreated();

        return $reponse->json('id');
    }

    private function ajouterMembre(int $projetId, Utilisateur $membre): void
    {
        MembreProjet::query()->create([
            'projet_id' => $projetId,
            'utilisateur_id' => $membre->id,
            'role' => 'membre',
        ]);
    }
}
