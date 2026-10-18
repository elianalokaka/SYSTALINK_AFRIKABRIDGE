<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Candidature extends Model
{
    protected $table = 'candidatures';

    protected $fillable = [
        'projet_id',
        'candidat_id',
        'message_motivation',
        'statut',
        'date_decision',
    ];

    protected $attributes = [
        'statut' => 'en_attente',
    ];

    protected function casts(): array
    {
        return [
            'date_decision' => 'datetime',
        ];
    }

    /**
     * Projet auquel la candidature est adressée.
     */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(
            Projet::class,
            'projet_id'
        );
    }

    /**
     * Utilisateur qui a envoyé la candidature.
     */
    public function candidat(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'candidat_id'
        );
    }
}