<?php

namespace App\Console\Commands;

use App\Assistant\AiEngine;
use App\Models\ChatSession;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Hace una pregunta real a la IA del asistente para comprobar la clave y el modelo.
 * No guarda nada: la conversación de prueba se descarta.
 */
class TestAssistantAi extends Command
{
    protected $signature = 'imagia:probar-ia {mensaje=Tengo una barbería y quiero que mis clientes reserven citas por internet}';

    protected $description = 'Comprueba que el asistente con IA responde (usa la clave de .env)';

    public function handle(): int
    {
        if (blank(config('services.anthropic.key'))) {
            $this->error('Falta ANTHROPIC_API_KEY en el archivo .env.');

            return self::FAILURE;
        }

        $this->info('Modelo: '.config('services.anthropic.model'));
        $this->line('Visitante: '.$this->argument('mensaje'));

        DB::beginTransaction();

        try {
            $session = ChatSession::query()->create([
                'uuid' => (string) Str::uuid(),
                'engine' => 'ai',
                'answers' => [],
                'status' => 'open',
                'attention_status' => 'new',
            ]);
            $session->messages()->create(['role' => 'user', 'content' => $this->argument('mensaje')]);

            $turn = app(AiEngine::class)->reply($session, $this->argument('mensaje'));

            $this->newLine();
            $this->line('Asistente: '.$turn->reply);
            if ($turn->quickReplies !== []) {
                $this->line('Opciones: '.implode(' · ', $turn->quickReplies));
            }
            $this->newLine();
            $this->info('✔ La IA responde correctamente.');

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error('La IA no respondió: '.$e->getMessage());
            $this->line('El sitio seguirá usando el flujo guiado hasta que se corrija.');

            return self::FAILURE;
        } finally {
            DB::rollBack();
        }
    }
}
