<?php

namespace Tests\Unit\Projet;

use App\Http\Requests\Api\V1\Projet\ListerProjetsRequest;
use PHPUnit\Framework\TestCase;

class ListerProjetsRequestTest extends TestCase
{
    public function test_le_statut_n_accepte_que_les_valeurs_techniques(): void
    {
        $regles = (new ListerProjetsRequest)->rules();

        $this->assertStringContainsString('recrutement', (string) $regles['statut'][3]);
        $this->assertStringContainsString('termine', (string) $regles['statut'][3]);
    }

    public function test_messages_sont_en_francais(): void
    {
        $messages = (new ListerProjetsRequest)->messages();

        $this->assertSame(
            'Le statut doit être recrutement, en_cours ou termine.',
            $messages['statut.in']
        );
    }
}
