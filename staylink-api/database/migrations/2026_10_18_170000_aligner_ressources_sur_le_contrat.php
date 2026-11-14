<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ressources', function (Blueprint $table) {
            $table->text('contenu_code')->nullable();
            $table->string('langage', 50)->nullable();
            $table->string('visibilite', 20)->default('publique');
        });

        DB::statement("UPDATE ressources SET visibilite = 'projet' WHERE projet_id IS NOT NULL");
        DB::statement('ALTER TABLE ressources ALTER COLUMN titre TYPE varchar(200)');

        DB::statement('ALTER TABLE ressources DROP CONSTRAINT chk_ressources_type');
        DB::statement("
            ALTER TABLE ressources
            ADD CONSTRAINT chk_ressources_type
            CHECK (type IN ('code', 'lien', 'tutoriel', 'api', 'document', 'article', 'autre'))
        ");
        DB::statement("
            ALTER TABLE ressources
            ADD CONSTRAINT chk_ressources_visibilite
            CHECK (visibilite IN ('projet', 'publique'))
        ");
        DB::statement("
            ALTER TABLE ressources
            ADD CONSTRAINT chk_ressources_visibilite_projet
            CHECK (visibilite <> 'projet' OR projet_id IS NOT NULL)
        ");

        Schema::create('ressource_competence', function (Blueprint $table) {
            $table->foreignId('ressource_id')
                ->constrained('ressources')
                ->cascadeOnDelete();
            $table->foreignId('competence_id')
                ->constrained('competences')
                ->cascadeOnDelete();
            $table->primary(['ressource_id', 'competence_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ressource_competence');

        DB::statement('ALTER TABLE ressources DROP CONSTRAINT chk_ressources_visibilite_projet');
        DB::statement('ALTER TABLE ressources DROP CONSTRAINT chk_ressources_visibilite');
        DB::statement('ALTER TABLE ressources DROP CONSTRAINT chk_ressources_type');
        DB::statement("
            ALTER TABLE ressources
            ADD CONSTRAINT chk_ressources_type
            CHECK (type IN ('code', 'lien', 'tutoriel', 'api', 'document'))
        ");

        Schema::table('ressources', function (Blueprint $table) {
            $table->dropColumn(['contenu_code', 'langage', 'visibilite']);
        });

        DB::statement('ALTER TABLE ressources ALTER COLUMN titre TYPE varchar(150)');
    }
};