<?php

namespace Tests\Unit\Profil;

use App\Http\Resources\TalentResource;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Tests\TestCase;

class TalentResourceTest extends TestCase
{
    public function test_to_array_n_expose_pas_email_et_tronque_la_bio(): void
    {
        $talent = (new Utilisateur)->forceFill([
            'id' => 4,
            'nom' => 'Kabongo',
            'prenom' => 'Jean-Marc',
            'email' => 'secret@example.com',
            'pays' => 'CD',
            'biographie' => str_repeat('a', 200),
        ]);
        $talent->setRelation('competences', collect());

        $json = (new TalentResource($talent))->toArray(Request::create('/api/v1/users', 'GET'));

        $this->assertArrayNotHasKey('email', $json);
        $this->assertSame('Jean-Marc Kabongo', $json['nom']);
        $this->assertSame(160, mb_strlen($json['bio_courte']));
        $this->assertArrayNotHasKey('bio', $json);
    }
}
