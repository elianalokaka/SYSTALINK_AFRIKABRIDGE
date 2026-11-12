<?php

namespace Tests\Unit\Profil;

use App\Http\Resources\ProfilPublicResource;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Tests\TestCase;

class ProfilPublicResourceTest extends TestCase
{
    public function test_to_array_omet_role_profil_et_n_expose_pas_l_email(): void
    {
        $utilisateur = (new Utilisateur)->forceFill([
            'id' => 4,
            'nom' => 'Ndiaye',
            'prenom' => 'Fatou',
            'email' => 'fatou@example.com',
            'pays' => 'SN',
        ]);
        $utilisateur->setRelation('competences', collect());
        $utilisateur->setRelation('domaines', collect());
        $utilisateur->setRelation('liens', collect());

        $json = (new ProfilPublicResource($utilisateur))->resolve(Request::create('/api/v1/users/4', 'GET'));

        $this->assertArrayNotHasKey('role_profil', $json);
        $this->assertArrayNotHasKey('email', $json);
        $this->assertArrayNotHasKey('prenom', $json);
        $this->assertSame('Fatou Ndiaye', $json['nom']);
        $this->assertSame([], $json['domaines']);
        $this->assertSame([], $json['liens']);
    }
}
