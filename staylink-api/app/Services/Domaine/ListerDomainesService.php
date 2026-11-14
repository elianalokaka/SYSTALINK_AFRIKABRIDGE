<?php

namespace App\Services\Domaine;

use App\Models\ProjetDomaine;
use App\Models\UtilisateurDomaine;
use App\Support\CatalogueDomaines;

class ListerDomainesService
{
    /**
     * Catalogue fixe + noms libres déjà enregistrés en base.
     *
     * @return list<string>
     */
    public function lister(): array
    {
        $fixes = [];
        foreach (array_keys(CatalogueDomaines::LIBELLES) as $valeur) {
            if ($valeur !== 'autre') {
                $fixes[] = $valeur;
            }
        }

        $enBase = UtilisateurDomaine::query()->distinct()->pluck('domaine')
            ->merge(ProjetDomaine::query()->distinct()->pluck('domaine'));

        $libres = [];
        foreach ($enBase as $nom) {
            $resolu = CatalogueDomaines::resoudre((string) $nom);
            if ($resolu === '' || $resolu === 'autre' || in_array($resolu, $fixes, true)) {
                continue;
            }
            $libres[$resolu] = $resolu;
        }

        $noms = array_values($libres);
        natcasesort($noms);

        return array_merge($fixes, array_values($noms));
    }
}
