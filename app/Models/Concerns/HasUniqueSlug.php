<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * Genera un slug único a partir de un texto (para URLs públicas).
 */
trait HasUniqueSlug
{
    public static function uniqueSlug(string $text, ?int $ignoreId = null): string
    {
        $base = Str::slug($text) ?: 'item';
        $slug = $base;
        $i = 2;
        $softDeletes = in_array(SoftDeletes::class, class_uses_recursive(static::class), true);

        while (static::query()
            ->when($softDeletes, fn ($q) => $q->withTrashed())
            ->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
            ->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
