import { colorMap } from '../data/products';

const KEYWORDS = [
    [['black'], '#1C1B18'],
    [['navy'], '#1B2A4A'],
    [['blue'], '#2B547E'],
    [['green', 'sage', 'olive'], '#3B5249'],
    [['charcoal', 'dark grey'], '#3E4042'],
    [['grey', 'gray', 'silver'], '#8C8C8C'],
    [['white', 'ivory'], '#F5F5F2'],
    [['cream', 'beige', 'champagne'], '#E6DEC8'],
    [['taupe', 'mink'], '#9E9082'],
    [['brown', 'walnut', 'tan'], '#6B4C35'],
    [['oak', 'wood', 'gold'], '#C8A165'],
    [['pink', 'blush'], '#E3BCBC'],
];

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Swatch colour for a finish name: admin-defined, built-in, then a keyword guess. */
export function resolveColorHex(colorName, customColors = {}) {
    if (!colorName) return '#D6D3CD';
    const custom = customColors?.[colorName];
    if (typeof custom === 'string' && HEX.test(custom)) return custom;
    if (colorMap[colorName]) return colorMap[colorName];

    const lower = String(colorName).toLowerCase();
    const exact = Object.keys(colorMap).find((k) => k.toLowerCase() === lower);
    if (exact) return colorMap[exact];

    for (const [words, hex] of KEYWORDS) {
        if (words.some((w) => lower.includes(w))) return hex;
    }
    return '#C2B9AC';
}
