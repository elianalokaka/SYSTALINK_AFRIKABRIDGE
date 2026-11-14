<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commentaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ressource_id')
                ->constrained('ressources')
                ->cascadeOnDelete();
            $table->foreignId('utilisateur_id')
                ->constrained('utilisateurs')
                ->restrictOnDelete();
            $table->string('contenu', 1000);
            $table->timestamps();

            $table->index(['ressource_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commentaires');
    }
};
