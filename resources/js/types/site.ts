import type { ContactSettings, LogoPart, OriginPart } from '@/types/brand';

/** Datos que todas las páginas públicas reciben del servidor. */
export type SiteProps = {
    site: {
        contact: Pick<
            ContactSettings,
            | 'email'
            | 'phone'
            | 'whatsapp'
            | 'whatsapp_message'
            | 'city'
            | 'instagram'
            | 'facebook'
            | 'linkedin'
            | 'tiktok'
            | 'github'
        >;
        services: { name: string; slug: string }[];
        logo_parts: LogoPart[];
        origin: OriginPart[];
        assistant: boolean;
    };
    seoTitle: string;
};

export type PublicService = {
    id: number;
    name: string;
    slug: string;
    summary: string;
    description: string | null;
    icon: string | null;
    benefits: string[];
    features: string[];
};

export type PublicPlan = {
    id: number;
    name: string;
    slug: string;
    summary: string;
    description: string | null;
    estimated_time: string | null;
    limits: string | null;
    exclusions: string | null;
    badge: string | null;
    price_type: string;
    price: string | null;
    currency: string;
    included: string[];
    optional: { name: string; note: string | null }[];
    addons: { name: string; note: string | null }[];
    faqs: { question: string; answer: string }[];
};

export type PublicProjectCard = {
    title: string;
    slug: string;
    category: string;
    category_label: string;
    summary: string;
    cover_url: string;
    technologies: string[];
    year: number | null;
    /** Partes del sistema entregado («Sitio web», «Panel administrativo»…). */
    parts: string[];
};

export type PublicProjectPart = {
    type: string;
    label: string;
    title: string | null;
    description: string | null;
    features: string[];
    images: { url: string; caption: string | null }[];
};

export type PublicProject = Omit<PublicProjectCard, 'parts'> & {
    parts: PublicProjectPart[];
    client: string | null;
    problem: string | null;
    solution: string | null;
    highlights: string[];
    public_url: string | null;
    completed_on: string | null;
    images: { url: string; caption: string | null }[];
    testimonials: {
        author_name: string;
        author_role: string | null;
        quote: string;
    }[];
};

export type ProcessStep = { title: string; text: string };
