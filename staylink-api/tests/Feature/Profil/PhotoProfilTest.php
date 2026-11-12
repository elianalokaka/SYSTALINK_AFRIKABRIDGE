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

        $utilisateur = $this->membre();

        $reponse = $this->actingAs($utilisateur)
            ->postJson('/api/v1/users/me/photo', [
                'photo' => $this->photoJpeg(100),
            ]);

        $reponse->assertOk()
            ->assertJsonStructure(['photo_url']);

        $utilisateur->refresh();

        $this->assertNotNull($utilisateur->photo_profil);
        $this->assertTrue(str_starts_with($utilisateur->photo_profil, 'photos-profil/'));
        Storage::disk('public')->assertExists($utilisateur->photo_profil);
    }

    public function test_photo_trop_lourde_renvoie_422(): void
    {
        $utilisateur = $this->membre();

        $reponse = $this->actingAs($utilisateur)
            ->postJson('/api/v1/users/me/photo', [
                'photo' => $this->photoJpeg(3000),
            ]);

        $reponse->assertUnprocessable()
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_mauvais_type_de_fichier_renvoie_422(): void
    {
        $utilisateur = $this->membre();

        $reponse = $this->actingAs($utilisateur)
            ->postJson('/api/v1/users/me/photo', [
                'photo' => UploadedFile::fake()->create('document.pdf', 100),
            ]);

        $reponse->assertUnprocessable()
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_telechargement_photo_sans_authentification_renvoie_401(): void
    {
        $reponse = $this->postJson('/api/v1/users/me/photo', [
            'photo' => UploadedFile::fake()->create('photo.jpg', 100, 'image/jpeg'),
        ]);

        $reponse->assertUnauthorized();
    }

    private function membre(): Utilisateur
    {
        return Utilisateur::query()->create([
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'eliana@example.com',
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);
    }

    /**
     * JPEG minimal, sans extension GD (absente du PHP du conteneur).
     */
    private function photoJpeg(int $kiloOctets): UploadedFile
    {
        $jpeg = base64_decode(
            '/9j/4AAQSkZJRgABAQAAAQABAAD/2wAAAAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAf/8AAEQgAAQABAwEiAAIRAQMRAf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGf/9k='
        );

        $taille = max(strlen($jpeg), $kiloOctets * 1024);

        return UploadedFile::fake()->createWithContent(
            'photo.jpg',
            str_pad($jpeg, $taille, "\0")
        );
    }
}
