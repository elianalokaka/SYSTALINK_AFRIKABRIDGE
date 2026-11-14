<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UtilisateurLien extends Model
{
    public $timestamps = false;

    protected $table = 'utilisateur_liens';

    protected $fillable = [
        'utilisateur_id',
        'type',
        'url',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }
}
