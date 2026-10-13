<?php

namespace Database\Seeders;

use App\Models\Feature;
use App\Models\Plan;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Catálogo inicial propuesto en la Fase 1. Todo queda como BORRADOR y SIN PRECIO:
 * se revisa, se completa y se publica desde el panel. Solo se carga si el catálogo está vacío.
 */
class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        if (Service::query()->exists() || Plan::query()->exists()) {
            return;
        }

        DB::transaction(function () {
            $f = collect([
                'Diseño adaptable a celular, tablet y computador',
                'Secciones personalizadas',
                'Formulario de contacto',
                'Botón de WhatsApp',
                'Optimización básica para buscadores (SEO)',
                'Analítica de visitas',
                'Sitio de varias páginas',
                'Presentación de servicios',
                'Administrador de contenido',
                'Blog',
                'Varios idiomas',
                'Inicio de sesión y permisos por rol',
                'Panel administrativo',
                'Gestión de usuarios',
                'Agenda de citas y reservas',
                'Inventario',
                'Clientes (CRM)',
                'Reportes',
                'Automatización de procesos',
                'Integración con otros sistemas (API)',
                'Funciones con inteligencia artificial',
                'App móvil',
            ])->mapWithKeys(fn ($name) => [$name => Feature::query()->create(['name' => $name])->id]);

            $services = [
                ['Landing pages', 'Rocket', 'Una página enfocada en convertir visitantes en clientes.', ['Diseño adaptable a celular, tablet y computador', 'Formulario de contacto', 'Botón de WhatsApp', 'Optimización básica para buscadores (SEO)']],
                ['Páginas web', 'Globe', 'Sitios corporativos con varias secciones para presentar tu negocio.', ['Sitio de varias páginas', 'Presentación de servicios', 'Formulario de contacto', 'Administrador de contenido']],
                ['Software de gestión', 'Database', 'Sistemas para organizar clientes, citas, inventario y procesos internos.', ['Inicio de sesión y permisos por rol', 'Gestión de usuarios', 'Reportes']],
                ['Paneles administrativos', 'LayoutDashboard', 'Un panel claro para administrar la información de tu negocio.', ['Panel administrativo', 'Gestión de usuarios', 'Reportes']],
                ['Automatización empresarial', 'Workflow', 'Procesos que funcionan solos para ahorrar tiempo y errores.', ['Automatización de procesos', 'Integración con otros sistemas (API)']],
                ['Integraciones e inteligencia artificial', 'Sparkles', 'Conectamos tus herramientas y agregamos IA donde aporta valor.', ['Integración con otros sistemas (API)', 'Funciones con inteligencia artificial']],
            ];

            $serviceIds = [];
            foreach ($services as $order => [$name, $icon, $summary, $features]) {
                $service = Service::query()->create([
                    'name' => $name,
                    'slug' => Service::uniqueSlug($name),
                    'summary' => $summary,
                    'icon' => $icon,
                    'is_published' => false,
                    'sort_order' => $order,
                ]);
                $service->features()->sync($f->only($features)->values());
                $serviceIds[$name] = $service->id;
            }

            $plans = [
                [
                    'Presencia Digital', 'Landing pages', 'Para negocios que necesitan empezar a tener presencia profesional en internet.', 'from',
                    ['Diseño adaptable a celular, tablet y computador', 'Secciones personalizadas', 'Formulario de contacto', 'Botón de WhatsApp', 'Optimización básica para buscadores (SEO)'],
                    ['Analítica de visitas'],
                ],
                [
                    'Web Profesional', 'Páginas web', 'Para empresas que necesitan una página web corporativa con varias secciones.', 'from',
                    ['Sitio de varias páginas', 'Presentación de servicios', 'Formulario de contacto', 'Diseño adaptable a celular, tablet y computador', 'Optimización básica para buscadores (SEO)', 'Administrador de contenido'],
                    ['Blog', 'Varios idiomas', 'Integración con otros sistemas (API)'],
                ],
                [
                    'Gestión Empresarial', 'Software de gestión', 'Para empresas que necesitan organizar sus procesos internos con un sistema propio.', 'quote',
                    ['Inicio de sesión y permisos por rol', 'Panel administrativo', 'Gestión de usuarios', 'Reportes'],
                    ['Agenda de citas y reservas', 'Inventario', 'Clientes (CRM)', 'App móvil'],
                ],
                [
                    'Solución a Medida', 'Automatización empresarial', 'Para automatizaciones, integraciones o funcionalidades específicas.', 'quote',
                    ['Automatización de procesos', 'Integración con otros sistemas (API)'],
                    ['Funciones con inteligencia artificial', 'App móvil'],
                ],
            ];

            foreach ($plans as $order => [$name, $service, $summary, $priceType, $included, $optional]) {
                $plan = Plan::query()->create([
                    'service_id' => $serviceIds[$service],
                    'name' => $name,
                    'slug' => Plan::uniqueSlug($name),
                    'summary' => $summary,
                    'price_type' => $priceType,
                    'price' => null,
                    'currency' => 'COP',
                    'exclusions' => 'Dominio, alojamiento y mantenimiento no están incluidos salvo que se acuerden por separado.',
                    'badge' => $name === 'Web Profesional' ? 'Recomendado' : null,
                    'is_published' => false,
                    'sort_order' => $order,
                ]);

                $sync = [];
                foreach (array_values($included) as $i => $feature) {
                    $sync[$f[$feature]] = ['kind' => 'included', 'sort_order' => $i];
                }
                foreach (array_values($optional) as $i => $feature) {
                    $sync[$f[$feature]] = ['kind' => 'optional', 'sort_order' => 100 + $i];
                }
                $plan->features()->sync($sync);
            }
        });
    }
}
