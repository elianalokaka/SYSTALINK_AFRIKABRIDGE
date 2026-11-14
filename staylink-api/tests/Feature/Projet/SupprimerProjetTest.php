<?php

namespace Tests\Feature\Projet;

use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupprimerProjetTest extends TestCase
{
    use RefreshDatabase;

    public function test_le_proprietaire_supprime_le_projet_en_204(): void
    {
        $alice = $this->membre('alice@example.com');
        $projet = $this->projet($alice);
        $demande = Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $this->membre('bob@example.com')->id,
            'statut' => 'en_attente',
        ]);
        $ressource = Ressource::query()->create([
            'utilisateur_id' => $alice->id,
            'projet_id' => $projet->id,
            'titre' => 'Note',
            'type' => 'lien',
            'url' => 'https://example.com/note',
            'visibilite' => 'projet',
        ]);

        $this->actingAs($alice)
            ->deleteJson('/api/v1/projects/'.$projet->id)
            ->assertNoContent();

        $this->assertSoftDeleted('projets', ['id' => $projet->id]);
        $this->assertDatabaseHas('candidatures', ['id' => $demande->id]);
        $this->assertDatabaseHas('ressources', ['id' => $ressource->id]);

        $this->actingAs($alice)
            ->getJson('/api/v1/projects/'.$projet->id)
            ->assertNotFound();
    }

    public function test_un_non_proprietaire_recoit_403(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projet = $this->projet($alice);

        $this->actingAs($bob)
            ->deleteJson('/api/v1/projects/'.$projet->id)
            ->assertForbidden();

        $this->assertDatabaseHas('projets', [
            'id' => $projet->id,
            'deleted_at' => null,
        ]);
    }

    public function test_supprimer_sans_session_renvoie_401(): void
    {
        $this->deleteJson('/api/v1/projects/1')
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

    private function projet(Utilisateur $createur): Projet
    {
        $projet = Projet::query()->create([
            'createur_id' => $createur->id,
            'nom' => 'Smart',
            'description' => 'Description',
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
