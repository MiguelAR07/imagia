# IMAGIA

Plataforma para administrar el negocio de desarrollo de software de IMAGIA: sitio público, panel privado, CRM, proyectos, cotizaciones, finanzas y asistente comercial.

> **IMAGIA** = Imagina + Magia + IA · _Tú lo imaginas. Nosotros hacemos la magia._
> **I**nnovación · **M**ovilidad · **A**utomatización · **G**estión · **I**nteligencia · **A**plicaciones web

## Tecnología

| Capa             | Herramienta                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| Backend          | Laravel 13 · PHP 8.4                                                     |
| Interfaz         | React 19 + TypeScript con Inertia 3 · Tailwind 4 · componentes shadcn/ui |
| Rutas tipadas    | Wayfinder (genera `resources/js/routes` y `resources/js/actions`)        |
| Acceso           | Laravel Fortify (login, verificación en dos pasos, llaves de acceso)     |
| Roles y permisos | spatie/laravel-permission                                                |
| Base de datos    | SQLite en desarrollo · MySQL en producción                               |
| Pruebas          | Pest / PHPUnit                                                           |

## Puesta en marcha (Windows con Laravel Herd)

El proyecto vive en `C:\Users\<usuario>\Herd\imagia` y Herd lo sirve en **http://imagia.test**.

```bash
composer install
npm install
cp .env.example .env        # solo la primera vez
php artisan key:generate    # solo la primera vez
php artisan migrate --seed  # tablas + roles + etapas del embudo
php artisan imagia:admin    # crea tu cuenta de administrador (pide nombre, correo y contraseña)
npm run dev                 # deja esta terminal abierta mientras trabajas
```

Luego entra a **http://imagia.test/login**.

> No hay registro público. Las demás cuentas se crean desde **Panel → Usuarios**, que envía un enlace para que cada persona cree su contraseña. En desarrollo los correos no se envían: quedan escritos en `storage/logs/laravel.log` (`MAIL_MAILER=log`).

## Comandos útiles

| Comando                    | Para qué                                                                 |
| -------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`              | Interfaz con recarga automática                                          |
| `npm run build`            | Compilar la interfaz para producción                                     |
| `php artisan test`         | Ejecutar todas las pruebas                                               |
| `npx tsc --noEmit`         | Revisar tipos de TypeScript                                              |
| `npm run check:fix`        | Formatear y revisar el código de la interfaz                             |
| `vendor/bin/pint`          | Formatear el código PHP                                                  |
| `php artisan imagia:admin` | Crear un administrador o convertir una cuenta existente en administrador |
| `php artisan db:seed`      | Volver a sembrar roles, permisos y datos base (no duplica)               |

## Estructura

```
app/
  Console/Commands/CreateAdmin.php      comando imagia:admin
  Http/Controllers/Admin/               controladores del panel (/admin)
  Http/Requests/Admin/                  validaciones del panel
  Http/Middleware/EnsureUserIsActive    cierra la sesión de usuarios desactivados
  Support/Settings.php                  configuración editable (marca, contacto)
  Support/Permissions.php               catálogo de roles y permisos
database/migrations/                    tablas de todos los módulos
resources/brand/                        logo, favicon y brand.json (marca oficial)
resources/js/pages/admin/               pantallas del panel
resources/js/pages/welcome.tsx          página pública provisional
routes/admin.php                        rutas del panel
```

## Marca y configuración

- `resources/brand/brand.json` es la marca **por defecto**: nombre, siglas, lema, colores y significado del logo.
- Lo que se edite en **Panel → Configuración** se guarda en la tabla `settings` y tiene prioridad sobre `brand.json`.
- Las siglas se validan contra el nombre: una palabra por letra, en el mismo orden.
- El significado de la marca se muestra en el inicio del panel, en el login y en la página pública.

## Roles

| Rol           | Puede                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| Administrador | Todo                                                                                        |
| Colaborador   | Entrar al panel, ver clientes, gestionar prospectos, proyectos y tareas, ver conversaciones |

Los permisos de los módulos futuros ya existen en `app/Support/Permissions.php`. Siempre debe quedar al menos un administrador activo.

## Reglas de negocio definidas en la base de datos

- **Dinero:** cotizado (`quotes.total`), contratado (`projects.agreed_amount`) y recibido (suma de `payments`) se guardan por separado. Crear o aceptar una cotización no registra pagos.
- **Avance de proyectos:** por tareas (peso de las terminadas ÷ peso total) o manual, indicado en `projects.progress_mode`.
- **Portafolio:** solo es público lo que está publicado y no es confidencial. Los testimonios necesitan fecha de autorización.
- **Asistente:** guarda la fecha de consentimiento del prospecto y solo un hash de la IP.
- **Moneda:** por defecto `COP`, editable en cada registro.

## Pendiente de definir

- Dominio y registro de la marca.
- Impuestos por defecto (se agregan en **Cotizaciones → Impuestos**).
- Precios de los planes (el catálogo inicial está en borrador y sin precio).
- Clave de IA para el asistente (opcional; sin ella funciona el flujo guiado).
- Servidor de correo para producción (`MAIL_*` en `.env`).

## Módulos del panel (Fase 3)

| Módulo       | Ruta                  | Lo esencial                                                                                                                 |
| ------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Prospectos   | `/admin/prospectos`   | Embudo Kanban (arrastrar o selector), etapas editables, «perdido» exige motivo, seguimientos vencidos, conversión a cliente |
| Clientes     | `/admin/clientes`     | Búsqueda, ficha, contactos (uno principal), historial de notas e interacciones, archivar/restaurar                          |
| Cotizaciones | `/admin/cotizaciones` | Número `COT-AAAA-NNN`, totales calculados en el servidor, estados, vista imprimible/PDF, crear proyecto al aceptar          |
| Proyectos    | `/admin/proyectos`    | Tabla, tablero y calendario; ficha con tareas, hitos, entregables, archivos privados e historial                            |
| Tareas       | `/admin/tareas`       | Vista general con filtros por vencimiento, estado, proyecto y responsable; comentarios                                      |
| Catálogo     | `/admin/catalogo`     | Servicios, planes (precio fijo, «desde» o cotización), funcionalidades reutilizables, preguntas frecuentes                  |
| Portafolio   | `/admin/portafolio`   | Portada, galería, tecnologías, testimonios autorizados; publicar, duplicar, confidencial                                    |

Las imágenes del portafolio y los archivos de proyectos se guardan en `storage/app/private` y se sirven a través de controladores que validan permisos.

## Asistente del sitio (Fase 5)

El botón **«¿Te ayudo?»** del sitio abre un chat que hace una pregunta a la vez, recomienda una solución (landing, web profesional, sistema de gestión o a la medida) y ofrece: solicitar cotización o reunión (crea el prospecto con el resumen), continuar por WhatsApp con el resumen, o ver el resumen.

- **Sin IA (por defecto):** flujo guiado por reglas en `app/Assistant/RulesEngine.php`. Se adapta al objetivo y acepta texto libre.
- **Con IA (opcional):** agrega en `.env`:

  ```env
  ANTHROPIC_API_KEY=sk-ant-...
  ASSISTANT_MODEL=claude-opus-5-5   # se puede cambiar por otro modelo de Claude
  ASSISTANT_DAILY_LIMIT=300         # respuestas con IA por día; luego sigue el flujo guiado
  ```

  Las instrucciones del asistente están en `resources/prompts/assistant.md` y solo recibe el catálogo **publicado** (con precio solo si está definido). La respuesta de la IA se valida contra un esquema; si falla, se niega o llega al tope diario, la conversación sigue con el flujo guiado. Se usa el respaldo de servidor (`fallbacks: default`) por si el modelo declina una solicitud.
- **Seguridad:** la clave nunca llega al navegador; límites por IP (20 mensajes/min, 10 conversaciones/hora), 30 mensajes por conversación y 1.000 caracteres por mensaje; se quita el HTML; el asistente no puede guardar datos ni agendar: solo el formulario con autorización crea el prospecto.
- **Panel:** **Conversaciones** (`/admin/conversaciones`) muestra transcripción, resumen, prospecto vinculado, seguimiento (nueva / en revisión / atendida) y notas. **Configuración → Asistente** activa o desactiva el chat, cambia el saludo, elige el plan que se muestra con cada recomendación y muestra el estado de la IA.

## Fases

1. ✅ Marca y experiencia visual
2. ✅ Base de la plataforma: estructura, base de datos, acceso, roles, configuración
3. ✅ Administración: clientes, prospectos, proyectos, tareas, catálogo, portafolio, planes, cotizaciones
4. ✅ Sitio comercial: inicio, servicios, proyectos, planes, proceso, cotizar, contacto, legales, SEO
5. ✅ Asistente inteligente: flujo guiado + IA opcional, conversaciones en el panel
6. Seguimiento comercial y financiero
7. Pruebas y despliegue
