import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CreditCard, ListChecks, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/utils';
import { open, read } from '@/routes/admin/notifications';

const ICONS = { lead: Target, task: ListChecks, payment: CreditCard };

/** Campana del panel: prospectos nuevos, tareas asignadas… */
export function NotificationBell() {
    const { notifications } = usePage().props;

    if (!notifications) {
        return null;
    }

    const { unread, items } = notifications;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={
                        unread > 0
                            ? `Notificaciones: ${unread} sin leer`
                            : 'Notificaciones'
                    }
                >
                    <Bell className="size-5" />
                    {unread > 0 && (
                        <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-[#3b5bff] to-[#22d3ee] px-1 text-[10px] leading-4 font-bold text-white">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    Notificaciones
                    {unread > 0 && (
                        <button
                            type="button"
                            className="text-xs font-normal text-muted-foreground hover:text-foreground"
                            onClick={() =>
                                router.post(
                                    read().url,
                                    {},
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Marcar todo como leído
                        </button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No tienes notificaciones.
                    </p>
                ) : (
                    items.map((n) => {
                        const Icon =
                            ICONS[n.icon as keyof typeof ICONS] ?? Bell;

                        return (
                            <DropdownMenuItem key={n.id} asChild>
                                <Link
                                    href={open(n.id).url}
                                    className="flex items-start gap-3"
                                >
                                    <Icon
                                        className={cn(
                                            'mt-0.5 size-4 shrink-0',
                                            n.read
                                                ? 'text-muted-foreground'
                                                : 'text-brand-cyan',
                                        )}
                                    />
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className={cn(
                                                'truncate text-sm',
                                                !n.read && 'font-semibold',
                                            )}
                                        >
                                            {n.title}
                                        </p>
                                        {n.body && (
                                            <p className="truncate text-xs text-muted-foreground">
                                                {n.body}
                                            </p>
                                        )}
                                        <p className="text-[11px] text-muted-foreground">
                                            {formatRelative(n.created_at)}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <span
                                            className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-blue"
                                            aria-label="Sin leer"
                                        />
                                    )}
                                </Link>
                            </DropdownMenuItem>
                        );
                    })
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
