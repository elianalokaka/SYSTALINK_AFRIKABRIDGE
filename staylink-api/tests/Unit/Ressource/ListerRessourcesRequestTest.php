<?php

namespace Tests\Unit\Ressource;

use App\Http\Requests\Api\V1\Ressource\ListerRessourcesRequest;
use PHPUnit\Framework\TestCase;

class ListerRessourcesRequestTest extends TestCase
{
    public function test_le_type_suit_l_enum_du_contrat(): void
    {
        $regles = (new ListerRessourcesRequest)->rules();

        $this->assertStringContainsString('document', (string) $regles['type'][3]);
        $this->assertStringContainsString('lien', (string) $regles['type'][3]);
    }

    public function test_messages_sont_en_francais(): void
    {
        $messages = (new ListerRessourcesRequest)->messages();

        $this->assertSame(
            'Le type de ressource n\'est pas reconnu.',
            $messages['type.in']
        );
    }
}
