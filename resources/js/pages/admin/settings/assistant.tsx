import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { edit, update } from '@/routes/admin/assistant';
import type { Option } from '@/types';

type Settings = {
    enabled: boolean;
    use_ai: boolean;
    greeting: string;
    plans: Record<string, string | null>;
};

type Props = {
    settings: Settings;
    recommendations: Option[];
    plans: Option[];
    ai: {
        configured: boolean;
        model: string;
        daily_limit: number;
        calls_today: number;
    };
};

export default function AssistantSettingsPage({
    settings,
    recommendations,
    plans,
    ai,
}: Props) {
    const form = useForm({
        enabled: settings.enabled,
        use_ai: settings.use_ai,
        greeting: settings.greeting ?? '',
        plans: Object.fromEntries(
            recommendations.map((r) => [
                r.value,
                settings.plans[r.value] ?? '',
            ]),
        ) as Record<string, string>,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update().url, { preserveScroll: true });
    };

    const errors = form.errors as Record<string, string | undefined>;

    return (
        <>
            <Head title="Asistente" />

            <form onSubmit={submit} className="space-y-10">
                <fieldset className="space-y-4">
                    <legend className="mb-4 text-base font-semibold">
                        Asistente del sitio
                    </legend>
                    <Toggle
                        id="enabled"
                        checked={form.data.enabled}
                        onChange={(v) => form.setData('enabled', v)}
                        label="Mostrar el asistente en el sitio público"
                        hint="Si lo desactivas, desaparece el botón «¿Te ayudo?» y nadie puede iniciar conversaciones."
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="greeting">Saludo inicial</Label>
                        <Textarea
                            id="greeting"
                            rows={3}
                            maxLength={500}
                            value={form.data.greeting}
                            placeholder="¡Hola! Soy tu asistente de soluciones digitales. Te ayudaré a encontrar la mejor opción para tu negocio…"
                            onChange={(e) =>
                                form.setData('greeting', e.target.value)
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Déjalo vacío para usar el saludo por defecto.
                        </p>
                        <InputError message={form.errors.greeting} />
                    </div>
                </fieldset>

                <fieldset className="space-y-4">
                    <legend className="mb-1 text-base font-semibold">
                        Plan que se muestra con cada recomendación
                    </legend>
                    <p className="text-sm text-muted-foreground">
                        La tarjeta solo aparece si el plan está publicado, y con
                        el precio que tenga configurado.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {recommendations.map((r) => (
                            <div key={r.value} className="grid gap-2">
                                <Label htmlFor={`plan-${r.value}`}>
                                    {r.label}
                                </Label>
                                <OptionSelect
                                    id={`plan-${r.value}`}
                                    value={form.data.plans[r.value] ?? ''}
                                    options={plans}
                                    allLabel="Sin tarjeta de plan"
                                    onChange={(v) =>
                                        form.setData('plans', {
                                            ...form.data.plans,
                                            [r.value]: v,
                                        })
                                    }
                                />
                                <InputError
                                    message={errors[`plans.${r.value}`]}
                                />
                            </div>
                        ))}
                    </div>
                </fieldset>

                <fieldset className="space-y-4">
                    <legend className="mb-1 text-base font-semibold">
                        Inteligencia artificial
                    </legend>
                    <div className="rounded-lg border p-4 text-sm">
                        {ai.configured ? (
                            <dl className="grid gap-2 sm:grid-cols-3">
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Estado
                                    </dt>
                                    <dd className="font-medium text-success">
                                        Clave configurada
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Modelo
                                    </dt>
                                    <dd className="font-mono text-xs">
                                        {ai.model}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Respuestas con IA hoy
                                    </dt>
                                    <dd>
                                        {ai.calls_today} de {ai.daily_limit}
                                    </dd>
                                </div>
                            </dl>
                        ) : (
                            <p className="text-muted-foreground">
                                No hay clave configurada: el asistente usa el
                                flujo guiado de preguntas, que funciona sin IA.
                                Para activar la IA, agrega{' '}
                                <code className="font-mono text-xs">
                                    ANTHROPIC_API_KEY
                                </code>{' '}
                                en el archivo <code>.env</code> del servidor.
                                Por seguridad, la clave nunca se escribe en el
                                panel.
                            </p>
                        )}
                    </div>
                    <Toggle
                        id="use_ai"
                        checked={form.data.use_ai}
                        onChange={(v) => form.setData('use_ai', v)}
                        label="Usar IA cuando esté disponible"
                        hint="Si la IA falla, llega al tope diario o la desactivas, la conversación continúa con el flujo guiado."
                    />
                </fieldset>

                <div className="flex items-center gap-4 border-t pt-6">
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Guardando…' : 'Guardar cambios'}
                    </Button>
                    {form.isDirty && !form.processing && (
                        <span className="text-sm text-muted-foreground">
                            Tienes cambios sin guardar
                        </span>
                    )}
                </div>
            </form>
        </>
    );
}

function Toggle({
    id,
    checked,
    onChange,
    label,
    hint,
}: {
    id: string;
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    hint: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border p-3">
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(c) => onChange(c === true)}
            />
            <div className="grid gap-1">
                <Label htmlFor={id}>{label}</Label>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
        </div>
    );
}

AssistantSettingsPage.layout = {
    breadcrumbs: [{ title: 'Configuración', href: edit() }],
};
