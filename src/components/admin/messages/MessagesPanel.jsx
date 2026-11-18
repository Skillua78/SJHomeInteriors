import { useEffect, useState } from 'react';
import { Loader2, Mail, MailOpen, Trash2, RefreshCw, Phone } from 'lucide-react';
import { api } from '../../../utils/api';
import { sectionTitleClass } from '../adminUi';

/** Inbox for contact-form enquiries and website feedback. */
export default function MessagesPanel({ onChanged }) {
    const [messages, setMessages] = useState([]);
    const [nextOffset, setNextOffset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async (offset) => {
        setLoading(true);
        setError('');
        try {
            const page = await api.listMessages({ limit: 30, offset });
            setMessages((prev) => (offset === 0 ? page.items : [...prev, ...page.items]));
            setNextOffset(page.nextOffset);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(0);
    }, []);

    const run = async (action, apply) => {
        try {
            await action();
            setMessages(apply);
            onChanged?.();
        } catch (err) {
            setError(err.message);
        }
    };

    const setRead = (message, read) =>
        run(
            () => api.setMessageRead(message.id, read),
            (prev) => prev.map((m) => (m.id === message.id ? { ...m, read } : m))
        );

    const remove = (message) =>
        run(
            () => api.deleteMessage(message.id),
            (prev) => prev.filter((m) => m.id !== message.id)
        );

    const markAllRead = () =>
        run(
            () => api.markAllMessagesRead(),
            (prev) => prev.map((m) => ({ ...m, read: true }))
        );

    const unread = messages.filter((m) => !m.read).length;

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className={sectionTitleClass}>
                    Messages{unread > 0 ? ` (${unread} unread)` : ''}
                </h3>
                <div className="flex items-center gap-2">
                    {unread > 0 && (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="px-3.5 py-2 rounded-xl border border-stone-300 hover:border-bronze text-xs font-semibold cursor-pointer"
                        >
                            Mark all as read
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => load(0)}
                        aria-label="Refresh messages"
                        className="p-2.5 rounded-xl border border-stone-300 hover:border-bronze cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {error && (
                <p role="alert" className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
                    {error}
                </p>
            )}

            {!loading && messages.length === 0 && !error && (
                <p className="p-8 text-center text-sm text-stone-500 bg-cream rounded-2xl border border-dashed border-stone-300">
                    No messages yet. Enquiries from the contact page and website feedback appear here.
                </p>
            )}

            {messages.map((m) => (
                <article
                    key={m.id}
                    className={`p-4 rounded-2xl border space-y-2.5 ${
                        m.read ? 'bg-cream border-stone-200' : 'bg-amber-50 border-amber-300'
                    }`}
                >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-ink flex flex-wrap items-center gap-2">
                                {!m.read && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-ink text-[10px] font-bold uppercase">
                                        New
                                    </span>
                                )}
                                {m.name || (m.kind === 'feedback' ? 'Website visitor' : 'Unknown sender')}
                                <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px] font-bold uppercase">
                                    {m.kind === 'feedback' ? 'Feedback' : 'Enquiry'}
                                </span>
                            </p>
                            <p className="text-xs text-stone-600 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                {m.email && (
                                    <a
                                        href={`mailto:${m.email}${
                                            m.subject ? `?subject=${encodeURIComponent(`Re: ${m.subject}`)}` : ''
                                        }`}
                                        className="underline break-all"
                                    >
                                        {m.email}
                                    </a>
                                )}
                                {m.phone && (
                                    <a href={`tel:${m.phone.replace(/\s+/g, '')}`} className="underline flex items-center gap-1">
                                        <Phone className="w-3 h-3" aria-hidden="true" />
                                        {m.phone}
                                    </a>
                                )}
                                <span className="text-stone-500">{m.createdAt}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setRead(m, !m.read)}
                                className="px-3 py-1.5 rounded-full bg-white border border-stone-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:border-bronze"
                            >
                                {m.read ? (
                                    <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                    <MailOpen className="w-3.5 h-3.5" aria-hidden="true" />
                                )}
                                {m.read ? 'Mark unread' : 'Mark as read'}
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(m)}
                                aria-label={`Delete message from ${m.name || 'visitor'}`}
                                className="p-2 text-stone-400 hover:text-red-600 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    {m.subject && <p className="text-sm font-semibold text-ink">{m.subject}</p>}
                    <p className="text-sm text-stone-700 whitespace-pre-line bg-white p-3 rounded-xl border border-stone-200">
                        {m.message}
                    </p>
                </article>
            ))}

            {loading && (
                <p className="text-sm text-stone-500 flex items-center gap-2" role="status">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Loading messages…
                </p>
            )}
            {!loading && nextOffset !== null && (
                <button
                    type="button"
                    onClick={() => load(nextOffset)}
                    className="w-full py-2.5 rounded-xl border border-stone-300 hover:border-bronze text-sm font-semibold cursor-pointer"
                >
                    Load more
                </button>
            )}
        </div>
    );
}
