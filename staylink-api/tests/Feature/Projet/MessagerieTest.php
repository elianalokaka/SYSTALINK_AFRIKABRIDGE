<?php

namespace Tests\Feature\Projet;

use App\Models\MembreProjet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessagerieTest extends TestCase
{
    use RefreshDatabase;

    public function test_un_non_membre_ne_peut_ni_lire_ni_ecrire(): void
    {
        $alice = $this->membre('alice@example.com');
        $carol = $this->membre('carol@example.com');
        $projetId = $this->projet($alice);

        $this->actingAs($carol)
            ->postJson("/api/v1/projects/{$projetId}/messages", [
                'contenu' => 'Bonjour',
            ])
            ->assertForbidden();

        $this->actingAs($carol)
            ->getJson("/api/v1/projects/{$projetId}/messages")
            ->assertForbidden();
    }

    public function test_un_membre_envoie_un_message(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projetId = $this->projet($alice);
        $this->ajouterMembre($projetId, $bob);

        $reponse = $this->actingAs($bob)->postJson(
            "/api/v1/projects/{$projetId}/messages",
            ['contenu' => 'Je commence demain.']
        );

        $reponse->assertCreated();
        $reponse->assertJsonPath('contenu', 'Je commence demain.');
        $reponse->assertJsonPath('auteur.id', $bob->id);
        $reponse->assertJsonPath('projet_id', $projetId);
    }

    public function test_la_suppression_apparait_dans_supprimes(): void
    {
        $alice = $this->membre('alice@example.com');
        $bob = $this->membre('bob@example.com');
        $projetId = $this->projet($alice);
        $this->ajouterMembre($projetId, $bob);

        $creation = $this->actingAs($bob)->postJson(
            "/api/v1/projects/{$projetId}/messages",
            ['contenu' => 'Message à retirer.']
        );
        $creation->assertCreated();
        $messageId = $creation->json('id');

        $avant = $this->actingAs($alice)->getJson("/api/v1/projects/{$projetId}/messages");
        $avant->assertOk();
        $depuis = $avant->json('meta.server_time');

        $this->actingAs($bob)
            ->deleteJson("/api/v1/projects/{$projetId}/messages/{$messageId}")
            ->assertNoContent();

        $apres = $this->actingAs($alice)->getJson(
            "/api/v1/projects/{$projetId}/messages?depuis=".urlencode($depuis)
        );

        $apres->assertOk();
        $this->assertContains($messageId, $apres->json('supprimes'));
        $this->assertNotContains(
            $messageId,
            collect($apres->json('data'))->pluck('id')->all()
        );
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

    private function projet(Utilisateur $createur): int
    {
        $reponse = $this->actingAs($createur)->postJson('/api/v1/projects', [
            'nom' => 'Smart Agriculture RDC',
            'description' => 'Suivre les parcelles agricoles.',
            'domaines' => ['agriculture'],
            'objectifs' => 'Relier les producteurs.',
            'nombre_membres_souhaite' => 5,
        ]);

        $reponse->assertCreated();

        return $reponse->json('id');
    }

    private function ajouterMembre(int $projetId, Utilisateur $utilisateur): void
    {
        MembreProjet::query()->create([
            'projet_id' => $projetId,
            'utilisateur_id' => $utilisateur->id,
            'role' => 'membre',
        ]);
    }
}