import { Head } from '@inertiajs/react';
import { Fragment } from 'react';
import { formatDate } from '@/lib/format';
import type { SiteProps } from '@/types';

/**
 * Texto legal en formato simple: «## » y «### » son títulos, las líneas que empiezan
 * con «- » forman una lista, **texto** va en negrita y una línea en blanco separa párrafos.
 * Se muestra como texto (nunca como HTML), así que no se puede inyectar código.
 */
export default function Legal({
    title,
    content,
    updated_at,
    seoTitle,
}: SiteProps & { title: string; content: string; updated_at: string | null }) {
    const blocks = content
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean);

    return (
        <>
            <Head title={seoTitle} />
            <article className="mx-auto max-w-3xl space-y-6 px-5 pt-12 pb-20 md:px-8">
                <h1 className="text-4xl font-black tracking-tight">{title}</h1>
                {updated_at && (
                    <p className="text-sm text-muted-foreground">
                        Última actualización: {formatDate(updated_at)}
                    </p>
                )}
                <div className="space-y-4 text-muted-foreground">
                    {blocks.map((block, i) => {
                        if (block.startsWith('### ')) {
                            return (
                                <h3
                                    key={i}
                                    className="pt-2 text-lg font-semibold text-foreground"
                                >
                                    {block.slice(4)}
                                </h3>
                            );
                        }

                        if (block.startsWith('## ')) {
                            return (
                                <h2
                                    key={i}
                                    className="pt-4 text-xl font-bold text-foreground"
                                >
                                    {block.slice(3)}
                                </h2>
                            );
                        }

                        const lines = block.split('\n');

                        if (lines.every((l) => l.trim().startsWith('- '))) {
                            return (
                                <ul
                                    key={i}
                                    className="list-disc space-y-1.5 pl-6"
                                >
                                    {lines.map((l, j) => (
                                        <li key={j}>
                                            <Inline text={l.trim().slice(2)} />
                                        </li>
                                    ))}
                                </ul>
                            );
                        }

                        return (
                            <p key={i} className="whitespace-pre-line">
                                <Inline text={block} />
                            </p>
                        );
                    })}
                </div>
            </article>
        </>
    );
}

/** Solo interpreta **negrita**; el resto es texto. */
function Inline({ text }: { text: string }) {
    return (
        <>
            {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
                part.startsWith('**') && part.endsWith('**') ? (
                    <strong key={i} className="font-semibold text-foreground">
                        {part.slice(2, -2)}
                    </strong>
                ) : (
                    <Fragment key={i}>{part}</Fragment>
                ),
            )}
        </>
    );
}
