import { useState } from 'react';

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
            showToast(`Dish "${dishName}" is back IN STOCK`);
        } else {
            setUnavailableDishes(prev => [...prev, dishName]);
            showToast(`Dish "${dishName}" marked OUT OF STOCK (86'd)`);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {/* TOAST */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="font-black text-sm">✦</span>
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-[#081126] text-white p-8 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ KITCHEN DISPLAY SYSTEM (KDS) ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Kitchen Cooking Queue & Inventory 86
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Live order tickets, dish preparation status, and inventory stock control for kitchen staff.
                    </p>
                </div>
            </div>

            {/* LIVE COOKING TICKETS GRID */}
            <div>
                <h2 className="font-serif text-2xl font-bold text-slate-900 mb-4">Active Kitchen Tickets</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {kitchenOrders.length === 0 ? (
                        <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed text-center text-slate-400">
                            <span className="text-4xl block mb-2">🧑‍🍳</span>
                            <p className="font-serif font-bold text-slate-700">Kitchen Queue is Clear!</p>
                            <p className="text-xs mt-1">All tickets served.</p>
                        </div>
                    ) : (
                        kitchenOrders.map(ticket => (
                            <div key={ticket.id} className={`bg-white rounded-3xl border shadow-lg overflow-hidden flex flex-col justify-between ${
                                ticket.urgent ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-stone-200'
                            }`}>
                                <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex justify-between items-center">
                                    <div>
                                        <span className="text-[10px] font-bold text-[#DCC8A8] font-mono">{ticket.id}</span>
                                        <h3 className="font-serif font-bold text-lg text-white">{ticket.table}</h3>
                                    </div>
                                    <span className="text-xs font-bold bg-amber-950 text-amber-300 px-3 py-1 rounded-full border border-amber-500/40">
                                        ⏱ {ticket.timeAgo}
                                    </span>
                                </div>

                                <div className="p-5 space-y-3 flex-1">
                                    {ticket.items.map(item => (
                                        <div key={item.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-bold text-slate-900 text-sm block">{item.name}</span>
                                                    {item.note && <span className="text-[10px] text-amber-700 font-bold block">📝 {item.note}</span>}
                                                </div>
                                                <span className="bg-[#081126] text-[#DCC8A8] font-black text-sm px-2.5 py-0.5 rounded-lg">x{item.qty}</span>
                                            </div>

                                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                    item.status === 'Cooking' ? 'bg-amber-100 text-amber-800' :
                                                    item.status === 'Ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                                                }`}>
                                                    {item.status}
                                                </span>

                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleUpdateItemStatus(ticket.id, item.id, 'Cooking')}
                                                        className="px-2 py-1 bg-amber-500 text-white font-bold text-[10px] uppercase rounded hover:bg-amber-600 cursor-pointer"
                                                    >
                                                        Cooking
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateItemStatus(ticket.id, item.id, 'Ready')}
                                                        className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] uppercase rounded hover:bg-emerald-700 cursor-pointer"
                                                    >
                                                        Ready
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-slate-50 border-t border-slate-100">
                                    <button
                                        onClick={() => handleMarkAllReady(ticket.id)}
                                        className="w-full py-2.5 bg-[#081126] text-[#DCC8A8] font-extrabold text-xs uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-md"
                                    >
                                        ✅ Ticket Complete & Dispatch
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* KITCHEN 86 DISHES CONTROL */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-4">
                <h3 className="font-serif text-xl font-bold text-[#081126]">Quick Inventory 86 Control</h3>
                <p className="text-xs text-slate-500">Toggle dish availability to instantly notify waiters & prevent ordering</p>

                <div className="flex flex-wrap gap-3 pt-2">
                    {['Wagyu A5 Ribeye Flambé', 'Fresh Oysters', 'Galaxy Lobster Hotpot', 'Truffle Mushroom Risotto', 'Seafood Platter'].map(dish => {
                        const is86 = unavailableDishes.includes(dish);
                        return (
                            <button
                                key={dish}
                                onClick={() => handleToggleUnavailable(dish)}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer border flex items-center gap-2 ${
                                    is86
                                        ? 'bg-rose-100 text-rose-800 border-rose-300 line-through'
                                        : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                }`}
                            >
                                <span>{is86 ? '🚫 OUT OF STOCK' : '✅ AVAILABLE'}</span>
                                <span>{dish}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
