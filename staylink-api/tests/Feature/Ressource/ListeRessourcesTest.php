<?php

namespace Tests\Feature\Ressource;

use App\Models\Competence;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Ressource;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListeRessourcesTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_bibliotheque_exige_une_session(): void
    {
        $this->getJson('/api/v1/resources')
            ->assertUnauthorized();
    }

    public function test_un_non_membre_voit_le_public_mais_pas_la_ressource_d_equipe(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $projet = $this->projet($fatou, 'Education');
        $publique = $this->ressource($fatou, 'Jeu de donnees', 'publique');
        $this->ressource($fatou, 'Cahier des charges', 'projet', $projet->id);

        $kwame = $this->membre('kwame@example.com');

        $reponse = $this->actingAs($kwame)
            ->getJson('/api/v1/resources');

        $reponse->assertOk();
        $reponse->assertJsonPath('meta.total', 1);
        $reponse->assertJsonPath('data.0.id', $publique->id);
        $reponse->assertJsonPath('data.0.visibilite', 'publique');
        $reponse->assertJsonMissingPath('data.0.auteur.email');
    }

    public function test_un_membre_voit_la_ressource_reservee_a_son_equipe(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $projet = $this->projet($fatou, 'Education');
        $equipe = $this->ressource($fatou, 'Cahier des charges', 'projet', $projet->id);

        $reponse = $this->actingAs($fatou)
            ->getJson('/api/v1/resources');

        $reponse->assertOk();
        $ids = collect($reponse->json('data'))->pluck('id')->all();
        $this->assertContains($equipe->id, $ids);
    }

    public function test_projet_id_sans_etre_membre_renvoie_403(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $projet = $this->projet($fatou, 'Education');
        $kwame = $this->membre('kwame@example.com');

        $this->actingAs($kwame)
            ->getJson('/api/v1/resources?projet_id='.$projet->id)
            ->assertForbidden();
    }

    public function test_projet_id_en_tant_que_membre_ne_renvoie_que_ce_projet(): void
    {
        $fatou = $this->membre('fatou@example.com');
        $education = $this->projet($fatou, 'Education');
        $agri = $this->projet($fatou, 'Agri');
        $duProjet = $this->ressource($fatou, 'Cahier', 'projet', $education->id);
        $this->ressource($fatou, 'Capteurs', 'projet', $agri->id);

        $this->actingAs($fatou)
            ->getJson('/api/v1/resources?projet_id='.$education->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $duProjet->id);
    }

    public function test_competence_ids_en_brackets_renvoie_200(): void
    {
        $laravel = Competence::query()->create(['nom' => 'Laravel', 'categorie' => 'framework']);
        $fatou = $this->membre('fatou@example.com');
        $ressource = $this->ressource($fatou, 'Pagination Laravel', 'publique');
        $ressource->competences()->attach($laravel->id);
        $this->ressource($fatou, 'Autre', 'publique');

        $this->actingAs($this->membre('jean@example.com'))
            ->getJson('/api/v1/resources?competence_ids[]='.$laravel->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.titre', 'Pagination Laravel');
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
            'domaine' => 'education',
            'objectifs' => 'Objectifs',
            'nombre_max_membres' => 5,
            'statut' => 'en_cours',
            'progression' => 40,
        ]);

        $projet->domaines()->create(['domaine' => 'education']);

        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $createur->id,
            'role' => 'proprietaire',
        ]);

        return $projet;
    }

    private function ressource(
        Utilisateur $auteur,
        string $titre,
        string $visibilite,
        ?int $projetId = null
    ): Ressource {
        return Ressource::query()->create([
            'utilisateur_id' => $auteur->id,
            'projet_id' => $projetId,
            'titre' => $titre,
            'description' => 'Description '.$titre,
            'type' => 'lien',
            'url' => 'https://example.com/'.$titre,
            'visibilite' => $visibilite,
        ]);
    }
}
