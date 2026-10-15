<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Una funcionalidad también puede venderse como módulo adicional: con categoría, tamaño,
 * precio y los tipos de proyecto a los que sirve. Lo usa la calculadora de presupuesto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('features', function (Blueprint $table) {
            $table->boolean('is_module')->default(false)->after('description');
            // clients, operation, money, communication, content, automation
            $table->string('category', 20)->nullable()->after('is_module');
            // S, M, L
            $table->char('size', 1)->nullable()->after('category');
            $table->decimal('module_price', 14, 2)->nullable()->after('size');
            // Tipos de proyecto donde tiene sentido: website, management, automation
            $table->json('goals')->nullable()->after('module_price');
            $table->unsignedSmallInteger('module_order')->default(0)->after('goals');
        });
    }

    public function down(): void
    {
        Schema::table('features', function (Blueprint $table) {
            $table->dropColumn(['is_module', 'category', 'size', 'module_price', 'goals', 'module_order']);
        });
    }
};
