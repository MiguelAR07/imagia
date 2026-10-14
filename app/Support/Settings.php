<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;

/**
 * Lectura y escritura de la configuración guardada en la tabla `settings`.
 *
 * Los valores por defecto de la marca salen de resources/brand/brand.json,
 * de modo que la plataforma funciona aunque todavía no se haya guardado nada.
 */
class Settings
{
    public const BRAND = 'marca';

    public const CONTACT = 'contacto';

    public const LEGAL = 'legal';

    private const CACHE_PREFIX = 'settings:';

    /**
     * @return array<string, mixed>
     */
    public static function get(string $key): array
    {
        return Cache::rememberForever(self::CACHE_PREFIX.$key, function () use ($key) {
            $stored = Setting::query()->where('key', $key)->value('value');
            $stored = is_string($stored) ? json_decode($stored, true) : $stored;

            return array_replace(self::defaults($key), $stored ?? []);
        });
    }

    /**
     * @param  array<string, mixed>  $value
     */
    public static function put(string $key, array $value): void
    {
        Setting::query()->updateOrCreate(['key' => $key], ['value' => $value]);

        Cache::forget(self::CACHE_PREFIX.$key);
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaults(string $key): array
    {
        return match ($key) {
            self::BRAND => self::brandDefaults(),
            self::CONTACT => [
                'email' => null,
                'phone' => null,
                'whatsapp' => null,
                'whatsapp_message' => 'Hola, quiero hablar sobre un proyecto.',
                'city' => null,
                'instagram' => null,
                'facebook' => null,
                'linkedin' => null,
                'tiktok' => null,
                'github' => null,
            ],
            self::LEGAL => [
                'privacy' => (string) @file_get_contents(resource_path('legal/privacidad.md')),
                'terms' => (string) @file_get_contents(resource_path('legal/terminos.md')),
                'updated_at' => null,
            ],
            default => [],
        };
    }

    /**
     * @return array<string, mixed>
     */
    private static function brandDefaults(): array
    {
        $path = resource_path('brand/brand.json');
        $json = is_file($path) ? json_decode((string) file_get_contents($path), true) : [];

        return [
            'name' => $json['nombre'] ?? 'IMAGIA',
            'tagline' => $json['lema'] ?? '',
            'descriptor' => $json['descriptor'] ?? '',
            'origin' => array_map(fn (array $part) => [
                'part' => $part['parte'],
                'meaning' => $part['significado'],
            ], $json['origen'] ?? []),
            'acronym' => array_map(fn (array $item) => [
                'letter' => $item['letra'],
                'word' => $item['palabra'],
                'description' => $item['descripcion'],
            ], $json['siglas'] ?? []),
            'logo_parts' => array_map(fn (array $part) => [
                'shape' => $part['forma'],
                'meaning' => $part['representa'],
            ], $json['logo']['partes'] ?? []),
        ];
    }
}
