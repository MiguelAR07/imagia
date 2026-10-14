/** Enlace de WhatsApp con un mensaje inicial. El número va sin «+» ni espacios. */
export function whatsappLink(
    number: string | null | undefined,
    message?: string | null,
): string | null {
    if (!number) {
        return null;
    }

    const text = message ? `?text=${encodeURIComponent(message)}` : '';

    return `https://wa.me/${number.replace(/\D/g, '')}${text}`;
}
