<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UtilisateurDomaine extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = 'utilisateur_id';

    protected $table = 'utilisateur_domaines';

    protected $fillable = [
        'utilisateur_id',
        'domaine',
    ];
}
