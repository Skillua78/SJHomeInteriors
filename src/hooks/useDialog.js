import { useEffect, useRef, useState } from 'react';

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keep something mounted while it animates out.
 * Returns { mounted, state } where state is 'open' | 'closed' for CSS (data-state).
 */
export function useTransitionState(isOpen, durationMs = 320) {
    const [mounted, setMounted] = useState(isOpen);
    const [state, setState] = useState(isOpen ? 'open' : 'closed');

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            // Two frames: let the browser paint the closed state before animating to open.
            let raf2;
            const raf1 = requestAnimationFrame(() => {
                raf2 = requestAnimationFrame(() => setState('open'));
            });
            return () => {
                cancelAnimationFrame(raf1);
                cancelAnimationFrame(raf2);
            };
        }
        setState('closed');
        const timer = setTimeout(() => setMounted(false), durationMs);
        return () => clearTimeout(timer);
    }, [isOpen, durationMs]);

    return { mounted, state };
}

let openDialogs = 0;
let savedOverflow = '';

/**
 * Accessible dialog behaviour for drawers and modals:
 *  - Escape closes
 *  - focus moves into the dialog, Tab stays inside it, and focus returns afterwards
 *  - the page behind does not scroll (handles nested dialogs)
 *
 * Returns a ref to put on the dialog panel.
 */
export function useDialog(isOpen, onClose) {
    const panelRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!isOpen) return undefined;

        const previouslyFocused = document.activeElement;

        // The panel may only mount a frame or two after isOpen flips (see useTransitionState),
        // so always read the ref at the moment it is needed rather than capturing it here.
        let attempts = 0;
        let focusTimer;
        const focusFirst = () => {
            const panel = panelRef.current;
            if (!panel) {
                attempts += 1;
                if (attempts < 20) focusTimer = setTimeout(focusFirst, 25);
                return;
            }
            if (panel.contains(document.activeElement)) return;
            const first = panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE);
            (first || panel).focus({ preventScroll: true });
        };
        focusTimer = setTimeout(focusFirst, 30);

        const onKeyDown = (e) => {
            const panel = panelRef.current;
            if (!panel) return;
            // Only the top-most dialog reacts.
            const dialogs = document.querySelectorAll('[data-dialog-panel]');
            if (dialogs[dialogs.length - 1] !== panel) return;

            if (e.key === 'Escape') {
                e.stopPropagation();
                onCloseRef.current?.();
                return;
            }
            if (e.key !== 'Tab') return;
            const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
                (el) => el.offsetParent !== null || el === document.activeElement
            );
            if (items.length === 0) {
                e.preventDefault();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        if (openDialogs === 0) {
            savedOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
        }
        openDialogs += 1;

        return () => {
            clearTimeout(focusTimer);
            document.removeEventListener('keydown', onKeyDown);
            openDialogs = Math.max(0, openDialogs - 1);
            if (openDialogs === 0) document.body.style.overflow = savedOverflow;
            if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
                previouslyFocused.focus({ preventScroll: true });
            }
        };
    }, [isOpen]);

    return panelRef;
}
