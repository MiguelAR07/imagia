<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    | Asistente del sitio con IA (opcional). La clave solo vive en .env: nunca llega al navegador.
    | Sin clave, el asistente funciona con el flujo guiado por reglas.
    */
    'anthropic' => [
        'key' => env('ANTHROPIC_API_KEY'),
        'model' => env('ASSISTANT_MODEL', 'claude-opus-5-5'),
        // Máximo de respuestas con IA por día; al llegar al tope se usa el flujo guiado.
        'daily_limit' => (int) env('ASSISTANT_DAILY_LIMIT', 300),
        'timeout' => (float) env('ASSISTANT_TIMEOUT', 30),
    ],

    /*
    | Pagos en línea con Wompi. Las llaves solo viven en .env. El ambiente (pruebas o
    | producción) se deduce de la llave pública: pub_test_… o pub_prod_….
    */
    'wompi' => [
        'public_key' => env('WOMPI_PUBLIC_KEY'),
        'integrity_secret' => env('WOMPI_INTEGRITY_SECRET'),
        'events_secret' => env('WOMPI_EVENTS_SECRET'),
    ],

];
