<?php

namespace Tests\Unit\Ressource;

use App\Http\Requests\Api\V1\Ressource\CommentaireCreateRequest;
use PHPUnit\Framework\TestCase;

class CommentaireCreateRequestTest extends TestCase
{
    public function test_le_contenu_est_requis_et_borne_a_mille_caracteres(): void
    {
        $regles = (new CommentaireCreateRequest)->rules();

        $this->assertContains('required', $regles['contenu']);
        $this->assertContains('max:1000', $regles['contenu']);
    }
}
