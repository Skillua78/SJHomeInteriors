import { useCallback, useEffect, useState } from 'react';
import {
    X,
    Undo2,
    Package,
    Settings,
    MessageSquare,
    ShieldAlert,
    ClipboardList,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { api } from '../../utils/api';
import { useAdminCatalog } from './useAdminCatalog';
import ProductEditor from './products/ProductEditor';
import InventoryList from './products/InventoryList';
import SettingsPanel from './settings/SettingsPanel';
import ReviewsPanel from './reviews/ReviewsPanel';
import OrdersPanel from './orders/OrdersPanel';
import { CATEGORY_TAXONOMY } from '../../data/products';

const TABS = [
    { id: 'inventory', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ClipboardList },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
];

/**
 * Admin dashboard shell: tabs, undo and status messages. Each tab is its own
 * module under ./products, ./orders, ./reviews and ./settings.
 */
export default function AdminDashboard({
    isOpen,
    onClose,
    currentUser,
    siteSettings,
    onSaveSiteSettings,
    facets,
    onCatalogChanged,
    reviews,
    onToggleVerifyReview,
    onRespondToReview,
    onDeleteReview,
    initialEditProduct,
    onClearInitialEdit,
}) {
    const [tab, setTab] = useState('inventory');
    const [target, setTarget] = useState(null); // { product, duplicate } loaded into the editor
    const [inventoryVersion, setInventoryVersion] = useState(0);

    const handleChanged = useCallback(() => {
        setInventoryVersion((v) => v + 1);
        onCatalogChanged();
    }, [onCatalogChanged]);

    const catalog = useAdminCatalog(handleChanged);
    const { reportError, clearNotice } = catalog;

    /** Editing needs the full record (gallery, options), not the list summary. */
    const openInEditor = useCallback(
        async (summary, duplicate = false) => {
            try {
                const product = await api.getProduct(summary.id, { fresh: true });
                setTab('inventory');
                setTarget({ product, duplicate });
            } catch (err) {
                reportError(err);
            }
        },
        [reportError]
    );

    useEffect(() => {
        if (isOpen && initialEditProduct) {
            openInEditor(initialEditProduct);
            onClearInitialEdit?.();
        }
    }, [isOpen, initialEditProduct, openInEditor, onClearInitialEdit]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [isOpen]);

    if (!isOpen || currentUser?.role !== 'admin') return null;

    const categoryNames = Array.from(
        new Set([...Object.keys(CATEGORY_TAXONOMY), ...(facets?.categories || []).map((c) => c.name)])
    );
    const pendingReviews = reviews.filter((r) => !r.verified).length;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin dashboard"
            className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-6xl w-full h-[96dvh] sm:h-[92vh] flex flex-col overflow-hidden shadow-2xl">
                <header className="shrink-0 px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 bg-[#1C1B18] text-white">
                    <div className="min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" /> Admin
                        </span>
                        <h2 className="font-serif text-xl font-bold leading-tight">Shop manager</h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <nav aria-label="Dashboard sections" className="flex flex-wrap gap-1.5">
                            {TABS.map((item) => {
                                const Icon = item.icon;
                                const active = tab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        aria-current={active ? 'page' : undefined}
                                        onClick={() => setTab(item.id)}
                                        className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                                            active
                                                ? 'bg-[#9A7B56] text-white'
                                                : 'bg-white/10 text-stone-200 hover:bg-white/20'
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                                        {item.label}
                                        {item.id === 'reviews' && pendingReviews > 0 && (
                                            <span className="ml-0.5 px-1.5 rounded-full bg-amber-500 text-[#1C1B18] text-[10px] font-bold">
                                                {pendingReviews}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        <button
                            type="button"
                            onClick={catalog.undo}
                            disabled={!catalog.canUndo}
                            title={catalog.canUndo ? `Undo ${catalog.undoLabel}` : 'Nothing to undo'}
                            className={`px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition max-w-[14rem] ${
                                catalog.canUndo
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                                    : 'bg-white/5 text-stone-500 cursor-not-allowed'
                            }`}
                        >
                            <Undo2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span className="truncate">Undo</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close admin dashboard"
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-red-600 text-white flex items-center justify-center cursor-pointer transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {catalog.notice && (
                    <div
                        role={catalog.notice.tone === 'error' ? 'alert' : 'status'}
                        className={`shrink-0 px-4 sm:px-6 py-2.5 text-sm font-medium flex items-center justify-between gap-3 ${
                            catalog.notice.tone === 'error'
                                ? 'bg-red-50 text-red-800 border-b border-red-200'
                                : 'bg-emerald-50 text-emerald-900 border-b border-emerald-200'
                        }`}
                    >
                        <span className="flex items-center gap-2">
                            {catalog.notice.tone === 'error' ? (
                                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            )}
                            {catalog.notice.text}
                        </span>
                        <button
                            type="button"
                            onClick={clearNotice}
                            aria-label="Dismiss message"
                            className="p-1 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    {tab === 'inventory' && (
                        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            <ProductEditor
                                target={target}
                                onSave={catalog.saveProduct}
                                onDone={() => setTarget(null)}
                                siteSettings={siteSettings}
                                saveSettings={onSaveSiteSettings}
                                facets={facets}
                            />
                            <InventoryList
                                categoryNames={categoryNames}
                                refreshKey={inventoryVersion}
                                editingId={target && !target.duplicate ? target.product.id : null}
                                onEdit={(p) => openInEditor(p)}
                                onDuplicate={(p) => openInEditor(p, true)}
                                onDelete={catalog.deleteProduct}
                                onSetStock={catalog.setStock}
                            />
                        </div>
                    )}
                    {tab === 'orders' && <OrdersPanel />}
                    {tab === 'reviews' && (
                        <ReviewsPanel
                            reviews={reviews}
                            onToggleVerify={onToggleVerifyReview}
                            onRespond={onRespondToReview}
                            onDelete={onDeleteReview}
                        />
                    )}
                    {tab === 'settings' && (
                        <SettingsPanel siteSettings={siteSettings} onSave={onSaveSiteSettings} />
                    )}
                </div>
            </div>
        </div>
    );
}
