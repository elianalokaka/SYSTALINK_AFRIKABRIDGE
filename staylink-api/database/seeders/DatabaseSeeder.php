<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            CompetenceSeeder::class,
            UtilisateurDemoSeeder::class,
            ProjetDemoSeeder::class,
            RessourceEtMessageDemoSeeder::class,
        ]);
    }
}
