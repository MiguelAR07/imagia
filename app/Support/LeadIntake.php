<?php

namespace App\Support;

use App\Models\Lead;
use App\Models\PipelineStage;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Registra en el embudo a las personas que escriben desde el sitio
 * (formularios ahora; el asistente en la Fase 5). Siempre con su autorización.
 */
class LeadIntake
{
    /**
     * @param  array{name: string, company?: string|null, email?: string|null, phone?: string|null, need?: string|null,
     *     budget_range?: string|null, urgency?: string|null, recommended_plan_id?: int|null}  $data
     * @param  list<string>  $details  Líneas extra para el historial (respuestas, preferencia de reunión…)
     */
    public static function register(array $data, string $source, array $details = []): Lead
    {
        $stage = PipelineStage::initial();

        if ($stage === null) {
            throw new RuntimeException('El embudo comercial no tiene etapas.');
        }

        return DB::transaction(function () use ($data, $source, $details, $stage) {
            $lead = new Lead([
                ...collect($data)->except('recommended_plan_id')->all(),
                'source' => $source,
                'pipeline_stage_id' => $stage->id,
            ]);
            $lead->forceFill([
                'consent_at' => now(),
                'recommended_plan_id' => $data['recommended_plan_id'] ?? null,
            ])->save();

            $lines = ['Llegó desde '.mb_strtolower(Lead::SOURCES[$source]).'.', ...$details];
            $lead->logActivity('system', implode("\n", $lines));

            return $lead;
        });
    }
}
