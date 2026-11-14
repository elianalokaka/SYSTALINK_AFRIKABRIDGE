<?php

namespace Tests\Unit\Profil;

use App\Http\Requests\Api\V1\Profil\ListerCompetencesRequest;
use PHPUnit\Framework\TestCase;

class ListerCompetencesRequestTest extends TestCase
{
    public function test_categorie_n_accepte_que_les_valeurs_du_contrat(): void
    {
        $regles = (new ListerCompetencesRequest)->rules();

        $this->assertStringContainsString('in:langage,framework,outil,domaine_technique,design,gestion_projet,autre', $regles['categorie'][3]);
    }

    public function test_message_categorie_est_en_francais(): void
    {
        $messages = (new ListerCompetencesRequest)->messages();

        $this->assertArrayHasKey('categorie.in', $messages);
        $this->assertStringContainsString('catégorie', $messages['categorie.in']);
    }
}
