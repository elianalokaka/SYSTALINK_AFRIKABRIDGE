<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            // Projet auquel appartient la discussion
            $table->foreignId('projet_id')
                ->constrained('projets')
                ->cascadeOnDelete();

            // Utilisateur ayant envoyé le message
            $table->foreignId('expediteur_id')
                ->constrained('utilisateurs')
                ->restrictOnDelete();

            // Contenu textuel du message
            $table->text('contenu');

            // Dates de création et de modification
            $table->timestamps();

            // Optimiser la récupération des messages
            // d'un projet dans l'ordre chronologique
            $table->index(
                ['projet_id', 'created_at'],
                'idx_messages_projet_date'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};