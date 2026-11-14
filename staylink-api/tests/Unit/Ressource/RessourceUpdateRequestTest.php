<?php

namespace Tests\Unit\Ressource;

use App\Http\Requests\Api\V1\Ressource\RessourceUpdateRequest;
use PHPUnit\Framework\TestCase;

class RessourceUpdateRequestTest extends TestCase
{
    public function test_le_contrat_interdit_de_changer_type_fichier_et_visibilite(): void
    {
        $regles = (new RessourceUpdateRequest)->rules();

        $this->assertArrayHasKey('titre', $regles);
        $this->assertArrayHasKey('description', $regles);
        $this->assertArrayHasKey('competence_ids', $regles);
        $this->assertArrayNotHasKey('type', $regles);
        $this->assertArrayNotHasKey('fichier', $regles);
        $this->assertArrayNotHasKey('visibilite', $regles);
        $this->assertContains('sometimes', $regles['titre']);
        $this->assertContains('max:200', $regles['titre']);
    }
}
