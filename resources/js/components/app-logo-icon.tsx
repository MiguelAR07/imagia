import { useId } from 'react';
import type { SVGAttributes } from 'react';

type AppLogoIconProps = SVGAttributes<SVGElement> & {
    /** Anima la luz que recorre la pantalla y el punto que gira en el ciclo. */
    animated?: boolean;
    /** Versión a una tinta (blanca), para usar sobre el color de marca. */
    mono?: boolean;
};

const CYCLE = 'M42 17 A15 15 0 0 1 42 47 A15 15 0 0 1 42 17';

/**
 * Isotipo «Enlace» de IMAGIA: el cuadrado (pantallas: web y apps) entrelazado
 * con el círculo (automatización). Los detalles internos usan currentColor.
 */
const prefersReducedMotion = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function AppLogoIcon({
    animated: animatedProp = false,
    mono = false,
    ...props
}: AppLogoIconProps) {
    const id = useId().replace(/:/g, '');
    const animated = animatedProp && !prefersReducedMotion();
    const screen = mono ? '#fff' : `url(#${id}-a)`;
    const cycle = mono ? 'rgba(255,255,255,.8)' : `url(#${id}-b)`;

    return (
        <svg
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <defs>
                <linearGradient
                    id={`${id}-a`}
                    gradientUnits="userSpaceOnUse"
                    x1="6"
                    y1="47"
                    x2="36"
                    y2="17"
                >
                    <stop offset="0" stopColor="var(--brand-blue)" />
                    <stop offset="1" stopColor="var(--brand-cyan)" />
                </linearGradient>
                <linearGradient
                    id={`${id}-b`}
                    gradientUnits="userSpaceOnUse"
                    x1="27"
                    y1="17"
                    x2="57"
                    y2="47"
                >
                    <stop offset="0" stopColor="var(--brand-cyan)" />
                    <stop offset="1" stopColor="var(--brand-blue)" />
                </linearGradient>
                <mask
                    id={`${id}-cut`}
                    maskUnits="userSpaceOnUse"
                    x="0"
                    y="0"
                    width="64"
                    height="64"
                >
                    <rect width="64" height="64" fill="#fff" />
                    <path
                        d="M39.4 46.77 A15 15 0 0 1 31.4 42.6"
                        fill="none"
                        stroke="#000"
                        strokeWidth="12"
                    />
                </mask>
            </defs>

            <path d={CYCLE} fill="none" stroke={cycle} strokeWidth="6.5" />
            <g mask={`url(#${id}-cut)`}>
                <rect
                    x="6"
                    y="17"
                    width="30"
                    height="30"
                    rx="9"
                    fill="none"
                    stroke={screen}
                    strokeWidth="6.5"
                />
                {animated && !mono && (
                    <rect
                        className="logo-pulse"
                        pathLength={1}
                        x="6"
                        y="17"
                        width="30"
                        height="30"
                        rx="9"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeDasharray=".07 .93"
                        opacity=".85"
                    />
                )}
            </g>
            <g fill={mono ? '#fff' : 'currentColor'}>
                <rect x="13" y="25" width="10" height="3.4" rx="1.7" />
                <rect
                    x="13"
                    y="31"
                    width="6"
                    height="3.4"
                    rx="1.7"
                    opacity=".5"
                />
            </g>
            {animated ? (
                <circle
                    r="3.6"
                    fill={mono ? '#fff' : 'currentColor'}
                    className="logo-dot"
                >
                    <animateMotion
                        dur="3.2s"
                        repeatCount="indefinite"
                        path={CYCLE}
                    />
                </circle>
            ) : (
                <circle
                    cx="57"
                    cy="32"
                    r="3.6"
                    fill={mono ? '#fff' : 'currentColor'}
                />
            )}
        </svg>
    );
}
