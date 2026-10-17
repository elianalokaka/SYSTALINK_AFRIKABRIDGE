<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\Auth\InscriptionController;
use App\Http\Controllers\Api\V1\Auth\ConnexionController;
use App\Http\Controllers\Api\V1\Auth\ProfilConnecteController;
use App\Http\Controllers\Api\V1\Auth\DeconnexionController;
use App\Http\Controllers\Api\V1\Suivi\NePlusSuivreMembreController;
use App\Http\Controllers\Api\V1\Suivi\SuivreMembreController;

Route::prefix('v1')->group(function () {

    // Authentification publique
    Route::post('/auth/register', InscriptionController::class)
        ->name('auth.register');
    Route::post('/auth/login', ConnexionController::class)
    ->middleware('throttle:connexion')
    ->name('auth.login');



    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/auth/me', ProfilConnecteController::class)
            ->name('auth.me');

        Route::post('/auth/logout', DeconnexionController::class)
            ->name('auth.logout');
        Route::post('/users/{id}/follow', SuivreMembreController::class)
        ->whereNumber('id')
        ->name('users.follow');

    Route::delete('/users/{id}/follow', NePlusSuivreMembreController::class)
        ->whereNumber('id')
        ->name('users.unfollow');
    });

});