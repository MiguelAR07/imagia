import { Link } from '@inertiajs/react';
import {
    Building2,
    ExternalLink,
    LayoutGrid,
    Settings2,
    Target,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCan } from '@/hooks/use-can';
import { dashboard, home } from '@/routes';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as leadsIndex } from '@/routes/admin/leads';
import { index as usersIndex } from '@/routes/admin/users';
import type { NavItem } from '@/types';

/*
 * Los módulos se agregan aquí a medida que se construyen (clientes, prospectos,
 * proyectos, cotizaciones…). No se muestran accesos a pantallas que aún no existen.
 */
export function AppSidebar() {
    const can = useCan();

    const mainNavItems: NavItem[] = [
        { title: 'Inicio', href: dashboard(), icon: LayoutGrid },
    ];

    const commercialNavItems: NavItem[] = [
        ...(can('prospectos.gestionar')
            ? [
                  {
                      title: 'Prospectos',
                      href: leadsIndex(),
                      icon: Target,
                      matchChildren: true,
                  },
              ]
            : []),
        ...(can('clientes.ver')
            ? [
                  {
                      title: 'Clientes',
                      href: clientsIndex(),
                      icon: Building2,
                      matchChildren: true,
                  },
              ]
            : []),
    ];

    const systemNavItems: NavItem[] = [
        ...(can('usuarios.gestionar')
            ? [{ title: 'Usuarios', href: usersIndex(), icon: Users }]
            : []),
        ...(can('configuracion.gestionar')
            ? [
                  {
                      title: 'Configuración',
                      href: '/admin/configuracion',
                      icon: Settings2,
                      matchChildren: true,
                  },
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [
        { title: 'Ver sitio público', href: home(), icon: ExternalLink },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} label="Panel" />
                <NavMain items={commercialNavItems} label="Comercial" />
                <NavMain items={systemNavItems} label="Sistema" />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
