<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projet_competence', function (Blueprint $table) {

            // Projet recherchant la compétence
            $table->foreignId('projet_id')
                ->constrained('projets')
                ->cascadeOnDelete();

            // Compétence recherchée
            $table->foreignId('competence_id')
                ->constrained('competences')
                ->cascadeOnDelete();

            // Clé primaire composite
            $table->primary([
                'projet_id',
                'competence_id'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projet_competence');
    }
};