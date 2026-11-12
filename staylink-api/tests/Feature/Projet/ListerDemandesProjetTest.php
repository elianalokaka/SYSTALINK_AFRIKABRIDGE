<?php

namespace Tests\Feature\Projet;

use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListerDemandesProjetTest extends TestCase
{
    use RefreshDatabase;

    public function test_lister_les_demandes_exige_une_session(): void
    {
        $this->getJson('/api/v1/projects/1/join-requests')
            ->assertUnauthorized();
    }

    public function test_un_projet_inconnu_renvoie_404(): void
    {
        $alice = $this->membre('alice@example.com');

        $this->actingAs($alice)
            ->getJson('/api/v1/projects/999999/join-requests')
            ->assertNotFound();
    }

    public function test_un_non_proprietaire_renvoie_403(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projet = $this->projet($alice, 'Smart');

        $this->actingAs($bob)
            ->getJson("/api/v1/projects/{$projet->id}/join-requests")
            ->assertForbidden();
    }

    public function test_le_proprietaire_voit_les_demandes_en_attente_par_defaut(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $carol = $this->membre('carol@example.com');
        $projet = $this->projet($alice, 'Smart');

        $enAttente = Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $bob->id,
            'message_motivation' => 'Je peux aider.',
            'statut' => 'en_attente',
        ]);
        Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $carol->id,
            'statut' => 'acceptee',
        ]);

        $reponse = $this->actingAs($alice)
            ->getJson("/api/v1/projects/{$projet->id}/join-requests");

        $reponse->assertOk();
        $reponse->assertJsonPath('meta.total', 1);
        $reponse->assertJsonPath('meta.per_page', 15);
        $reponse->assertJsonPath('data.0.id', $enAttente->id);
        $reponse->assertJsonPath('data.0.utilisateur.id', $bob->id);
        $reponse->assertJsonMissingPath('data.0.utilisateur.email');
        $reponse->assertJsonMissingPath('data.0.utilisateur.role_profil');
    }

    public function test_le_filtre_statut_isole_les_demandes_acceptees(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projet = $this->projet($alice, 'Smart');

        Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $bob->id,
            'statut' => 'en_attente',
        ]);
        $acceptee = Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $this->membre('carol@example.com')->id,
            'statut' => 'acceptee',
        ]);

        $this->actingAs($alice)
            ->getJson("/api/v1/projects/{$projet->id}/join-requests?statut=acceptee")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $acceptee->id);
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

    private function projet(Utilisateur $createur, string $nom): Projet
    {
        $projet = Projet::query()->create([
            'createur_id' => $createur->id,
            'nom' => $nom,
            'description' => 'Description '.$nom,
            'domaine' => 'agriculture',
            'objectifs' => 'Objectifs',
            'nombre_max_membres' => 5,
            'statut' => 'recrutement',
            'progression' => 0,
        ]);

        $projet->domaines()->create(['domaine' => 'agriculture']);

        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $createur->id,
            'role' => 'proprietaire',
        ]);

        return $projet;
    }
}
