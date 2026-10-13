import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn } from '@/lib/utils';
import { index as faqsIndex } from '@/routes/admin/catalog/faqs';
import { index as featuresIndex } from '@/routes/admin/catalog/features';
import { index as plansIndex } from '@/routes/admin/catalog/plans';
import { index as servicesIndex } from '@/routes/admin/catalog/services';

const tabs = [
    { title: 'Servicios', href: servicesIndex() },
    { title: 'Planes', href: plansIndex() },
    { title: 'Funcionalidades', href: featuresIndex() },
    { title: 'Preguntas frecuentes', href: faqsIndex() },
];

/** Secciones del catálogo comercial. Solo lo publicado aparece en el sitio. */
export default function CatalogLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold">Catálogo</h1>
                <p className="text-sm text-muted-foreground">
                    Lo que ofreces. Solo lo marcado como publicado aparece en el
                    sitio y lo usa el asistente.
                </p>
            </div>
            <nav
                aria-label="Secciones del catálogo"
                className="flex gap-1 overflow-x-auto border-b"
            >
                {tabs.map((tab) => (
                    <Link
                        key={tab.title}
                        href={tab.href}
                        className={cn(
                            '-mb-px border-b-2 px-3 pb-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                            isCurrentOrParentUrl(tab.href)
                                ? 'border-primary text-foreground'
                                : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {tab.title}
                    </Link>
                ))}
            </nav>
            {children}
        </div>
    );
}
