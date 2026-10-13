<?php

namespace App\Support;

/**
 * Catálogo de roles y permisos de la plataforma.
 *
 * Se definen desde ahora todos los permisos de los módulos planeados, para que
 * cada módulo nuevo solo tenga que usarlos. El rol administrador tiene acceso
 * total (ver Gate::before en AppServiceProvider).
 */
class Permissions
{
    public const ROLE_ADMIN = 'administrador';

    public const ROLE_COLLABORATOR = 'colaborador';

    public const PANEL_ACCESS = 'panel.acceder';

    public const MANAGE_BRAND = 'configuracion.gestionar';

    public const MANAGE_USERS = 'usuarios.gestionar';

    /**
     * @return array<string, string> permiso => descripción
     */
    public static function all(): array
    {
        return [
            self::PANEL_ACCESS => 'Entrar al panel administrativo',
            self::MANAGE_BRAND => 'Editar la configuración de la marca y el contacto',
            self::MANAGE_USERS => 'Crear usuarios y asignar roles',
            'clientes.ver' => 'Ver clientes',
            'clientes.gestionar' => 'Crear y editar clientes',
            'prospectos.gestionar' => 'Gestionar prospectos y embudo comercial',
            'conversaciones.ver' => 'Ver conversaciones del asistente',
            'proyectos.ver' => 'Ver proyectos',
            'proyectos.gestionar' => 'Crear y editar proyectos',
            'tareas.gestionar' => 'Crear y editar tareas',
            'catalogo.gestionar' => 'Editar servicios, planes y portafolio',
            'cotizaciones.gestionar' => 'Crear y editar cotizaciones',
            'finanzas.ver' => 'Ver pagos, gastos y rentabilidad',
            'finanzas.gestionar' => 'Registrar pagos y gastos',
        ];
    }

    /**
     * Permisos por rol. El administrador recibe todos.
     *
     * @return array<string, list<string>>
     */
    public static function roles(): array
    {
        return [
            self::ROLE_ADMIN => array_keys(self::all()),
            self::ROLE_COLLABORATOR => [
                self::PANEL_ACCESS,
                'clientes.ver',
                'prospectos.gestionar',
                'conversaciones.ver',
                'proyectos.ver',
                'proyectos.gestionar',
                'tareas.gestionar',
            ],
        ];
    }

    /**
     * @return array<string, string> rol => nombre visible
     */
    public static function roleLabels(): array
    {
        return [
            self::ROLE_ADMIN => 'Administrador',
            self::ROLE_COLLABORATOR => 'Colaborador',
        ];
    }
}
