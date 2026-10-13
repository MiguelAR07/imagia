import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FormField } from '@/components/form-field';
import { OptionSelect } from '@/components/option-select';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { store, update } from '@/routes/admin/clients';
import type { ClientDetail, Option } from '@/types';

type Props = {
    open: boolean;
    onClose: () => void;
    client?: ClientDetail;
    options: { types: Option[]; statuses: Option[] };
};

/** Crear o editar un cliente. Sin `client`, crea uno nuevo. */
export function ClientFormDialog({ open, onClose, client, options }: Props) {
    const form = useForm({
        type: client?.type ?? 'company',
        name: client?.name ?? '',
        tax_id: client?.tax_id ?? '',
        email: client?.email ?? '',
        phone: client?.phone ?? '',
        whatsapp: client?.whatsapp ?? '',
        city: client?.city ?? '',
        website: client?.website ?? '',
        status: client?.status ?? 'active',
        notes: client?.notes ?? '',
    });
    const isCompany = form.data.type === 'company';

    const submit = (event: FormEvent) => {
        event.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (!client) {
                    form.reset();
                }
                onClose();
            },
        };

        if (client) {
            form.put(update(client.id).url, options);
        } else {
            form.post(store().url, options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>
                            {client ? 'Editar cliente' : 'Nuevo cliente'}
                        </DialogTitle>
                        <DialogDescription>
                            Solo el nombre es obligatorio. Puedes completar el
                            resto después.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <FormField
                            id="client-type"
                            label="Tipo"
                            error={form.errors.type}
                        >
                            <OptionSelect
                                id="client-type"
                                value={form.data.type}
                                options={options.types}
                                onChange={(v) => form.setData('type', v)}
                            />
                        </FormField>
                        <FormField
                            id="client-status"
                            label="Estado"
                            error={form.errors.status}
                        >
                            <OptionSelect
                                id="client-status"
                                value={form.data.status}
                                options={options.statuses}
                                onChange={(v) => form.setData('status', v)}
                            />
                        </FormField>
                        <FormField
                            id="client-name"
                            label={
                                isCompany
                                    ? 'Nombre de la empresa'
                                    : 'Nombre completo'
                            }
                            error={form.errors.name}
                            className="sm:col-span-2"
                        >
                            <Input
                                id="client-name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                required
                                autoFocus
                            />
                        </FormField>
                        <FormField
                            id="client-tax"
                            label={isCompany ? 'NIT' : 'Documento'}
                            error={form.errors.tax_id}
                        >
                            <Input
                                id="client-tax"
                                value={form.data.tax_id}
                                onChange={(e) =>
                                    form.setData('tax_id', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="client-city"
                            label="Ciudad"
                            error={form.errors.city}
                        >
                            <Input
                                id="client-city"
                                value={form.data.city}
                                onChange={(e) =>
                                    form.setData('city', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="client-email"
                            label="Correo"
                            error={form.errors.email}
                        >
                            <Input
                                id="client-email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) =>
                                    form.setData('email', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="client-phone"
                            label="Teléfono"
                            error={form.errors.phone}
                        >
                            <Input
                                id="client-phone"
                                type="tel"
                                value={form.data.phone}
                                onChange={(e) =>
                                    form.setData('phone', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="client-whatsapp"
                            label="WhatsApp"
                            hint="Con indicativo del país. Ej.: 573001234567"
                            error={form.errors.whatsapp}
                        >
                            <Input
                                id="client-whatsapp"
                                type="tel"
                                value={form.data.whatsapp}
                                onChange={(e) =>
                                    form.setData('whatsapp', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="client-web"
                            label="Sitio web"
                            error={form.errors.website}
                        >
                            <Input
                                id="client-web"
                                type="url"
                                placeholder="https://"
                                value={form.data.website}
                                onChange={(e) =>
                                    form.setData('website', e.target.value)
                                }
                            />
                        </FormField>
                        <FormField
                            id="client-notes"
                            label="Notas internas"
                            hint="Solo las ve tu equipo."
                            error={form.errors.notes}
                            className="sm:col-span-2"
                        >
                            <Textarea
                                id="client-notes"
                                value={form.data.notes}
                                onChange={(e) =>
                                    form.setData('notes', e.target.value)
                                }
                                rows={3}
                            />
                        </FormField>
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
                            {form.processing
                                ? 'Guardando…'
                                : client
                                  ? 'Guardar cambios'
                                  : 'Crear cliente'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
