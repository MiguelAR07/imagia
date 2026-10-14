import { Globe, Smartphone, Workflow } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';

const ORBIT = [
    { icon: Globe, label: 'Web', className: 'top-[6%] left-[8%]' },
    { icon: Smartphone, label: 'Apps', className: 'top-[18%] right-[2%]' },
    {
        icon: Workflow,
        label: 'Automatización',
        className: 'bottom-[8%] left-[18%]',
    },
];

/**
 * Visual del inicio: el símbolo de la marca con los tres frentes del negocio orbitando.
 * Decorativo: el contenido real está en el texto del hero.
 */
export function HeroVisual() {
    return (
        <div
            aria-hidden="true"
            className="relative mx-auto aspect-square w-full max-w-[460px]"
        >
            <div className="absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(59,91,255,.45),rgba(34,211,238,.1)_45%,transparent_70%)] blur-2xl" />
            <div className="absolute inset-[6%] rounded-full border border-dashed border-brand-blue/25 motion-safe:animate-[spin_60s_linear_infinite]" />
            <div className="absolute inset-[22%] rounded-full border border-brand-cyan/20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <AppLogoIcon
                    animated
                    className="size-[44%] text-foreground drop-shadow-[0_0_40px_rgba(59,91,255,.6)]"
                />
            </div>
            {ORBIT.map(({ icon: Icon, label, className }, i) => (
                <div
                    key={label}
                    className={`absolute flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 px-3 py-2 text-xs font-medium shadow-lg backdrop-blur motion-safe:animate-[float_6s_ease-in-out_infinite] ${className}`}
                    style={{ animationDelay: `${i * 1.2}s` }}
                >
                    <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b5bff] to-[#22d3ee] text-white">
                        <Icon className="size-3.5" />
                    </span>
                    {label}
                </div>
            ))}
        </div>
    );
}
