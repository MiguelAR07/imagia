<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Conversaciones del asistente comercial del sitio público.
 * No se guarda la IP en claro: solo un hash para limitar abusos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();
            $table->string('ip_hash', 64)->nullable();
            // rules: flujo guiado · ai: modelo de lenguaje
            $table->string('engine', 10)->default('rules');
            $table->foreignId('recommended_plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->json('answers')->nullable();
            $table->text('summary')->nullable();
            // open, converted, closed
            $table->string('status', 10)->default('open');
            // new, in_review, attended
            $table->string('attention_status', 12)->default('new');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'last_message_at']);
        });

        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chat_session_id')->constrained()->cascadeOnDelete();
            // user, assistant
            $table->string('role', 10);
            $table->text('content');
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
        Schema::dropIfExists('chat_sessions');
    }
};
