<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('utilisateur_competence', function (Blueprint $table) {
            $table->string('niveau', 20)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('utilisateur_competence', function (Blueprint $table) {
            $table->dropColumn('niveau');
        });
    }
};
