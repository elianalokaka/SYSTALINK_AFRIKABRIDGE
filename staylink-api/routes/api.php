<?php

use App\Http\Controllers\Api\V1\Auth\ConnexionController;
use App\Http\Controllers\Api\V1\Auth\DeconnexionController;
use App\Http\Controllers\Api\V1\Auth\InscriptionController;
use App\Http\Controllers\Api\V1\Auth\ProfilConnecteController;
use App\Http\Controllers\Api\V1\Dashboard\DashboardController;
use App\Http\Controllers\Api\V1\Profil\ListerCompetencesController;
use App\Http\Controllers\Api\V1\Profil\ModifierProfilController;
use App\Http\Controllers\Api\V1\Profil\RechercherTalentsController;
use App\Http\Controllers\Api\V1\Profil\RemplacerCompetencesController;
use App\Http\Controllers\Api\V1\Profil\UploadPhotoProfilController;
use App\Http\Controllers\Api\V1\Profil\VoirProfilController;
use App\Http\Controllers\Api\V1\Projet\CreerProjetController;
use App\Http\Controllers\Api\V1\Projet\AnnulerDemandeAdhesionController;
use App\Http\Controllers\Api\V1\Projet\DeciderDemandeAdhesionController;
use App\Http\Controllers\Api\V1\Projet\DeposerDemandeAdhesionController;
use App\Http\Controllers\Api\V1\Projet\EnvoyerMessageController;
use App\Http\Controllers\Api\V1\Projet\LireMessagesController;
use App\Http\Controllers\Api\V1\Projet\ListerDemandesProjetController;
use App\Http\Controllers\Api\V1\Projet\ListerMembresProjetController;
use App\Http\Controllers\Api\V1\Projet\ListerProjetsController;
use App\Http\Controllers\Api\V1\Projet\MesDemandesAdhesionController;
use App\Http\Controllers\Api\V1\Projet\MesProjetsController;
use App\Http\Controllers\Api\V1\Projet\ModifierProjetController;
use App\Http\Controllers\Api\V1\Projet\PortfolioUtilisateurController;
use App\Http\Controllers\Api\V1\Projet\RetirerMembreProjetController;
use App\Http\Controllers\Api\V1\Projet\SuggestionsTalentsController;
use App\Http\Controllers\Api\V1\Projet\SupprimerMessageController;
use App\Http\Controllers\Api\V1\Projet\SupprimerProjetController;
use App\Http\Controllers\Api\V1\Projet\VoirProjetController;
use App\Http\Controllers\Api\V1\Ressource\ListerCommentairesController;
use App\Http\Controllers\Api\V1\Ressource\ListerRessourcesController;
use App\Http\Controllers\Api\V1\Ressource\ModifierRessourceController;
use App\Http\Controllers\Api\V1\Ressource\PublierCommentaireController;
use App\Http\Controllers\Api\V1\Ressource\PublierRessourceController;
use App\Http\Controllers\Api\V1\Ressource\SupprimerCommentaireController;
use App\Http\Controllers\Api\V1\Ressource\SupprimerRessourceController;
use App\Http\Controllers\Api\V1\Ressource\TelechargerFichierRessourceController;
use App\Http\Controllers\Api\V1\Ressource\VoirRessourceController;
use App\Http\Controllers\Api\V1\Statistiques\StatistiquesPubliquesController;
use App\Http\Controllers\Api\V1\Suivi\NePlusSuivreMembreController;
use App\Http\Controllers\Api\V1\Suivi\SuivreMembreController;
use App\Http\Controllers\Api\V1\Suivi\ListerAbonnesController;
use App\Http\Controllers\Api\V1\Suivi\ListerAbonnementsController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Authentification publique
    Route::post('/auth/register', InscriptionController::class)
        ->middleware('throttle:inscription')
        ->name('auth.register');
    Route::post('/auth/login', ConnexionController::class)
        ->middleware('throttle:connexion')
        ->name('auth.login');

    Route::get('/stats', StatistiquesPubliquesController::class)
        ->middleware('throttle:60,1')
        ->name('stats.index');

    Route::middleware(['auth:sanctum', 'throttle:lectures'])->group(function () {

        Route::get('/auth/me', ProfilConnecteController::class)
            ->name('auth.me');

        Route::post('/auth/logout', DeconnexionController::class)
            ->name('auth.logout');

        Route::get('/me/dashboard', DashboardController::class)
            ->name('me.dashboard');

        Route::get('/me/projects', MesProjetsController::class)
            ->name('me.projects');

        Route::get('/me/join-requests', MesDemandesAdhesionController::class)
            ->name('me.join-requests');

        Route::get('/skills', ListerCompetencesController::class)
            ->name('skills.index');

        Route::patch('/users/me', ModifierProfilController::class)
            ->middleware('throttle:ecritures')
            ->name('users.me.update');

        Route::put('/users/me/skills', RemplacerCompetencesController::class)
            ->middleware('throttle:ecritures')
            ->name('users.me.skills.update');

        Route::post('/users/me/photo', UploadPhotoProfilController::class)
            ->middleware('throttle:ecritures')
            ->name('users.me.photo.update');

        Route::get('/users', RechercherTalentsController::class)
            ->name('users.index');

        Route::get('/users/suggestions', SuggestionsTalentsController::class)
            ->name('users.suggestions');

        Route::get('/users/{id}/portfolio', PortfolioUtilisateurController::class)
            ->whereNumber('id')
            ->name('users.portfolio');

        Route::get('/users/{id}', VoirProfilController::class)
            ->whereNumber('id')
            ->name('users.show');

        Route::post('/users/{id}/follow', SuivreMembreController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('users.follow');

        Route::delete('/users/{id}/follow', NePlusSuivreMembreController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('users.unfollow');
        Route::get('/users/{id}/followers', ListerAbonnesController::class)
            ->whereNumber('id')
            ->name('users.followers');

        Route::get('/users/{id}/following', ListerAbonnementsController::class)
            ->whereNumber('id')
            ->name('users.following');

        Route::get('/projects', ListerProjetsController::class)
            ->name('projects.index');
        Route::post('/projects', CreerProjetController::class)
            ->middleware('throttle:ecritures')
            ->name('projects.store');
        Route::get('/projects/{id}', VoirProjetController::class)
            ->whereNumber('id')
            ->name('projects.show');
        Route::patch('/projects/{id}', ModifierProjetController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('projects.update');
        Route::delete('/projects/{id}', SupprimerProjetController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('projects.destroy');
        Route::get('/projects/{id}/join-requests', ListerDemandesProjetController::class)
            ->whereNumber('id')
            ->name('projects.join-requests.index');
        Route::post('/projects/{id}/join-requests', DeposerDemandeAdhesionController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('projects.join-requests.store');
        Route::get('/projects/{id}/members', ListerMembresProjetController::class)
            ->whereNumber('id')
            ->name('projects.members.index');
        Route::delete('/projects/{id}/members/{userId}', RetirerMembreProjetController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->whereNumber('userId')
            ->name('projects.members.destroy');
        Route::patch('/join-requests/{id}', DeciderDemandeAdhesionController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('join-requests.update');
        Route::delete('/join-requests/{id}', AnnulerDemandeAdhesionController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('join-requests.destroy');
        Route::get('/projects/{id}/messages', LireMessagesController::class)
            ->whereNumber('id')
            ->name('projects.messages.index');

        Route::post('/projects/{id}/messages', EnvoyerMessageController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('projects.messages.store');

        Route::delete('/projects/{id}/messages/{messageId}', SupprimerMessageController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->whereNumber('messageId')
            ->name('projects.messages.destroy');
        Route::get('/resources', ListerRessourcesController::class)
            ->name('resources.index');
        Route::post('/resources', PublierRessourceController::class)
            ->middleware('throttle:ecritures')
            ->name('resources.store');
        Route::get('/resources/{id}/comments', ListerCommentairesController::class)
            ->whereNumber('id')
            ->name('resources.comments.index');
        Route::get('/resources/{id}/file', TelechargerFichierRessourceController::class)
            ->whereNumber('id')
            ->name('resources.file');
        Route::post('/resources/{id}/comments', PublierCommentaireController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('resources.comments.store');
        Route::get('/resources/{id}', VoirRessourceController::class)
            ->whereNumber('id')
            ->name('resources.show');
        Route::patch('/resources/{id}', ModifierRessourceController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('resources.update');
        Route::delete('/resources/{id}', SupprimerRessourceController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('resources.destroy');
        Route::delete('/comments/{id}', SupprimerCommentaireController::class)
            ->middleware('throttle:ecritures')
            ->whereNumber('id')
            ->name('comments.destroy');
    });

});
