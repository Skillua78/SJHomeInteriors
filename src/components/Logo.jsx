export default function Logo({ variant = 'dark', className = '' }) {
    const isLight = variant === 'light';
    const primaryText = isLight ? 'text-white' : 'text-[#1C1B18]';
    const strokeColor = isLight ? '#FAF8F5' : '#1C1B18';

    return (
        <div className={`inline-flex items-center gap-3 select-none ${className}`}>
            {/* Architectural Monogram Emblem */}
            <svg
                width="44"
                height="44"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
            >
                {/* Outer Bronze Frame */}
                <rect
                    x="2"
                    y="2"
                    width="44"
                    height="44"
                    rx="8"
                    stroke="#9A7B56"
                    strokeWidth="1.75"
                />
                {/* Inner Architectural Arch / Roofline */}
                <path
                    d="M8 18L24 7L40 18V39C40 39.5523 39.5523 40 39 40H9C8.44772 40 8 39.5523 8 39V18Z"
                    stroke="#9A7B56"
                    strokeWidth="1"
                    strokeOpacity="0.45"
                />
                {/* Intertwined Serif 'S' & 'J' Monogram */}
                <text
                    x="13"
                    y="33"
                    fill={strokeColor}
                    fontFamily="'Cormorant Garamond', Georgia, serif"
                    fontWeight="700"
                    fontSize="22"
                    letterSpacing="-1"
                >
                    S
                </text>
                <text
                    x="25"
                    y="33"
                    fill="#9A7B56"
                    fontFamily="'Cormorant Garamond', Georgia, serif"
                    fontWeight="700"
                    fontSize="22"
                >
                    J
                </text>
                {/* Minimalist Sofa Base Line */}
                <path
                    d="M14 36.5H34"
                    stroke="#9A7B56"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                />
            </svg>

            {/* Brand Wordmark */}
            <div className="flex flex-col text-left">
                <span
                    className={`font-serif text-xl sm:text-2xl font-bold tracking-tight leading-none ${primaryText}`}
                >
                    SJ HOME INTERIORS
                </span>
                <span className="text-[9px] uppercase tracking-[0.26em] text-[#9A7B56] font-semibold mt-1">
                    Maltby Showroom &bull; Est. UK
                </span>
            </div>
        </div>
    );
}