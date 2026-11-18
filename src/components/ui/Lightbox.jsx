import { useState } from 'react';
import { X } from 'lucide-react';
import { useDialog, useTransitionState } from '../../hooks/useDialog';

/** Full-screen photo viewer. Closes on the X, the backdrop or Escape. */
export default function Lightbox({ src, alt, onClose }) {
    const isOpen = Boolean(src);
    const { mounted, state } = useTransitionState(isOpen, 250);
    const panelRef = useDialog(isOpen, onClose);
    const [lastSrc, setLastSrc] = useState(src);
    if (src && src !== lastSrc) setLastSrc(src);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
                data-state={state}
                onClick={onClose}
                aria-hidden="true"
                className="overlay-fade absolute inset-0 bg-ink/90"
            />
            <div
                ref={panelRef}
                data-dialog-panel
                data-state={state}
                role="dialog"
                aria-modal="true"
                aria-label={alt}
                tabIndex={-1}
                className="dialog-pop relative outline-none"
            >
                <img
                    src={src || lastSrc}
                    alt={alt}
                    className="max-w-[92vw] max-h-[85vh] rounded-2xl shadow-2xl"
                />
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close photo"
                    className="press absolute -top-3 -right-3 w-11 h-11 rounded-full bg-white text-ink shadow-lg flex items-center justify-center"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
