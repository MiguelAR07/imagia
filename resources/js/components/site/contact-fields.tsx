import { Link } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { privacy } from '@/routes/site';

export type ContactData = {
    name: string;
    company: string;
    email: string;
    phone: string;
    wants_meeting: boolean;
    consent: boolean;
    website: string;
};

/** Datos de contacto + autorización + campo trampa para robots. Compartido por cotizar y contacto. */
export function ContactFields({
    data,
    errors,
    set,
}: {
    data: ContactData;
    errors: Partial<Record<keyof ContactData, string>>;
    set: <K extends keyof ContactData>(key: K, value: ContactData[K]) => void;
}) {
    return (
        <div className="grid gap-5 sm:grid-cols-2">
            <Field id="c-name" label="Tu nombre" error={errors.name}>
                <Input
                    id="c-name"
                    autoComplete="name"
                    value={data.name}
                    onChange={(e) => set('name', e.target.value)}
                    required
                />
            </Field>
            <Field
                id="c-company"
                label="Empresa o negocio (opcional)"
                error={errors.company}
            >
                <Input
                    id="c-company"
                    autoComplete="organization"
                    value={data.company}
                    onChange={(e) => set('company', e.target.value)}
                />
            </Field>
            <Field id="c-email" label="Correo" error={errors.email}>
                <Input
                    id="c-email"
                    type="email"
                    autoComplete="email"
                    value={data.email}
                    onChange={(e) => set('email', e.target.value)}
                />
            </Field>
            <Field
                id="c-phone"
                label="Teléfono o WhatsApp"
                error={errors.phone}
            >
                <Input
                    id="c-phone"
                    type="tel"
                    autoComplete="tel"
                    value={data.phone}
                    onChange={(e) => set('phone', e.target.value)}
                />
            </Field>
            <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">
                Con uno de los dos es suficiente para responderte.
            </p>

            {/* Campo trampa: invisible para personas. */}
            <div
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 overflow-hidden"
            >
                <label htmlFor="c-website">No llenes este campo</label>
                <input
                    id="c-website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={data.website}
                    onChange={(e) => set('website', e.target.value)}
                />
            </div>

            <label className="flex items-start gap-3 rounded-lg border p-3 text-sm sm:col-span-2">
                <Checkbox
                    checked={data.wants_meeting}
                    onCheckedChange={(c) => set('wants_meeting', c === true)}
                />
                Me gustaría agendar una reunión para conversar
            </label>

            <div className="space-y-1 sm:col-span-2">
                <div className="flex items-start gap-3">
                    <Checkbox
                        id="c-consent"
                        checked={data.consent}
                        onCheckedChange={(c) => set('consent', c === true)}
                    />
                    <Label
                        htmlFor="c-consent"
                        className="text-sm leading-snug font-normal text-muted-foreground"
                    >
                        Autorizo el uso de mis datos para responder mi
                        solicitud, según la{' '}
                        <Link
                            href={privacy()}
                            target="_blank"
                            className="text-foreground underline underline-offset-2"
                        >
                            política de privacidad
                        </Link>
                        .
                    </Label>
                </div>
                <InputError message={errors.consent} />
            </div>
        </div>
    );
}

function Field({
    id,
    label,
    error,
    children,
}: {
    id: string;
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid content-start gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
