<?php

namespace Tests\Unit\Profil;

use App\Http\Resources\ProfilPriveResource;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Tests\TestCase;

class ProfilPriveResourceTest extends TestCase
{
    public function test_to_array_omet_role_profil_quand_il_est_vide(): void
    {
        $utilisateur = (new Utilisateur)->forceFill([
            'id' => 1,
            'nom' => 'Lokoka',
            'prenom' => 'Eliana',
            'email' => 'eliana@example.com',
            'pays' => 'CD',
        ]);
        $utilisateur->setRelation('competences', collect());
        $utilisateur->setRelation('domaines', collect());
        $utilisateur->setRelation('liens', collect());

        $json = (new ProfilPriveResource($utilisateur))->resolve(Request::create('/api/v1/auth/me', 'GET'));

        $this->assertArrayNotHasKey('role_profil', $json);
        $this->assertArrayNotHasKey('prenom', $json);
        $this->assertSame('Eliana Lokoka', $json['nom']);
        $this->assertSame('eliana@example.com', $json['email']);
        $this->assertSame([], $json['domaines']);
        $this->assertSame([], $json['liens']);
        $this->assertNull($json['region']);
    }
}
