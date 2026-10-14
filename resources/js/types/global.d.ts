import type { Auth } from '@/types/auth';
import type { SharedBrand } from '@/types/brand';
import type { SharedNotifications } from '@/types/common';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            brand: SharedBrand;
            auth: Auth;
            sidebarOpen: boolean;
            notifications: SharedNotifications | null;
            [key: string]: unknown;
        };
    }
}
