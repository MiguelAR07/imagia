<?php

namespace App\Support;

/**
 * Convierte un catálogo «valor => etiqueta» en la lista que usan los selectores de la interfaz.
 */
class Options
{
    /**
     * @param  array<string, string>  $map
     * @return list<array{value: string, label: string}>
     */
    public static function from(array $map): array
    {
        return array_map(
            fn (string $value, string $label) => ['value' => $value, 'label' => $label],
            array_keys($map),
            array_values($map),
        );
    }
}
