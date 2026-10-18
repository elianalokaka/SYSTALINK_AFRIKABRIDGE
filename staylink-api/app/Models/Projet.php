<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;


class Projet extends Model
{
    protected $table = 'projets';

    protected $fillable = [
            'createur_id',
            'nom',
            'description',
            'domaine',
            'objectifs',
            'nombre_max_membres',
            'statut',

    ];

    protected $attributes = [
        'statut' => 'recrutement',
    ];

    protected function casts(): array
    {
        return [
            'nombre_max_membres' => 'integer',
        ];
    }

    /**
     * Utilisateur ayant créé le projet.
     */
    public function createur(): BelongsTo
    {
        return $this->belongsTo(
            Utilisateur::class,
            'createur_id'
        );
    }

    /**
     * Compétences recherchées par le projet.
     */
    public function competences(): BelongsToMany
    {
        return $this->belongsToMany(
            Competence::class,
            'projet_competence',
            'projet_id',
            'competence_id'
        );
    }

    public function domaines(): HasMany
    {
        return $this->hasMany(ProjetDomaine::class, 'projet_id');
    }
    /**
     * Utilisateurs appartenant à l'équipe du projet.
     */
    public function membres(): BelongsToMany
    {
        return $this->belongsToMany(
            Utilisateur::class,
            'membres_projet',
            'projet_id',
            'utilisateur_id'
        )->withPivot([
            'id',
            'role',
            'date_adhesion',
        ]);
    }

    /**
     * Participations enregistrées pour le projet.
     */
    public function participations(): HasMany
    {
        return $this->hasMany(
            MembreProjet::class,
            'projet_id'
        );
    }

    /**
     * Candidatures reçues pour ce projet.
     */
    public function candidatures(): HasMany
    {
        return $this->hasMany(
            Candidature::class,
            'projet_id'
        );
    }

    /**
     * Invitations envoyées pour ce projet.
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(
            Invitation::class,
            'projet_id'
        );
    }


    /**
     * Messages de discussion du projet.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(
            Message::class,
            'projet_id'
        );
    }

    /**
     * Ressources associées au projet.
     */
    public function ressources(): HasMany
    {
        return $this->hasMany(
            Ressource::class,
            'projet_id'
        );
    }
}