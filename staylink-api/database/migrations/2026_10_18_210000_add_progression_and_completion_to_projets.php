<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projets', function (Blueprint $table) {
            $table->unsignedTinyInteger('progression')->default(0);
            $table->date('date_fin')->nullable();
            $table->string('lien_realisation', 2048)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('projets', function (Blueprint $table) {
            $table->dropColumn([
                'progression',
                'date_fin',
                'lien_realisation',
            ]);
        });
    }
};
