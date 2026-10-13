export type AcronymItem = {
    letter: string;
    word: string;
    description: string;
};

export type OriginPart = {
    part: string;
    meaning: string;
};

export type LogoPart = {
    shape: string;
    meaning: string;
};

/** Datos de marca compartidos con todas las páginas. */
export type SharedBrand = {
    name: string;
    tagline: string;
    descriptor: string;
    acronym: AcronymItem[];
};

export type BrandSettings = SharedBrand & {
    origin: OriginPart[];
    logo_parts: LogoPart[];
};

export type ContactSettings = {
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    whatsapp_message: string | null;
    city: string | null;
    instagram: string | null;
    facebook: string | null;
    linkedin: string | null;
    tiktok: string | null;
    github: string | null;
};
