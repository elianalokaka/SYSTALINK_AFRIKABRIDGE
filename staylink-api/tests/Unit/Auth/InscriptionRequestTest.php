<?php

namespace Tests\Unit\Auth;

use App\Http\Requests\Api\V1\Auth\InscriptionRequest;
use PHPUnit\Framework\TestCase;

class InscriptionRequestTest extends TestCase
{
    public function test_prenom_n_est_pas_obligatoire(): void
    {
        $request = new InscriptionRequest;

        $this->assertNotContains('required', $request->rules()['prenom']);
        $this->assertContains('sometimes', $request->rules()['prenom']);
        $this->assertContains('required', $request->rules()['nom']);
    }
}
