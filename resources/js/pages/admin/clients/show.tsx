import { Head, Link, router, setLayoutProps, useForm } from '@inertiajs/react';
import {
    Archive,
    ArchiveRestore,
    Globe,
    Mail,
    MessageCircle,
    Pencil,
    Phone,
    Plus,
    Star,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { ActivityTimeline } from '@/components/activity-timeline';
import { ClientFormDialog } from '@/components/clients/client-form-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FormField } from '@/components/form-field';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCan } from '@/hooks/use-can';
import { formatDate } from '@/lib/format';
import { PROJECT_STATUS_TONE } from '@/lib/project-labels';
import { destroy, index, restore, show } from '@/routes/admin/clients';
import { show as showProject } from '@/routes/admin/projects';
import {
    destroy as destroyContact,
    store as storeContact,
    update as updateContact,
} from '@/routes/admin/clients/contacts';
import type { ActivityItem, ClientDetail, ContactItem, Option } from '@/types';

type Props = {
    client: ClientDetail;
    projects: {
        id: number;
        name: string;
        status: string;
        status_label: string;
        due_date: string | null;
    }[];
    activities: ActivityItem[];
    options: { types: Option[]; statuses: Option[]; activity_types: Option[] };
};

export default function ClientShow({
    client,
    projects,
    activities,
    options,
}: Props) {
    const can = useCan();
    const canManage = can('clientes.gestionar');
    const [editing, setEditing] = useState(false);
    const [contactForm, setContactForm] = useState<ContactItem | 'new' | null>(
        null,
    );
    const typeLabel = options.types.find((t) => t.value === client.type)?.label;

    setLayoutProps({
        breadcrumbs: [
            { title: 'Clientes', href: index() },
            { title: client.name, href: show(client.id) },
        ],
    });

    return (
        <>
            <Head title={client.name} />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                {client.archived && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
                        Este cliente está archivado. No aparece en los listados
                        habituales.
                        {canManage && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    router.post(restore(client.id).url)
                                }
                            >
                                <ArchiveRestore className="size-4" />
                                Restaurar
                            </Button>
                        )}
                    </div>
                )}

                <PageHeader
                    eyebrow={typeLabel}
                    title={client.name}
                    description={
                        <span className="inline-flex items-center gap-2">
                            {client.status === 'active' ? (
                                <StatusBadge tone="success">Activo</StatusBadge>
                            ) : (
                                <StatusBadge tone="warning">
                                    Inactivo
                                </StatusBadge>
                            )}
                            Cliente desde {formatDate(client.created_at)}
                        </span>
                    }
                    actions={
                        canManage &&
                        !client.archived && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setEditing(true)}
                                >
                                    <Pencil className="size-4" />
                                    Editar
                                </Button>
                                <ConfirmDialog
                                    trigger={
                                        <Button variant="ghost">
                                            <Archive className="size-4" />
                                            Archivar
                                        </Button>
                                    }
                                    title={`Archivar «${client.name}»`}
                                    description="Dejará de aparecer en los listados. Su historial, proyectos y cotizaciones se conservan y puedes restaurarlo cuando quieras."
                                    confirmLabel="Archivar"
                                    onConfirm={(done) =>
                                        router.delete(destroy(client.id).url, {
                                            onFinish: done,
                                        })
                                    }
                                />
                            </>
                        )
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
                    <div className="space-y-6">
                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="mb-4 text-base font-semibold">
                                Datos de contacto
                            </h2>
                            <dl className="grid gap-3 text-sm">
                                <InfoRow icon={Mail} label="Correo">
                                    {client.email ? (
                                        <a
                                            className="hover:underline"
                                            href={`mailto:${client.email}`}
                                        >
                                            {client.email}
                                        </a>
                                    ) : null}
                                </InfoRow>
                                <InfoRow icon={Phone} label="Teléfono">
                                    {client.phone}
                                </InfoRow>
                                <InfoRow icon={MessageCircle} label="WhatsApp">
                                    {client.whatsapp ? (
                                        <a
                                            className="hover:underline"
                                            href={`https://wa.me/${client.whatsapp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            +{client.whatsapp}
                                        </a>
                                    ) : null}
                                </InfoRow>
                                <InfoRow icon={Globe} label="Sitio web">
                                    {client.website ? (
                                        <a
                                            className="break-all hover:underline"
                                            href={client.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {client.website}
                                        </a>
                                    ) : null}
                                </InfoRow>
                            </dl>
                            <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        {client.type === 'company'
                                            ? 'NIT'
                                            : 'Documento'}
                                    </dt>
                                    <dd>{client.tax_id ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs text-muted-foreground">
                                        Ciudad
                                    </dt>
                                    <dd>{client.city ?? '—'}</dd>
                                </div>
                            </dl>
                            {client.notes && (
                                <div className="mt-4 border-t pt-4">
                                    <p className="text-xs text-muted-foreground">
                                        Notas internas
                                    </p>
                                    <p className="mt-1 text-sm whitespace-pre-line">
                                        {client.notes}
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="rounded-xl border bg-card p-5">
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <h2 className="text-base font-semibold">
                                    Personas de contacto
                                </h2>
                                {canManage && !client.archived && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setContactForm('new')}
                                    >
                                        <Plus className="size-4" />
                                        Agregar
                                    </Button>
                                )}
                            </div>
                            {client.contacts.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Agrega a las personas con las que hablas en
                                    esta empresa.
                                </p>
                            ) : (
                                <ul className="divide-y">
                                    {client.contacts.map((c) => (
                                        <li
                                            key={c.id}
                                            className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="min-w-0 text-sm">
                                                <p className="flex items-center gap-1.5 font-medium">
                                                    {c.name}
                                                    {c.is_primary && (
                                                        <Star
                                                            className="size-3.5 fill-warning text-warning"
                                                            aria-label="Contacto principal"
                                                        />
                                                    )}
                                                </p>
                                                {c.role && (
                                                    <p className="text-muted-foreground">
                                                        {c.role}
                                                    </p>
                                                )}
                                                <p className="text-muted-foreground">
                                                    {[c.email, c.phone]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                            </div>
                                            {canManage && !client.archived && (
                                                <div className="flex shrink-0 gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        aria-label={`Editar a ${c.name}`}
                                                        onClick={() =>
                                                            setContactForm(c)
                                                        }
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Button>
                                                    <ConfirmDialog
                                                        trigger={
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                aria-label={`Eliminar a ${c.name}`}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        }
                                                        title={`Eliminar a ${c.name}`}
                                                        description="Se quitará de las personas de contacto de este cliente."
                                                        confirmLabel="Eliminar"
                                                        destructive
                                                        onConfirm={(done) =>
                                                            router.delete(
                                                                destroyContact({
                                                                    client: client.id,
                                                                    contact:
                                                                        c.id,
                                                                }).url,
                                                                {
                                                                    preserveScroll: true,
                                                                    onFinish:
                                                                        done,
                                                                },
                                                            )
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section className="rounded-xl border bg-card p-5">
                            <h2 className="mb-4 text-base font-semibold">
                                Proyectos
                            </h2>
                            {projects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Este cliente aún no tiene proyectos.
                                </p>
                            ) : (
                                <ul className="divide-y">
                                    {projects.map((p) => (
                                        <li
                                            key={p.id}
                                            className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <Link
                                                href={showProject(p.id)}
                                                className="text-sm font-medium hover:underline"
                                            >
                                                {p.name}
                                            </Link>
                                            <StatusBadge
                                                tone={
                                                    PROJECT_STATUS_TONE[
                                                        p.status
                                                    ] ?? 'neutral'
                                                }
                                            >
                                                {p.status_label}
                                            </StatusBadge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>

                    <section className="rounded-xl border bg-card p-5">
                        <h2 className="mb-4 text-base font-semibold">
                            Historial
                        </h2>
                        <ActivityTimeline
                            subjectType="clientes"
                            subjectId={client.id}
                            activities={activities}
                            types={options.activity_types}
                            canWrite={canManage}
                        />
                    </section>
                </div>
            </div>

            {editing && (
                <ClientFormDialog
                    open
                    client={client}
                    options={options}
                    onClose={() => setEditing(false)}
                />
            )}
            {contactForm && (
                <ContactDialog
                    key={contactForm === 'new' ? 'new' : contactForm.id}
                    clientId={client.id}
                    contact={contactForm === 'new' ? undefined : contactForm}
                    onClose={() => setContactForm(null)}
                />
            )}
        </>
    );
}

function InfoRow({
    icon: Icon,
    label,
    children,
}: {
    icon: typeof Mail;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-[20px_90px_1fr] items-start gap-2">
            <Icon
                className="mt-0.5 size-4 text-muted-foreground"
                aria-hidden="true"
            />
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0">
                {children ?? <span className="text-muted-foreground">—</span>}
            </dd>
        </div>
    );
}

function ContactDialog({
    clientId,
    contact,
    onClose,
}: {
    clientId: number;
    contact?: ContactItem;
    onClose: () => void;
}) {
    const form = useForm({
        name: contact?.name ?? '',
        role: contact?.role ?? '',
        email: contact?.email ?? '',
        phone: contact?.phone ?? '',
        is_primary: contact?.is_primary ?? false,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const opts = { preserveScroll: true, onSuccess: onClose };

        if (contact) {
            form.put(
                updateContact({ client: clientId, contact: contact.id }).url,
                opts,
            );
        } else {
            form.post(storeContact(clientId).url, opts);
        }
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-5">
                    <DialogHeader>
                        <DialogTitle>
                            {contact ? 'Editar contacto' : 'Nuevo contacto'}
                        </DialogTitle>
                    </DialogHeader>
                    <FormField
                        id="contact-name"
                        label="Nombre"
                        error={form.errors.name}
                    >
                        <Input
                            id="contact-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            required
                            autoFocus
                        />
                    </FormField>
                    <FormField
                        id="contact-role"
                        label="Cargo"
                        error={form.errors.role}
                    >
                        <Input
                            id="contact-role"
                            value={form.data.role}
                            onChange={(e) =>
                                form.setData('role', e.target.value)
                            }
                        />
                    </FormField>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                            id="contact-email"
                            label="Correo"
                            error={form.errors.email}
                        >
                            <Input
                                id="contact-email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="contact-phone"
                            label="Teléfono"
                            error={form.errors.phone}
                        >
                            <Input
                                id="contact-phone"
                                type="tel"
                                value={form.data.phone}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
                            />
                        </FormField>
                    </div>
                    <div className="flex items-center gap-3">
                        <Checkbox
                            id="contact-primary"
                            checked={form.data.is_primary}
                            onCheckedChange={(c) =>
                                form.setData('is_primary', c === true)
                            }
                        />
                        <Label htmlFor="contact-primary">
                            Contacto principal
                        </Label>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Guardando…' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
