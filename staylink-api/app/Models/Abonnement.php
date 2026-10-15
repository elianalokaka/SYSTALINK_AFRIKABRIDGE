<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Abonnement extends Model
{
    protected $table = 'abonnements';

    // La table possède created_at, mais pas updated_at.
    public const UPDATED_AT = null;

    protected $fillable = [];

    /**
     * Utilisateur qui suit.
     */
    public function abonne(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'abonne_id'
        );
    }

    /**
     * Utilisateur suivi.
     */
    public function suivi(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'suivi_id'
        );
    }
}