<?php

namespace Tests\Feature\Profil;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhotoProfilTest extends TestCase
{
    use RefreshDatabase;

    public function test_utilisateur_connecte_peut_telecharger_sa_photo(): void
    {
        Storage::fake('public');

        $utilisateur = Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);

        $photo = UploadedFile::fake()->image('photo.jpg')->size(100); // 100 Ko

        $reponse = $this->actingAs($utilisateur)
            ->postJson('/api/v1/users/me/photo', [
                'photo' => $photo,
            ]);

        $reponse->assertOk()
            ->assertJsonStructure(['photo_url']);

        $this->assertDatabaseHas('utilisateurs', [
            'id' => $utilisateur->id,
            'photo_profil' => $this->photoCheminEstValide($utilisateur->photo_profil),
        ]);
    }

    public function test_photo_trop_lourde_renvoie_422(): void
    {
        $utilisateur = Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);

        // 3 Mo > 2 Mo max
        $photo = UploadedFile::fake()->image('photo.jpg')->size(3000);

        $reponse = $this->actingAs($utilisateur)
            ->postJson('/api/v1/users/me/photo', [
                'photo' => $photo,
            ]);

        $reponse->assertUnprocessable()
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_mauvais_type_de_fichier_renvoie_422(): void
    {
        $utilisateur = Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);

        $fichier = UploadedFile::fake()->create('document.pdf', 100);

        $reponse = $this->actingAs($utilisateur)
            ->postJson('/api/v1/users/me/photo', [
                'photo' => $fichier,
            ]);

        $reponse->assertUnprocessable()
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_telechargement_photo_sans_authentification_renvoie_401(): void
    {
        $photo = UploadedFile::fake()->image('photo.jpg')->size(100);

        $reponse = $this->postJson('/api/v1/users/me/photo', [
            'photo' => $photo,
        ]);

        $reponse->assertUnauthorized();
    }

    private function photoCheminEstValide(string $chemin): bool
    {
        return str_starts_with($chemin, 'photos-profil/');
    }
}
