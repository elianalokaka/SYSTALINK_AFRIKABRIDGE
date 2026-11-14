<?php

namespace App\Support;

class TexteNormalise
{
    public static function clef(string $valeur): string
    {
        $translitere = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $valeur);
        $source = is_string($translitere) ? $translitere : $valeur;
        $minuscule = mb_strtolower($source, 'UTF-8');
        $espace = preg_replace('/[^a-z0-9]+/u', ' ', $minuscule) ?? $minuscule;

        return trim($espace);
    }
}
