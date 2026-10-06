import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const INITIAL_ORDERS = [
    {
        id: 'ORD-8801',
        table: 'Table M03',
        server: 'Staff Le Minh',
        status: 'SentToKitchen',
        items: [
            { id: 'item-1', name: 'Wagyu A5 Ribeye Flambé', qty: 2, price: 1200000, note: 'Medium-rare', available: true },
            { id: 'item-2', name: 'Truffle Mushroom Risotto', qty: 1, price: 450000, note: 'Extra parmesan', available: true },
        ],
        total: 2850000,
        createdAt: '19:15',
    },
    {
        id: 'ORD-8802',
        table: 'Table V01',
        server: 'Staff Nguyen An',
        status: 'ReadyToServe',
        items: [
            { id: 'item-3', name: 'Galaxy Lobster Hotpot', qty: 1, price: 1800000, note: 'Spicy broth', available: true },
            { id: 'item-4', name: 'Gold Leaf Cocktails', qty: 4, price: 250000, note: 'Less ice', available: true },
        ],
        total: 2800000,
        createdAt: '19:30',
    },
    {
        id: 'ORD-8803',
        table: 'Table S04',
        server: 'Staff Le Minh',
        status: 'Draft',
        items: [
            { id: 'item-5', name: 'Seafood Platter', qty: 1, price: 950000, note: '', available: false }, // Unavailable dish example
        ],
        total: 950000,
        createdAt: '19:42',
    },
];

export default function OrderManagement() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState(INITIAL_ORDERS);
    const [selectedOrder, setSelectedOrder] = useState(orders[0]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleSendToKitchen = (orderId) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'SentToKitchen' } : o));
        setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: 'SentToKitchen' } : prev);
        showToast(`Order ${orderId} sent to Kitchen KDS station!`);
    };

    const handleUpdateStatus = (orderId, newStatus) => {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status: newStatus } : prev);
        showToast(`Order ${orderId} status → ${newStatus}`);
    };

    const handleToggleItemAvailability = (orderId, itemId) => {
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const updatedItems = o.items.map(it => it.id === itemId ? { ...it, available: !it.available } : it);
                return { ...o, items: updatedItems };
            }
            return o;
        }));
        setSelectedOrder(prev => {
            if (prev?.id === orderId) {
                return {
                    ...prev,
                    items: prev.items.map(it => it.id === itemId ? { ...it, available: !it.available } : it)
                };
            }
            return prev;
        });
        showToast(`Dish availability toggled for Order ${orderId}`);
    };

    const filteredOrders = orders.filter(o => filterStatus === 'All' || o.status === filterStatus);

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
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ LIVE RESTAURANT ORDERS & DISPATCH ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Order Management & Status Tracking
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Track table orders, dispatch items to kitchen queue, and handle unavailable dishes.
                    </p>
                </div>
            </div>

            {/* FILTER TOOLBAR */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['All', 'Draft', 'SentToKitchen', 'ReadyToServe', 'Completed', 'Cancelled'].map(st => (
                    <button
                        key={st}
                        onClick={() => setFilterStatus(st)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            filterStatus === st
                                ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {st}
                    </button>
                ))}
            </div>

            {/* GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ORDERS LIST */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-serif font-bold text-[#081126]">Active Orders Queue</h2>
                        <span className="text-xs font-bold text-slate-400">{filteredOrders.length} orders</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredOrders.map(order => (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className={`p-5 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center ${
                                    selectedOrder?.id === order.id ? 'bg-amber-50/50 border-l-4 border-[#081126]' : ''
                                }`}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-black text-slate-800">{order.id}</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            order.status === 'SentToKitchen' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                            order.status === 'ReadyToServe' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                            'bg-slate-100 text-slate-700 border-slate-200'
                                        }`}>
                                            ● {order.status}
                                        </span>
                                    </div>
                                    <h3 className="font-serif font-bold text-slate-900 text-base mt-1">{order.table}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Assigned: {order.server} · {order.items.length} dishes</p>
                                </div>

                                <div className="text-right">
                                    <span className="text-base font-black text-[#081126] block">
                                        {order.total.toLocaleString('vi-VN')} đ
                                    </span>
                                    <span className="text-[10px] text-slate-400">Time: {order.createdAt}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ORDER DETAIL & ACTION PANEL */}
                <div>
                    {selectedOrder ? (
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-6 sticky top-20">
                            <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Detail</span>
                                    <h3 className="font-serif text-2xl font-bold text-[#081126] mt-0.5">{selectedOrder.table}</h3>
                                    <span className="text-xs text-slate-500 font-mono">{selectedOrder.id}</span>
                                </div>
                            </div>

                            {/* DISH ITEMS */}
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ordered Dishes</span>
                                {selectedOrder.items.map(it => (
                                    <div key={it.id} className={`p-3 rounded-2xl border text-xs flex justify-between items-center ${
                                        !it.available ? 'bg-rose-50 border-rose-200 opacity-80' : 'bg-slate-50 border-slate-200'
                                    }`}>
                                        <div>
                                            <span className="font-bold text-slate-900 block">{it.name} x{it.qty}</span>
                                            {it.note && <span className="text-[10px] text-amber-700 block">📝 {it.note}</span>}
                                            {!it.available && <span className="text-[10px] font-bold text-rose-600 block">⚠️ Dish Out of Stock</span>}
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <span className="font-mono font-bold text-slate-800">{(it.price * it.qty).toLocaleString('vi-VN')} đ</span>
                                            <button
                                                onClick={() => handleToggleItemAvailability(selectedOrder.id, it.id)}
                                                className="text-[9px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-0.5 rounded cursor-pointer"
                                            >
                                                {it.available ? 'Mark Unavailable' : 'Restore Stock'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* TOTAL */}
                            <div className="bg-[#081126] text-white p-4 rounded-2xl flex justify-between items-center">
                                <span className="text-xs font-bold text-[#DCC8A8] uppercase">Grand Total</span>
                                <span className="text-xl font-black text-[#F5F2EA]">{selectedOrder.total.toLocaleString('vi-VN')} đ</span>
                            </div>

                            {/* ACTIONS */}
                            <div className="space-y-2 pt-2">
                                {selectedOrder.status === 'Draft' && (
                                    <button
                                        onClick={() => handleSendToKitchen(selectedOrder.id)}
                                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-extrabold text-xs uppercase rounded-xl hover:bg-amber-800 transition cursor-pointer shadow-md"
                                    >
                                        🚀 Send Order to Kitchen
                                    </button>
                                )}
                                {selectedOrder.status === 'SentToKitchen' && (
                                    <button
                                        onClick={() => handleUpdateStatus(selectedOrder.id, 'ReadyToServe')}
                                        className="w-full py-3 bg-emerald-700 text-white font-extrabold text-xs uppercase rounded-xl hover:bg-emerald-800 transition cursor-pointer shadow-md"
                                    >
                                        🔔 Mark Ready to Serve
                                    </button>
                                )}
                                <button
                                    onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}
                                    className="w-full py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs uppercase rounded-xl hover:bg-rose-100 transition cursor-pointer"
                                >
                                    Cancel Order
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                            <span className="text-4xl block mb-2">🍽️</span>
                            <p className="font-serif font-bold text-slate-600 text-sm">Select an order</p>
                            <p className="text-xs mt-1">to view details & manage items</p>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}
