<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ressource extends Model
{
    protected $table = 'ressources';

    protected $fillable = [
        'titre',
        'description',
        'type',
        'url',
        'chemin_fichier',
    ];

    /**
     * Auteur de la ressource.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'utilisateur_id'
        );
    }

    /**
     * Projet associé, éventuellement absent.
     */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(
            Projet::class,
            'projet_id'
        );
    }
}