/**
 * @param wrap allow the wordmark onto two lines (narrow columns such as the footer)
 */
export default function Logo({ variant = 'dark', className = '', wrap = false }) {
    const isLight = variant === 'light';
    const primaryText = isLight ? 'text-white' : 'text-ink';
    const strokeColor = isLight ? '#F8F6F1' : '#1D2A27';

    return (
        <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none max-w-full ${className}`}>
            {/* Monogram */}
            <svg
                width="44"
                height="44"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={`shrink-0 ${wrap ? '' : 'w-10 h-10 sm:w-11 sm:h-11'}`}
            >
                {/* House outline behind an S&J monogram; the ampersand cuts a thin gap where it crosses the letters */}
                <path
                    d="M3 20.5L24 3.5L45 20.5V44.5H3Z"
                    stroke="#C2683F"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <g fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="600">
                    <text x="6" y="38" fontSize="30" fill={strokeColor}>
                        S
                    </text>
                    <text x="27.5" y="35" fontSize="30" fill={strokeColor}>
                        J
                    </text>
                    <text
                        x="24.5"
                        y="37"
                        fontSize="21"
                        textAnchor="middle"
                        fill="#C2683F"
                        stroke={isLight ? '#1D2A27' : '#F8F6F1'}
                        strokeWidth="1.6"
                        paintOrder="stroke"
                    >
                        &amp;
                    </text>
                </g>
            </svg>

            {/* Brand Wordmark */}
            <div className="flex flex-col text-left min-w-0">
                <span
                    className={`font-logo text-[15px] min-[400px]:text-base sm:text-2xl font-bold tracking-tight leading-[1.1] sm:leading-none ${
                        wrap ? '' : 'sm:whitespace-nowrap sm:truncate'
                    } ${primaryText}`}
                >
                    {/* Two set lines on phones so the wordmark never runs under the header buttons. */}
                    <span className={wrap ? '' : 'block sm:inline whitespace-nowrap'}>S&amp;J HOME</span>{' '}
                    <span className={wrap ? '' : 'block sm:inline whitespace-nowrap'}>INTERIORS</span>
                </span>
                <span className="hidden sm:block text-[9px] uppercase tracking-[0.26em] text-bronze-deep font-semibold mt-1 whitespace-nowrap">
                    Maltby Showroom &bull; Est. UK
                </span>
            </div>
        </div>
    );
}