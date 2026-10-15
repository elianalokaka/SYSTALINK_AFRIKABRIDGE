<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projets', function (Blueprint $table) {
            $table->id();

            // Utilisateur qui a créé le projet
            $table->foreignId('createur_id')
                ->constrained('utilisateurs')
                ->restrictOnDelete();

            // Informations du projet
            $table->string('nom', 150);
            $table->text('description');
            $table->string('domaine', 100);
            $table->text('objectifs')->nullable();

            // Capacité maximale (responsable inclus)
            $table->integer('nombre_max_membres')->nullable();

            // État actuel du projet
            $table->string('statut', 30)->default('ouvert');

            $table->timestamps();

            // Index pour les filtres de recherche
            $table->index(['statut', 'domaine']);
        });

        // Contrainte PostgreSQL : capacité minimale
        DB::statement("
            ALTER TABLE projets
            ADD CONSTRAINT chk_projets_capacite
            CHECK (
                nombre_max_membres IS NULL
                OR nombre_max_membres >= 2
            )
        ");

        // Contrainte PostgreSQL : statuts autorisés
        DB::statement("
            ALTER TABLE projets
            ADD CONSTRAINT chk_projets_statut
            CHECK (
                statut IN (
                    'ouvert',
                    'en_cours',
                    'termine',
                    'annule'
                )
            )
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('projets');
    }
};