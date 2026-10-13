<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Prepara la base de datos con lo indispensable para usar la plataforma.
     * La cuenta de administrador se crea con: php artisan imagia:admin
     */
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            BaseDataSeeder::class,
        ]);
    }
}
