import { useState } from 'react';
import {
    ChefHat,
    CircleCheck,
    CircleX,
    Clock3,
    CookingPot,
    PackageCheck,
    Send,
    UtensilsCrossed,
} from 'lucide-react';

const INITIAL_KITCHEN_ORDERS = [
    {
        id: 'K-101',
        table: 'Table M03',
        timeAgo: '8 mins ago',
        urgent: true,
        items: [
            { id: 'k-1', name: 'Wagyu A5 Ribeye Flambé', qty: 2, status: 'Cooking', note: 'Medium-rare' },
            { id: 'k-2', name: 'Truffle Mushroom Risotto', qty: 1, status: 'Pending', note: 'Extra parmesan' },
        ],
    },
    {
        id: 'K-102',
        table: 'Table V01',
        timeAgo: '3 mins ago',
        urgent: false,
        items: [
            { id: 'k-3', name: 'Galaxy Lobster Hotpot', qty: 1, status: 'Preparing', note: 'Spicy broth' },
            { id: 'k-4', name: 'Grilled King Prawns', qty: 2, status: 'Pending', note: '' },
        ],
    },
    {
        id: 'K-103',
        table: 'Table S04',
        timeAgo: '1 min ago',
        urgent: false,
        items: [
            { id: 'k-5', name: 'Seafood Platter', qty: 1, status: 'Pending', note: 'No onions' },
        ],
    },
];

export default function KitchenDisplay() {
    const [kitchenOrders, setKitchenOrders] = useState(INITIAL_KITCHEN_ORDERS);
    const [unavailableDishes, setUnavailableDishes] = useState(['Fresh Oysters']);
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleUpdateItemStatus = (orderId, itemId, nextStatus) => {
        setKitchenOrders(prev => prev.map(order => {
            if (order.id === orderId) {
                const updatedItems = order.items.map(it => it.id === itemId ? { ...it, status: nextStatus } : it);
                return { ...order, items: updatedItems };
            }
            return order;
        }));
        showToast(`Item status updated to ${nextStatus}`);
    };

    const handleMarkAllReady = (orderId) => {
        setKitchenOrders(prev => prev.filter(o => o.id !== orderId));
        showToast(`Order ${orderId} completed and sent to servers!`);
    };

    const handleToggleUnavailable = (dishName) => {
        if (unavailableDishes.includes(dishName)) {
            setUnavailableDishes(prev => prev.filter(d => d !== dishName));
            showToast(`Dish "${dishName}" is back in stock.`);
        } else {
            setUnavailableDishes(prev => [...prev, dishName]);
            showToast(`Dish "${dishName}" marked as out of stock.`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 font-sans space-y-7">

            {/* TOAST */}
            {toast && (
                <div role="status" className="fixed top-20 right-6 z-50 bg-[#081126] text-white border border-[#DCC8A8]/40 px-5 py-3 rounded-xl shadow-xl flex items-center gap-3">
                    <CircleCheck size={18} className="text-emerald-400 shrink-0" />
                    <span className="text-sm font-semibold">{toast}</span>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-[#081126] text-white px-6 py-6 sm:px-8 rounded-2xl border border-[#DCC8A8]/20 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 relative overflow-hidden">
                <div className="absolute -top-24 -right-12 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase text-[#DCC8A8] tracking-[0.16em]">
                        <ChefHat size={15} />
                        Kitchen Display
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F2EA] mt-2">
                        Orders in Progress
                    </h1>
                    <p className="text-sm text-[#B7C0D1] mt-2">
                        Track dishes to prepare, update their status, and report unavailable items.
                    </p>
                </div>
                <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    {kitchenOrders.length} open orders
                </div>
            </div>

            {/* LIVE COOKING TICKETS GRID */}
            <div>
                <div className="flex items-end justify-between gap-3 mb-4">
                    <div>
                        <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">Orders to Prepare</h2>
                        <p className="text-sm text-slate-500 mt-1">Update each item and complete the order when the kitchen is finished.</p>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Clock3 size={14} />
                        Prioritize oldest orders
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 items-start gap-4">
                    {kitchenOrders.length === 0 ? (
                        <div className="col-span-full bg-white p-10 rounded-2xl border border-dashed border-slate-300 text-center">
                            <ChefHat size={32} className="mx-auto mb-3 text-slate-400" />
                            <p className="font-semibold text-slate-800">No pending orders</p>
                            <p className="text-sm text-slate-500 mt-1">New orders will appear here.</p>
                        </div>
                    ) : (
                        kitchenOrders.map(ticket => (
                            <div key={ticket.id} className={`w-full bg-white rounded-2xl border shadow-sm overflow-hidden ${ticket.urgent ? 'border-amber-400 ring-1 ring-amber-300' : 'border-slate-200'
                                }`}>
                                <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
                                    <div>
                                        <span className="text-[11px] font-semibold text-[#DCC8A8] font-mono">{ticket.id}</span>
                                        <h3 className="font-semibold text-base text-white mt-0.5">{ticket.table}</h3>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-full border ${ticket.urgent ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-white/10 text-slate-200 border-white/10'
                                        }`}>
                                        <Clock3 size={13} /> {ticket.timeAgo}
                                    </span>
                                </div>

                                <div className="p-4 space-y-3">
                                    {ticket.items.map(item => (
                                        <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold text-slate-900 text-sm block leading-5">{item.name}</span>
                                                    {item.note && <span className="text-xs text-amber-800 font-medium block mt-1">Note: {item.note}</span>}
                                                </div>
                                                <span className="bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded-lg shrink-0 ml-2">×{item.qty}</span>
                                            </div>

                                            <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-200/80">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.status === 'Cooking' || item.status === 'Preparing' ? 'bg-amber-100 text-amber-800' :
                                                        item.status === 'Ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                                    }`}>
                                                    {item.status === 'Pending' ? 'Pending' :
                                                        item.status === 'Cooking' ? 'Cooking' :
                                                            item.status === 'Preparing' ? 'Preparing' : 'Ready'}
                                                </span>

                                                <div className="flex gap-2">
                                                    {item.status !== 'Ready' && (
                                                        <button
                                                            onClick={() => handleUpdateItemStatus(ticket.id, item.id, item.status === 'Pending' ? 'Cooking' : 'Ready')}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${item.status === 'Pending'
                                                                    ? 'bg-amber-500 text-white hover:bg-amber-600'
                                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                                }`}
                                                        >
                                                            {item.status === 'Pending' ? <><CookingPot size={13} /> Start</> : <><CircleCheck size={13} /> Mark ready</>}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-4 pb-4">
                                    <button
                                        onClick={() => handleMarkAllReady(ticket.id)}
                                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#081126] text-[#DCC8A8] font-bold text-xs rounded-xl hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        <Send size={14} /> Complete Order & Send to Service
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* KITCHEN 86 DISHES CONTROL */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                    <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <UtensilsCrossed size={19} />
                        </div>
                        <div>
                            <h3 className="font-serif text-xl font-bold text-[#081126]">Dish Availability</h3>
                            <p className="text-sm text-slate-500 mt-1"></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 sm:pt-2">
                        <PackageCheck size={15} />
                        Report unavailable dishes to servers
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                    {['Wagyu A5 Ribeye Flambé', 'Fresh Oysters', 'Galaxy Lobster Hotpot', 'Truffle Mushroom Risotto', 'Seafood Platter'].map(dish => {
                        const is86 = unavailableDishes.includes(dish);
                        return (
                            <button
                                key={dish}
                                onClick={() => handleToggleUnavailable(dish)}
                                aria-pressed={is86}
                                className={`min-h-[76px] p-3.5 rounded-xl text-left transition cursor-pointer border flex items-start gap-3 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${is86
                                        ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 focus:ring-rose-300'
                                        : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-50 focus:ring-emerald-300'
                                    }`}
                            >
                                {is86
                                    ? <CircleX size={18} className="shrink-0 mt-0.5 text-rose-600" />
                                    : <CircleCheck size={18} className="shrink-0 mt-0.5 text-emerald-600" />}
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold leading-5">{dish}</span>
                                    <span className={`block text-[11px] font-bold uppercase tracking-wide mt-1 ${is86 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                        {is86 ? 'Out of stock · click to restore' : 'In stock · click to mark unavailable'}
                                    </span>
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
