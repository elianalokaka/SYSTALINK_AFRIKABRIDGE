<?php

namespace Tests\Feature\Projet;

use App\Models\Competence;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortfolioEtSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_portfolio_retourne_seulement_les_projets_termines_du_membre_par_date_decroissante(): void
    {
        $cible = $this->utilisateur('cible@example.com');
        $lecteur = $this->utilisateur('lecteur@example.com');
        $ancien = $this->projet($cible, 'Ancien projet', 'termine', '2026-01-10');
        $recent = $this->projet($cible, 'Projet recent', 'termine', '2026-03-20');
        $this->projet($cible, 'Projet en cours', 'en_cours', null);
        $nonMembre = $this->projet(
            $this->utilisateur('createur@example.com'),
            'Projet sans participation',
            'termine',
            '2026-04-01'
        );

        $reponse = $this->actingAs($lecteur)
            ->getJson("/api/v1/users/{$cible->id}/portfolio")
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'nom', 'statut', 'date_fin']]]);

        $this->assertSame(
            [$recent->id, $ancien->id],
            collect($reponse->json('data'))->pluck('id')->all()
        );
        $this->assertNotContains($nonMembre->id, collect($reponse->json('data'))->pluck('id')->all());
        $this->assertFalse($reponse->json('data.0.is_member'));
    }

    public function test_portfolio_refuse_un_visiteur_non_authentifie(): void
    {
        $cible = $this->utilisateur('cible@example.com');

        $this->getJson("/api/v1/users/{$cible->id}/portfolio")
            ->assertUnauthorized();
    }

    public function test_portfolio_renvoie_404_pour_un_utilisateur_inconnu(): void
    {
        $lecteur = $this->utilisateur('lecteur@example.com');

        $this->actingAs($lecteur)
            ->getJson('/api/v1/users/999999/portfolio')
            ->assertNotFound();
    }

    public function test_suggestions_classent_les_talents_par_competences_requises_et_excluent_son_equipe(): void
    {
        $moi = $this->utilisateur('moi@example.com');
        $projet = $this->projet($moi, 'Projet a recruter', 'recrutement', null);
        $php = $this->competence('PHP');
        $laravel = $this->competence('Laravel');
        $sql = $this->competence('SQL');
        $python = $this->competence('Python');
        $monSkill = $this->competence('JavaScript');
        $projet->competences()->sync([$php->id, $laravel->id, $sql->id]);
        $moi->competences()->attach($monSkill->id);

        $unMatch = $this->utilisateur('un-match@example.com');
        $unMatch->competences()->attach($php->id);

        $deuxMatchs = $this->utilisateur('deux-matchs@example.com');
        $deuxMatchs->competences()->attach([$php->id, $laravel->id, $monSkill->id]);

        $complementaire = $this->utilisateur('complementaire@example.com');
        $complementaire->competences()->attach($python->id);

        $membreEquipe = $this->utilisateur('membre-equipe@example.com');
        $membreEquipe->competences()->attach([$php->id, $sql->id]);
        $projet->membres()->attach($membreEquipe->id, ['role' => 'membre']);

        $sansCompetenceDifferente = $this->utilisateur('meme-skill@example.com');
        $sansCompetenceDifferente->competences()->attach($monSkill->id);

        $reponse = $this->actingAs($moi)
            ->getJson('/api/v1/users/suggestions')
            ->assertOk()
            ->assertJsonStructure(['data' => [['id', 'nom', 'photo_url', 'pays', 'role_profil', 'bio', 'competences', 'domaines', 'followers_count', 'is_following']]]);

        $ids = collect($reponse->json('data'))->pluck('id')->all();

        $this->assertSame(
            [$deuxMatchs->id, $unMatch->id, $complementaire->id],
            array_slice($ids, 0, 3)
        );
        $this->assertNotContains($moi->id, $ids);
        $this->assertNotContains($membreEquipe->id, $ids);
        $this->assertNotContains($sansCompetenceDifferente->id, $ids);
    }

    public function test_suggestions_appliquent_la_limite_demandee(): void
    {
        $moi = $this->utilisateur('moi@example.com');
        $this->projet($moi, 'Projet a recruter', 'recrutement', null);
        $competence = $this->competence('Rust');

        foreach (range(1, 3) as $index) {
            $talent = $this->utilisateur("talent{$index}@example.com");
            $talent->competences()->attach($competence->id);
        }

        $this->actingAs($moi)
            ->getJson('/api/v1/users/suggestions?limit=2')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_suggestions_utilisent_une_limite_par_defaut_de_dix(): void
    {
        $moi = $this->utilisateur('moi@example.com');
        $competence = $this->competence('Rust');

        foreach (range(1, 11) as $index) {
            $talent = $this->utilisateur("talent{$index}@example.com");
            $talent->competences()->attach($competence->id);
        }

        $this->actingAs($moi)
            ->getJson('/api/v1/users/suggestions')
            ->assertOk()
            ->assertJsonCount(10, 'data');
    }

    public function test_suggestions_valide_limit_entre_un_et_vingt(): void
    {
        $moi = $this->utilisateur('moi@example.com');

        $this->actingAs($moi)
            ->getJson('/api/v1/users/suggestions?limit=21')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['limit']);

        $this->actingAs($moi)
            ->getJson('/api/v1/users/suggestions?limit=0')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['limit']);
    }

    public function test_suggestions_refusent_les_visiteurs_non_authentifies(): void
    {
        $this->getJson('/api/v1/users/suggestions')
            ->assertUnauthorized();
    }

    private function utilisateur(string $email): Utilisateur
    {
        return Utilisateur::query()->create([
            'nom' => 'Lokaka',
            'prenom' => 'Eliana',
            'email' => $email,
            'mot_de_passe' => 'SecurePass123!',
            'pays' => 'CD',
        ]);
    }

    private function competence(string $nom): Competence
    {
        return Competence::query()->create(['nom' => $nom]);
    }

    private function projet(
        Utilisateur $proprietaire,
        string $nom,
        string $statut,
        ?string $dateFin
    ): Projet {
        $projet = Projet::query()->create([
            'createur_id' => $proprietaire->id,
            'nom' => $nom,
            'description' => 'Projet de test.',
            'domaine' => 'agriculture',
            'objectifs' => 'Tester le portfolio.',
            'nombre_max_membres' => 5,
            'statut' => $statut,
            'progression' => $statut === 'termine' ? 100 : 0,
            'date_fin' => $dateFin,
        ]);

        $projet->domaines()->create(['domaine' => 'agriculture']);
        MembreProjet::query()->create([
            'projet_id' => $projet->id,
            'utilisateur_id' => $proprietaire->id,
            'role' => 'proprietaire',
        ]);

        return $projet;
    }
}
