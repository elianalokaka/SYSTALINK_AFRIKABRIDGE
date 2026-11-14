<?php

namespace Tests\Unit\Projet;

use App\Http\Requests\Api\V1\Projet\MesProjetsRequest;
use PHPUnit\Framework\TestCase;

class MesProjetsRequestTest extends TestCase
{
    public function test_role_equipe_n_accepte_que_proprietaire_et_membre(): void
    {
        $regles = (new MesProjetsRequest)->rules();

        $this->assertStringContainsString('proprietaire', (string) $regles['role_equipe'][3]);
        $this->assertStringContainsString('membre', (string) $regles['role_equipe'][3]);
    }

    public function test_messages_sont_en_francais(): void
    {
        $messages = (new MesProjetsRequest)->messages();

        $this->assertSame(
            'Le rôle d\'équipe doit être proprietaire ou membre.',
            $messages['role_equipe.in']
        );
    }
}
