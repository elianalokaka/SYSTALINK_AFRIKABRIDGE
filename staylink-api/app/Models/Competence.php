<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Competence extends Model
{
    protected $table = 'competences';

    protected $fillable = [
        'nom',
        'categorie',
    ];

    /**
     * Utilisateurs possédant cette compétence.
     */
    public function utilisateurs(): BelongsToMany
    {
        return $this->belongsToMany(
            Utilisateur::class,
            'utilisateur_competence',
            'competence_id',
            'utilisateur_id'
        );
    }

    /**
     * Projets recherchant cette compétence.
     */
    public function projets(): BelongsToMany
    {
        return $this->belongsToMany(
            Projet::class,
            'projet_competence',
            'competence_id',
            'projet_id'
        );
    }
}