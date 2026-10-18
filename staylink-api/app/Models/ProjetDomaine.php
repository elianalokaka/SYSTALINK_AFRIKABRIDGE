<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjetDomaine extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $primaryKey = 'projet_id';

    protected $table = 'projet_domaines';

    protected $fillable = [
        'projet_id',
        'domaine',
    ];
}