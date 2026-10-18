<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ressource extends Model
{
    protected $table = 'ressources';

    protected $fillable = [
        'utilisateur_id',
        'projet_id',
        'titre',
        'description',
        'type',
        'url',
        'contenu_code',
        'langage',
        'chemin_fichier',
        'visibilite',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(Utilisateur::class, 'utilisateur_id');
    }

    public function projet(): BelongsTo
    {
        return $this->belongsTo(Projet::class, 'projet_id');
    }

    public function competences(): BelongsToMany
    {
        return $this->belongsToMany(
            Competence::class,
            'ressource_competence',
            'ressource_id',
            'competence_id',
        );
    }
}