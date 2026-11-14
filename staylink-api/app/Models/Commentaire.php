<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Commentaire extends Model
{
    protected $table = 'commentaires';

    protected $fillable = [
        'ressource_id',
        'utilisateur_id',
        'contenu',
    ];

    public function ressource(): BelongsTo
    {
        return $this->belongsTo(Ressource::class, 'ressource_id');
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }
}
