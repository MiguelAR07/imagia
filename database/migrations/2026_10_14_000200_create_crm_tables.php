<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Clientes, contactos, embudo comercial, prospectos y el historial de interacciones.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            // company: empresa · person: persona natural
            $table->string('type', 10)->default('company');
            $table->string('name');
            $table->string('tax_id', 40)->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('whatsapp', 20)->nullable();
            $table->string('city', 80)->nullable();
            $table->string('website')->nullable();
            $table->string('status', 10)->default('active');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'name']);
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('role', 80)->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });

        Schema::create('pipeline_stages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            $table->string('slug', 60)->unique();
            $table->string('color', 20)->default('slate');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_won')->default(false);
            $table->boolean('is_lost')->default(false);
            $table->timestamps();
        });

        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();
            // chatbot, form, whatsapp, referral, manual
            $table->string('source', 20)->default('manual');
            $table->text('need')->nullable();
            $table->string('budget_range', 80)->nullable();
            $table->string('urgency', 80)->nullable();
            $table->foreignId('recommended_plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->foreignId('pipeline_stage_id')->constrained()->restrictOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            // Fecha en que la persona autorizó el tratamiento de sus datos.
            $table->timestamp('consent_at')->nullable();
            $table->string('lost_reason')->nullable();
            $table->timestamp('last_contacted_at')->nullable();
            $table->timestamp('next_follow_up_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['pipeline_stage_id', 'created_at']);
        });

        // Historial de interacciones y notas internas de clientes, prospectos y proyectos.
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->morphs('subject');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // note, call, email, meeting, whatsapp, status_change, system
            $table->string('type', 20)->default('note');
            $table->text('description');
            $table->json('properties')->nullable();
            $table->timestamp('happened_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
        Schema::dropIfExists('leads');
        Schema::dropIfExists('pipeline_stages');
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('clients');
    }
};
