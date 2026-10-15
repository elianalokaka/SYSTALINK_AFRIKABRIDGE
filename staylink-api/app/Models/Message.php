<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $table = 'messages';

    protected $fillable = [
        'contenu',
    ];

    /**
     * Projet auquel appartient le message.
     */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(
            Projet::class,
            'projet_id'
        );
    }

    /**
     * Utilisateur ayant envoyé le message.
     */
    public function expediteur(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'expediteur_id'
        );
    }
}