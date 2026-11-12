<?php

namespace Tests\Feature\Dashboard;

use App\Models\Abonnement;
use App\Models\Candidature;
use App\Models\MembreProjet;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_retourne_les_projets_et_les_agregats_personnels(): void
    {
        $utilisateur = $this->utilisateur('moi@example.com');
        $projets = [];

        foreach (range(1, 6) as $index) {
            $projet = $this->projet($utilisateur, "Projet {$index}");
            DB::table('projets')
                ->where('id', $projet->id)
                ->update(['updated_at' => "2026-10-0{$index} 12:00:00"]);
            $projets[] = $projet;
        }

        $autreProprietaire = $this->utilisateur('autre@example.com');
        $projetExterne = $this->projet($autreProprietaire, 'Projet externe');
        $candidatExterne = $this->utilisateur('candidat@example.com');
        $candidatureRecue = Candidature::query()->create([
            'projet_id' => $projets[0]->id,
            'candidat_id' => $candidatExterne->id,
        ]);
        $candidatureTraitee = Candidature::query()->create([
            'projet_id' => $projets[1]->id,
            'candidat_id' => $candidatExterne->id,
        ]);
        $candidatureTraitee->update(['statut' => 'acceptee']);
        Candidature::query()->create([
            'projet_id' => $projetExterne->id,
            'candidat_id' => $utilisateur->id,
        ]);

        Abonnement::query()->create([
            'abonne_id' => $autreProprietaire->id,
            'suivi_id' => $utilisateur->id,
        ]);
        Abonnement::query()->create([
            'abonne_id' => $candidatExterne->id,
            'suivi_id' => $utilisateur->id,
        ]);
        Abonnement::query()->create([
            'abonne_id' => $utilisateur->id,
            'suivi_id' => $autreProprietaire->id,
        ]);

        $reponse = $this->actingAs($utilisateur)
            ->getJson('/api/v1/me/dashboard')
            ->assertOk()
            ->assertJsonStructure([
                'mes_projets' => [[
                    'id',
                    'nom',
                    'domaines',
                    'statut',
                    'progression',
                    'nombre_membres_souhaite',
                    'nombre_membres_actuel',
                ]],
                'projets_count',
                'demandes_recues_en_attente',
                'mes_demandes_en_attente',
                'followers_count',
                'following_count',
            ])
            ->assertJsonPath('projets_count', 6)
            ->assertJsonPath('demandes_recues_en_attente', 1)
            ->assertJsonPath('mes_demandes_en_attente', 1)
            ->assertJsonPath('followers_count', 2)
            ->assertJsonPath('following_count', 1);

        $this->assertSame(
            collect($projets)->reverse()->take(5)->pluck('id')->values()->all(),
            collect($reponse->json('mes_projets'))->pluck('id')->all()
        );
        $this->assertSame($projets[5]->id, $reponse->json('mes_projets.0.id'));
        $this->assertSame(['agriculture'], $reponse->json('mes_projets.0.domaines'));
        $this->assertSame(1, $reponse->json('mes_projets.0.nombre_membres_actuel'));
        $this->assertSame('en_attente', $candidatureRecue->fresh()->statut);
    }

    public function test_dashboard_refuse_les_visiteurs_non_authentifies(): void
    {
        $this->getJson('/api/v1/me/dashboard')
            ->assertUnauthorized();
    }

    public function test_dashboard_retourne_des_listes_et_compteurs_vides_sans_activite(): void
    {
        $utilisateur = $this->utilisateur('sans-activite@example.com');

        $this->actingAs($utilisateur)
            ->getJson('/api/v1/me/dashboard')
            ->assertOk()
            ->assertJsonPath('mes_projets', [])
            ->assertJsonPath('projets_count', 0)
            ->assertJsonPath('demandes_recues_en_attente', 0)
            ->assertJsonPath('mes_demandes_en_attente', 0)
            ->assertJsonPath('followers_count', 0)
            ->assertJsonPath('following_count', 0);
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

    private function projet(Utilisateur $proprietaire, string $nom): Projet
    {
        $projet = Projet::query()->create([
            'createur_id' => $proprietaire->id,
            'nom' => $nom,
            'description' => 'Projet de test.',
            'domaine' => 'agriculture',
            'objectifs' => 'Tester le dashboard.',
            'nombre_max_membres' => 5,
            'statut' => 'en_cours',
            'progression' => 40,
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
