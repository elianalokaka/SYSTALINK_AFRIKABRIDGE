<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();

            $table->string('nom', 100);
            $table->string('prenom', 100);

            $table->string('email', 255)->unique();
            $table->string('mot_de_passe', 255);

            $table->string('photo_profil', 255)->nullable();
            $table->text('biographie')->nullable();

            $table->string('pays', 100);
            $table->string('domaine', 100)->nullable();
            $table->string('titre_professionnel', 150)->nullable();

            $table->timestamp('email_verifie_le')->nullable();

            // Champ technique utilisé par Laravel
            $table->rememberToken();

            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('utilisateurs');
    }
};