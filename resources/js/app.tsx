import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AdminSettingsLayout from '@/layouts/admin-settings-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import CatalogLayout from '@/layouts/catalog-layout';
import SettingsLayout from '@/layouts/settings/layout';
import SiteLayout from '@/layouts/site-layout';

const appName = import.meta.env.VITE_APP_NAME || 'IMAGIA';

void createInertiaApp({
    // Las páginas públicas ya traen el nombre de la marca en su título.
    title: (title) =>
        !title
            ? appName
            : title.includes(appName)
              ? title
              : `${title} - ${appName}`,
    layout: (name) => {
        switch (true) {
            case name === 'admin/quotes/print':
                return null;
            case name.startsWith('site/'):
                return SiteLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            case name.startsWith('admin/settings/'):
                return [AppLayout, AdminSettingsLayout];
            case name.startsWith('admin/catalog/'):
                return [AppLayout, CatalogLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#22D3EE',
    },
});

// This will set light / dark mode on load...
initializeTheme();
