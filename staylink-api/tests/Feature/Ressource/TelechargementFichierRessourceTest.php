<?php

namespace Tests\Feature\Ressource;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TelechargementFichierRessourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_invite_ne_telecharge_pas_le_fichier(): void
    {
        $alice = $this->membre('alice@example.com');
        $ressource = $this->fichier($alice, 'publique');

        $this->getJson('/api/v1/resources/'.$ressource->id.'/file')
            ->assertUnauthorized();
    }

    public function test_un_non_membre_ne_telecharge_pas_un_fichier_de_projet(): void
    {
        $alice = $this->membre('alice@example.com');
        $projet = $this->projet($alice);
        $ressource = $this->fichier($alice, 'projet', $projet->id);

        $this->actingAs($this->membre('bob@example.com'))
            ->getJson('/api/v1/resources/'.$ressource->id.'/file')
            ->assertForbidden();
    }

    public function test_un_membre_telecharge_le_fichier_prive(): void
    {
        $alice = $this->membre('alice@example.com');
        $projet = $this->projet($alice);
        $ressource = $this->fichier($alice, 'projet', $projet->id);

        $reponse = $this->actingAs($alice)
            ->get('/api/v1/resources/'.$ressource->id.'/file');

        $reponse->assertOk();
        $this->assertSame('contenu-prive', $reponse->streamedContent());
    }

    public function test_un_fichier_deja_sur_le_disque_public_reste_telechargeable_par_un_membre(): void
    {
        Storage::fake('local');
        Storage::fake('public');
        Storage::disk('public')->put('ressources/ancien.pdf', 'ancien');

        $alice = $this->membre('alice@example.com');
        $ressource = Ressource::query()->create([
            'utilisateur_id' => $alice->id,
            'titre' => 'Ancien',
            'type' => 'document',
            'chemin_fichier' => 'ressources/ancien.pdf',
            'visibilite' => 'publique',
        ]);

        $reponse = $this->actingAs($alice)
            ->get('/api/v1/resources/'.$ressource->id.'/file');

        $reponse->assertOk();
        $this->assertSame('ancien', $reponse->streamedContent());
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

    private function fichier(Utilisateur $auteur, string $visibilite, ?int $projetId = null): Ressource
    {
        Storage::fake('local');
        Storage::disk('local')->put('ressources/secret.pdf', 'contenu-prive');

        return Ressource::query()->create([
            'utilisateur_id' => $auteur->id,
            'projet_id' => $projetId,
            'titre' => 'Guide',
            'type' => 'document',
            'chemin_fichier' => 'ressources/secret.pdf',
            'visibilite' => $visibilite,
        ]);
    }
}
