<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invitation extends Model
{
    protected $table = 'invitations';

    protected $fillable = [
        'projet_id',
        'expediteur_id',
        'destinataire_id',
        'message',
    ];

    protected $attributes = [
        'statut' => 'en_attente',
    ];

    protected function casts(): array
    {
        return [
            'date_reponse' => 'datetime',
        ];
    }

    /**
     * Projet concerné par l'invitation.
     */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(
            Projet::class,
            'projet_id'
        );
    }

    /**
     * Responsable ayant envoyé l'invitation.
     */
    public function expediteur(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'expediteur_id'
        );
    }

    /**
     * Talent qui reçoit l'invitation.
     */
    public function destinataire(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'destinataire_id'
        );
    }
}