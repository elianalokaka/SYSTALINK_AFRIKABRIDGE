<?php

namespace Tests\Unit\Projet;

use App\Http\Requests\Api\V1\Projet\ListerDemandesProjetRequest;
use PHPUnit\Framework\TestCase;

class ListerDemandesProjetRequestTest extends TestCase
{
    public function test_le_statut_n_accepte_que_les_trois_valeurs_du_contrat(): void
    {
        $regles = (new ListerDemandesProjetRequest)->rules();

        $this->assertStringContainsString('en_attente', (string) $regles['statut'][2]);
        $this->assertStringContainsString('acceptee', (string) $regles['statut'][2]);
        $this->assertStringContainsString('refusee', (string) $regles['statut'][2]);
    }

    public function test_messages_sont_en_francais(): void
    {
        $messages = (new ListerDemandesProjetRequest)->messages();

        $this->assertSame(
            'Le statut doit être en_attente, acceptee ou refusee.',
            $messages['statut.in']
        );
    }
}
