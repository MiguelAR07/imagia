import type { ProcessStep } from '@/types';

/** Los pasos del proceso de trabajo, en orden. La numeración indica la secuencia real. */
export function ProcessSteps({ steps }: { steps: ProcessStep[] }) {
    return (
        <ol className="relative grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3">
            {steps.map((step, i) => (
                <li key={step.title} className="relative bg-card p-6">
                    <span className="font-mono text-xs text-brand-cyan">
                        {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className="mt-3 text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {step.text}
                    </p>
                    <span
                        aria-hidden="true"
                        className="absolute top-6 right-6 h-px w-10 bg-gradient-to-r from-brand-blue to-transparent"
                    />
                </li>
            ))}
        </ol>
    );
}
