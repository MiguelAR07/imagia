<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($forceDark ?? false) || ($appearance ?? 'system') == 'dark']) @if ($forceDark ?? false) data-force-dark="true" @endif>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @unless ($forceDark ?? false)
            {{-- Inline script to detect system dark mode preference and apply it immediately --}}
            <script>
                (function() {
                    const appearance = '{{ $appearance ?? "system" }}';

                    if (appearance === 'system') {
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                        if (prefersDark) {
                            document.documentElement.classList.add('dark');
                        }
                    }
                })();
            </script>
        @endunless

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: #f4f5f8;
            }

            html.dark {
                background-color: #0a0c11;
            }
        </style>

        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <meta name="theme-color" content="#0a0c11">

        {{-- Datos para buscadores y redes (sitio público). Se generan en el servidor. --}}
        @isset($meta)
            <meta name="description" content="{{ $meta['description'] }}">
            <link rel="canonical" href="{{ $meta['url'] }}">
            <meta property="og:type" content="website">
            <meta property="og:site_name" content="{{ $meta['site_name'] }}">
            <meta property="og:title" content="{{ $meta['title'] }}">
            <meta property="og:description" content="{{ $meta['description'] }}">
            <meta property="og:url" content="{{ $meta['url'] }}">
            @if (! empty($meta['image']))
                <meta property="og:image" content="{{ $meta['image'] }}">
            @endif
            <meta name="twitter:card" content="{{ empty($meta['image']) ? 'summary' : 'summary_large_image' }}">
            @if (! empty($meta['noindex']))
                <meta name="robots" content="noindex">
            @endif
        @endisset

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ $meta['title'] ?? config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
