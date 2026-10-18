<?php

namespace Tests\Feature\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatutProjetTest extends TestCase
{
    use RefreshDatabase;

    public function test_terminer_un_projet_fixe_sa_progression_et_sa_date_de_fin(): void
    {
        $proprietaire = $this->membre('owner@example.com');
        $projet = $this->creerProjet($proprietaire);

        $this->actingAs($proprietaire)
            ->patchJson("/api/v1/projects/{$projet->id}", [
                'statut' => 'termine',
                'progression' => 35,
            ])
            ->assertOk()
            ->assertJsonPath('statut', 'termine')
            ->assertJsonPath('progression', 100)
            ->assertJsonPath('date_fin', now()->toDateString());

        $this->assertDatabaseHas('projets', [
            'id' => $projet->id,
            'statut' => 'termine',
            'progression' => 100,
            'date_fin' => now()->toDateString(),
        ]);
    }

    public function test_un_projet_termine_ne_peut_pas_revenir_a_un_autre_statut(): void
    {
        $proprietaire = $this->membre('owner@example.com');
        $projet = $this->creerProjet($proprietaire);

        $this->actingAs($proprietaire)
            ->patchJson("/api/v1/projects/{$projet->id}", ['statut' => 'termine'])
            ->assertOk();
        $dateFin = $projet->fresh()->date_fin->toDateString();

        $this->actingAs($proprietaire)
            ->patchJson("/api/v1/projects/{$projet->id}", [
                'statut' => 'en_cours',
                'progression' => 20,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['statut']);

        $this->assertDatabaseHas('projets', [
            'id' => $projet->id,
            'statut' => 'termine',
            'progression' => 100,
            'date_fin' => $dateFin,
        ]);
    }

    public function test_seul_le_proprietaire_peut_modifier_le_projet(): void
    {
        $proprietaire = $this->membre('owner@example.com');
        $autre = $this->membre('other@example.com');
        $projet = $this->creerProjet($proprietaire);

        $this->actingAs($autre)
            ->patchJson("/api/v1/projects/{$projet->id}", ['progression' => 50])
            ->assertForbidden();

        $this->assertDatabaseHas('projets', [
            'id' => $projet->id,
            'progression' => 0,
        ]);
    }

    public function test_la_progression_est_validee_entre_zero_et_cent(): void
    {
        $proprietaire = $this->membre('owner@example.com');
        $projet = $this->creerProjet($proprietaire);

        $this->actingAs($proprietaire)
            ->patchJson("/api/v1/projects/{$projet->id}", ['progression' => 101])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['progression']);
    }

    public function test_la_progression_est_persisted_sur_un_projet_actif(): void
    {
        $proprietaire = $this->membre('owner@example.com');
        $projet = $this->creerProjet($proprietaire);

        $this->actingAs($proprietaire)
            ->patchJson("/api/v1/projects/{$projet->id}", [
                'progression' => 45,
                'lien_realisation' => 'https://example.com/demo',
            ])
            ->assertOk()
            ->assertJsonPath('progression', 45)
            ->assertJsonPath('lien_realisation', 'https://example.com/demo')
            ->assertJsonPath('date_fin', null);

        $this->assertDatabaseHas('projets', [
            'id' => $projet->id,
            'progression' => 45,
            'lien_realisation' => 'https://example.com/demo',
            'date_fin' => null,
        ]);
    }

    public function test_la_capacite_ne_peut_pas_descendre_sous_les_membres_actuels(): void
    {
        $proprietaire = $this->membre('owner@example.com');
        $membre = $this->membre('member@example.com');
        $projet = $this->creerProjet($proprietaire);

        $projet->membres()->attach($membre->id, ['role' => 'membre']);

        $this->actingAs($proprietaire)
            ->patchJson("/api/v1/projects/{$projet->id}", [
                'nombre_membres_souhaite' => 1,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['nombre_membres_souhaite']);
    }

    public function test_modifier_un_projet_inexistant_renvoie_404(): void
    {
        $proprietaire = $this->membre('owner@example.com');

        $this->actingAs($proprietaire)
            ->patchJson('/api/v1/projects/999999', ['statut' => 'termine'])
            ->assertNotFound();
    }

    public function test_modifier_un_projet_sans_authentification_renvoie_401(): void
    {
        $proprietaire = $this->membre('owner@example.com');
        $projet = Projet::query()->create([
            'createur_id' => $proprietaire->id,
            'nom' => 'Smart Agriculture RDC',
            'description' => 'Suivre les parcelles agricoles.',
            'domaine' => 'agriculture',
            'objectifs' => 'Relier les producteurs.',
            'nombre_max_membres' => 5,
            'statut' => 'recrutement',
        ]);
        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $proprietaire->id,
            'role' => 'proprietaire',
        ]);

        $this->patchJson("/api/v1/projects/{$projet->id}", ['statut' => 'termine'])
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

    private function creerProjet(Utilisateur $proprietaire): Projet
    {
        $reponse = $this->actingAs($proprietaire)->postJson('/api/v1/projects', [
            'nom' => 'Smart Agriculture RDC',
            'description' => 'Suivre les parcelles agricoles.',
            'domaines' => ['agriculture'],
            'objectifs' => 'Relier les producteurs.',
            'nombre_membres_souhaite' => 5,
        ]);

        $reponse->assertCreated();

        return Projet::query()->findOrFail($reponse->json('id'));
    }
}
