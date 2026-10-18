<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MembreProjet extends Model
{
    protected $table = 'membres_projet';

    // La table ne possède pas created_at ni updated_at.
    public $timestamps = false;

    protected $fillable = [
        'projet_id',
        'utilisateur_id',
        'role',
    ];

    protected $attributes = [
        'role' => 'membre',
    ];

    protected function casts(): array
    {
        return [
            'date_adhesion' => 'datetime',
        ];
    }

    /**
     * Projet auquel appartient le membre.
     */
    public function projet(): BelongsTo
    {
        return $this->belongsTo(
            Projet::class,
            'projet_id'
        );
    }

    /**
     * Utilisateur appartenant au projet.
     */
    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'utilisateur_id'
        );
    }
}