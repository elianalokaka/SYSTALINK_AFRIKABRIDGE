<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE utilisateur_domaines DROP CONSTRAINT IF EXISTS chk_utilisateur_domaines_domaine');
        DB::statement('ALTER TABLE utilisateur_domaines ALTER COLUMN domaine TYPE VARCHAR(100)');
        DB::statement('ALTER TABLE projet_domaines ALTER COLUMN domaine TYPE VARCHAR(100)');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE utilisateur_domaines ALTER COLUMN domaine TYPE VARCHAR(50)');
        DB::statement('ALTER TABLE projet_domaines ALTER COLUMN domaine TYPE VARCHAR(50)');
        DB::statement("
            ALTER TABLE utilisateur_domaines
            ADD CONSTRAINT chk_utilisateur_domaines_domaine
            CHECK (
                domaine IN (
                    'agriculture',
                    'sante',
                    'education',
                    'fintech',
                    'energie',
                    'transport',
                    'iot',
                    'intelligence_artificielle',
                    'commerce',
                    'environnement',
                    'administration',
                    'autre'
                )
            )
        ");
    }
};
