import { useState } from 'react';
import { X, Copy, Check, Upload, Sparkles, FileJson, PlusCircle, Layers } from 'lucide-react';
import { sanitizeText, validateSafeImageUrl } from '../../../utils/security';

export const DEFAULT_PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85';

export const AI_PROMPT_TEMPLATE = `Convert the following raw furniture product notes into a valid JSON object (or an array of JSON objects if multiple products are listed) for SJ Home Interiors.

Rules:
1. Return ONLY raw valid JSON (no markdown backticks or extra commentary).
2. Convert ALL CAPS titles into clean Title Case.
3. Rewrite descriptions to emphasize affordable showroom prices and durable quality.
4. Format all sizes and dimensions with BOTH cm and ft/in (e.g. "5ft King (150 × 200 cm)" or "215 cm (7ft 1in)").
5. Category MUST be one of: "Sofas", "Beds", "Tables", "Chairs", "Wardrobes", "Cabinets", "Outdoor".
6. Only include "mattresses" and "liftOptions" if category is "Beds" (leave them as empty arrays [] for other furniture).
7. Leave "image" and "images" empty [] unless a URL is provided (our system will auto-fill a default placeholder image).

JSON Schema:
{
  "name": "Kensington Wingback Gas-Lift Ottoman Bed",
  "price": 649.00,
  "previousPrice": 799.00,
  "description": "Direct showroom value on a solid UK-built ottoman bed...",
  "category": "Beds",
  "subcategory": "Ottoman Beds",
  "badge": "Great Value",
  "stock": 5,
  "delivery": "2–7 days",
  "isPopular": true,
  "isTrending": false,
  "colors": ["Cream", "Grey", "Charcoal", "Black"],
  "features": [
    "Heavy-duty hydraulic gas-lift storage",
    "Solid hardwood reinforced frame"
  ],
  "variations": {
    "fabrics": ["Plush Velvet", "Naples", "Spice Velvet", "Wool", "Linoso", "Teddy"],
    "sizes": [
      "3ft Single (90 × 190 cm)",
      "4ft 6in Double (135 × 190 cm)",
      "5ft King (150 × 200 cm)",
      "6ft Super King (180 × 200 cm)"
    ],
    "mattresses": [
      "No Mattress (Frame Only)",
      "Orthopaedic",
      "Pocket Spring"
    ],
    "liftOptions": ["End Lift Ottoman", "Side Lift Ottoman"],
    "priceDeltas": {
      "fabrics": {},
      "sizes": {
        "3ft Single (90 × 190 cm)": -50,
        "4ft 6in Double (135 × 190 cm)": 0,
        "5ft King (150 × 200 cm)": 60,
        "6ft Super King (180 × 200 cm)": 120
      },
      "mattresses": {
        "No Mattress (Frame Only)": 0,
        "Orthopaedic": 129,
        "Pocket Spring": 189
      },
      "liftOptions": {}
    },
    "structuredDimensions": {
      "default": {
        "length": "205 cm (6ft 9in)",
        "width": "148 cm (4ft 10in)",
        "depth": "137 cm (4ft 6in)",
        "custom": "Underbed Storage Depth: 28 cm (11in)"
      },
      "bySize": {}
    }
  }
}

RAW PRODUCT INFORMATION TO CONVERT:
[PASTE YOUR SUPPLIER NOTES / PRODUCT DETAILS HERE]`;

export function normalizeImportedProduct(raw) {
    const cleanName = sanitizeText(raw.name || 'Untitled Furniture Item', 120);
    const parsedPrice = parseFloat(raw.price);
    const price = Number.isNaN(parsedPrice) || parsedPrice < 0 ? 0 : parsedPrice;

    const parsedPrev = parseFloat(raw.previousPrice ?? raw.previous_price);
    const previousPrice =
        !Number.isNaN(parsedPrev) && parsedPrev > price ? parsedPrev : null;

    const rawGallery = Array.isArray(raw.images)
        ? raw.images.map((u) => validateSafeImageUrl(u)).filter(Boolean)
        : [];
    const primaryImage =
        validateSafeImageUrl(raw.image) || rawGallery[0] || DEFAULT_PLACEHOLDER_IMAGE;
    const images = rawGallery.length > 0 ? rawGallery : [primaryImage];

    const v = raw.variations || {};
    const structuredDimensions = v.structuredDimensions || {
        default: {
            length: raw.length || '',
            width: raw.width || '',
            depth: raw.depth || '',
            custom: Array.isArray(raw.dimensions) ? raw.dimensions.join(' | ') : '',
        },
        bySize: {},
    };

    const defDim = structuredDimensions.default || {};
    const summaryDims = [];
    if (defDim.length || defDim.width || defDim.depth) {
        summaryDims.push(
            [
                defDim.length ? `Length: ${defDim.length}` : '',
                defDim.width ? `Width: ${defDim.width}` : '',
                defDim.depth ? `Depth: ${defDim.depth}` : '',
            ]
                .filter(Boolean)
                .join(' | ')
        );
    }
    if (defDim.custom) summaryDims.push(defDim.custom);

    return {
        id:
            raw.id ||
            `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()
                .toString()
                .slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`,
        name: cleanName,
        price,
        previousPrice,
        description: sanitizeText(raw.description || '', 2000),
        category: sanitizeText(raw.category || 'Sofas', 40),
        subcategory: sanitizeText(raw.subcategory || '', 40),
        badge: sanitizeText(raw.badge || 'Great Value', 40),
        stock:
            raw.stock === null || raw.stock === undefined || raw.stock === ''
                ? null
                : Math.max(0, parseInt(raw.stock, 10) || 0),
        isPopular: Boolean(raw.isPopular ?? raw.is_popular ?? false),
        isTrending: Boolean(raw.isTrending ?? raw.is_trending ?? false),
        delivery: sanitizeText(raw.delivery || '2–7 days', 40),
        colors: Array.isArray(raw.colors)
            ? raw.colors.map((c) => sanitizeText(String(c), 35)).filter(Boolean)
            : [],
        image: primaryImage,
        images,
        dimensions: summaryDims,
        features: Array.isArray(raw.features)
            ? raw.features.map((f) => sanitizeText(String(f), 120)).filter(Boolean)
            : typeof raw.features === 'string'
                ? raw.features
                    .split(',')
                    .map((f) => sanitizeText(f, 120))
                    .filter(Boolean)
                : [],
        variations: {
            fabrics: Array.isArray(v.fabrics) ? v.fabrics : [],
            sizes: Array.isArray(v.sizes) ? v.sizes : [],
            mattresses: Array.isArray(v.mattresses) ? v.mattresses : [],
            liftOptions: Array.isArray(v.liftOptions) ? v.liftOptions : [],
            priceDeltas: {
                fabrics: v.priceDeltas?.fabrics || {},
                sizes: v.priceDeltas?.sizes || {},
                mattresses: v.priceDeltas?.mattresses || {},
                liftOptions: v.priceDeltas?.liftOptions || {},
            },
            structuredDimensions,
        },
    };
}

export default function AiImportModal({
    isOpen,
    onClose,
    onLoadSingleIntoEditor,
    onBulkCreateProducts,
}) {
    const [jsonText, setJsonText] = useState('');
    const [copiedPrompt, setCopiedPrompt] = useState(false);
    const [error, setError] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    if (!isOpen) return null;

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 3000);
    };

    const handleFileUpload = (e) => {
        setError('');
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            setJsonText(String(ev.target?.result || ''));
        };
        reader.onerror = () => {
            setError('Failed to read JSON file.');
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const parseInputJson = () => {
        setError('');
        const cleaned = jsonText
            .trim()
            .replace(/^```(?:json)?/i, '')
            .replace(/```$/, '')
            .trim();

        if (!cleaned) {
            setError('Please upload a .json file or paste the AI-generated JSON first.');
            return null;
        }

        try {
            const parsed = JSON.parse(cleaned);
            const list = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed.products)
                    ? parsed.products
                    : [parsed];

            if (list.length === 0) {
                setError('No product objects found in the JSON.');
                return null;
            }
            return list.map(normalizeImportedProduct);
        } catch (err) {
            setError(`Invalid JSON format: ${err.message}`);
            return null;
        }
    };

    const handleLoadIntoForm = () => {
        const items = parseInputJson();
        if (!items) return;
        onLoadSingleIntoEditor(items[0]);
        setJsonText('');
        onClose();
    };

    const handleBulkSave = async () => {
        const items = parseInputJson();
        if (!items) return;
        setIsImporting(true);
        try {
            await onBulkCreateProducts(items);
            setJsonText('');
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save imported products.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="AI Product JSON Importer"
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A7B56] flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Fast AI Catalog Importer
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-[#1C1B18] mt-0.5">
                            Import Product via AI Prompt or JSON File
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Step 1: Copy AI Prompt */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <h4 className="text-xs font-bold text-[#1C1B18]">
                                Step 1: Copy the AI Prompt Template
                            </h4>
                            <p className="text-[11px] text-stone-600">
                                Paste this prompt + your raw supplier notes into ChatGPT, Claude, or Gemini. It will
                                format the title, dual-unit sizes (ft/in &amp; cm), and variations into ready-to-upload JSON.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCopyPrompt}
                            className="px-3.5 py-2 rounded-xl bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shrink-0"
                        >
                            {copiedPrompt ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied AI Prompt!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5" /> Copy AI Prompt &amp; Schema
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Step 2: Upload .json file or Paste JSON */}
                <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="text-xs font-bold text-[#1C1B18] flex items-center gap-1.5">
                            <FileJson className="w-4 h-4 text-[#9A7B56]" />
                            Step 2: Upload `.json` File or Paste AI Output
                        </label>

                        <label className="px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] border border-stone-300 hover:border-[#9A7B56] text-xs font-semibold text-[#1C1B18] flex items-center gap-1.5 cursor-pointer transition">
                            <Upload className="w-3.5 h-3.5 text-[#9A7B56]" /> Upload .json File
                            <input
                                type="file"
                                accept=".json,application/json"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <textarea
                        rows={8}
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        placeholder='Paste the JSON from your AI here (or click "Upload .json File" above)...'
                        className="w-full p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 font-mono text-xs text-stone-800 focus:outline-none focus:border-[#9A7B56]"
                    />

                    <p className="text-[11px] text-stone-500">
                        * A default furniture placeholder image is automatically attached so you can save
                        immediately and upload your real showroom photos whenever you are ready.
                    </p>
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                        {error}
                    </div>
                )}

                {/* Step 3: Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200">
                    <button
                        type="button"
                        onClick={handleLoadIntoForm}
                        disabled={isImporting}
                        className="py-3 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-stone-200/70 border border-stone-300 text-[#1C1B18] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                        <PlusCircle className="w-4 h-4 text-[#9A7B56]" />
                        Load into Form (Review &amp; Edit)
                    </button>

                    <button
                        type="button"
                        onClick={handleBulkSave}
                        disabled={isImporting}
                        className="py-3 px-4 rounded-2xl bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-md"
                    >
                        <Layers className="w-4 h-4" />
                        {isImporting ? 'Importing to Database...' : 'Save Directly to Catalog (1 or Many)'}
                    </button>
                </div>
            </div>
        </div>
    );
}