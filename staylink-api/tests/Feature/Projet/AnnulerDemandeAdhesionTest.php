<?php

namespace Tests\Feature\Projet;

use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnulerDemandeAdhesionTest extends TestCase
{
    use RefreshDatabase;

    public function test_annuler_sa_demande_en_attente_renvoie_204(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projet = $this->projet($alice);
        $demande = Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $bob->id,
            'statut' => 'en_attente',
        ]);

        $this->actingAs($bob)
            ->deleteJson('/api/v1/join-requests/'.$demande->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('candidatures', ['id' => $demande->id]);
    }

    public function test_annuler_une_demande_traitee_renvoie_409(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projet = $this->projet($alice);
        $demande = Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $bob->id,
            'statut' => 'acceptee',
        ]);

        $this->actingAs($bob)
            ->deleteJson('/api/v1/join-requests/'.$demande->id)
            ->assertStatus(409);

        $this->assertDatabaseHas('candidatures', ['id' => $demande->id]);
    }

    public function test_annuler_la_demande_d_un_autre_renvoie_403(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projet = $this->projet($alice);
        $demande = Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $bob->id,
            'statut' => 'en_attente',
        ]);

        $this->actingAs($alice)
            ->deleteJson('/api/v1/join-requests/'.$demande->id)
            ->assertForbidden();
    }

    public function test_annuler_sans_session_renvoie_401(): void
    {
        $this->deleteJson('/api/v1/join-requests/1')
            ->assertUnauthorized();
    }

    public function test_annuler_une_demande_inconnue_renvoie_404(): void
    {
        $bob = $this->membre('bob@example.com');

        $this->actingAs($bob)
            ->deleteJson('/api/v1/join-requests/99999')
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
