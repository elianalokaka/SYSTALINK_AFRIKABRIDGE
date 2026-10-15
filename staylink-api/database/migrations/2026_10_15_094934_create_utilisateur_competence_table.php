<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateur_competence', function (Blueprint $table) {

            // Référence vers l'utilisateur
            $table->foreignId('utilisateur_id')
                ->constrained('utilisateurs')
                ->cascadeOnDelete();

            // Référence vers la compétence
            $table->foreignId('competence_id')
                ->constrained('competences')
                ->cascadeOnDelete();

            // Clé primaire composée des deux colonnes
            $table->primary([
                'utilisateur_id',
                'competence_id'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateur_competence');
    }
};