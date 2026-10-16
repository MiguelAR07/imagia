<?php

namespace App\Support;

use App\Models\Client;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Quote;
use Illuminate\Support\Facades\DB;

/**
 * Lo que pasa cuando un cliente acepta una cotización: queda aceptada, el prospecto
 * pasa a ser cliente (si aún no lo es) y se crea el proyecto con el valor acordado.
 * Es idempotente: si ya estaba aceptada o ya tiene proyecto, no duplica nada.
 */
class QuoteAcceptance
{
    public static function accept(Quote $quote, string $via): Project
    {
        return DB::transaction(function () use ($quote, $via) {
            if ($quote->status !== 'accepted') {
                $quote->forceFill(['status' => 'accepted', 'accepted_at' => now()])->save();
            }

            return self::projectFor($quote, "Proyecto creado desde la cotización {$quote->number} ({$via}).");
        });
    }

    /**
     * Proyecto de la cotización; lo crea si no existe. Convierte al prospecto en cliente si hace falta.
     */
    public static function projectFor(Quote $quote, string $note): Project
    {
        $existing = $quote->project()->first();

        if ($existing) {
            return $existing;
        }

        $clientId = $quote->client_id ?? ($quote->lead ? self::clientFromLead($quote->lead)->id : null);

        $project = Project::query()->create([
            'client_id' => $clientId,
            'quote_id' => $quote->id,
            'name' => $quote->title,
            'description' => $quote->scope,
            'status' => 'planning',
            'priority' => 'medium',
            'agreed_amount' => $quote->total,
            'currency' => $quote->currency,
            'progress_mode' => 'tasks',
        ]);
        $project->logActivity('system', $note);

        return $project;
    }

    /**
     * Crea el cliente a partir del prospecto (o devuelve el que ya tiene).
     */
    public static function clientFromLead(Lead $lead, ?int $userId = null): Client
    {
        if ($lead->client_id !== null && ($client = Client::withTrashed()->find($lead->client_id))) {
            return $client;
        }

        return DB::transaction(function () use ($lead, $userId) {
            $client = new Client([
                'type' => filled($lead->company) ? 'company' : 'person',
                'name' => $lead->company ?: $lead->name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'status' => 'active',
            ]);
            $client->created_by = $userId;
            $client->save();

            if (filled($lead->company)) {
                $client->contacts()->create([
                    'name' => $lead->name,
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                    'is_primary' => true,
                ]);
            }

            $lead->forceFill(['client_id' => $client->id])->save();
            $lead->logActivity('system', "Convertido en el cliente «{$client->name}».");
            $client->logActivity('system', "Creado a partir del prospecto «{$lead->name}».");

            return $client;
        });
    }
}
