<?php

namespace Tests\Feature\Projet;

use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MesDemandesAdhesionTest extends TestCase
{
    use RefreshDatabase;

    public function test_mes_demandes_exigent_une_session(): void
    {
        $this->getJson('/api/v1/me/join-requests')
            ->assertUnauthorized();
    }

    public function test_mes_demandes_ne_listent_que_celles_que_j_ai_envoyees(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $jean = $this->membre('jean@example.com');
        $kwame = $this->membre('kwame@example.com');
        $projet = $this->projet($fatou, 'Smart');

        $mienne = Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $jean->id,
            'message_motivation' => 'Je peux aider sur Laravel.',
            'statut' => 'en_attente',
        ]);
        Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $kwame->id,
            'statut' => 'en_attente',
        ]);

        $reponse = $this->actingAs($jean)
            ->getJson('/api/v1/me/join-requests');

        $reponse->assertOk();
        $reponse->assertJsonPath('meta.total', 1);
        $reponse->assertJsonPath('meta.per_page', 15);
        $reponse->assertJsonPath('data.0.id', $mienne->id);
        $reponse->assertJsonPath('data.0.utilisateur.id', $jean->id);
        $reponse->assertJsonPath('data.0.projet.nom', 'Smart');
        $reponse->assertJsonPath('data.0.message', 'Je peux aider sur Laravel.');
        $reponse->assertJsonMissingPath('data.0.utilisateur.email');
    }

    public function test_le_filtre_statut_isole_les_demandes_acceptees(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $jean = $this->membre('jean@example.com');
        $projet = $this->projet($fatou, 'Smart');

        Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $jean->id,
            'statut' => 'en_attente',
        ]);
        $acceptee = Candidature::query()->create([
            'projet_id' => $this->projet($fatou, 'Autre')->id,
            'candidat_id' => $jean->id,
            'statut' => 'acceptee',
        ]);

        $this->actingAs($jean)
            ->getJson('/api/v1/me/join-requests?statut=acceptee')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $acceptee->id);
    }

    public function test_un_statut_inconnu_renvoie_422(): void
    {
        $jean = $this->membre('jean@example.com');

        $this->actingAs($jean)
            ->getJson('/api/v1/me/join-requests?statut=pending')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['statut']);
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
