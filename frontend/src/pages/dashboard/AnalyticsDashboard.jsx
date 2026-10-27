import { useState } from 'react';
import IconGlyph from '../../components/common/IconGlyph';

const REVENUE_STATS = {
    dailyTotal: '45,280,000 VND',
    monthlyTotal: '1,240,500,000 VND',
    ordersToday: 86,
    avgTableTurn: '1.4 hours',
    satisfactionRate: '98.5%',
};

const BEST_SELLING = [
    { rank: 1, name: 'Wagyu A5 Ribeye Flambé', sold: 142, revenue: '170,400,000 VND' },
    { rank: 2, name: 'Galaxy Lobster Hotpot', sold: 98, revenue: '176,400,000 VND' },
    { rank: 3, name: 'Truffle Mushroom Risotto', sold: 85, revenue: '38,250,000 VND' },
    { rank: 4, name: 'Gold Leaf Cocktails', sold: 210, revenue: '52,500,000 VND' },
];

const WORST_SELLING = [
    { rank: 10, name: 'Steamed Tofu Salad', sold: 4, revenue: '480,000 VND' },
    { rank: 9, name: 'Cold Tomato Soup', sold: 7, revenue: '1,050,000 VND' },
];

const ORDER_STATUS_STATS = [
    { status: 'Completed', count: 72, share: '83.7%' },
    { status: 'In progress', count: 8, share: '9.3%' },
    { status: 'Cancelled', count: 6, share: '7.0%' },
];

const DAILY_FOOD_QUANTITIES = [
    { dish: 'Wagyu A5 Ribeye Flambé', breakfast: 12, lunch: 48, dinner: 82, total: 142 },
    { dish: 'Galaxy Lobster Hotpot', breakfast: 4, lunch: 31, dinner: 63, total: 98 },
    { dish: 'Truffle Mushroom Risotto', breakfast: 10, lunch: 37, dinner: 38, total: 85 },
    { dish: 'Gold Leaf Cocktails', breakfast: 18, lunch: 72, dinner: 120, total: 210 },
];

const SERVICE_STATUS_STATS = [
    { status: 'Waiting for kitchen', count: 3, detail: 'Orders accepted and queued' },
    { status: 'Preparing', count: 5, detail: 'Currently being prepared' },
    { status: 'Ready to serve', count: 4, detail: 'Awaiting service staff' },
    { status: 'Serving', count: 2, detail: 'Being served at tables' },
    { status: 'Completed', count: 72, detail: 'Service finished' },
];

export default function AnalyticsDashboard() {
    const [reportType, setReportType] = useState('revenue');
    const [dateRange, setDateRange] = useState('Today');
    const [toast, setToast] = useState('');

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleExportReport = () => {
        const reportRows = {
            revenue: [
                ['Metric', 'Value'],
                ['Today revenue', REVENUE_STATS.dailyTotal],
                ['Monthly revenue', REVENUE_STATS.monthlyTotal],
                ['Orders today', REVENUE_STATS.ordersToday],
            ],
            dishes: [
                ['Ranking', 'Dish', 'Quantity sold', 'Revenue'],
                ...BEST_SELLING.map((dish) => [dish.rank, dish.name, dish.sold, dish.revenue]),
                ...WORST_SELLING.map((dish) => ['Low-selling', dish.name, dish.sold, dish.revenue]),
            ],
            orders: [['Order status', 'Order count', 'Share'], ...ORDER_STATUS_STATS.map((row) => [row.status, row.count, row.share])],
            tables: [
                ['Dining area', 'Occupancy'],
                ['Main Dining Hall', '85%'],
                ['VIP Garden Lounge', '100%'],
                ['Sky Bar Terrace', '60%'],
            ],
            quantities: [
                ['Dish', 'Breakfast', 'Lunch', 'Dinner', 'Total portions'],
                ...DAILY_FOOD_QUANTITIES.map((row) => [row.dish, row.breakfast, row.lunch, row.dinner, row.total]),
            ],
            service: [['Service status', 'Orders', 'Description'], ...SERVICE_STATUS_STATS.map((row) => [row.status, row.count, row.detail])],
            staff: [
                ['Employee', 'Position', 'Tables served', 'Rating'],
                ['Staff Le Minh', 'Head Waiter', 42, 4.9],
                ['Chef Antoine Le', 'Executive Chef', 86, 5.0],
                ['Tran Hoang Nam', 'Senior Bartender', 35, 4.8],
            ],
            promo: [
                ['Promotion', 'Uses', 'Sales generated'],
                ['LUMIERE10 (VIP 10% OFF)', 28, '84,000,000 VND'],
                ['AUTUMN500K (500k Voucher)', 12, '42,000,000 VND'],
            ],
        };
        const escapeCsv = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
        const csv = reportRows[reportType].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
        const file = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `lumiere-${reportType}-${dateRange.toLowerCase()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        showToast('Report exported as CSV.');
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
                        ✦ EXECUTIVE BUSINESS INTELLIGENCE ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Business Dashboard & Reporting
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Track revenue reports, dish leaderboards, order statistics, table usage, and staff efficiency.
                    </p>
                </div>

                <button
                    onClick={handleExportReport}
                    className="relative z-10 px-5 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer flex items-center gap-2"
                >
                    <IconGlyph glyph="📥" size={15} /> Export Report (CSV)
                </button>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                    { label: 'Today Revenue', val: REVENUE_STATS.dailyTotal, sub: '▲ 14% vs yesterday', color: 'text-[#081126]' },
                    { label: 'Monthly Revenue', val: REVENUE_STATS.monthlyTotal, sub: 'Target: 1.5B VND', color: 'text-amber-900' },
                    { label: 'Total Orders', val: REVENUE_STATS.ordersToday, sub: '86 completed bills', color: 'text-emerald-700' },
                    { label: 'Avg Table Turnover', val: REVENUE_STATS.avgTableTurn, sub: 'Optimal occupancy', color: 'text-indigo-900' },
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{kpi.label}</span>
                        <div className={`text-2xl font-black ${kpi.color} mt-2`}>{kpi.val}</div>
                        <span className="text-xs font-bold text-slate-500 mt-1 block">{kpi.sub}</span>
                    </div>
                ))}
            </div>

            {/* REPORT SELECTION TABS */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="flex gap-2 overflow-x-auto">
                        {[
                            { id: 'revenue', label: 'Revenue & Sales', icon: '📊' },
                            { id: 'dishes', label: 'Best & Worst Dishes', icon: '🥩' },
                            { id: 'orders', label: 'Order Statistics', icon: '🧾' },
                            { id: 'tables', label: 'Table Occupancy', icon: '🪑' },
                            { id: 'quantities', label: 'Daily Food Quantity', icon: '🍽️' },
                            { id: 'service', label: 'Service Status', icon: '🛎️' },
                            { id: 'staff', label: 'Staff Performance', icon: '👨‍🍳' },
                            { id: 'promo', label: 'Promotion Impact', icon: '🎟️' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setReportType(t.id)}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                                    reportType === t.id
                                        ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <><IconGlyph glyph={t.icon} size={14} /> {t.label}</>
                            </button>
                        ))}
                    </div>

                    <select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    >
                        <option value="Today">Today</option>
                        <option value="ThisWeek">This Week</option>
                        <option value="ThisMonth">This Month</option>
                        <option value="ThisYear">This Year</option>
                    </select>
                </div>

                {/* TAB DETAILS */}
                {reportType === 'revenue' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-serif font-bold text-xl text-slate-900">Hourly Revenue Performance</h3>
                                <p className="text-xs text-slate-500">Real-time sales distribution across dining service hours</p>
                            </div>
                            <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                                Peak Hour: 20:00 (100% Capacity)
                            </span>
                        </div>
                        <div className="grid grid-cols-6 gap-4 pt-10 pb-4 items-end h-64 bg-[#081126] p-6 rounded-3xl border border-[#DCC8A8]/30 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                            {[
                                { hour: '11:00', val: 30, amount: '13.5M' },
                                { hour: '13:00', val: 75, amount: '33.9M' },
                                { hour: '15:00', val: 20, amount: '9.0M' },
                                { hour: '18:00', val: 95, amount: '43.0M' },
                                { hour: '20:00', val: 100, amount: '45.2M' },
                                { hour: '22:00', val: 50, amount: '22.6M' },
                            ].map((bar, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative z-10">
                                    <span className="text-[10px] font-black text-[#DCC8A8] opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all font-mono">
                                        {bar.amount}
                                    </span>
                                    <div className="w-full max-w-[48px] bg-slate-800/60 rounded-2xl h-full flex items-end p-1 border border-white/10 group-hover:border-[#DCC8A8]/60 transition-colors">
                                        <div
                                            className="w-full bg-gradient-to-t from-amber-600 via-[#DCC8A8] to-amber-200 rounded-xl transition-all duration-500 shadow-[0_0_12px_rgba(220,200,168,0.3)] group-hover:shadow-[0_0_20px_rgba(220,200,168,0.7)] group-hover:brightness-125"
                                            style={{ height: `${bar.val}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-300 font-mono mt-1">{bar.hour}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {reportType === 'dishes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                            <h4 className="font-serif font-bold text-emerald-900 text-lg"><IconGlyph glyph="🏆" size={18} /> Top 4 Best-Selling Dishes</h4>
                            <div className="divide-y divide-slate-200">
                                {BEST_SELLING.map(d => (
                                    <div key={d.rank} className="py-2.5 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-bold text-slate-900">{d.rank}. {d.name}</span>
                                            <span className="text-slate-400 block text-[10px]">{d.sold} portions ordered</span>
                                        </div>
                                        <span className="font-mono font-bold text-emerald-800">{d.revenue}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                            <h4 className="font-serif font-bold text-rose-900 text-lg"><IconGlyph glyph="⚠️" size={18} /> Lowest Selling Dishes (Needs Promotion)</h4>
                            <div className="divide-y divide-slate-200">
                                {WORST_SELLING.map(d => (
                                    <div key={d.rank} className="py-2.5 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-bold text-slate-900">{d.name}</span>
                                            <span className="text-slate-400 block text-[10px]">{d.sold} portions ordered</span>
                                        </div>
                                        <span className="font-mono font-bold text-rose-800">{d.revenue}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'orders' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-serif text-xl font-bold text-slate-900">Order Statistics</h3>
                            <p className="text-xs text-slate-500">Order volume and distribution for the selected reporting period</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            {ORDER_STATUS_STATS.map((row) => (
                                <div key={row.status} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{row.status}</span>
                                    <div className="mt-2 flex items-end justify-between">
                                        <span className="text-3xl font-black text-[#081126]">{row.count}</span>
                                        <span className="text-sm font-semibold text-slate-500">{row.share}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {reportType === 'tables' && (
                    <div className="space-y-3 text-xs">
                        <h3 className="font-serif font-bold text-xl text-slate-900">Table Usage Statistics</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                                <span className="text-slate-400 font-bold block uppercase text-[10px]">Main Dining Hall Occupancy</span>
                                <span className="text-2xl font-black text-[#081126] mt-1 block">85%</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                                <span className="text-slate-400 font-bold block uppercase text-[10px]">VIP Garden Lounge Occupancy</span>
                                <span className="text-2xl font-black text-amber-900 mt-1 block">100%</span>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                                <span className="text-slate-400 font-bold block uppercase text-[10px]">Sky Bar Terrace Occupancy</span>
                                <span className="text-2xl font-black text-indigo-900 mt-1 block">60%</span>
                            </div>
                        </div>
                    </div>
                )}

                {reportType === 'quantities' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-serif text-xl font-bold text-slate-900">Daily Food Quantity Report</h3>
                            <p className="text-xs text-slate-500">Portions sold by dish and meal period</p>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200">
                            <table className="w-full min-w-[640px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Dish</th>
                                        <th className="px-4 py-3 text-right">Breakfast</th>
                                        <th className="px-4 py-3 text-right">Lunch</th>
                                        <th className="px-4 py-3 text-right">Dinner</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {DAILY_FOOD_QUANTITIES.map((row) => (
                                        <tr key={row.dish}>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{row.dish}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{row.breakfast}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{row.lunch}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">{row.dinner}</td>
                                            <td className="px-4 py-3 text-right font-bold text-[#081126]">{row.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {reportType === 'service' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-serif text-xl font-bold text-slate-900">Service Status Report</h3>
                            <p className="text-xs text-slate-500">Current order flow across kitchen and table service</p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {SERVICE_STATUS_STATS.map((row) => (
                                <div key={row.status} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div>
                                        <p className="font-bold text-slate-800">{row.status}</p>
                                        <p className="mt-1 text-xs text-slate-500">{row.detail}</p>
                                    </div>
                                    <span className="rounded-xl bg-white px-3 py-2 text-lg font-black text-[#081126] shadow-sm">{row.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {reportType === 'staff' && (
                    <div className="space-y-3 text-xs">
                        <h3 className="font-serif font-bold text-xl text-slate-900">Employee Service Efficiency Ratings</h3>
                        <div className="divide-y divide-slate-100">
                            {[
                                { name: 'Staff Le Minh', role: 'Head Waiter', rating: 4.9, orders: 42 },
                                { name: 'Chef Antoine Le', role: 'Executive Chef', rating: 5.0, orders: 86 },
                                { name: 'Tran Hoang Nam', role: 'Senior Bartender', rating: 4.8, orders: 35 },
                            ].map((s, idx) => (
                                <div key={idx} className="py-3 flex justify-between items-center">
                                    <div>
                                        <span className="font-bold text-slate-900">{s.name} ({s.role})</span>
                                        <span className="text-slate-400 block text-[10px]">{s.orders} tables served</span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">{s.rating} <IconGlyph glyph="⭐" size={13} /></span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {reportType === 'promo' && (
                    <div className="space-y-3 text-xs">
                        <h3 className="font-serif font-bold text-xl text-slate-900">Promotion Effectiveness Report</h3>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-800">LUMIERE10 (VIP 10% OFF)</span>
                                <span className="font-mono text-emerald-700 font-bold">Used 28 times · Sales Generated: 84,000,000 VND</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-800">AUTUMN500K (500k Voucher)</span>
                                <span className="font-mono text-emerald-700 font-bold">Used 12 times · Sales Generated: 42,000,000 VND</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>

        </div>
    );
}
