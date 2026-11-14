<?php

namespace Tests\Feature\Profil;

use App\Models\Abonnement;
use App\Models\Competence;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RechercheTalentsTest extends TestCase
{
    use RefreshDatabase;

    public function test_la_recherche_exige_une_session(): void
    {
        $this->getJson('/api/v1/users')
            ->assertUnauthorized();
    }

    public function test_la_liste_exclut_le_compte_connecte_et_n_expose_pas_email(): void
    {
        $alice = $this->membre('alice@example.com', 'Alice');
        $bob = $this->membre('bob@example.com', 'Bob');

        $reponse = $this->actingAs($alice)
            ->getJson('/api/v1/users');

        $reponse->assertOk();
        $reponse->assertJsonPath('meta.current_page', 1);
        $reponse->assertJsonPath('meta.per_page', 15);
        $reponse->assertJsonPath('meta.total', 1);
        $reponse->assertJsonPath('data.0.id', $bob->id);
        $reponse->assertJsonPath('data.0.nom', 'Bob Lokoka');
        $reponse->assertJsonMissingPath('data.0.email');
        $this->assertSame([$bob->id], collect($reponse->json('data'))->pluck('id')->all());
    }

    public function test_competence_ids_en_brackets_renvoie_200(): void
    {
        $python = Competence::query()->create(['nom' => 'Python', 'categorie' => 'langage']);
        $laravel = Competence::query()->create(['nom' => 'Laravel', 'categorie' => 'framework']);

        $alice = $this->membre('alice@example.com', 'Alice');
        $pythoniste = $this->membre('py@example.com', 'Py');
        $pythoniste->competences()->attach($python->id);
        $laraveliste = $this->membre('lv@example.com', 'Lv');
        $laraveliste->competences()->attach($laravel->id);

        $this->actingAs($alice)
            ->getJson('/api/v1/users?competence_ids[]='.$python->id)
            ->assertOk()
            ->assertJsonPath('data.0.id', $pythoniste->id)
            ->assertJsonCount(1, 'data');
    }

    public function test_competence_match_all_exige_toutes_les_competences(): void
    {
        $python = Competence::query()->create(['nom' => 'Python', 'categorie' => 'langage']);
        $iot = Competence::query()->create(['nom' => 'IoT', 'categorie' => 'domaine_technique']);

        $alice = $this->membre('alice@example.com', 'Alice');
        $partiel = $this->membre('partiel@example.com', 'Partiel');
        $partiel->competences()->attach($python->id);
        $complet = $this->membre('complet@example.com', 'Complet');
        $complet->competences()->attach([$python->id, $iot->id]);

        $this->actingAs($alice)
            ->getJson('/api/v1/users?competence_ids[]='.$python->id.'&competence_ids[]='.$iot->id.'&competence_match=all')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $complet->id);
    }

    public function test_competence_match_invalide_renvoie_422(): void
    {
        $alice = $this->membre('alice@example.com', 'Alice');

        $this->actingAs($alice)
            ->getJson('/api/v1/users?competence_match=nimportequoi')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['competence_match']);
    }

    public function test_per_page_au_dela_de_50_renvoie_422(): void
    {
        $alice = $this->membre('alice@example.com', 'Alice');

        $this->actingAs($alice)
            ->getJson('/api/v1/users?per_page=100')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_is_following_est_relatif_au_compte_connecte(): void
    {
        $alice = $this->membre('alice@example.com', 'Alice');
        $bob = $this->membre('bob@example.com', 'Bob');

        Abonnement::query()->create([
            'abonne_id' => $alice->id,
            'suivi_id' => $bob->id,
        ]);

        $this->actingAs($alice)
            ->getJson('/api/v1/users')
            ->assertOk()
            ->assertJsonPath('data.0.is_following', true)
            ->assertJsonPath('data.0.followers_count', 1);
    }

    private function membre(string $email, string $prenom): Utilisateur
    {
        return Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => $prenom,
            'email' => $email,
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);
    }
}
