<?php

namespace Tests\Feature\Ressource;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DetailEtMutationRessourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_le_detail_public_est_visible_sans_email(): void
    {
        $alice = $this->membre('alice@example.com');
        $ressource = $this->ressource($alice, 'publique');

        $this->actingAs($this->membre('bob@example.com'))
            ->getJson('/api/v1/resources/'.$ressource->id)
            ->assertOk()
            ->assertJsonPath('id', $ressource->id)
            ->assertJsonPath('titre', 'Guide')
            ->assertJsonMissingPath('email')
            ->assertJsonMissingPath('auteur.email')
            ->assertJsonPath('commentaires_count', 0);
    }

    public function test_une_ressource_de_projet_est_interdite_aux_non_membres(): void
    {
        $alice = $this->membre('alice@example.com');
        $projet = $this->projet($alice);
        $ressource = $this->ressource($alice, 'projet', $projet->id);

        $this->actingAs($this->membre('bob@example.com'))
            ->getJson('/api/v1/resources/'.$ressource->id)
            ->assertForbidden();
    }

    public function test_l_auteur_modifie_le_titre(): void
    {
        $alice = $this->membre('alice@example.com');
        $ressource = $this->ressource($alice, 'publique');

        $this->actingAs($alice)
            ->patchJson('/api/v1/resources/'.$ressource->id, [
                'titre' => 'Guide mis a jour',
            ])
            ->assertOk()
            ->assertJsonPath('titre', 'Guide mis a jour');
    }

    public function test_un_tiers_ne_peut_pas_modifier(): void
    {
        $alice = $this->membre('alice@example.com');
        $ressource = $this->ressource($alice, 'publique');

        $this->actingAs($this->membre('bob@example.com'))
            ->patchJson('/api/v1/resources/'.$ressource->id, [
                'titre' => 'Hack',
            ])
            ->assertForbidden();
    }

    public function test_le_proprietaire_du_projet_peut_supprimer_la_ressource_d_un_membre(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projet = $this->projet($alice);
        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $bob->id,
            'role' => 'membre',
        ]);
        $ressource = $this->ressource($bob, 'projet', $projet->id);

        $this->actingAs($alice)
            ->deleteJson('/api/v1/resources/'.$ressource->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('ressources', ['id' => $ressource->id]);
    }

    public function test_le_detail_exige_une_session(): void
    {
        $this->getJson('/api/v1/resources/1')
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

    private function ressource(Utilisateur $auteur, string $visibilite, ?int $projetId = null): Ressource
    {
        return Ressource::query()->create([
            'utilisateur_id' => $auteur->id,
            'projet_id' => $projetId,
            'titre' => 'Guide',
            'description' => 'Description',
            'type' => 'lien',
            'url' => 'https://example.com/guide',
            'visibilite' => $visibilite,
        ]);
    }
}
