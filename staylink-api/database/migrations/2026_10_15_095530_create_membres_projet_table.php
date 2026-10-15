<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membres_projet', function (Blueprint $table) {
            $table->id();

            // Projet auquel appartient le membre
            $table->foreignId('projet_id')
                ->constrained('projets')
                ->cascadeOnDelete();

            // Utilisateur membre du projet
            $table->foreignId('utilisateur_id')
                ->constrained('utilisateurs')
                ->restrictOnDelete();

            // Rôle au sein de l'équipe
            $table->string('role', 30)->default('membre');

            // Date d'entrée dans l'équipe
            $table->timestamp('date_adhesion')
                ->useCurrent();

            // Un utilisateur ne peut être membre
            // qu'une seule fois du même projet
            $table->unique(
                ['projet_id', 'utilisateur_id'],
                'uq_membres_projet'
            );
        });

        // Seuls deux rôles sont autorisés
        DB::statement("
            ALTER TABLE membres_projet
            ADD CONSTRAINT chk_membres_projet_role
            CHECK (role IN ('responsable', 'membre'))
        ");

        // Un seul responsable par projet
        DB::statement("
            CREATE UNIQUE INDEX uq_responsable_par_projet
            ON membres_projet (projet_id)
            WHERE role = 'responsable'
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('membres_projet');
    }
};