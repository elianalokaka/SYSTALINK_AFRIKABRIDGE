<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ressources', function (Blueprint $table) {
            $table->id();

            // Utilisateur ayant publié la ressource
            $table->foreignId('utilisateur_id')
                ->constrained('utilisateurs')
                ->restrictOnDelete();

            // Projet facultatif : NULL = ressource publique
            $table->foreignId('projet_id')
                ->nullable()
                ->constrained('projets')
                ->cascadeOnDelete();

            // Informations de la ressource
            $table->string('titre', 150);
            $table->text('description')->nullable();

            // Nature de la ressource
            $table->string('type', 30);

            // Adresse externe ou chemin du fichier
            $table->text('url')->nullable();
            $table->string('chemin_fichier', 500)->nullable();

            $table->timestamps();
        });

        // Limiter les types de ressources autorisés
        DB::statement("
            ALTER TABLE ressources
            ADD CONSTRAINT chk_ressources_type
            CHECK (
                type IN (
                    'code',
                    'lien',
                    'tutoriel',
                    'api',
                    'document'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('ressources');
    }
};