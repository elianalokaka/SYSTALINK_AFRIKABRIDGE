<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE projets DROP CONSTRAINT chk_projets_statut');
        DB::statement("UPDATE projets SET statut = 'recrutement' WHERE statut = 'ouvert'");
        DB::statement("UPDATE projets SET statut = 'en_cours' WHERE statut = 'annule'");
        DB::statement("ALTER TABLE projets ALTER COLUMN statut SET DEFAULT 'recrutement'");
        DB::statement("
            ALTER TABLE projets
            ADD CONSTRAINT chk_projets_statut
            CHECK (statut IN ('recrutement', 'en_cours', 'termine'))
        ");

        DB::statement('ALTER TABLE membres_projet DROP CONSTRAINT chk_membres_projet_role');
        DB::statement('DROP INDEX IF EXISTS uq_responsable_par_projet');
        DB::statement("UPDATE membres_projet SET role = 'proprietaire' WHERE role = 'responsable'");
        DB::statement("
            ALTER TABLE membres_projet
            ADD CONSTRAINT chk_membres_projet_role
            CHECK (role IN ('proprietaire', 'membre'))
        ");
        DB::statement("
            CREATE UNIQUE INDEX uq_proprietaire_par_projet
            ON membres_projet (projet_id)
            WHERE role = 'proprietaire'
        ");

        Schema::create('projet_domaines', function (Blueprint $table) {
            $table->foreignId('projet_id')
                ->constrained('projets')
                ->cascadeOnDelete();
            $table->string('domaine', 50);
            $table->primary(['projet_id', 'domaine']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projet_domaines');

        DB::statement('DROP INDEX IF EXISTS uq_proprietaire_par_projet');
        DB::statement('ALTER TABLE membres_projet DROP CONSTRAINT chk_membres_projet_role');
        DB::statement("UPDATE membres_projet SET role = 'responsable' WHERE role = 'proprietaire'");
        DB::statement("
            ALTER TABLE membres_projet
            ADD CONSTRAINT chk_membres_projet_role
            CHECK (role IN ('responsable', 'membre'))
        ");
        DB::statement("
            CREATE UNIQUE INDEX uq_responsable_par_projet
            ON membres_projet (projet_id)
            WHERE role = 'responsable'
        ");

        DB::statement('ALTER TABLE projets DROP CONSTRAINT chk_projets_statut');
        DB::statement("UPDATE projets SET statut = 'ouvert' WHERE statut = 'recrutement'");
        DB::statement("ALTER TABLE projets ALTER COLUMN statut SET DEFAULT 'ouvert'");
        DB::statement("
            ALTER TABLE projets
            ADD CONSTRAINT chk_projets_statut
            CHECK (statut IN ('ouvert', 'en_cours', 'termine', 'annule'))
        ");
    }
};