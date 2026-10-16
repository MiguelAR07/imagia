<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La cotización tiene un enlace para el cliente, y el anticipo se paga desde ahí:
 * el link de pago nace de la cotización y queda en el proyecto cuando este se crea.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->string('public_token', 40)->nullable()->unique()->after('number');
        });

        Schema::table('payment_links', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->change();
            $table->foreignId('quote_id')->nullable()->after('project_id')->constrained()->nullOnDelete();
            // deposit (anticipo), balance (saldo final), other
            $table->string('kind', 10)->default('other')->after('quote_id');
        });
    }

    public function down(): void
    {
        Schema::table('payment_links', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quote_id');
            $table->dropColumn('kind');
        });

        Schema::table('quotes', function (Blueprint $table) {
            $table->dropUnique(['public_token']);
            $table->dropColumn('public_token');
        });
    }
};
