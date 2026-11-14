<?php

namespace Tests\Unit\Projet;

use App\Http\Resources\ProjetCarteResource;
use App\Models\Projet;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Tests\TestCase;

class ProjetCarteResourceTest extends TestCase
{
    public function test_to_array_tronque_la_description_et_n_expose_pas_la_description_complete(): void
    {
        $createur = (new Utilisateur)->forceFill([
            'id' => 2,
            'nom' => 'Ndiaye',
            'prenom' => 'Fatou',
            'pays' => 'SN',
        ]);
        $projet = (new Projet)->forceFill([
            'id' => 1,
            'nom' => 'Smart Agriculture RDC',
            'description' => str_repeat('x', 250),
            'statut' => 'recrutement',
            'progression' => 10,
            'nombre_max_membres' => 5,
        ]);
        $projet->setRelation('createur', $createur);
        $projet->setRelation('domaines', collect());
        $projet->setRelation('competences', collect());
        $projet->participations_count = 1;
        $projet->is_member = false;
        $projet->ma_demande_statut = null;

        $json = (new ProjetCarteResource($projet))->toArray(Request::create('/api/v1/projects', 'GET'));

        $this->assertArrayNotHasKey('description', $json);
        $this->assertSame(200, mb_strlen($json['description_courte']));
        $this->assertArrayNotHasKey('role_profil', $json['createur']);
        $this->assertSame('Fatou Ndiaye', $json['createur']['nom']);
    }
}
