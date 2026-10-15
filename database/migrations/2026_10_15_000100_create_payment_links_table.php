<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links de pago en línea (Wompi) asociados a un proyecto. Cuando Wompi confirma el pago,
 * se crea el registro en `payments` y el link queda pagado.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_links', function (Blueprint $table) {
            $table->id();
            // Identificador público del link (va en la URL que recibe el cliente).
            $table->string('token', 40)->unique();
            $table->foreignId('project_id')->constrained()->restrictOnDelete();
            $table->decimal('amount', 14, 2);
            $table->char('currency', 3)->default('COP');
            $table->string('description');
            // pending, paid, cancelled
            $table->string('status', 10)->default('pending');
            // Último resultado informado por Wompi (APPROVED, DECLINED, VOIDED, ERROR, PENDING).
            $table->string('last_transaction_status', 12)->nullable();
            $table->string('transaction_id', 60)->nullable()->unique();
            $table->string('payment_method_type', 30)->nullable();
            $table->foreignId('payment_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['project_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_links');
    }
};
