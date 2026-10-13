<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_module_tables_exist()
    {
        $tables = [
            'settings', 'services', 'features', 'feature_service', 'plans', 'feature_plan', 'faqs',
            'clients', 'contacts', 'pipeline_stages', 'leads', 'activities',
            'technologies', 'portfolio_items', 'portfolio_images', 'portfolio_item_technology', 'testimonials',
            'chat_sessions', 'chat_messages',
            'tax_rates', 'quotes', 'quote_items',
            'projects', 'milestones', 'tasks', 'task_comments', 'deliverables', 'files',
            'payments', 'expense_categories', 'expenses',
        ];

        foreach ($tables as $table) {
            $this->assertTrue(Schema::hasTable($table), "Falta la tabla {$table}");
        }
    }

    public function test_the_seeder_creates_the_sales_pipeline_once()
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(7, DB::table('pipeline_stages')->count());
        $this->assertSame('nuevo', DB::table('pipeline_stages')->orderBy('sort_order')->value('slug'));
        $this->assertSame(1, DB::table('pipeline_stages')->where('is_won', true)->count());
        $this->assertSame(0, DB::table('tax_rates')->count(), 'Los impuestos los configura el negocio');
    }
}
