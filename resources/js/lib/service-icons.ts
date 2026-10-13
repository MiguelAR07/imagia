import {
    Boxes,
    CalendarCheck,
    Database,
    Globe,
    LayoutDashboard,
    Rocket,
    ShoppingCart,
    Smartphone,
    Sparkles,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Íconos permitidos para los servicios (deben coincidir con Service::ICONS). */
export const SERVICE_ICONS: Record<string, LucideIcon> = {
    Rocket,
    Globe,
    LayoutDashboard,
    Workflow,
    Smartphone,
    Sparkles,
    Database,
    ShoppingCart,
    CalendarCheck,
    Boxes,
};

export const serviceIcon = (name: string | null): LucideIcon =>
    (name && SERVICE_ICONS[name]) || Boxes;
