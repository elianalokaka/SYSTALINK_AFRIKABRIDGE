<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competences', function (Blueprint $table) {
            $table->id();

            // Nom unique de la compétence
            $table->string('nom', 100)->unique();

            // Catégorie facultative
            $table->string('categorie', 100)->nullable();

            // Dates de création et de modification
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competences');
    }
};