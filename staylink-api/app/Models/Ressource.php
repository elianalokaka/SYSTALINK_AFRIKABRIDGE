<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function commentaires(): HasMany
    {
        return $this->hasMany(Commentaire::class, 'ressource_id');
    }

    public function estVisiblePour(Utilisateur $acteur): bool
    {
        if ($this->visibilite !== 'projet') {
            return true;
        }

        if ($this->projet_id === null) {
            return false;
        }

        return MembreProjet::query()
            ->where('projet_id', $this->projet_id)
            ->where('utilisateur_id', $acteur->id)
            ->exists();
    }

    public function estModifiablePar(Utilisateur $acteur): bool
    {
        if ((int) $this->utilisateur_id === (int) $acteur->id) {
            return true;
        }

        if ($this->projet_id === null) {
            return false;
        }

        return MembreProjet::query()
            ->where('projet_id', $this->projet_id)
            ->where('utilisateur_id', $acteur->id)
            ->where('role', 'proprietaire')
            ->exists();
    }
}