import { Head } from '@inertiajs/react';
import { formatDate } from '@/lib/format';
import type { SiteProps } from '@/types';

/**
 * Texto legal en formato simple: «## » inicia un título, una línea en blanco separa párrafos.
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
                    {blocks.map((block, i) =>
                        block.startsWith('## ') ? (
                            <h2
                                key={i}
                                className="pt-4 text-xl font-bold text-foreground"
                            >
                                {block.slice(3)}
                            </h2>
                        ) : (
                            <p key={i} className="whitespace-pre-line">
                                {block}
                            </p>
                        ),
                    )}
                </div>
            </article>
        </>
    );
}
