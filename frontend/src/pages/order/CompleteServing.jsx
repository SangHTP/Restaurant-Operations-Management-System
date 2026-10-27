import { useState } from 'react';
import IconGlyph from '../../components/common/IconGlyph';
import { useConfirm } from '../../context/ConfirmContext';

const SERVING_ORDERS = [
    {
        id: 'ORD-8801',
        table: 'Table M03',
        server: 'Staff Le Minh',
        status: 'ReadyToServe',
        items: [
            { id: 's-1', name: 'Wagyu A5 Ribeye Flambé', qty: 2, served: false },
            { id: 's-2', name: 'Truffle Mushroom Risotto', qty: 1, served: true },
        ],
        createdAt: '19:15',
    },
    {
        id: 'ORD-8802',
        table: 'Table V01',
        server: 'Staff Nguyen An',
        status: 'ReadyToServe',
        items: [
            { id: 's-3', name: 'Galaxy Lobster Hotpot', qty: 1, served: false },
            { id: 's-4', name: 'Gold Leaf Cocktails', qty: 4, served: false },
        ],
        createdAt: '19:30',
    },
    {
        id: 'ORD-8803',
        table: 'Table S04',
        server: 'Staff Le Minh',
        status: 'Serving',
        items: [
            { id: 's-5', name: 'Fresh Oysters (6pc)', qty: 1, served: true },
            { id: 's-6', name: 'Champagne Rosé', qty: 2, served: true },
            { id: 's-7', name: 'Seafood Platter', qty: 1, served: false },
        ],
        createdAt: '18:45',
    },
];

export default function CompleteServing() {
    const confirm = useConfirm();
    const [orders, setOrders] = useState(SERVING_ORDERS);
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleToggleItemServed = (orderId, itemId) => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const updatedItems = o.items.map(it => it.id === itemId ? { ...it, served: !it.served } : it);
                return { ...o, items: updatedItems };
            }
            return o;
        }));
    };

    const handleCompleteServing = async (orderId) => {
        const shouldComplete = await confirm({
            title: 'Complete serving?',
            message: `Confirm that order ${orderId} has been fully served. It will be removed from the serving list.`,
            confirmText: 'Complete serving',
            tone: 'warning',
        });
        if (!shouldComplete) return;
        setOrders(prev => prev.filter(o => o.id !== orderId));
        showToast(`Order ${orderId} serving completed! Table ready for billing.`);
    };

    const handleMarkAllServed = (orderId) => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return { ...o, items: o.items.map(it => ({ ...it, served: true })) };
            }
            return o;
        }));
        showToast(`All items marked as served for ${orderId}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {/* Toast */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <IconGlyph glyph="✦" size={16} />
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-[#081126] text-white p-8 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ SERVING STATION ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Complete Serving & Dish Tracking
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Track which dishes have been served to each table. Mark all items served to complete the order.
                    </p>
                </div>

                <div className="relative z-10 flex gap-4 mt-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <span className="text-2xl font-black text-amber-400 block">{orders.length}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Pending Serving</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <span className="text-2xl font-black text-emerald-400 block">
                            {orders.reduce((sum, o) => sum + o.items.filter(it => it.served).length, 0)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Dishes Served</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <span className="text-2xl font-black text-rose-400 block">
                            {orders.reduce((sum, o) => sum + o.items.filter(it => !it.served).length, 0)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Remaining</span>
                    </div>
                </div>
            </div>

            {/* Serving Tickets Grid */}
            {orders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
                    <IconGlyph glyph="🎉" size={44} className="mb-3" />
                    <p className="font-serif font-bold text-slate-700 text-lg">All Orders Fully Served!</p>
                    <p className="text-xs mt-1">No pending serving items. Great work!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {orders.map(order => {
                        const servedCount = order.items.filter(it => it.served).length;
                        const totalItems = order.items.length;
                        const allServed = servedCount === totalItems;
                        const progress = Math.round((servedCount / totalItems) * 100);

                        return (
                            <div key={order.id} className="bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden flex flex-col">
                                {/* Ticket Header */}
                                <div className="p-5 border-b border-slate-100 bg-slate-900 text-white">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-bold text-[#DCC8A8] font-mono">{order.id}</span>
                                            <h3 className="font-serif font-bold text-lg text-white">{order.table}</h3>
                                            <span className="text-[10px] text-slate-400">Server: {order.server} · Since {order.createdAt}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                allServed
                                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                    : 'bg-amber-100 text-amber-800 border-amber-300'
                                            }`}>
                                                {servedCount}/{totalItems} served
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${allServed ? 'bg-emerald-500' : 'bg-[#DCC8A8]'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-5 space-y-2 flex-1">
                                    {order.items.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleToggleItemServed(order.id, item.id)}
                                            className={`p-3 rounded-2xl border text-xs flex justify-between items-center cursor-pointer transition ${
                                                item.served
                                                    ? 'bg-emerald-50 border-emerald-200'
                                                    : 'bg-slate-50 border-slate-200 hover:bg-amber-50 hover:border-amber-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-5 h-5 rounded-md flex items-center justify-center border-2 text-[10px] font-bold transition ${
                                                    item.served
                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                        : 'bg-white border-slate-300 text-transparent hover:border-emerald-400'
                                                }`}>
                                                    ✓
                                                </span>
                                                <span className={`font-bold ${item.served ? 'text-emerald-800 line-through' : 'text-slate-900'}`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <span className="bg-[#081126] text-[#DCC8A8] font-black text-[10px] px-2 py-0.5 rounded-lg">
                                                x{item.qty}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                                    {!allServed && (
                                        <button
                                            onClick={() => handleMarkAllServed(order.id)}
                                            className="w-full py-2 bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs uppercase rounded-xl hover:bg-amber-200 transition cursor-pointer"
                                        >
                                            <IconGlyph glyph="✦" size={14} /> Mark All Served
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleCompleteServing(order.id)}
                                        disabled={!allServed}
                                        className={`w-full py-2.5 font-extrabold text-xs uppercase rounded-xl transition cursor-pointer shadow-md ${
                                            allServed
                                                ? 'bg-[#081126] text-[#DCC8A8] hover:bg-slate-800'
                                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <IconGlyph glyph="✅" size={15} /> Complete Serving
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
