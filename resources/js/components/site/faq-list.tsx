import { ChevronDown } from 'lucide-react';

/** Preguntas frecuentes con <details>: accesible con teclado y sin JavaScript extra. */
export function FaqList({
    faqs,
}: {
    faqs: { question: string; answer: string }[];
}) {
    if (faqs.length === 0) {
        return null;
    }

    return (
        <div className="divide-y rounded-2xl border bg-card">
            {faqs.map((f) => (
                <details
                    key={f.question}
                    className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden"
                >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                        {f.question}
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-sm whitespace-pre-line text-muted-foreground">
                        {f.answer}
                    </p>
                </details>
            ))}
        </div>
    );
}
