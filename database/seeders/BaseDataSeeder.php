<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Datos de arranque editables desde el panel. Se puede ejecutar varias veces sin duplicar.
 * No crea precios, impuestos ni datos de clientes: eso lo define el negocio.
 */
class BaseDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $stages = [
            ['slug' => 'nuevo', 'name' => 'Nuevo prospecto', 'color' => 'blue'],
            ['slug' => 'contactado', 'name' => 'Contactado', 'color' => 'cyan'],
            ['slug' => 'reunion', 'name' => 'Reunión pendiente', 'color' => 'violet'],
            ['slug' => 'cotizacion-enviada', 'name' => 'Cotización enviada', 'color' => 'amber'],
            ['slug' => 'negociacion', 'name' => 'Negociación', 'color' => 'orange'],
            ['slug' => 'ganado', 'name' => 'Ganado', 'color' => 'green', 'is_won' => true],
            ['slug' => 'perdido', 'name' => 'Perdido', 'color' => 'slate', 'is_lost' => true],
        ];

        foreach ($stages as $order => $stage) {
            DB::table('pipeline_stages')->updateOrInsert(
                ['slug' => $stage['slug']],
                [
                    'name' => $stage['name'],
                    'color' => $stage['color'],
                    'sort_order' => $order,
                    'is_won' => $stage['is_won'] ?? false,
                    'is_lost' => $stage['is_lost'] ?? false,
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }

        foreach (['Hosting y dominios', 'Software y suscripciones', 'APIs e inteligencia artificial', 'Diseño y recursos', 'Publicidad', 'Otros'] as $name) {
            DB::table('expense_categories')->updateOrInsert(
                ['name' => $name],
                ['updated_at' => $now, 'created_at' => $now],
            );
        }
    }
}
