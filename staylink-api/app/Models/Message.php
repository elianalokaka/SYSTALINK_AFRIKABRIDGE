<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Message extends Model
{
    use SoftDeletes;

    protected $table = 'messages';

    protected $fillable = [
        'projet_id',
        'expediteur_id',
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