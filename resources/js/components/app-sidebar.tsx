import { Link } from '@inertiajs/react';
import {
    Building2,
    ExternalLink,
    FileText,
    FolderKanban,
    Images,
    LayoutGrid,
    MessagesSquare,
    ListChecks,
    Package,
    Settings2,
    Target,
    Users,
    Wallet,
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
import { home as catalogHome } from '@/routes/admin/catalog';
import { index as financeIndex } from '@/routes/admin/finance';
import { index as conversationsIndex } from '@/routes/admin/conversations';
import { index as clientsIndex } from '@/routes/admin/clients';
import { index as leadsIndex } from '@/routes/admin/leads';
import { index as portfolioIndex } from '@/routes/admin/portfolio';
import { index as projectsIndex } from '@/routes/admin/projects';
import { index as quotesIndex } from '@/routes/admin/quotes';
import { index as tasksIndex } from '@/routes/admin/tasks';
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
        ...(can('conversaciones.ver')
            ? [
                  {
                      title: 'Conversaciones',
                      href: conversationsIndex(),
                      icon: MessagesSquare,
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
        ...(can('finanzas.ver')
            ? [
                  {
                      title: 'Finanzas',
                      href: financeIndex(),
                      icon: Wallet,
                      matchChildren: true,
                  },
              ]
            : []),
        ...(can('cotizaciones.gestionar')
            ? [
                  {
                      title: 'Cotizaciones',
                      href: quotesIndex(),
                      icon: FileText,
                      matchChildren: true,
                  },
              ]
            : []),
    ];

    const operationNavItems: NavItem[] = [
        ...(can('proyectos.ver')
            ? [
                  {
                      title: 'Proyectos',
                      href: projectsIndex(),
                      icon: FolderKanban,
                      matchChildren: true,
                  },
              ]
            : []),
        ...(can('tareas.gestionar')
            ? [{ title: 'Tareas', href: tasksIndex(), icon: ListChecks }]
            : []),
    ];

    const siteNavItems: NavItem[] = can('catalogo.gestionar')
        ? [
              {
                  title: 'Catálogo',
                  href: catalogHome(),
                  icon: Package,
                  matchChildren: true,
              },
              {
                  title: 'Portafolio',
                  href: portfolioIndex(),
                  icon: Images,
                  matchChildren: true,
              },
          ]
        : [];

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
                <NavMain items={operationNavItems} label="Operación" />
                <NavMain items={siteNavItems} label="Sitio público" />
                <NavMain items={systemNavItems} label="Sistema" />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
