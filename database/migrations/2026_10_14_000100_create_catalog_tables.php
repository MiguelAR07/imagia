<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Catálogo comercial: servicios, funcionalidades reutilizables, planes y preguntas frecuentes.
 * Una funcionalidad («Formulario de contacto») se define una vez y se asigna a varios planes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('summary', 300);
            $table->text('description')->nullable();
            $table->json('benefits')->nullable();
            $table->string('icon', 50)->nullable();
            $table->boolean('is_published')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('features', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('description', 300)->nullable();
            $table->timestamps();
        });

        Schema::create('feature_service', function (Blueprint $table) {
            $table->foreignId('service_id')->constrained()->cascadeOnDelete();
            $table->foreignId('feature_id')->constrained()->cascadeOnDelete();
            $table->primary(['service_id', 'feature_id']);
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('summary', 300);
            $table->text('description')->nullable();
            // fixed: precio fijo · from: «desde» · quote: solo cotización
            $table->string('price_type', 10)->default('quote');
            $table->decimal('price', 14, 2)->nullable();
            $table->char('currency', 3)->default('COP');
            $table->string('estimated_time', 100)->nullable();
            $table->text('limits')->nullable();
            $table->text('exclusions')->nullable();
            $table->json('addons')->nullable();
            $table->string('badge', 40)->nullable();
            $table->boolean('is_published')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('feature_plan', function (Blueprint $table) {
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->foreignId('feature_id')->constrained()->cascadeOnDelete();
            // included: incluida · optional: opcional (puede tener costo adicional)
            $table->string('kind', 10)->default('included');
            $table->string('extra_price_note', 100)->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->primary(['plan_id', 'feature_id']);
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            // Sin dueño: pregunta general (también la usa el asistente).
            $table->nullableMorphs('faqable');
            $table->string('question');
            $table->text('answer');
            $table->boolean('is_published')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('feature_plan');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('feature_service');
        Schema::dropIfExists('features');
        Schema::dropIfExists('services');
    }
};
