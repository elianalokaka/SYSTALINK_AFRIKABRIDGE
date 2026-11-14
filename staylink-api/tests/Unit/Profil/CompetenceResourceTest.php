<?php

namespace Tests\Unit\Profil;

use App\Http\Resources\CompetenceResource;
use App\Models\Competence;
use Illuminate\Http\Request;
use Tests\TestCase;

class CompetenceResourceTest extends TestCase
{
    public function test_to_array_ne_renvoie_que_id_nom_categorie(): void
    {
        $competence = (new Competence)->forceFill([
            'id' => 6,
            'nom' => 'Laravel',
            'categorie' => 'framework',
        ]);

        $json = (new CompetenceResource($competence))->toArray(Request::create('/api/v1/skills', 'GET'));

        $this->assertSame([
            'id' => 6,
            'nom' => 'Laravel',
            'categorie' => 'framework',
        ], $json);
    }
}
