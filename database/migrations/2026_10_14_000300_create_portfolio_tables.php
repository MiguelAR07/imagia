<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Portafolio público. Un proyecto solo se muestra si está publicado y no es confidencial.
 * Los testimonios guardan la fecha de autorización: sin autorización no se publican.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('technologies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60)->unique();
            $table->timestamps();
        });

        Schema::create('portfolio_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('client_display_name')->nullable();
            $table->boolean('client_name_authorized')->default(false);
            $table->string('category', 60);
            $table->string('cover_path')->nullable();
            $table->string('summary', 300);
            $table->text('problem')->nullable();
            $table->text('solution')->nullable();
            $table->json('highlights')->nullable();
            $table->date('completed_on')->nullable();
            $table->string('public_url')->nullable();
            // draft: borrador · published: publicado
            $table->string('status', 10)->default('draft');
            $table->boolean('is_confidential')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'is_confidential', 'is_featured']);
        });

        Schema::create('portfolio_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_item_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('caption')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('portfolio_item_technology', function (Blueprint $table) {
            $table->foreignId('portfolio_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('technology_id')->constrained()->cascadeOnDelete();
            $table->primary(['portfolio_item_id', 'technology_id']);
        });

        Schema::create('testimonials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('portfolio_item_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('author_name');
            $table->string('author_role')->nullable();
            $table->text('quote');
            $table->timestamp('authorized_at')->nullable();
            $table->string('authorization_note')->nullable();
            $table->boolean('is_published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('testimonials');
        Schema::dropIfExists('portfolio_item_technology');
        Schema::dropIfExists('portfolio_images');
        Schema::dropIfExists('portfolio_items');
        Schema::dropIfExists('technologies');
    }
};
