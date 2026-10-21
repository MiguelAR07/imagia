<?php

/*
 * Punto de entrada en Vercel. Allí el disco es de solo lectura salvo /tmp, así que
 * vistas compiladas, caché y registros de Laravel van a /tmp (LARAVEL_STORAGE_PATH).
 */
foreach (['framework/views', 'framework/cache/data', 'framework/sessions', 'logs', 'app/private', 'app/public'] as $dir) {
    $path = '/tmp/storage/'.$dir;

    if (! is_dir($path)) {
        mkdir($path, 0755, true);
    }
}

require __DIR__.'/../public/index.php';
