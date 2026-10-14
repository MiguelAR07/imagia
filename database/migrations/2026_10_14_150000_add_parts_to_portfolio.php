<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un proyecto del portafolio puede tener varias partes (sitio web, panel administrativo,
 * portal de clientes…), cada una con su descripción, funciones e imágenes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('portfolio_items', function (Blueprint $table) {
            // [{type, title, description, features: []}]
            $table->json('parts')->nullable()->after('highlights');
        });

        Schema::table('portfolio_images', function (Blueprint $table) {
            // Parte a la que pertenece la imagen (web, admin…); null = galería general.
            $table->string('part', 20)->nullable()->after('caption');
        });
    }

    public function down(): void
    {
        Schema::table('portfolio_images', fn (Blueprint $table) => $table->dropColumn('part'));
        Schema::table('portfolio_items', fn (Blueprint $table) => $table->dropColumn('parts'));
    }
};
