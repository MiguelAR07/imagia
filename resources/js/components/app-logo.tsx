import AppLogoIcon from '@/components/app-logo-icon';
import { BrandWordmark } from '@/components/brand-wordmark';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center">
                <AppLogoIcon className="size-8 text-foreground" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <BrandWordmark className="truncate text-[15px] leading-tight" />
            </div>
        </>
    );
}
