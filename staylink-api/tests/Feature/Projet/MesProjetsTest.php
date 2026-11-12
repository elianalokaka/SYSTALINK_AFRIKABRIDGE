<?php

namespace Tests\Feature\Projet;

use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MesProjetsTest extends TestCase
{
    use RefreshDatabase;

    public function test_mes_projets_exigent_une_session(): void
    {
        $this->getJson('/api/v1/me/projects')
            ->assertUnauthorized();
    }

    public function test_mes_projets_ne_listent_que_ceux_dont_je_suis_membre(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $jean = $this->membre('jean@example.com');
        $mien = $this->projet($fatou, 'Le mien', 'recrutement');
        $rejoint = $this->projet($jean, 'Rejoint', 'en_cours');
        MembreProjet::query()->create([
            'projet_id' => $rejoint->id,
            'utilisateur_id' => $fatou->id,
            'role' => 'membre',
        ]);
        $this->projet($jean, 'Etranger', 'recrutement');

        $reponse = $this->actingAs($fatou)
            ->getJson('/api/v1/me/projects');

        $reponse->assertOk();
        $reponse->assertJsonPath('meta.total', 2);
        $reponse->assertJsonPath('meta.per_page', 15);
        $ids = collect($reponse->json('data'))->pluck('id')->all();
        $this->assertEqualsCanonicalizing([$mien->id, $rejoint->id], $ids);
        $this->assertTrue(collect($reponse->json('data'))->every(fn ($carte) => $carte['is_member'] === true));
        $reponse->assertJsonMissingPath('data.0.description');
    }

    public function test_role_equipe_filtre_proprietaire_et_membre(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $jean = $this->membre('jean@example.com');
        $possede = $this->projet($fatou, 'Possede', 'recrutement');
        $rejoint = $this->projet($jean, 'Rejoint', 'recrutement');
        MembreProjet::query()->create([
            'projet_id' => $rejoint->id,
            'utilisateur_id' => $fatou->id,
            'role' => 'membre',
        ]);

        $this->actingAs($fatou)
            ->getJson('/api/v1/me/projects?role_equipe=proprietaire')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $possede->id);

        $this->actingAs($fatou)
            ->getJson('/api/v1/me/projects?role_equipe=membre')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $rejoint->id);
    }

    public function test_filtre_statut_refuse_un_libelle(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $this->projet($fatou, 'Ouvert', 'recrutement');

        $this->actingAs($fatou)
            ->getJson('/api/v1/me/projects?statut=Ouvert')
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

    private function projet(Utilisateur $createur, string $nom, string $statut): Projet
    {
        $projet = Projet::query()->create([
            'createur_id' => $createur->id,
            'nom' => $nom,
            'description' => 'Description '.$nom,
            'domaine' => 'agriculture',
            'objectifs' => 'Objectifs',
            'nombre_max_membres' => 5,
            'statut' => $statut,
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
