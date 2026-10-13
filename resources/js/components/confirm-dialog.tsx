import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

/**
 * Confirmación para acciones importantes (archivar, eliminar).
 * `onConfirm` recibe una función para cerrar el diálogo cuando termine.
 */
export function ConfirmDialog({
    trigger,
    title,
    description,
    confirmLabel = 'Confirmar',
    destructive = false,
    onConfirm,
}: {
    trigger: ReactNode;
    title: string;
    description: ReactNode;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: (done: () => void) => void;
}) {
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button
                        variant={destructive ? 'destructive' : 'default'}
                        disabled={busy}
                        onClick={() => {
                            setBusy(true);
                            onConfirm(() => {
                                setBusy(false);
                                setOpen(false);
                            });
                        }}
                    >
                        {busy ? 'Un momento…' : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
