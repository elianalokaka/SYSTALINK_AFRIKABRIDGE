<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('candidatures', function (Blueprint $table) {
            $table->id();

            // Projet concerné
            $table->foreignId('projet_id')
                ->constrained('projets')
                ->cascadeOnDelete();

            // Utilisateur qui souhaite rejoindre le projet
            $table->foreignId('candidat_id')
                ->constrained('utilisateurs')
                ->restrictOnDelete();

            // Message facultatif du candidat
            $table->text('message_motivation')->nullable();

            // État de la candidature
            $table->string('statut', 30)
                ->default('en_attente');

            // Date de réponse du responsable
            $table->timestamp('date_decision')->nullable();

            $table->timestamps();

            // Optimisation des recherches par projet et statut
            $table->index(['projet_id', 'statut']);
        });

        // Limiter les statuts autorisés
        DB::statement("
            ALTER TABLE candidatures
            ADD CONSTRAINT chk_candidatures_statut
            CHECK (
                statut IN (
                    'en_attente',
                    'acceptee',
                    'refusee',
                    'annulee'
                )
            )
        ");

        // Une seule candidature en attente par utilisateur et projet
        DB::statement("
            CREATE UNIQUE INDEX uq_candidature_en_attente
            ON candidatures (projet_id, candidat_id)
            WHERE statut = 'en_attente'
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('candidatures');
    }
};