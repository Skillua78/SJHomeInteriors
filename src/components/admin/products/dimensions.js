/**
 * Format a measurement in both units, e.g. "215 cm (7ft 1in)".
 * Accepts centimetres, feet/inches, or both; returns '' when nothing usable was entered.
 */
export function formatDualDimension(cmInput, ftInput, inInput) {
    const cm = parseFloat(cmInput);
    const ft = parseInt(ftInput, 10) || 0;
    const inches = parseFloat(inInput) || 0;
    const hasCm = !Number.isNaN(cm) && cm > 0;
    const hasImperial = ft > 0 || inches > 0;

    const imperialText = (feet, ins) =>
        `${feet > 0 ? `${feet}ft` : ''}${ins > 0 ? ` ${ins}in` : ''}`.trim();

    if (hasCm && hasImperial) return `${cm} cm (${imperialText(ft, inches)})`;

    if (hasCm) {
        const totalInches = Math.round(cm / 2.54);
        const feet = Math.floor(totalInches / 12);
        const rest = totalInches % 12;
        return `${cm} cm (${imperialText(feet, rest) || '0in'})`;
    }

    if (hasImperial) {
        const totalCm = Math.round((ft * 12 + inches) * 2.54);
        return `${totalCm} cm (${imperialText(ft, inches)})`;
    }

    return '';
}
