<?php

namespace App\Support;

class CatalogueDomaines
{
    /**
     * @var array<string, string>
     */
    public const LIBELLES = [
        'agriculture' => 'Agriculture',
        'sante' => 'Santé',
        'education' => 'Éducation',
        'fintech' => 'Fintech',
        'energie' => 'Énergie',
        'transport' => 'Transport',
        'iot' => 'IoT',
        'intelligence_artificielle' => 'Intelligence artificielle',
        'commerce' => 'Commerce',
        'environnement' => 'Environnement',
        'administration' => 'Administration',
        'autre' => 'Autre',
    ];

    public static function resoudre(string $saisie): string
    {
        $nom = trim(preg_replace('/\s+/u', ' ', $saisie) ?? $saisie);
        if ($nom === '') {
            return '';
        }

        $clef = TexteNormalise::clef($nom);

        foreach (self::LIBELLES as $valeur => $libelle) {
            if ($valeur === 'autre') {
                continue;
            }

            $clefValeur = TexteNormalise::clef(str_replace('_', ' ', $valeur));
            $clefLibelle = TexteNormalise::clef($libelle);

            if ($clef === $clefValeur || $clef === $clefLibelle) {
                return $valeur;
            }
        }

        if (TexteNormalise::clef('autre') === $clef) {
            return 'autre';
        }

        return $nom;
    }

    /**
     * @param  list<mixed>  $domaines
     * @return list<string>
     */
    public static function normaliserListe(array $domaines): array
    {
        $uniques = [];

        foreach ($domaines as $domaine) {
            if (! is_string($domaine)) {
                continue;
            }

            $resolu = self::resoudre($domaine);
            if ($resolu === '') {
                continue;
            }

            $uniques[$resolu] = $resolu;
        }

        return array_values($uniques);
    }
}
