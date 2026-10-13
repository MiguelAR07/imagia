<?php

namespace App\Models\Concerns;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Historial de interacciones y notas internas de un registro (cliente, prospecto, proyecto).
 */
trait HasActivities
{
    /**
     * @return MorphMany<Activity, $this>
     */
    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject')->latest('happened_at')->latest('id');
    }

    /**
     * @param  array<string, mixed>|null  $properties
     */
    public function logActivity(string $type, string $description, ?User $user = null, ?array $properties = null): Activity
    {
        return $this->activities()->create([
            'type' => $type,
            'description' => $description,
            'user_id' => $user?->id ?? auth()->id(),
            'properties' => $properties,
            'happened_at' => now(),
        ]);
    }
}
