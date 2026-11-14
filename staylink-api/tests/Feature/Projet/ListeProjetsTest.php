<?php

namespace Tests\Feature\Projet;

use App\Models\Candidature;
use App\Models\Competence;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListeProjetsTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_liste_exige_une_session(): void
    {
        $this->getJson('/api/v1/projects')
            ->assertUnauthorized();
    }

    public function test_la_liste_renvoie_des_cartes_paginees_sans_description_complete(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $projet = $this->projet($fatou, 'Smart Agriculture RDC', 'recrutement');

        $jean = $this->membre('jean@example.com');

        $reponse = $this->actingAs($jean)
            ->getJson('/api/v1/projects');

        $reponse->assertOk();
        $reponse->assertJsonPath('data.0.id', $projet->id);
        $reponse->assertJsonPath('data.0.statut', 'recrutement');
        $reponse->assertJsonPath('data.0.is_member', false);
        $reponse->assertJsonPath('data.0.nombre_membres_actuel', 1);
        $reponse->assertJsonMissingPath('data.0.description');
        $reponse->assertJsonPath('meta.total', 1);
        $reponse->assertJsonPath('meta.per_page', 15);
        $this->assertNotEmpty($reponse->json('data.0.description_courte'));
    }

    public function test_le_filtre_statut_n_accepte_que_les_valeurs_techniques(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $this->projet($fatou, 'Ouvert', 'recrutement');
        $this->projet($fatou, 'Fini', 'termine');

        $this->actingAs($this->membre('jean@example.com'))
            ->getJson('/api/v1/projects?statut=recrutement')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.nom', 'Ouvert');

        $this->actingAs($this->membre('kwame@example.com'))
            ->getJson('/api/v1/projects?statut=Ouvert')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['statut']);
    }

    public function test_le_filtre_domaine_retient_les_projets_qui_contiennent_ce_domaine(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $agri = $this->projet($fatou, 'Agri', 'recrutement', ['agriculture', 'iot']);
        $this->projet($fatou, 'Sante', 'recrutement', ['sante']);

        $this->actingAs($this->membre('jean@example.com'))
            ->getJson('/api/v1/projects?domaine=iot')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $agri->id);
    }

    public function test_places_disponibles_exclut_les_equipes_completes(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $ouvert = $this->projet($fatou, 'Places', 'recrutement', ['agriculture'], 3);
        $plein = $this->projet($fatou, 'Complet', 'recrutement', ['agriculture'], 2);
        MembreProjet::query()->create([
            'projet_id' => $plein->id,
            'utilisateur_id' => $this->membre('membre@example.com')->id,
            'role' => 'membre',
        ]);

        $this->actingAs($this->membre('jean@example.com'))
            ->getJson('/api/v1/projects?places_disponibles=true')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ouvert->id);
    }

    public function test_is_member_et_ma_demande_statut_suivent_le_compte_connecte(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $projet = $this->projet($fatou, 'Smart', 'recrutement');
        $jean = $this->membre('jean@example.com');
        Candidature::query()->create([
            'projet_id' => $projet->id,
            'candidat_id' => $jean->id,
            'statut' => 'en_attente',
        ]);

        $this->actingAs($jean)
            ->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonPath('data.0.is_member', false)
            ->assertJsonPath('data.0.ma_demande_statut', 'en_attente');

        $this->actingAs($fatou)
            ->getJson('/api/v1/projects')
            ->assertOk()
            ->assertJsonPath('data.0.is_member', true);
    }

    public function test_competence_ids_en_brackets_renvoie_200(): void
    {
        $python = Competence::query()->create(['nom' => 'Python', 'categorie' => 'langage']);
        $fatou = $this->membre('fatou@example.com');
        $projet = $this->projet($fatou, 'Data', 'recrutement');
        $projet->competences()->attach($python->id);
        $this->projet($fatou, 'Sans', 'recrutement');

        $this->actingAs($this->membre('jean@example.com'))
            ->getJson('/api/v1/projects?competence_ids[]='.$python->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nom', 'Data');
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

    private function projet(
        Utilisateur $createur,
        string $nom,
        string $statut,
        array $domaines = ['agriculture'],
        int $places = 5
    ): Projet {
        $projet = Projet::query()->create([
            'createur_id' => $createur->id,
            'nom' => $nom,
            'description' => 'Description du projet '.$nom,
            'domaine' => $domaines[0],
            'objectifs' => 'Objectifs',
            'nombre_max_membres' => $places,
            'statut' => $statut,
            'progression' => $statut === 'termine' ? 100 : 0,
        ]);

        foreach ($domaines as $domaine) {
            $projet->domaines()->create(['domaine' => $domaine]);
        }

        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $createur->id,
            'role' => 'proprietaire',
        ]);

        return $projet->refresh();
    }
}
