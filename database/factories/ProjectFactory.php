<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Solo para pruebas automáticas.
 *
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'name' => 'Proyecto '.fake()->words(2, true),
            'category' => 'website',
            'status' => 'in_progress',
            'priority' => 'medium',
            'start_date' => today()->subWeek(),
            'due_date' => today()->addMonth(),
            'progress_mode' => 'tasks',
        ];
    }
}
