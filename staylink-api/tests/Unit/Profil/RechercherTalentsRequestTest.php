<?php

namespace Tests\Unit\Profil;

use App\Http\Requests\Api\V1\Profil\RechercherTalentsRequest;
use PHPUnit\Framework\TestCase;

class RechercherTalentsRequestTest extends TestCase
{
    public function test_competence_match_n_accepte_que_any_et_all(): void
    {
        $regles = (new RechercherTalentsRequest)->rules();

        $this->assertContains('in:any,all', $regles['competence_match']);
    }

    public function test_per_page_est_plafonne_a_cinquante(): void
    {
        $regles = (new RechercherTalentsRequest)->rules();

        $this->assertContains('max:50', $regles['per_page']);
    }

    public function test_les_messages_sont_en_francais(): void
    {
        $messages = (new RechercherTalentsRequest)->messages();

        $this->assertSame('Le critère de compétences doit être any ou all.', $messages['competence_match.in']);
    }
}
