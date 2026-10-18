<?php

namespace Tests\Feature\Ressource;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PublicationRessourceTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_document_sans_fichier_est_refuse(): void
    {
        $alice = $this->membre('alice@example.com');

        $this->actingAs($alice)
            ->postJson('/api/v1/resources', [
                'type' => 'document',
                'titre' => 'Guide API',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fichier']);

        $this->assertDatabaseCount('ressources', 0);
    }

    public function test_un_fichier_de_plus_de_10_mo_renvoie_422(): void
    {
        $alice = $this->membre('alice@example.com');
        $fichier = UploadedFile::fake()->create('guide.pdf', 10241);

        $this->actingAs($alice)
            ->post('/api/v1/resources', [
                'type' => 'document',
                'titre' => 'Guide trop lourd',
                'fichier' => $fichier,
            ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['fichier']);

        $this->assertDatabaseCount('ressources', 0);
    }

    public function test_un_corps_de_plus_de_16_mo_renvoie_413(): void
    {
        $alice = $this->membre('alice@example.com');

        $this->actingAs($alice)
            ->call('POST', '/api/v1/resources', [], [], [], [
                'CONTENT_LENGTH' => 17 * 1024 * 1024,
                'HTTP_ACCEPT' => 'application/json',
            ])
            ->assertStatus(413)
            ->assertExactJson([
                'message' => 'Fichier trop volumineux (16 Mo maximum).',
            ]);
    }

    public function test_un_membre_publie_un_document(): void
    {
        Storage::fake('public');

        $alice = $this->membre('alice@example.com');
        $fichier = UploadedFile::fake()->create('guide.pdf', 100);

        $reponse = $this->actingAs($alice)
            ->post('/api/v1/resources', [
                'type' => 'document',
                'titre' => 'Guide API',
                'fichier' => $fichier,
            ], ['Accept' => 'application/json']);

        $reponse->assertCreated();
        $reponse->assertJsonPath('type', 'document');
        $reponse->assertJsonPath('titre', 'Guide API');
        $reponse->assertJsonPath('visibilite', 'publique');
        $reponse->assertJsonPath('auteur.id', $alice->id);
        $reponse->assertJsonPath('commentaires_count', 0);
        $this->assertNotNull($reponse->json('fichier_url'));

        $this->assertDatabaseHas('ressources', [
            'utilisateur_id' => $alice->id,
            'type' => 'document',
            'titre' => 'Guide API',
            'visibilite' => 'publique',
        ]);
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
}