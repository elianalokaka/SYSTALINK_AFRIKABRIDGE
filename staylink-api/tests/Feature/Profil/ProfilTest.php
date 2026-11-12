<?php

namespace Tests\Feature\Profil;

use App\Models\Competence;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Abonnement;
use App\Models\MembreProjet;
use App\Models\Projet;
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
            ->assertJsonMissingPath('email')
            ->assertJsonMissingPath('role_profil');
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

    public function test_authenticated_user_can_update_region_role_domaines_et_liens(): void
    {
        $user = $this->membre('alice@example.com');

        $this->actingAs($user)
            ->patchJson('/api/v1/users/me', [
                'nom' => 'Eliana Lokoka',
                'region' => 'Kinshasa',
                'role_profil' => 'fullstack',
                'domaines' => ['agriculture', 'iot'],
                'liens' => [
                    [
                        'type' => 'github',
                        'url' => 'https://github.com/eliana',
                    ],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('nom', 'Eliana Lokoka')
            ->assertJsonPath('region', 'Kinshasa')
            ->assertJsonPath('role_profil', 'fullstack')
            ->assertJsonPath('domaines.0', 'agriculture')
            ->assertJsonPath('domaines.1', 'iot')
            ->assertJsonPath('liens.0.type', 'github')
            ->assertJsonPath('liens.0.url', 'https://github.com/eliana')
            ->assertJsonMissingPath('prenom')
            ->assertJsonPath('email', 'alice@example.com');

        $this->assertDatabaseHas('utilisateurs', [
            'id' => $user->id,
            'prenom' => 'Eliana',
            'nom' => 'Lokoka',
            'region' => 'Kinshasa',
            'role_profil' => 'fullstack',
            'domaine' => 'agriculture',
        ]);
        $this->assertDatabaseHas('utilisateur_domaines', [
            'utilisateur_id' => $user->id,
            'domaine' => 'iot',
        ]);
        $this->assertDatabaseHas('utilisateur_liens', [
            'utilisateur_id' => $user->id,
            'type' => 'github',
            'url' => 'https://github.com/eliana',
        ]);
    }

    public function test_un_domaine_libre_est_enregistre_sous_son_nom(): void
    {
        $user = $this->membre('domaine-libre@example.com');

        $this->actingAs($user)
            ->patchJson('/api/v1/users/me', [
                'domaines' => ['éducation', 'Agroécologie'],
            ])
            ->assertOk()
            ->assertJsonPath('domaines.0', 'education')
            ->assertJsonPath('domaines.1', 'Agroécologie');

        $this->assertDatabaseHas('utilisateur_domaines', [
            'utilisateur_id' => $user->id,
            'domaine' => 'Agroécologie',
        ]);
        $this->assertDatabaseMissing('utilisateur_domaines', [
            'utilisateur_id' => $user->id,
            'domaine' => 'autre',
        ]);
    }

    public function test_profile_patch_does_not_wipe_omitted_fields(): void
    {
        $user = $this->membre('alice@example.com');
        $user->update([
            'region' => 'Kinshasa',
            'role_profil' => 'fullstack',
        ]);
        $user->domaines()->create(['domaine' => 'agriculture']);

        $this->actingAs($user)
            ->patchJson('/api/v1/users/me', [
                'bio' => 'Bio seule.',
            ])
            ->assertOk()
            ->assertJsonPath('bio', 'Bio seule.')
            ->assertJsonPath('region', 'Kinshasa')
            ->assertJsonPath('role_profil', 'fullstack')
            ->assertJsonPath('domaines.0', 'agriculture');
    }

    public function test_profile_patch_rejects_unknown_role(): void
    {
        $user = $this->membre('alice@example.com');

        $this->actingAs($user)
            ->patchJson('/api/v1/users/me', [
                'role_profil' => 'magicien',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['role_profil']);
    }

    public function test_public_profile_exposes_domaines_without_email(): void
    {
        $owner = $this->membre('owner@example.com');
        $owner->update([
            'region' => 'Dakar',
            'role_profil' => 'designer_ui_ux',
        ]);
        $owner->domaines()->create(['domaine' => 'education']);
        $viewer = $this->membre('viewer@example.com');

        $this->actingAs($viewer)
            ->getJson('/api/v1/users/'.$owner->id)
            ->assertOk()
            ->assertJsonMissingPath('email')
            ->assertJsonPath('region', 'Dakar')
            ->assertJsonPath('role_profil', 'designer_ui_ux')
            ->assertJsonPath('domaines.0', 'education');
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

    public function test_un_nom_deja_present_ecrit_autrement_reutilise_la_competence(): void
    {
        $user = $this->membre('skills-nom@example.com');
        $javascript = Competence::query()->create(['nom' => 'JavaScript', 'categorie' => 'langage']);

        $this->actingAs($user)
            ->putJson('/api/v1/users/me/skills', [
                'competences' => [
                    ['nom' => 'javascript', 'niveau' => 'avance'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('competences.0.id', $javascript->id)
            ->assertJsonPath('competences.0.nom', 'JavaScript');

        $this->assertDatabaseCount('competences', 1);
    }

    public function test_un_nom_inconnu_cree_la_competence(): void
    {
        $user = $this->membre('skills-nouvelle@example.com');

        $this->actingAs($user)
            ->putJson('/api/v1/users/me/skills', [
                'competences' => [
                    ['nom' => 'Rust', 'niveau' => 'debutant'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('competences.0.nom', 'Rust')
            ->assertJsonPath('competences.0.categorie', 'autre')
            ->assertJsonPath('competences.0.niveau', 'debutant');

        $this->assertDatabaseHas('competences', [
            'nom' => 'Rust',
            'categorie' => 'autre',
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

    public function test_le_profil_public_expose_les_compteurs_relatifs_au_visiteur(): void
    {
        $cible = $this->membre('cible@example.com');
        $visiteur = $this->membre('visiteur@example.com');
        $fan = $this->membre('fan@example.com');
        $autre = $this->membre('autre@example.com');

        Abonnement::query()->create([
            'abonne_id' => $visiteur->id,
            'suivi_id' => $cible->id,
        ]);
        Abonnement::query()->create([
            'abonne_id' => $fan->id,
            'suivi_id' => $cible->id,
        ]);
        Abonnement::query()->create([
            'abonne_id' => $cible->id,
            'suivi_id' => $autre->id,
        ]);

        $this->actingAs($visiteur)
            ->getJson('/api/v1/users/'.$cible->id)
            ->assertOk()
            ->assertJsonMissingPath('email')
            ->assertJsonPath('followers_count', 2)
            ->assertJsonPath('following_count', 1)
            ->assertJsonPath('is_following', true);

        $this->actingAs($autre)
            ->getJson('/api/v1/users/'.$cible->id)
            ->assertOk()
            ->assertJsonPath('is_following', false)
            ->assertJsonPath('followers_count', 2);
    }

    public function test_le_profil_prive_expose_les_compteurs_sans_se_suivre(): void
    {
        $moi = $this->membre('moi@example.com');
        $fan = $this->membre('fan@example.com');
        $suivi = $this->membre('suivi@example.com');

        Abonnement::query()->create([
            'abonne_id' => $fan->id,
            'suivi_id' => $moi->id,
        ]);
        Abonnement::query()->create([
            'abonne_id' => $moi->id,
            'suivi_id' => $suivi->id,
        ]);

        $this->actingAs($moi)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('email', 'moi@example.com')
            ->assertJsonPath('followers_count', 1)
            ->assertJsonPath('following_count', 1)
            ->assertJsonPath('is_following', false);
    }

    public function test_le_profil_public_compte_seulement_les_projets_termines_du_membre(): void
{
    $cible = $this->membre('cible-portfolio@example.com');
    $visiteur = $this->membre('lecteur-portfolio@example.com');
    $autre = $this->membre('autre-portfolio@example.com');

    $this->projetPour($cible, 'Smart Agriculture', 'termine');
    $this->projetPour($cible, 'Encore en cours', 'en_cours');
    $this->projetPour($autre, 'Projet d un autre', 'termine');

    $rejoins = $this->projetPour($autre, 'Projet rejoint', 'termine');
    MembreProjet::query()->create([
        'projet_id' => $rejoins->id,
        'utilisateur_id' => $cible->id,
        'role' => 'membre',
    ]);

    $this->actingAs($visiteur)
        ->getJson('/api/v1/users/'.$cible->id)
        ->assertOk()
        ->assertJsonMissingPath('email')
        ->assertJsonPath('projets_realises_count', 2);
}

public function test_le_profil_prive_compte_les_projets_termines(): void
{
    $moi = $this->membre('moi-portfolio@example.com');

    $this->projetPour($moi, 'Projet livre', 'termine');
    $this->projetPour($moi, 'Projet ouvert', 'recrutement');

    $this->actingAs($moi)
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('email', 'moi-portfolio@example.com')
        ->assertJsonPath('projets_realises_count', 1);
}

    private function projetPour(Utilisateur $proprietaire, string $nom, string $statut): Projet
    {
        $projet = Projet::query()->create([
            'createur_id' => $proprietaire->id,
            'nom' => $nom,
            'description' => 'Projet de test.',
            'domaine' => 'agriculture',
            'objectifs' => 'Tester le compteur portfolio.',
            'nombre_max_membres' => 5,
            'statut' => $statut,
            'progression' => $statut === 'termine' ? 100 : 0,
        ]);

        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $proprietaire->id,
            'role' => 'proprietaire',
        ]);

        return $projet;
    }
}
