<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Proyectos, hitos, tareas, comentarios, entregables y archivos.
 *
 * Avance del proyecto (progress_mode):
 * - tasks: suma del peso de las tareas terminadas ÷ peso total (peso 1 por defecto).
 * - manual: se usa manual_progress y el panel lo indica como valor manual.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->foreignId('quote_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category', 60)->nullable();
            // planning, in_progress, review, delivered, paused, cancelled
            $table->string('status', 12)->default('planning');
            // low, medium, high, urgent
            $table->string('priority', 10)->default('medium');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            // Valor contratado (puede diferir del cotizado).
            $table->decimal('agreed_amount', 14, 2)->nullable();
            $table->char('currency', 3)->default('COP');
            $table->string('progress_mode', 6)->default('tasks');
            $table->unsignedTinyInteger('manual_progress')->nullable();
            $table->text('observations')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'due_date']);
        });

        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('milestone_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            // todo, in_progress, review, done
            $table->string('status', 12)->default('todo');
            $table->string('priority', 10)->default('medium');
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('due_date')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedSmallInteger('weight')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['project_id', 'status']);
            $table->index(['assignee_id', 'due_date']);
        });

        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('deliverables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('delivered_at')->nullable();
            // pending, delivered, approved
            $table->string('status', 10)->default('pending');
            $table->boolean('is_visible_to_client')->default(false);
            $table->timestamps();
        });

        // Archivos privados de proyectos, tareas o entregables. Se sirven solo a través
        // de un controlador que valida permisos; nunca desde una carpeta pública.
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->morphs('fileable');
            $table->string('disk', 20)->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->boolean('is_shared_with_client')->default(false);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('files');
        Schema::dropIfExists('deliverables');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('milestones');
        Schema::dropIfExists('projects');
    }
};
