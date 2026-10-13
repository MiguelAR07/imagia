import { Head, router, useForm, usePage } from '@inertiajs/react';
import { MailPlus, Pencil, ShieldCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { index, invite, store, update } from '@/routes/admin/users';

type Role = { value: string; label: string };

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    is_active: boolean;
    two_factor_enabled: boolean;
    created_at: string | null;
};

export default function UsersIndex({
    users,
    roles,
}: {
    users: UserRow[];
    roles: Role[];
}) {
    const { auth } = usePage().props;
    const [inviting, setInviting] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);
    const roleLabel = (value: string | null) =>
        roles.find((r) => r.value === value)?.label ?? 'Sin rol';

    return (
        <>
            <Head title="Usuarios" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Usuarios"
                        description="Las personas que pueden entrar al panel y lo que pueden hacer."
                    />
                    <Button onClick={() => setInviting(true)}>
                        <UserPlus className="size-4" />
                        Invitar usuario
                    </Button>
                </div>

                <div className="overflow-x-auto rounded-xl border bg-card">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead>
                            <tr className="border-b text-left font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                <th className="px-4 py-3 font-medium">
                                    Nombre
                                </th>
                                <th className="px-4 py-3 font-medium">Rol</th>
                                <th className="px-4 py-3 font-medium">
                                    Estado
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-medium">
                                            {user.name}
                                            {user.id === auth.user.id && (
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    (tú)
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1.5">
                                            {roleLabel(user.role)}
                                            {user.two_factor_enabled && (
                                                <ShieldCheck
                                                    className="size-4 text-success"
                                                    aria-label="Verificación en dos pasos activada"
                                                />
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.is_active ? (
                                            <Badge className="border-transparent bg-success/15 text-success">
                                                Activo
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Desactivado
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
                                            {user.is_active &&
                                                user.id !== auth.user.id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.post(
                                                                invite(user.id)
                                                                    .url,
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <MailPlus className="size-4" />
                                                        Reenviar enlace
                                                    </Button>
                                                )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditing(user)}
                                            >
                                                <Pencil className="size-4" />
                                                Editar
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <InviteDialog
                open={inviting}
                onClose={() => setInviting(false)}
                roles={roles}
            />
            {editing && (
                <EditDialog
                    key={editing.id}
                    user={editing}
                    roles={roles}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

function RoleSelect({
    id,
    value,
    roles,
    onChange,
}: {
    id: string;
    value: string;
    roles: Role[];
    onChange: (value: string) => void;
}) {
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger id={id} className="w-full">
                <SelectValue placeholder="Elige un rol" />
            </SelectTrigger>
            <SelectContent>
                {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                        {role.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

function InviteDialog({
    open,
    onClose,
    roles,
}: {
    open: boolean;
    onClose: () => void;
    roles: Role[];
}) {
    const form = useForm({ name: '', email: '', role: 'colaborador' });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store().url, {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Invitar usuario</DialogTitle>
                        <DialogDescription>
                            Le enviaremos un correo con un enlace para que cree
                            su contraseña.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="invite-name">Nombre completo</Label>
                        <Input
                            id="invite-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            required
                            autoComplete="off"
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="invite-email">Correo</Label>
                        <Input
                            id="invite-email"
                            type="email"
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                            required
                            autoComplete="off"
                        />
                        <InputError message={form.errors.email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="invite-role">Rol</Label>
                        <RoleSelect
                            id="invite-role"
                            value={form.data.role}
                            roles={roles}
                            onChange={(v) => form.setData('role', v)}
                        />
                        <InputError message={form.errors.role} />
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
                                ? 'Enviando…'
                                : 'Enviar invitación'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditDialog({
    user,
    roles,
    onClose,
}: {
    user: UserRow;
    roles: Role[];
    onClose: () => void;
}) {
    const form = useForm({
        name: user.name,
        role: user.role ?? 'colaborador',
        is_active: user.is_active,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.put(update(user.id).url, {
            preserveScroll: true,
            onSuccess: onClose,
        });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent>
                <form onSubmit={submit} className="space-y-6">
                    <DialogHeader>
                        <DialogTitle>Editar usuario</DialogTitle>
                        <DialogDescription>{user.email}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Nombre completo</Label>
                        <Input
                            id="edit-name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            required
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-role">Rol</Label>
                        <RoleSelect
                            id="edit-role"
                            value={form.data.role}
                            roles={roles}
                            onChange={(v) => form.setData('role', v)}
                        />
                        <InputError message={form.errors.role} />
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Checkbox
                            id="edit-active"
                            checked={form.data.is_active}
                            onCheckedChange={(c) =>
                                form.setData('is_active', c === true)
                            }
                        />
                        <div className="grid gap-1">
                            <Label htmlFor="edit-active">Acceso activo</Label>
                            <p className="text-xs text-muted-foreground">
                                Si lo desactivas, no podrá iniciar sesión. Su
                                historial se conserva.
                            </p>
                        </div>
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

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Usuarios', href: index() }],
};
