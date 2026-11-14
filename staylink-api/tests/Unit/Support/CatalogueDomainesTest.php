<?php

namespace Tests\Unit\Support;

use App\Support\CatalogueDomaines;
use PHPUnit\Framework\TestCase;

class CatalogueDomainesTest extends TestCase
{
    public function test_un_libelle_catalogue_est_resolu_vers_la_valeur_technique(): void
    {
        $this->assertSame('education', CatalogueDomaines::resoudre('Éducation'));
        $this->assertSame('education', CatalogueDomaines::resoudre('education'));
    }

    public function test_un_nom_inconnu_est_conserve(): void
    {
        $this->assertSame('Agroécologie', CatalogueDomaines::resoudre('Agroécologie'));
    }

    public function test_la_liste_dedoublonne_apres_resolution(): void
    {
        $this->assertSame(
            ['education', 'Agroécologie'],
            CatalogueDomaines::normaliserListe(['éducation', 'education', 'Agroécologie'])
        );
    }
}
