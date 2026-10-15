<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();

            // Projet concerné
            $table->foreignId('projet_id')
                ->constrained('projets')
                ->cascadeOnDelete();

            // Utilisateur qui envoie l'invitation
            $table->foreignId('expediteur_id')
                ->constrained('utilisateurs')
                ->restrictOnDelete();

            // Utilisateur qui reçoit l'invitation
            $table->foreignId('destinataire_id')
                ->constrained('utilisateurs')
                ->restrictOnDelete();

            // Message facultatif
            $table->text('message')->nullable();

            // Statut initial
            $table->string('statut', 30)
                ->default('en_attente');

            // Date de réponse
            $table->timestamp('date_reponse')->nullable();

            $table->timestamps();

            // Recherche des invitations par projet et statut
            $table->index(['projet_id', 'statut']);

            // Recherche des invitations reçues
            $table->index(['destinataire_id', 'statut']);
        });

        // Vérifier les statuts autorisés
        DB::statement("
            ALTER TABLE invitations
            ADD CONSTRAINT chk_invitations_statut
            CHECK (
                statut IN (
                    'en_attente',
                    'acceptee',
                    'refusee',
                    'annulee'
                )
            )
        ");

        // Empêcher de s'inviter soi-même
        DB::statement("
            ALTER TABLE invitations
            ADD CONSTRAINT chk_invitations_utilisateurs_distincts
            CHECK (expediteur_id <> destinataire_id)
        ");

        // Une seule invitation en attente
        // par projet et destinataire
        DB::statement("
            CREATE UNIQUE INDEX uq_invitation_en_attente
            ON invitations (projet_id, destinataire_id)
            WHERE statut = 'en_attente'
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};