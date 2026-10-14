import { Link } from '@inertiajs/react';
import {
    ArrowUp,
    CalendarDays,
    ClipboardList,
    FileText,
    LoaderCircle,
    MessageCircle,
    RotateCcw,
    Sparkles,
    X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { ContactData } from '@/components/site/contact-fields';
import { ContactFields } from '@/components/site/contact-fields';
import { Button } from '@/components/ui/button';
import {
    AssistantError,
    assistantApi,
    onOpenAssistant,
    savedConversation,
} from '@/lib/assistant';
import { planPriceLabel } from '@/lib/plan-price';
import { cn } from '@/lib/utils';
import { whatsappLink } from '@/lib/whatsapp';
import { plans } from '@/routes/site';
import type { AssistantState } from '@/types';

type Panel = 'chat' | 'contact' | 'summary';

const EMPTY_CONTACT: ContactData = {
    name: '',
    company: '',
    email: '',
    phone: '',
    wants_meeting: false,
    consent: false,
    website: '',
};

/**
 * Asistente del sitio: conversa, recomienda una solución y permite dejar los datos,
 * abrir WhatsApp con un resumen o pedir una reunión. Todo lo que dice que hizo,
 * lo confirmó el servidor.
 */
export function AssistantWidget({
    whatsapp,
    brandName,
}: {
    whatsapp: string | null;
    brandName: string;
}) {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<AssistantState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [panel, setPanel] = useState<Panel>('chat');
    const [contact, setContact] = useState<ContactData>(EMPTY_CONTACT);
    const [contactErrors, setContactErrors] = useState<
        Partial<Record<keyof ContactData, string>>
    >({});

    const launcherRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async (fresh = false) => {
        setLoading(true);
        setError(null);

        try {
            const saved = fresh ? null : savedConversation.get();
            let next: AssistantState | null = null;

            if (saved) {
                next = await assistantApi.show(saved).catch(() => null);
            }

            next ??= await assistantApi.start();
            savedConversation.set(next.uuid);
            setState(next);
        } catch (e) {
            setError(
                e instanceof AssistantError
                    ? e.message
                    : 'No pudimos iniciar el asistente.',
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(
        () =>
            onOpenAssistant(() => {
                setOpen(true);
            }),
        [],
    );

    useEffect(() => {
        if (open && !state && !loading) {
            void load();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    // Desplaza al último mensaje cuando llega uno nuevo.
    useEffect(() => {
        scrollRef.current?.scrollTo({
            top: scrollRef.current.scrollHeight,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 'auto'
                : 'smooth',
        });
    }, [state?.messages.length, loading, panel]);

    useEffect(() => {
        if (open && panel === 'chat') {
            inputRef.current?.focus();
        }
    }, [open, panel, state?.uuid]);

    const close = () => {
        setOpen(false);
        launcherRef.current?.focus();
    };

    const send = async (text: string) => {
        const content = text.trim();

        if (!state || !content || loading) {
            return;
        }

        setInput('');
        setError(null);
        setLoading(true);
        // Muestra el mensaje del visitante de inmediato; el servidor devuelve la conversación completa.
        setState({
            ...state,
            messages: [
                ...state.messages,
                {
                    id: -Date.now(),
                    role: 'user',
                    content,
                    quick_replies: [],
                    offer_actions: false,
                },
            ],
        });

        try {
            setState(await assistantApi.send(state.uuid, content));
        } catch (e) {
            setState(state);
            setInput(content);
            setError(
                e instanceof AssistantError
                    ? e.message
                    : 'No pudimos enviar tu mensaje.',
            );
        } finally {
            setLoading(false);
        }
    };

    const submitContact = async (e: FormEvent) => {
        e.preventDefault();

        if (!state) {
            return;
        }

        setLoading(true);
        setContactErrors({});
        setError(null);

        try {
            setState(await assistantApi.contact(state.uuid, contact));
            setContact(EMPTY_CONTACT);
            setPanel('chat');
        } catch (err) {
            if (err instanceof AssistantError) {
                setContactErrors(err.fields);
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const restart = () => {
        savedConversation.set(null);
        setState(null);
        setPanel('chat');
        void load(true);
    };

    const last = state?.messages.at(-1);
    const showActions =
        !!state && state.recommendation !== null && last?.role === 'assistant';
    const waSummary = whatsappLink(
        whatsapp,
        state?.summary
            ? `Hola, hablé con el asistente de ${brandName}. Este es el resumen:\n\n${state.summary}`
            : null,
    );

    return (
        <>
            <button
                ref={launcherRef}
                type="button"
                onClick={() => (open ? close() : setOpen(true))}
                aria-expanded={open}
                aria-controls="assistant-panel"
                className={cn(
                    'fixed right-5 bottom-5 z-40 flex h-14 items-center gap-2 rounded-full bg-gradient-to-r from-[#3b5bff] to-[#22d3ee] pr-5 pl-4 font-semibold text-white shadow-[0_10px_30px_rgba(59,91,255,.45)] transition-transform motion-safe:hover:scale-105',
                    open && 'max-sm:hidden',
                )}
                style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
            >
                {open ? (
                    <X className="size-5" />
                ) : (
                    <Sparkles className="size-5" />
                )}
                <span className="text-sm">
                    {open ? 'Cerrar' : '¿Te ayudo?'}
                </span>
            </button>

            {open && (
                <section
                    id="assistant-panel"
                    role="dialog"
                    aria-labelledby="assistant-title"
                    onKeyDown={(e) => e.key === 'Escape' && close()}
                    className="fixed inset-0 z-50 flex flex-col overflow-hidden border bg-background shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 sm:inset-auto sm:right-5 sm:bottom-24 sm:h-[min(640px,calc(100dvh-8rem))] sm:w-[400px] sm:rounded-2xl"
                >
                    <header className="flex items-center gap-3 border-b px-4 py-3">
                        <AppLogoIcon className="size-8 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <h2
                                id="assistant-title"
                                className="truncate text-sm font-semibold"
                            >
                                Asistente de {brandName}
                            </h2>
                            <p className="truncate text-xs text-muted-foreground">
                                Te ayuda a elegir la solución para tu negocio
                            </p>
                        </div>
                        {state && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={restart}
                                disabled={loading}
                                aria-label="Empezar una conversación nueva"
                                title="Empezar de nuevo"
                            >
                                <RotateCcw className="size-4" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={close}
                            aria-label="Cerrar el asistente"
                        >
                            <X className="size-4" />
                        </Button>
                    </header>

                    <div
                        ref={scrollRef}
                        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
                    >
                        {panel === 'contact' && state ? (
                            <form
                                onSubmit={submitContact}
                                className="space-y-4"
                            >
                                <div>
                                    <h3 className="font-semibold">
                                        {contact.wants_meeting
                                            ? 'Solicitar una reunión'
                                            : 'Solicitar cotización'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Enviaremos al equipo el resumen de esta
                                        conversación junto con tus datos.
                                    </p>
                                </div>
                                <ContactFields
                                    data={contact}
                                    errors={contactErrors}
                                    set={(key, value) =>
                                        setContact((c) => ({
                                            ...c,
                                            [key]: value,
                                        }))
                                    }
                                />
                                {error && (
                                    <p
                                        role="alert"
                                        className="text-sm text-destructive"
                                    >
                                        {error}
                                    </p>
                                )}
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setPanel('chat');
                                            setError(null);
                                        }}
                                    >
                                        Volver
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        {loading && (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        )}
                                        Enviar mis datos
                                    </Button>
                                </div>
                            </form>
                        ) : panel === 'summary' && state ? (
                            <div className="space-y-4">
                                <h3 className="font-semibold">
                                    Resumen de la conversación
                                </h3>
                                {state.summary ? (
                                    <dl className="space-y-2 rounded-xl border bg-card p-4 text-sm">
                                        {state.summary
                                            .split('\n')
                                            .map((line) => {
                                                const [label, ...rest] =
                                                    line.split(': ');

                                                return (
                                                    <div key={line}>
                                                        <dt className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                                            {label}
                                                        </dt>
                                                        <dd>
                                                            {rest.join(': ')}
                                                        </dd>
                                                    </div>
                                                );
                                            })}
                                    </dl>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Todavía no hay suficiente información
                                        para un resumen.
                                    </p>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => setPanel('chat')}
                                >
                                    Volver a la conversación
                                </Button>
                            </div>
                        ) : (
                            <div aria-live="polite" className="space-y-3">
                                {state?.messages.map((m) => (
                                    <Bubble key={m.id} role={m.role}>
                                        {m.content}
                                    </Bubble>
                                ))}

                                {showActions && state.plan && (
                                    <div className="rounded-xl border border-brand-blue/40 bg-[linear-gradient(180deg,rgba(59,91,255,.12),transparent)] p-4 text-sm">
                                        <p className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                                            Plan sugerido
                                        </p>
                                        <p className="mt-1 font-semibold">
                                            {state.plan.name}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {state.plan.summary}
                                        </p>
                                        <p className="mt-2 font-semibold">
                                            {planPriceLabel(
                                                state.plan.price_type,
                                                state.plan.price,
                                                state.plan.currency,
                                            )}
                                        </p>
                                        <Link
                                            href={plans()}
                                            className="mt-2 inline-block text-xs underline underline-offset-2"
                                        >
                                            Ver el detalle de los planes
                                        </Link>
                                    </div>
                                )}

                                {loading && (
                                    <p
                                        className="flex items-center gap-2 text-sm text-muted-foreground"
                                        role="status"
                                    >
                                        <LoaderCircle className="size-4 animate-spin" />
                                        {state ? 'Escribiendo…' : 'Conectando…'}
                                    </p>
                                )}

                                {error && (
                                    <div
                                        role="alert"
                                        className="rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
                                    >
                                        {error}
                                        {!state && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="px-1"
                                                onClick={() => void load()}
                                            >
                                                Reintentar
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {!loading &&
                                    last?.role === 'assistant' &&
                                    last.quick_replies.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {last.quick_replies.map((r) => (
                                                <button
                                                    key={r}
                                                    type="button"
                                                    onClick={() => void send(r)}
                                                    className="rounded-full border px-3 py-1.5 text-left text-sm transition-colors hover:border-brand-blue hover:bg-accent"
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                {showActions && (
                                    <div className="grid gap-2">
                                        {!state.has_contact && (
                                            <>
                                                <ActionButton
                                                    icon={FileText}
                                                    onClick={() => {
                                                        setContact((c) => ({
                                                            ...c,
                                                            wants_meeting: false,
                                                        }));
                                                        setError(null);
                                                        setPanel('contact');
                                                    }}
                                                >
                                                    Solicitar cotización
                                                </ActionButton>
                                                <ActionButton
                                                    icon={CalendarDays}
                                                    onClick={() => {
                                                        setContact((c) => ({
                                                            ...c,
                                                            wants_meeting: true,
                                                        }));
                                                        setError(null);
                                                        setPanel('contact');
                                                    }}
                                                >
                                                    Solicitar una reunión
                                                </ActionButton>
                                            </>
                                        )}
                                        {waSummary && (
                                            <ActionButton
                                                icon={MessageCircle}
                                                href={waSummary}
                                            >
                                                Continuar por WhatsApp
                                            </ActionButton>
                                        )}
                                        <ActionButton
                                            icon={ClipboardList}
                                            onClick={() => setPanel('summary')}
                                        >
                                            Ver resumen
                                        </ActionButton>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {panel === 'chat' && state && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                void send(input);
                            }}
                            className="border-t p-3"
                        >
                            {state.limit_reached ? (
                                <p className="text-center text-sm text-muted-foreground">
                                    Esta conversación llegó a su límite. Usa los
                                    botones de arriba o empieza una nueva.
                                </p>
                            ) : (
                                <div className="flex items-end gap-2">
                                    <label
                                        htmlFor="assistant-input"
                                        className="sr-only"
                                    >
                                        Escribe tu mensaje
                                    </label>
                                    <textarea
                                        id="assistant-input"
                                        ref={inputRef}
                                        rows={1}
                                        value={input}
                                        maxLength={state.max_length}
                                        onChange={(e) =>
                                            setInput(e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === 'Enter' &&
                                                !e.shiftKey
                                            ) {
                                                e.preventDefault();
                                                void send(input);
                                            }
                                        }}
                                        placeholder="Escribe tu mensaje…"
                                        className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={loading || !input.trim()}
                                        aria-label="Enviar mensaje"
                                        className="size-10 rounded-xl"
                                    >
                                        <ArrowUp className="size-4" />
                                    </Button>
                                </div>
                            )}
                            <p className="mt-2 text-center text-[11px] text-muted-foreground">
                                Las recomendaciones son orientativas; el alcance
                                y el valor se definen en la propuesta.
                            </p>
                        </form>
                    )}
                </section>
            )}
        </>
    );
}

function Bubble({
    role,
    children,
}: {
    role: 'user' | 'assistant';
    children: string;
}) {
    return (
        <div
            className={cn(
                'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line',
                role === 'user'
                    ? 'ml-auto rounded-br-md bg-brand-blue text-white'
                    : 'rounded-bl-md bg-muted',
            )}
        >
            <span className="sr-only">
                {role === 'user' ? 'Tú: ' : 'Asistente: '}
            </span>
            <RichText text={children} />
        </div>
    );
}

/** Solo interpreta **negrita**; el resto se muestra como texto (sin HTML). */
function RichText({ text }: { text: string }) {
    return (
        <>
            {text
                .split(/(\*\*[^*]+\*\*)/g)
                .map((part, i) =>
                    part.startsWith('**') && part.endsWith('**') ? (
                        <strong key={i}>{part.slice(2, -2)}</strong>
                    ) : (
                        <Fragment key={i}>{part}</Fragment>
                    ),
                )}
        </>
    );
}

function ActionButton({
    icon: Icon,
    href,
    onClick,
    children,
}: {
    icon: typeof FileText;
    href?: string;
    onClick?: () => void;
    children: ReactNode;
}) {
    const className =
        'flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 text-left text-sm font-medium transition-colors hover:border-brand-blue hover:bg-accent';

    return href ? (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
        >
            <Icon className="size-4 text-brand-cyan" />
            {children}
        </a>
    ) : (
        <button type="button" onClick={onClick} className={className}>
            <Icon className="size-4 text-brand-cyan" />
            {children}
        </button>
    );
}
