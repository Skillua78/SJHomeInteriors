import { useMemo } from 'react';
import { CATEGORY_TAXONOMY, colorMap, VARIATION_PRESETS } from '../../../data/products';
import { sanitizeText } from '../../../utils/security';
import { resolveColorHex } from '../../../utils/colors';

const REMOVED_KEY = {
    fabrics: 'removedFabrics',
    sizes: 'removedSizes',
    mattresses: 'removedMattresses',
    liftOptions: 'removedLiftOptions',
};

const unique = (list) => Array.from(new Set(list));

/**
 * The shop's reusable option library: categories, colours and variation
 * presets. Built-in defaults are merged with what the admin has saved (and
 * minus what they removed); every change is persisted to site settings.
 *
 * @param saveSettings async (nextSettings) => void
 * @param facets       catalogue facets, so categories already in use always appear
 * @param form         the product currently being edited (its own options stay selectable)
 */
export function usePresetLibrary({ siteSettings, saveSettings, facets, form }) {
    const settings = siteSettings || {};
    const saved = settings.savedPresets || {};

    const taxonomy = useMemo(() => {
        const removed = settings.removedCategories || [];
        const map = {};
        const add = (category, subs = []) => {
            if (!category || removed.includes(category)) return;
            map[category] = unique([...(map[category] || []), ...subs]);
        };
        Object.entries(CATEGORY_TAXONOMY).forEach(([cat, subs]) => add(cat, subs));
        Object.entries(settings.customCategories || {}).forEach(([cat, subs]) => add(cat, subs || []));
        (facets?.categories || []).forEach((cat) =>
            add(
                cat.name,
                cat.subcategories.map((s) => s.name)
            )
        );
        return map;
    }, [settings.removedCategories, settings.customCategories, facets]);

    const colorNames = useMemo(() => {
        const removed = settings.removedColors || [];
        return unique([...Object.keys(colorMap), ...Object.keys(settings.customColors || {})]).filter(
            (c) => !removed.includes(c)
        );
    }, [settings.customColors, settings.removedColors]);

    const presets = useMemo(() => {
        const merge = (field, builtIn) => {
            const removed = saved[REMOVED_KEY[field]] || [];
            return unique([...builtIn, ...(saved[field] || []), ...(form[field] || [])]).filter(
                (x) => !removed.includes(x)
            );
        };
        return {
            fabrics: merge('fabrics', VARIATION_PRESETS.fabrics),
            sizes: merge(
                'sizes',
                VARIATION_PRESETS.sizesByCategory[form.category] || VARIATION_PRESETS.sizesByCategory.default
            ),
            mattresses: merge('mattresses', VARIATION_PRESETS.mattresses),
            liftOptions: merge('liftOptions', VARIATION_PRESETS.liftOptions),
        };
    }, [saved, form.category, form.fabrics, form.sizes, form.mattresses, form.liftOptions]);

    /* ----- persistence ----- */

    const savePreset = (field, rawValue) => {
        const value = sanitizeText(String(rawValue || '').trim(), 80);
        if (!value) return Promise.resolve('');
        return saveSettings({
            ...settings,
            savedPresets: {
                ...saved,
                [field]: unique([...(saved[field] || []), value]),
                [REMOVED_KEY[field]]: (saved[REMOVED_KEY[field]] || []).filter((x) => x !== value),
            },
        }).then(() => value);
    };

    const removePreset = (field, value) =>
        saveSettings({
            ...settings,
            savedPresets: {
                ...saved,
                [field]: (saved[field] || []).filter((x) => x !== value),
                [REMOVED_KEY[field]]: unique([...(saved[REMOVED_KEY[field]] || []), value]),
            },
        });

    /** Save a finish. Returns the canonical name (an existing colour wins over a new spelling). */
    const saveColor = (rawName, hex) => {
        const clean = sanitizeText(String(rawName || '').trim(), 35);
        if (!clean) return Promise.resolve('');
        const existing = colorNames.find((c) => c.toLowerCase() === clean.toLowerCase());
        const name = existing || clean;
        return saveSettings({
            ...settings,
            removedColors: (settings.removedColors || []).filter((c) => c !== name),
            customColors: {
                ...(settings.customColors || {}),
                [name]: existing ? resolveColorHex(name, settings.customColors) : hex,
            },
        }).then(() => name);
    };

    const removeColor = (name) => {
        const customColors = { ...(settings.customColors || {}) };
        delete customColors[name];
        return saveSettings({
            ...settings,
            customColors,
            removedColors: unique([...(settings.removedColors || []), name]),
        });
    };

    const saveCategory = (rawName) => {
        const name = sanitizeText(String(rawName || '').trim(), 40);
        if (!name) return Promise.resolve('');
        return saveSettings({
            ...settings,
            customCategories: {
                ...(settings.customCategories || {}),
                [name]: settings.customCategories?.[name] || [],
            },
            removedCategories: (settings.removedCategories || []).filter((c) => c !== name),
        }).then(() => name);
    };

    const removeCategory = (name) =>
        saveSettings({
            ...settings,
            removedCategories: unique([...(settings.removedCategories || []), name]),
        });

    const saveSubcategory = (category, rawName) => {
        const name = sanitizeText(String(rawName || '').trim(), 40);
        if (!name || !category) return Promise.resolve('');
        return saveSettings({
            ...settings,
            customCategories: {
                ...(settings.customCategories || {}),
                [category]: unique([...(taxonomy[category] || []), name]),
            },
        }).then(() => name);
    };

    return {
        taxonomy,
        categoryNames: Object.keys(taxonomy),
        colorNames,
        presets,
        savePreset,
        removePreset,
        saveColor,
        removeColor,
        saveCategory,
        removeCategory,
        saveSubcategory,
    };
}
