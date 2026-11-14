<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('connexion', function (Request $request) {
            $email = Str::lower(trim((string) $request->input('email', '')));

            return [
                Limit::perMinute(5)->by('connexion-email:'.hash('sha256', $email.'|'.$request->ip())),
                Limit::perMinute(20)->by('connexion-ip:'.$request->ip()),
            ];
        });

        RateLimiter::for('inscription', function (Request $request) {
            return Limit::perMinute(5)->by('inscription:'.$request->ip());
        });

        RateLimiter::for('ecritures', function (Request $request) {
            $acteur = $request->user()?->id ?? $request->ip();

            return Limit::perMinute(30)->by('ecriture:'.$acteur);
        });

        // Au-dessus du sondage de discussion (toutes les 5 s) : 12/min suffisent, 300 laisse la marge.
        RateLimiter::for('lectures', function (Request $request) {
            $acteur = $request->user()?->id ?? $request->ip();

            return Limit::perMinute(300)->by('lecture:'.$acteur);
        });
    }
}
