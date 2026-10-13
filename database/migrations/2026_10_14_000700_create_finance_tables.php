<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Control financiero interno (no es un sistema contable certificado).
 * Cotizado (quotes.total), contratado (projects.agreed_amount) y recibido (suma de payments)
 * se guardan por separado y nunca se mezclan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 14, 2);
            $table->char('currency', 3)->default('COP');
            $table->date('paid_on');
            // transfer, cash, card, payment_link, other
            $table->string('method', 20)->default('transfer');
            $table->string('reference', 100)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['project_id', 'paid_on']);
        });

        Schema::create('expense_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60)->unique();
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            // Sin proyecto: gasto general del negocio (herramientas, suscripciones).
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('expense_category_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->string('vendor', 100)->nullable();
            $table->decimal('amount', 14, 2);
            $table->char('currency', 3)->default('COP');
            $table->date('spent_on');
            $table->boolean('is_recurring')->default(false);
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['spent_on']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('expense_categories');
        Schema::dropIfExists('payments');
    }
};
