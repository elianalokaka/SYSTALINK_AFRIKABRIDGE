<?php

namespace Tests\Unit\Profil;

use App\Http\Requests\Api\V1\Profil\ModifierProfilRequest;
use PHPUnit\Framework\TestCase;

class ModifierProfilRequestTest extends TestCase
{
    public function test_le_contrat_autorise_region_role_domaines_et_liens(): void
    {
        $regles = (new ModifierProfilRequest)->rules();

        $this->assertArrayHasKey('region', $regles);
        $this->assertArrayHasKey('role_profil', $regles);
        $this->assertArrayHasKey('domaines', $regles);
        $this->assertArrayHasKey('liens', $regles);
        $this->assertArrayHasKey('domaines.*', $regles);
        $this->assertArrayHasKey('liens.*.type', $regles);
        $this->assertArrayHasKey('liens.*.url', $regles);
        $this->assertContains('sometimes', $regles['nom']);
        $this->assertContains('sometimes', $regles['bio']);
        $this->assertContains('sometimes', $regles['pays']);
    }
}
