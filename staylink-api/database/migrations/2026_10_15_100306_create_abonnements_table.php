<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('abonnements', function (Blueprint $table) {
            $table->id();

            // Utilisateur qui suit un autre utilisateur
            $table->foreignId('abonne_id')
                ->constrained('utilisateurs')
                ->cascadeOnDelete();

            // Utilisateur qui est suivi
            $table->foreignId('suivi_id')
                ->constrained('utilisateurs')
                ->cascadeOnDelete();

            // Date de début de l'abonnement
            $table->timestamp('created_at')->useCurrent();

            // Empêcher les abonnements en double
            $table->unique(
                ['abonne_id', 'suivi_id'],
                'uq_abonnements_utilisateurs'
            );

            // Optimiser la recherche des abonnés
            $table->index('suivi_id');
        });

        // Empêcher un utilisateur de se suivre lui-même
        DB::statement("
            ALTER TABLE abonnements
            ADD CONSTRAINT chk_abonnements_distincts
            CHECK (abonne_id <> suivi_id)
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('abonnements');
    }
};