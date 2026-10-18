<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Utilisateur extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, Notifiable;

    protected $table = 'utilisateurs';

    protected $fillable = [
        'nom',
        'prenom',
        'email',
        'mot_de_passe',
        'photo_profil',
        'biographie',
        'pays',
        'domaine',
        'titre_professionnel',
    ];

    protected $hidden = [
        'mot_de_passe',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verifie_le' => 'datetime',
            'mot_de_passe' => 'hashed',
        ];
    }

    // Indiquer à Laravel le nom réel de la colonne du mot de passe
    public function getAuthPasswordName(): string
    {
        return 'mot_de_passe';
    }

    // Indiquer à Laravel le nom réel de la colonne remember_token
    public function getRememberTokenName(): string
    {
        return 'remember_token';
    }

    /**
     * Compétences maîtrisées par l'utilisateur.
     */
    public function competences(): BelongsToMany
    {
        return $this->belongsToMany(
            Competence::class,
            'utilisateur_competence',
            'utilisateur_id',
            'competence_id'
        )->withPivot('niveau');
    }

    /**
     * Projets créés par cet utilisateur.
     */
    public function projetsCrees(): HasMany
    {
        return $this->hasMany(
            Projet::class,
            'createur_id'
        );
    }

    /**
     * Projets auxquels l'utilisateur participe.
     */
    public function projetsRejoints(): BelongsToMany
    {
        return $this->belongsToMany(
            Projet::class,
            'membres_projet',
            'utilisateur_id',
            'projet_id'
        )->withPivot([
            'id',
            'role',
            'date_adhesion',
        ]);
    }

    /**
     * Participations de l'utilisateur aux projets.
     */
    public function participations(): HasMany
    {
        return $this->hasMany(
            MembreProjet::class,
            'utilisateur_id'
        );
    }

    /**
     * Candidatures envoyées par l'utilisateur.
     */
    public function candidatures(): HasMany
    {
        return $this->hasMany(
            Candidature::class,
            'candidat_id'
        );
    }

    /**
     * Invitations envoyées par l'utilisateur.
     */
    public function invitationsEnvoyees(): HasMany
    {
        return $this->hasMany(
            Invitation::class,
            'expediteur_id'
        );
    }

    /**
     * Invitations reçues par l'utilisateur.
     */
    public function invitationsRecues(): HasMany
    {
        return $this->hasMany(
            Invitation::class,
            'destinataire_id'
        );
    }

    /**
     * Messages envoyés par l'utilisateur.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(
            Message::class,
            'expediteur_id'
        );
    }

    /**
     * Ressources publiées par l'utilisateur.
     */
    public function ressources(): HasMany
    {
        return $this->hasMany(
            Ressource::class,
            'utilisateur_id'
        );
    }

    /**
     * Profils suivis par cet utilisateur.
     */
    public function abonnements(): HasMany
    {
        return $this->hasMany(
            Abonnement::class,
            'abonne_id'
        );
    }

    /**
     * Utilisateurs qui suivent ce profil.
     */
    public function abonnes(): HasMany
    {
        return $this->hasMany(
            Abonnement::class,
            'suivi_id'
        );
    }

    public function hasVerifiedEmail(): bool
    {
        return ! is_null($this->email_verifie_le);
    }

    public function markEmailAsVerified(): bool
    {
        return $this->forceFill([
            'email_verifie_le' => $this->freshTimestamp(),
        ])->save();
    }
}
