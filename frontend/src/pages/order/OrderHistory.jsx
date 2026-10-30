import { useState } from 'react';
import IconGlyph from '../../components/common/IconGlyph';

const INITIAL_ORDER_HISTORY = [
    {
        id: 'ORD-8780',
        table: 'Table M03',
        server: 'Staff Le Minh',
        status: 'Completed',
        items: [
            { name: 'Wagyu A5 Ribeye Flambé', qty: 2, price: 1200000 },
            { name: 'Truffle Mushroom Risotto', qty: 1, price: 450000 },
            { name: 'Gold Leaf Cocktails', qty: 2, price: 250000 },
        ],
        total: 3350000,
        createdAt: '2026-10-20 19:15',
        completedAt: '2026-10-20 20:45',
        paymentMethod: 'Credit Card',
    },
    {
        id: 'ORD-8775',
        table: 'Table V01',
        server: 'Staff Nguyen An',
        status: 'Completed',
        items: [
            { name: 'Galaxy Lobster Hotpot', qty: 1, price: 1800000 },
            { name: 'Grilled King Prawns', qty: 2, price: 680000 },
        ],
        total: 3160000,
        createdAt: '2026-10-19 20:00',
        completedAt: '2026-10-19 21:30',
        paymentMethod: 'VNPay QR',
    },
    {
        id: 'ORD-8770',
        table: 'Table S04',
        server: 'Staff Le Minh',
        status: 'Cancelled',
        items: [
            { name: 'Seafood Platter', qty: 1, price: 950000 },
        ],
        total: 950000,
        createdAt: '2026-10-18 18:30',
        completedAt: null,
        paymentMethod: null,
    },
    {
        id: 'ORD-8765',
        table: 'Table M08',
        server: 'Staff Tran Hoang',
        status: 'Completed',
        items: [
            { name: 'Wagyu A5 Ribeye Flambé', qty: 1, price: 1200000 },
            { name: 'Fresh Oysters (6pc)', qty: 2, price: 750000 },
            { name: 'Champagne Rosé', qty: 1, price: 1500000 },
        ],
        total: 4200000,
        createdAt: '2026-10-17 19:00',
        completedAt: '2026-10-17 20:30',
        paymentMethod: 'Cash',
    },
    {
        id: 'ORD-8760',
        table: 'Table V02',
        server: 'Staff Le Minh',
        status: 'Completed',
        items: [
            { name: 'Truffle Mushroom Risotto', qty: 2, price: 450000 },
            { name: 'Wagyu Tartare', qty: 1, price: 890000 },
        ],
        total: 1790000,
        createdAt: '2026-10-16 19:30',
        completedAt: '2026-10-16 20:50',
        paymentMethod: 'MoMo',
    },
];

export default function OrderHistory() {
    const [orders] = useState(INITIAL_ORDER_HISTORY);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [dateFilter, setDateFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = orders.filter(o => {
        const matchStatus = statusFilter === 'All' || o.status === statusFilter;
        const matchSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
            o.server.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
    });

    const totalRevenue = orders.filter(o => o.status === 'Completed').reduce((sum, o) => sum + o.total, 0);
    const completedOrders = orders.filter(o => o.status === 'Completed').length;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {/* Header */}
            <div className="bg-[#081126] text-white p-8 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ HISTORICAL ORDER RECORDS ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Order History & Records
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Browse completed, cancelled, and past orders with full item breakdowns and payment details.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="relative z-10 flex gap-4 mt-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <span className="text-2xl font-black text-[#DCC8A8] block">{orders.length}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total Orders</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <span className="text-2xl font-black text-emerald-400 block">{completedOrders}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Completed</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <span className="text-lg font-black text-amber-400 block">{totalRevenue.toLocaleString('en-US')} VND</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total Revenue</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Search by Order ID, table, server..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DCC8A8]"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                    {['All', 'Completed', 'Cancelled'].map(st => (
                        <button
                            key={st}
                            onClick={() => setStatusFilter(st)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                statusFilter === st
                                    ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Orders List */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-serif font-bold text-[#081126]">Past Orders</h2>
                        <span className="text-xs text-slate-400 font-bold">{filtered.length} records</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filtered.map(order => (
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
                                            order.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                            'bg-rose-100 text-rose-800 border-rose-300'
                                        }`}>
                                            ● {order.status}
                                        </span>
                                    </div>
                                    <h3 className="font-serif font-bold text-slate-900 text-base mt-1">{order.table}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Server: {order.server} · {order.items.length} dishes</p>
                                </div>

                                <div className="text-right">
                                    <span className="text-base font-black text-[#081126] block">
                                        {order.total.toLocaleString('en-US')} VND
                                    </span>
                                    <span className="text-[10px] text-slate-400">{order.createdAt}</span>
                                    {order.paymentMethod && (
                                        <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 font-bold block mt-1">
                                            {order.paymentMethod}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail Panel */}
                <div>
                    {selectedOrder ? (
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-5 sticky top-20">
                            <div className="border-b border-slate-100 pb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Detail</span>
                                <h3 className="font-serif text-2xl font-bold text-[#081126] mt-0.5">{selectedOrder.table}</h3>
                                <span className="text-xs text-slate-500 font-mono">{selectedOrder.id}</span>
                            </div>

                            {/* Timing */}
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Order Placed</span>
                                    <span className="font-bold text-slate-800">{selectedOrder.createdAt}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Completed</span>
                                    <span className="font-bold text-slate-800">{selectedOrder.completedAt || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ordered Dishes</span>
                                {selectedOrder.items.map((it, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-bold text-slate-900 block">{it.name} x{it.qty}</span>
                                        </div>
                                        <span className="font-mono font-bold text-slate-800">{(it.price * it.qty).toLocaleString('en-US')} VND</span>
                                    </div>
                                ))}
                            </div>

                            {/* Total */}
                            <div className="bg-[#081126] text-white p-4 rounded-2xl flex justify-between items-center">
                                <span className="text-xs font-bold text-[#DCC8A8] uppercase">Grand Total</span>
                                <span className="text-xl font-black text-[#F5F2EA]">{selectedOrder.total.toLocaleString('en-US')} VND</span>
                            </div>

                            {/* Payment Info */}
                            {selectedOrder.paymentMethod && (
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                                    <span className="font-bold text-indigo-900 mt-0.5 block"><IconGlyph glyph="💳" size={14} /> {selectedOrder.paymentMethod}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                            <IconGlyph glyph="📜" size={36} className="mb-2" />
                            <p className="font-serif font-bold text-slate-600 text-sm">Select an order</p>
                            <p className="text-xs mt-1">to view full details & receipt</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
