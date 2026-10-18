<?php

namespace Tests\Feature\Profil;

use App\Models\Competence;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfilTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_profile_hides_email_for_other_users(): void
    {
        $owner = $this->membre('owner@example.com');
        $viewer = $this->membre('viewer@example.com');

        $this->actingAs($viewer)
            ->getJson('/api/v1/users/'.$owner->id)
            ->assertOk()
            ->assertJsonPath('id', $owner->id)
            ->assertJsonMissingPath('email');
    }

    public function test_public_profile_requires_authentication(): void
    {
        $owner = $this->membre('owner@example.com');

        $this->getJson('/api/v1/users/'.$owner->id)
            ->assertUnauthorized();
    }

    public function test_public_profile_hides_email_even_from_its_owner(): void
    {
        $owner = $this->membre('owner@example.com');

        $this->actingAs($owner)
            ->getJson('/api/v1/users/'.$owner->id)
            ->assertOk()
            ->assertJsonMissingPath('email');
    }

    public function test_authenticated_user_can_partially_update_profile(): void
    {
        $user = $this->membre('alice@example.com');

        $this->actingAs($user)
            ->patchJson('/api/v1/users/me', [
                'bio' => 'Nouvelle bio de developpeuse.',
                'pays' => 'FR',
            ])
            ->assertOk()
            ->assertJsonPath('bio', 'Nouvelle bio de developpeuse.')
            ->assertJsonPath('pays', 'FR')
            ->assertJsonPath('id', $user->id);

        $this->assertDatabaseHas('utilisateurs', [
            'id' => $user->id,
            'biographie' => 'Nouvelle bio de developpeuse.',
            'pays' => 'FR',
            'email' => 'alice@example.com',
        ]);
    }

    public function test_profile_patch_requires_authentication(): void
    {
        $this->patchJson('/api/v1/users/me', [
            'bio' => 'Tentative non autoris�e',
        ])->assertUnauthorized();
    }

    public function test_put_users_me_skills_replaces_the_entire_list(): void
    {
        $user = $this->membre('skills@example.com');
        $php = Competence::query()->create(['nom' => 'PHP', 'categorie' => 'langage']);
        $laravel = Competence::query()->create(['nom' => 'Laravel', 'categorie' => 'framework']);
        $javascript = Competence::query()->create(['nom' => 'JavaScript', 'categorie' => 'langage']);

        $user->competences()->sync([
            $php->id => ['niveau' => 'avance'],
            $laravel->id => ['niveau' => 'intermediaire'],
        ]);

        $this->actingAs($user)
            ->putJson('/api/v1/users/me/skills', [
                'competences' => [
                    ['competence_id' => $javascript->id, 'niveau' => 'avance'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('competences.0.id', $javascript->id)
            ->assertJsonPath('competences.0.niveau', 'avance');

        $this->assertDatabaseHas('utilisateur_competence', [
            'utilisateur_id' => $user->id,
            'competence_id' => $javascript->id,
            'niveau' => 'avance',
        ]);

        $this->assertDatabaseMissing('utilisateur_competence', [
            'utilisateur_id' => $user->id,
            'competence_id' => $php->id,
        ]);
    }

    public function test_put_users_me_skills_rejects_unknown_competence_ids(): void
    {
        $user = $this->membre('unknown-skills@example.com');

        $this->actingAs($user)
            ->putJson('/api/v1/users/me/skills', [
                'competences' => [
                    ['competence_id' => 999999, 'niveau' => 'debutant'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['competences.0.competence_id']);
    }

    public function test_put_users_me_skills_validates_payload(): void
    {
        $user = $this->membre('validation-skills@example.com');
        $php = Competence::query()->create(['nom' => 'PHP', 'categorie' => 'langage']);

        $this->actingAs($user)
            ->putJson('/api/v1/users/me/skills', [
                'competences' => [
                    ['competence_id' => $php->id, 'niveau' => 'niveau_inconnu'],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['competences.0.niveau']);
    }

    public function test_put_users_me_skills_can_clear_the_entire_list(): void
    {
        $user = $this->membre('clear-skills@example.com');
        $php = Competence::query()->create(['nom' => 'PHP', 'categorie' => 'langage']);
        $user->competences()->attach($php->id);

        $this->actingAs($user)
            ->putJson('/api/v1/users/me/skills', ['competences' => []])
            ->assertOk()
            ->assertExactJson(['competences' => []]);

        $this->assertDatabaseMissing('utilisateur_competence', [
            'utilisateur_id' => $user->id,
            'competence_id' => $php->id,
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
            'biographie' => 'Ancienne bio',
        ]);
    }
}
