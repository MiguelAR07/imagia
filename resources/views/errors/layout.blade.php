<!DOCTYPE html>
<html lang="es" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>@yield('title') · {{ config('app.name') }}</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <style>
        *{box-sizing:border-box}
        body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#0a0c11;color:#eceef3;
            font-family:"Instrument Sans",ui-sans-serif,system-ui,sans-serif}
        main{max-width:520px;text-align:center}
        .code{font-family:ui-monospace,Consolas,monospace;font-size:13px;letter-spacing:.2em;color:#22d3ee}
        h1{font-size:clamp(28px,6vw,40px);line-height:1.1;margin:12px 0}
        p{color:#9097a6;font-size:17px;line-height:1.6;margin:0 0 28px}
        a{display:inline-block;padding:12px 20px;border-radius:12px;background:linear-gradient(90deg,#3b5bff,#2f57f0);
            color:#fff;font-weight:600;text-decoration:none}
        a:focus-visible{outline:2px solid #22d3ee;outline-offset:3px}
        svg{width:72px;height:72px;margin-bottom:12px}
    </style>
</head>
<body>
<main>
    <svg viewBox="0 0 64 64" aria-hidden="true">
        <defs>
            <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="6" y1="47" x2="36" y2="17"><stop offset="0" stop-color="#3B5BFF"/><stop offset="1" stop-color="#22D3EE"/></linearGradient>
            <linearGradient id="b" gradientUnits="userSpaceOnUse" x1="27" y1="17" x2="57" y2="47"><stop offset="0" stop-color="#22D3EE"/><stop offset="1" stop-color="#3B5BFF"/></linearGradient>
            <mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"/><path d="M39.4 46.77 A15 15 0 0 1 31.4 42.6" fill="none" stroke="#000" stroke-width="12"/></mask>
        </defs>
        <path d="M42 17 A15 15 0 0 1 42 47 A15 15 0 0 1 42 17" fill="none" stroke="url(#b)" stroke-width="6.5"/>
        <rect x="6" y="17" width="30" height="30" rx="9" fill="none" stroke="url(#a)" stroke-width="6.5" mask="url(#m)"/>
        <g fill="#ECEEF3"><rect x="13" y="25" width="10" height="3.4" rx="1.7"/><rect x="13" y="31" width="6" height="3.4" rx="1.7" opacity=".5"/></g>
        <circle cx="57" cy="32" r="3.6" fill="#fff"/>
    </svg>
    <div class="code">@yield('code')</div>
    <h1>@yield('title')</h1>
    <p>@yield('message')</p>
    <a href="/">Volver al inicio</a>
</main>
</body>
</html>
