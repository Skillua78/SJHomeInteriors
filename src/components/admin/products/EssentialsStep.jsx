import { useState } from 'react';
import { inputClass, labelClass, primaryButtonClass } from '../adminUi';

/** Step 1: title, category, pricing, delivery & assembly fee, description. */
export default function EssentialsStep({ form, update, library, manageMode, defaultDeliveryFee }) {
    const [newCategory, setNewCategory] = useState(null); // null = picker shown
    const [newSubcategory, setNewSubcategory] = useState(null);

    const addCategory = async () => {
        const name = await library.saveCategory(newCategory);
        if (name) update({ category: name, subcategory: '' });
        setNewCategory(null);
    };

    const addSubcategory = async () => {
        const name = await library.saveSubcategory(form.category, newSubcategory);
        if (name) update({ subcategory: name });
        setNewSubcategory(null);
    };

    const removeCategory = async () => {
        await library.removeCategory(form.category);
        update({ category: '', subcategory: '' });
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="pf-name" className={labelClass}>
                    Product title *
                </label>
                <input
                    id="pf-name"
                    required
                    type="text"
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => update({ name: e.target.value })}
                    placeholder="e.g. Kensington Wingback Ottoman Bed"
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label htmlFor="pf-category" className="text-xs font-semibold text-stone-700">
                            Category *
                        </label>
                        <div className="flex items-center gap-2">
                            {manageMode && form.category && (
                                <button
                                    type="button"
                                    onClick={removeCategory}
                                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                                >
                                    Remove “{form.category}”
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setNewCategory(newCategory === null ? '' : null)}
                                className="text-[11px] font-bold text-[#7D6242] hover:underline cursor-pointer"
                            >
                                {newCategory === null ? '+ New category' : 'Cancel'}
                            </button>
                        </div>
                    </div>
                    {newCategory === null ? (
                        <select
                            id="pf-category"
                            required
                            value={form.category}
                            onChange={(e) => update({ category: e.target.value, subcategory: '' })}
                            className={inputClass}
                        >
                            <option value="">Select furniture type…</option>
                            {library.categoryNames.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="flex gap-1.5">
                            <input
                                id="pf-category"
                                type="text"
                                autoFocus
                                maxLength={40}
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                                placeholder="e.g. Mirrors"
                                className={inputClass}
                            />
                            <button type="button" onClick={addCategory} className={primaryButtonClass}>
                                Save
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-1">
                        <label htmlFor="pf-subcategory" className="text-xs font-semibold text-stone-700">
                            Subcategory
                        </label>
                        {form.category && (
                            <button
                                type="button"
                                onClick={() => setNewSubcategory(newSubcategory === null ? '' : null)}
                                className="text-[11px] font-bold text-[#7D6242] hover:underline cursor-pointer"
                            >
                                {newSubcategory === null ? '+ New subcategory' : 'Cancel'}
                            </button>
                        )}
                    </div>
                    {newSubcategory === null ? (
                        <select
                            id="pf-subcategory"
                            value={form.subcategory}
                            onChange={(e) => update({ subcategory: e.target.value })}
                            disabled={!form.category}
                            className={inputClass}
                        >
                            <option value="">None</option>
                            {(library.taxonomy[form.category] || []).map((sub) => (
                                <option key={sub} value={sub}>
                                    {sub}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="flex gap-1.5">
                            <input
                                id="pf-subcategory"
                                type="text"
                                autoFocus
                                maxLength={40}
                                value={newSubcategory}
                                onChange={(e) => setNewSubcategory(e.target.value)}
                                placeholder="e.g. Velvet Beds"
                                className={inputClass}
                            />
                            <button type="button" onClick={addSubcategory} className={primaryButtonClass}>
                                Save
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                    <label htmlFor="pf-price" className={labelClass}>
                        Base price (£) *
                    </label>
                    <input
                        id="pf-price"
                        required
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.price}
                        onChange={(e) => update({ price: e.target.value })}
                        placeholder="649.00"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="pf-was" className={labelClass}>
                        Was price (£)
                    </label>
                    <input
                        id="pf-was"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.previousPrice}
                        onChange={(e) => update({ previousPrice: e.target.value })}
                        placeholder="Optional"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="pf-delivery-fee" className={labelClass}>
                        Delivery &amp; assembly (£)
                    </label>
                    <input
                        id="pf-delivery-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.deliveryFee}
                        onChange={(e) => update({ deliveryFee: e.target.value })}
                        placeholder={`Standard £${defaultDeliveryFee}`}
                        aria-describedby="pf-delivery-fee-hint"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="pf-stock" className={labelClass}>
                        Stock
                    </label>
                    <input
                        id="pf-stock"
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={(e) => update({ stock: e.target.value })}
                        placeholder="Blank = not shown"
                        className={inputClass}
                    />
                </div>
            </div>
            <p id="pf-delivery-fee-hint" className="text-[11px] text-stone-500 -mt-2">
                Delivery &amp; assembly is charged per item at checkout. Leave blank to use the standard £
                {defaultDeliveryFee}; enter 0 for no charge on this item. Collection is always free.
            </p>

            <div>
                <label htmlFor="pf-description" className={labelClass}>
                    Description
                </label>
                <textarea
                    id="pf-description"
                    rows={4}
                    maxLength={4000}
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="Describe the craftsmanship, comfort, upholstery and styling…"
                    className={inputClass}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label htmlFor="pf-eta" className={labelClass}>
                        Delivery estimate
                    </label>
                    <input
                        id="pf-eta"
                        type="text"
                        maxLength={60}
                        value={form.delivery}
                        onChange={(e) => update({ delivery: e.target.value })}
                        placeholder="e.g. 2–7 days"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="pf-badge" className={labelClass}>
                        Corner badge
                    </label>
                    <input
                        id="pf-badge"
                        type="text"
                        maxLength={40}
                        value={form.badge}
                        onChange={(e) => update({ badge: e.target.value })}
                        placeholder="e.g. Bestseller"
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.isPopular}
                        onChange={(e) => update({ isPopular: e.target.checked })}
                        className="w-4 h-4 accent-[#1C1B18]"
                    />
                    Popular
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.isTrending}
                        onChange={(e) => update({ isTrending: e.target.checked })}
                        className="w-4 h-4 accent-[#1C1B18]"
                    />
                    Trending
                </label>
            </div>
        </div>
    );
}
