import { useState } from 'react';
import { X, Plus, Minus, Copy, RotateCcw, Upload, Check, Trash2 } from 'lucide-react';
import { categories } from '../data/products';

export default function StockManagerModal({
    isOpen,
    onClose,
    products,
    onUpdateStock,
    onAddNewProduct,
    onDeleteProduct,
    onResetCatalog,
}) {
    const [copied, setCopied] = useState(false);
    const [newProd, setNewProd] = useState({
        name: '',
        price: '',
        category: 'U-Shape',
        stock: 5,
        badge: 'New Arrival',
        delivery: '2–10 days',
        colors: 'Grey, Beige, Charcoal',
        image: '',
        dimensions: 'Length: 240 cm x Depth: 95 cm x Height: 85 cm',
        features: 'Solid wood frame, High-density foam cushions, Two-person room assembly',
        isPopular: true,
        isTrending: false,
    });

    if (!isOpen) return null;

    const handleImageFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setNewProd((prev) => ({ ...prev, image: ev.target.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleCreateProduct = (e) => {
        e.preventDefault();
        if (!newProd.name || !newProd.price) return;
        const created = {
            id: newProd.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-3),
            name: newProd.name,
            price: parseFloat(newProd.price),
            category: newProd.category,
            secondaryCategory: 'All',
            badge: newProd.badge || 'New Arrival',
            stock: parseInt(newProd.stock, 10) || 0,
            isPopular: newProd.isPopular,
            isTrending: newProd.isTrending,
            delivery: newProd.delivery,
            colors: newProd.colors.split(',').map((c) => c.trim()).filter(Boolean),
            image:
                newProd.image ||
                'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85',
            dimensions: newProd.dimensions.split(',').map((d) => d.trim()).filter(Boolean),
            features: newProd.features.split(',').map((f) => f.trim()).filter(Boolean),
        };
        onAddNewProduct(created);
        setNewProd({ ...newProd, name: '', price: '', image: '' });
    };

    const copyProductsCode = () => {
        const codeString = `export const initialProducts = ${JSON.stringify(products, null, 2)};`;
        navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
                {/* Header */}
                <div className="p-6 border-b border-stone-200 flex flex-wrap items-center justify-between gap-4 bg-[#1C1B18] text-white">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A7B56]">
                            Developer & Showroom Inventory Tool
                        </span>
                        <h2 className="font-serif text-2xl font-bold">
                            Manage Stock & Add New Furniture
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyProductsCode}
                            className="px-4 py-2 rounded-full bg-[#9A7B56] hover:bg-[#7D6242] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied JSON for products.js!' : 'Copy Code for products.js'}
                        </button>
                        <button
                            onClick={onResetCatalog}
                            className="px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1 cursor-pointer"
                            title="Reset to default products.js file"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Add New Item Form */}
                    <form onSubmit={handleCreateProduct} className="lg:col-span-5 space-y-3.5 bg-[#FAF8F5] p-5 rounded-2xl border border-stone-200">
                        <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                            + Add New Furniture Item
                        </h3>
                        <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                Product Name *
                            </label>
                            <input
                                required
                                type="text"
                                value={newProd.name}
                                onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                                placeholder="e.g. Verona Velvet Corner Sofa"
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Price (£) *
                                </label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    value={newProd.price}
                                    onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                                    placeholder="999.00"
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Stock Qty *
                                </label>
                                <input
                                    required
                                    type="number"
                                    value={newProd.stock}
                                    onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Category
                                </label>
                                <select
                                    value={newProd.category}
                                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                                    className="w-full px-2 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                >
                                    {categories
                                        .filter((c) => !['All', 'Popular', 'Trending'].includes(c.id))
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.label}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                Image URL or Upload Image File
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newProd.image}
                                    onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                                    placeholder="Paste https:// image link..."
                                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                />
                                <label className="px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-[#9A7B56] text-xs font-semibold cursor-pointer flex items-center gap-1">
                                    <Upload className="w-3.5 h-3.5 text-[#9A7B56]" /> File
                                    <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Colours (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={newProd.colors}
                                    onChange={(e) => setNewProd({ ...newProd, colors: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                    Delivery Time
                                </label>
                                <input
                                    type="text"
                                    value={newProd.delivery}
                                    onChange={(e) => setNewProd({ ...newProd, delivery: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                                Dimensions (comma separated)
                            </label>
                            <input
                                type="text"
                                value={newProd.dimensions}
                                onChange={(e) => setNewProd({ ...newProd, dimensions: e.target.value })}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs"
                            />
                        </div>

                        <div className="flex items-center gap-4 pt-1">
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newProd.isPopular}
                                    onChange={(e) => setNewProd({ ...newProd, isPopular: e.target.checked })}
                                />
                                Popular Product
                            </label>
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={newProd.isTrending}
                                    onChange={(e) => setNewProd({ ...newProd, isTrending: e.target.checked })}
                                />
                                Trending Now
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 rounded-full bg-[#1C1B18] hover:bg-[#9A7B56] text-white text-xs font-semibold transition cursor-pointer"
                        >
                            + Add Item to Live Catalog
                        </button>
                    </form>

                    {/* Right: Live Stock List */}
                    <div className="lg:col-span-7 space-y-3">
                        <h3 className="font-serif text-xl font-bold text-[#1C1B18]">
                            Current Inventory ({products.length} Products)
                        </h3>
                        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                            {products.map((p) => (
                                <div
                                    key={p.id}
                                    className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-stone-200"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={p.image}
                                            alt={p.name}
                                            className="w-12 h-12 rounded-xl object-cover"
                                        />
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-[#9A7B56]">
                                                {p.category} &bull; £{p.price}
                                            </span>
                                            <h4 className="text-xs font-bold text-[#1C1B18]">{p.name}</h4>
                                        </div>
                                    </div>

                                    {/* Quick + / - Stock Controls */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                                            className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <input
                                            type="number"
                                            min="0"
                                            value={p.stock}
                                            onChange={(e) =>
                                                onUpdateStock(p.id, Math.max(0, parseInt(e.target.value, 10) || 0))
                                            }
                                            className="w-14 text-center py-1 rounded-lg border border-stone-200 text-xs font-bold"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onUpdateStock(p.id, p.stock + 1)}
                                            className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center hover:border-[#9A7B56] cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteProduct(p.id)}
                                            className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer ml-1"
                                            title="Delete product"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}