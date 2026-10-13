<?php

namespace Database\Factories;

use App\Models\Lead;
use App\Models\PipelineStage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Solo para pruebas automáticas.
 *
 * @extends Factory<Lead>
 */
class LeadFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'company' => fake()->company(),
            'email' => fake()->unique()->safeEmail(),
            'source' => 'manual',
            'need' => 'Necesita una página web para su negocio.',
            'pipeline_stage_id' => fn () => PipelineStage::query()->orderBy('sort_order')->value('id')
                ?? PipelineStage::query()->create(['name' => 'Nuevo', 'slug' => 'nuevo', 'sort_order' => 0])->id,
        ];
    }
}
