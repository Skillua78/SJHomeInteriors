/**
 * Client-side image preparation for uploads.
 * Photos are resized and re-encoded in the browser before being sent, so a
 * 6 MB phone photo becomes a ~200 KB WebP/JPEG. That keeps uploads fast and
 * well inside the database row limit.
 */
import { validateImageFile } from './security';

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // raw file the admin may pick
const TARGET_BASE64_CHARS = 1_200_000; // stays under the 2 MB row cap

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`"${file.name}" could not be read as an image.`));
        };
        img.src = url;
    });
}

function encode(img, maxSide, type, quality) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; // flatten transparency for JPEG output
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL(type, quality);
}

/**
 * Returns { dataUrl } or { error }.
 * @param maxSide longest edge in pixels (1600 for product photos, 1000 for review photos)
 */
export async function compressImageFile(file, maxSide = 1600) {
    const check = validateImageFile(file, MAX_UPLOAD_BYTES);
    if (!check.valid) return { error: check.error };

    let img;
    try {
        img = await loadImage(file);
    } catch (err) {
        return { error: err.message };
    }

    // Prefer WebP; browsers without a WebP encoder silently return PNG, so fall back to JPEG.
    const attempts = [
        [maxSide, 'image/webp', 0.82],
        [maxSide, 'image/jpeg', 0.82],
        [Math.round(maxSide * 0.75), 'image/jpeg', 0.75],
        [Math.round(maxSide * 0.5), 'image/jpeg', 0.7],
    ];
    for (const [side, type, quality] of attempts) {
        const dataUrl = encode(img, side, type, quality);
        const ok = dataUrl.startsWith(`data:${type};base64,`);
        if (ok && dataUrl.length <= TARGET_BASE64_CHARS) return { dataUrl };
    }
    return { error: `"${file.name}" is too large to upload, even after compression.` };
}

/** Compress several files; returns { images: string[], errors: string[] }. */
export async function compressImageFiles(files, maxSide = 1600) {
    const images = [];
    const errors = [];
    for (const file of files) {
        // Sequential on purpose: decoding many large photos at once can exhaust memory on phones.
        // eslint-disable-next-line no-await-in-loop
        const result = await compressImageFile(file, maxSide);
        if (result.dataUrl) images.push(result.dataUrl);
        else errors.push(result.error);
    }
    return { images, errors };
}
