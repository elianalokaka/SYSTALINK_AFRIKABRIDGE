<?php

namespace Tests\Feature\Ressource;

use App\Models\Commentaire;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentairesRessourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_publier_un_commentaire_renvoie_201_sans_email(): void
    {
        $alice = $this->membre('alice@example.com');
        $ressource = $this->ressource($alice, 'publique');

        $reponse = $this->actingAs($alice)
            ->postJson('/api/v1/resources/'.$ressource->id.'/comments', [
                'contenu' => 'Piste d amelioration.',
            ]);

        $reponse->assertCreated();
        $reponse->assertJsonPath('contenu', 'Piste d amelioration.');
        $reponse->assertJsonPath('ressource_id', $ressource->id);
        $reponse->assertJsonPath('auteur.id', $alice->id);
        $reponse->assertJsonMissingPath('auteur.email');

        $this->actingAs($alice)
            ->getJson('/api/v1/resources/'.$ressource->id)
            ->assertJsonPath('commentaires_count', 1);
    }

    public function test_la_liste_est_paginee_du_plus_recent(): void
    {
        $alice = $this->membre('alice@example.com');
        $ressource = $this->ressource($alice, 'publique');
        $ancien = Commentaire::query()->create([
            'ressource_id' => $ressource->id,
            'utilisateur_id' => $alice->id,
            'contenu' => 'Ancien',
            'created_at' => now()->subDay(),
        ]);
        $recent = Commentaire::query()->create([
            'ressource_id' => $ressource->id,
            'utilisateur_id' => $alice->id,
            'contenu' => 'Recent',
            'created_at' => now(),
        ]);

        $reponse = $this->actingAs($alice)
            ->getJson('/api/v1/resources/'.$ressource->id.'/comments');

        $reponse->assertOk();
        $reponse->assertJsonPath('data.0.id', $recent->id);
        $reponse->assertJsonPath('data.1.id', $ancien->id);
        $reponse->assertJsonPath('meta.total', 2);
    }

    public function test_un_non_membre_ne_commente_pas_une_ressource_de_projet(): void
    {
        $alice = $this->membre('alice@example.com');
        $projet = $this->projet($alice);
        $ressource = $this->ressource($alice, 'projet', $projet->id);

        $this->actingAs($this->membre('bob@example.com'))
            ->postJson('/api/v1/resources/'.$ressource->id.'/comments', [
                'contenu' => 'Intrus',
            ])
            ->assertForbidden();
    }

    public function test_contenu_vide_renvoie_422(): void
    {
        $alice = $this->membre('alice@example.com');
        $ressource = $this->ressource($alice, 'publique');

        $this->actingAs($alice)
            ->postJson('/api/v1/resources/'.$ressource->id.'/comments', [
                'contenu' => '   ',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['contenu']);
    }

    public function test_l_auteur_du_commentaire_peut_le_supprimer(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $ressource = $this->ressource($alice, 'publique');
        $commentaire = Commentaire::query()->create([
            'ressource_id' => $ressource->id,
            'utilisateur_id' => $bob->id,
            'contenu' => 'A supprimer',
        ]);

        $this->actingAs($bob)
            ->deleteJson('/api/v1/comments/'.$commentaire->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('commentaires', ['id' => $commentaire->id]);
    }

    public function test_l_auteur_de_la_ressource_peut_supprimer_un_commentaire(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $ressource = $this->ressource($alice, 'publique');
        $commentaire = Commentaire::query()->create([
            'ressource_id' => $ressource->id,
            'utilisateur_id' => $bob->id,
            'contenu' => 'A moderer',
        ]);

        $this->actingAs($alice)
            ->deleteJson('/api/v1/comments/'.$commentaire->id)
            ->assertNoContent();
    }

    public function test_un_tiers_ne_peut_pas_supprimer_un_commentaire(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $ressource = $this->ressource($alice, 'publique');
        $commentaire = Commentaire::query()->create([
            'ressource_id' => $ressource->id,
            'utilisateur_id' => $bob->id,
            'contenu' => 'Reste',
        ]);

        $this->actingAs($this->membre('claire@example.com'))
            ->deleteJson('/api/v1/comments/'.$commentaire->id)
            ->assertForbidden();
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
            'type' => 'lien',
            'url' => 'https://example.com/guide',
            'visibilite' => $visibilite,
        ]);
    }
}
