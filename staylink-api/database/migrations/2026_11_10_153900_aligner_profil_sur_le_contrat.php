<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->string('region', 100)->nullable()->after('pays');
            $table->string('role_profil', 40)->nullable()->after('region');
        });

        DB::statement("
            ALTER TABLE utilisateurs
            ADD CONSTRAINT chk_utilisateurs_role_profil
            CHECK (
                role_profil IS NULL
                OR role_profil IN (
                    'developpeur_frontend',
                    'developpeur_backend',
                    'fullstack',
                    'designer_ui_ux',
                    'ingenieur_iot',
                    'data_scientist',
                    'chef_de_projet',
                    'etudiant',
                    'entrepreneur',
                    'autre'
                )
            )
        ");

        Schema::create('utilisateur_domaines', function (Blueprint $table) {
            $table->foreignId('utilisateur_id')
                ->constrained('utilisateurs')
                ->cascadeOnDelete();
            $table->string('domaine', 50);
            $table->primary(['utilisateur_id', 'domaine']);
        });

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

        Schema::create('utilisateur_liens', function (Blueprint $table) {
            $table->id();
            $table->foreignId('utilisateur_id')
                ->constrained('utilisateurs')
                ->cascadeOnDelete();
            $table->string('type', 30);
            $table->string('url', 2048);
        });

        DB::statement("
            ALTER TABLE utilisateur_liens
            ADD CONSTRAINT chk_utilisateur_liens_type
            CHECK (
                type IN (
                    'github',
                    'gitlab',
                    'linkedin',
                    'portfolio',
                    'twitter',
                    'autre'
                )
            )
        ");

        DB::statement("
            INSERT INTO utilisateur_domaines (utilisateur_id, domaine)
            SELECT id, domaine
            FROM utilisateurs
            WHERE domaine IS NOT NULL
              AND domaine <> ''
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateur_liens');
        Schema::dropIfExists('utilisateur_domaines');

        DB::statement('ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS chk_utilisateurs_role_profil');

        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn(['region', 'role_profil']);
        });
    }
};
