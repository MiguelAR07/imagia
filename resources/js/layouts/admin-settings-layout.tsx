import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { edit as editBrand } from '@/routes/admin/brand';
import { edit as editContact } from '@/routes/admin/contact';

const tabs = [
    { title: 'Marca', href: editBrand() },
    { title: 'Contacto y redes', href: editContact() },
];

export default function AdminSettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <div className="px-4 py-6 md:px-6">
            <Heading
                title="Configuración"
                description="Lo que edites aquí se refleja en el panel y en el sitio público."
            />

            <nav
                aria-label="Secciones de configuración"
                className="mb-8 flex gap-1 border-b"
            >
                {tabs.map((tab) => (
                    <Link
                        key={tab.title}
                        href={tab.href}
                        className={cn(
                            '-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors',
                            isCurrentUrl(tab.href)
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {tab.title}
                    </Link>
                ))}
            </nav>

            <div className="max-w-3xl">{children}</div>
        </div>
    );
}
