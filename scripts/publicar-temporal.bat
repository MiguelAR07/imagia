@echo off
title IMAGIA - Publicacion temporal
echo.
echo  ================================================================
echo   IMAGIA en internet (temporal, gratis) con Cloudflare
echo  ----------------------------------------------------------------
echo   1. Herd debe estar abierto.
echo   2. Busca abajo la linea con  https://....trycloudflare.com
echo      Esa es tu direccion publica. Cambia cada vez que lo abres.
echo   3. Mientras esta ventana este abierta, la web esta en linea.
echo      Para apagarla, cierra esta ventana.
echo  ================================================================
echo.
"C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --no-autoupdate --url http://127.0.0.1:80 --http-host-header imagia.test
pause
