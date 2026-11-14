<?php

namespace Tests\Feature\Projet;

use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VoirProjetTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_fiche_exige_une_session(): void
    {
        $this->getJson('/api/v1/projects/1')
            ->assertUnauthorized();
    }

    public function test_un_projet_inconnu_renvoie_404(): void
    {
        $jean = $this->membre('jean@example.com');

        $this->actingAs($jean)
            ->getJson('/api/v1/projects/999999')
            ->assertNotFound();
    }

    public function test_la_fiche_renvoie_le_projet_complet(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $projet = $this->projet($fatou);

        $reponse = $this->actingAs($fatou)
            ->getJson("/api/v1/projects/{$projet->id}");

        $reponse->assertOk();
        $reponse->assertJsonPath('id', $projet->id);
        $reponse->assertJsonPath('nom', 'Smart Agriculture RDC');
        $reponse->assertJsonPath('statut', 'recrutement');
        $reponse->assertJsonPath('is_member', true);
        $reponse->assertJsonPath('nombre_membres_actuel', 1);
        $reponse->assertJsonPath('domaines.0', 'agriculture');
        $this->assertNotEmpty($reponse->json('description'));
        $reponse->assertJsonMissingPath('createur.email');
    }

    public function test_ma_demande_statut_suit_le_compte_connecte(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $jean = $this->membre('jean@example.com');
        $projet = $this->projet($fatou);

        Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $jean->id,
            'statut' => 'en_attente',
        ]);

        $this->actingAs($jean)
            ->getJson("/api/v1/projects/{$projet->id}")
            ->assertOk()
            ->assertJsonPath('is_member', false)
            ->assertJsonPath('ma_demande_statut', 'en_attente');
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
            'nom' => 'Smart Agriculture RDC',
            'description' => 'Suivre les parcelles agricoles.',
            'domaine' => 'agriculture',
            'objectifs' => 'Objectifs',
            'nombre_max_membres' => 5,
            'statut' => 'recrutement',
            'progression' => 25,
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
