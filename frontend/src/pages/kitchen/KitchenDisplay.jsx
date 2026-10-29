import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { kitchenApi } from '../../api/kitchenApi';

function formatElapsed(createdAt) {
    if (!createdAt) return 'Time unavailable';
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return 'Time unavailable';

    const minutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hr${hours === 1 ? '' : 's'} ago`;
}

export default function KitchenDisplay() {
    const { currentUser } = useAuth();
    const canUpdateTickets = ['Kitchen', 'Manager', 'Owner', 'Admin'].includes(currentUser?.role);
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState(null);
    const [pageError, setPageError] = useState('');
    const [toast, setToast] = useState('');

    const loadTickets = useCallback(async (background = false) => {
        if (background) setIsRefreshing(true);
        else setIsLoading(true);
        try {
            const rows = await kitchenApi.getTickets();
            setTickets(rows);
            setPageError('');
        } catch (error) {
            setPageError(error.message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadTickets();
        const intervalId = window.setInterval(() => loadTickets(true), 15000);
        return () => window.clearInterval(intervalId);
    }, [loadTickets]);

    useEffect(() => {
        if (!toast) return undefined;
        const timeoutId = window.setTimeout(() => setToast(''), 3500);
        return () => window.clearTimeout(timeoutId);
    }, [toast]);

    const activeItems = useMemo(
        () => tickets.flatMap(ticket => ticket.items),
        [tickets]
    );
    const pendingCount = activeItems.filter(item => item.status === 'Pending').length;
    const cookingCount = activeItems.filter(item => item.status === 'Cooking').length;

    const handleUpdateItemStatus = async (item, nextStatus) => {
        try {
            setUpdatingItemId(item.id);
            setPageError('');
            await kitchenApi.updateItemStatus(item.id, nextStatus);
            await loadTickets(true);
            setToast(nextStatus === 'Ready'
                ? `${item.name} is ready for service.`
                : `${item.name} is now being prepared.`);
        } catch (error) {
            setPageError(error.message);
        } finally {
            setUpdatingItemId(null);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">
            {toast && (
                <div role="status" aria-live="polite" className="fixed top-20 right-6 z-[60] bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                    <span className="font-black text-sm">✦</span>
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            <div className="bg-[#081126] text-white p-8 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ KITCHEN DISPLAY SYSTEM ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Kitchen Order Queue
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Orders are loaded from the restaurant database and refreshed automatically.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => loadTickets(true)}
                    disabled={isRefreshing || isLoading}
                    className="relative z-10 rounded-xl border border-[#DCC8A8]/50 px-4 py-2 text-xs font-bold text-[#DCC8A8] hover:bg-white/10 disabled:opacity-50"
                >
                    {isRefreshing ? 'Refreshing…' : '↻ Refresh queue'}
                </button>
            </div>

            {pageError && (
                <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
                    {pageError}
                    <button
                        type="button"
                        onClick={() => loadTickets()}
                        className="ml-3 underline underline-offset-2"
                    >
                        Try again
                    </button>
                </div>
            )}

            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Kitchen queue summary">
                {[
                    { label: 'Active tickets', value: tickets.length, color: 'text-slate-900' },
                    { label: 'Waiting to cook', value: pendingCount, color: 'text-amber-700' },
                    { label: 'Cooking', value: cookingCount, color: 'text-emerald-700' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
                        <span className={`block mt-2 text-3xl font-black ${stat.color}`}>{stat.value}</span>
                    </div>
                ))}
            </section>

            <section>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 className="font-serif text-2xl font-bold text-slate-900">Active kitchen tickets</h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Mark items ready when they are finished; they will leave the cooking queue for service.
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{tickets.length} ticket{tickets.length === 1 ? '' : 's'}</span>
                </div>

                {isLoading ? (
                    <div role="status" className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-500">
                        Loading kitchen tickets…
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                        <span className="mb-2 block text-4xl">🧑‍🍳</span>
                        <p className="font-serif font-bold text-slate-700">Kitchen queue is clear</p>
                        <p className="mt-1 text-xs text-slate-500">
                            New order items sent for preparation will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {tickets.map(ticket => (
                            <article key={ticket.orderId} className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg">
                                <header className="flex items-center justify-between border-b border-slate-100 bg-slate-900 p-5 text-white">
                                    <div>
                                        <span className="font-mono text-[10px] font-bold text-[#DCC8A8]">ORDER #{ticket.orderId}</span>
                                        <h3 className="mt-1 font-serif text-lg font-bold">{ticket.table}</h3>
                                        <p className="mt-1 text-[10px] text-slate-300">Server: {ticket.server}</p>
                                    </div>
                                    <span className="rounded-full border border-amber-500/40 bg-amber-950 px-3 py-1 text-xs font-bold text-amber-300">
                                        ⏱ {formatElapsed(ticket.createdAt)}
                                    </span>
                                </header>

                                <div className="flex-1 space-y-3 p-5">
                                    {ticket.items.map(item => (
                                        <div key={item.id} className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-900">{item.name}</span>
                                                    {item.note && <span className="mt-1 block text-[10px] font-semibold text-amber-700">📝 {item.note}</span>}
                                                </div>
                                                <span className="shrink-0 rounded-lg bg-[#081126] px-2.5 py-0.5 text-sm font-black text-[#DCC8A8]">x{item.quantity}</span>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-slate-200/70 pt-2">
                                                <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                                                    item.status === 'Cooking' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {item.status === 'Cooking' ? 'Cooking' : 'Pending'}
                                                </span>
                                                {canUpdateTickets && (
                                                    <button
                                                        type="button"
                                                        disabled={updatingItemId !== null}
                                                        onClick={() => handleUpdateItemStatus(
                                                            item,
                                                            item.status === 'Pending' ? 'Cooking' : 'Ready'
                                                        )}
                                                        className={`rounded-lg px-3 py-1.5 text-[10px] font-extrabold uppercase text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                                                            item.status === 'Pending'
                                                                ? 'bg-amber-600 hover:bg-amber-700'
                                                                : 'bg-emerald-700 hover:bg-emerald-800'
                                                        }`}
                                                    >
                                                        {updatingItemId === item.id
                                                            ? 'Saving…'
                                                            : item.status === 'Pending' ? 'Start cooking' : 'Mark ready'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <footer className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-semibold text-slate-500">
                                    Finished items are removed from the queue and ready for service.
                                </footer>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
