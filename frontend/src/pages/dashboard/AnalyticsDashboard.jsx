import { useState } from 'react';

const REVENUE_STATS = {
    dailyTotal: '45,280,000 đ',
    monthlyTotal: '1,240,500,000 đ',
    ordersToday: 86,
    avgTableTurn: '1.4 hours',
    satisfactionRate: '98.5%',
};

const BEST_SELLING = [
    { rank: 1, name: 'Wagyu A5 Ribeye Flambé', sold: 142, revenue: '170,400,000 đ' },
    { rank: 2, name: 'Galaxy Lobster Hotpot', sold: 98, revenue: '176,400,000 đ' },
    { rank: 3, name: 'Truffle Mushroom Risotto', sold: 85, revenue: '38,250,000 đ' },
    { rank: 4, name: 'Gold Leaf Cocktails', sold: 210, revenue: '52,500,000 đ' },
];

const WORST_SELLING = [
    { rank: 10, name: 'Steamed Tofu Salad', sold: 4, revenue: '480,000 đ' },
    { rank: 9, name: 'Cold Tomato Soup', sold: 7, revenue: '1,050,000 đ' },
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
        showToast('Generating & Exporting PDF / Excel Analytics Report...');
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
                    📥 Export Report (PDF/Excel)
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
                            { id: 'revenue', label: '📊 Revenue & Sales' },
                            { id: 'dishes', label: '🥩 Best & Worst Dishes' },
                            { id: 'tables', label: '🪑 Table Occupancy' },
                            { id: 'staff', label: '👨‍🍳 Staff Performance' },
                            { id: 'promo', label: '🎟️ Promotion Impact' },
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
                                {t.label}
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
                            <h4 className="font-serif font-bold text-emerald-900 text-lg">🏆 Top 4 Best-Selling Dishes</h4>
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
                            <h4 className="font-serif font-bold text-rose-900 text-lg">⚠️ Lowest Selling Dishes (Needs Promotion)</h4>
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

                {reportType === 'staff' && (
                    <div className="space-y-3 text-xs">
                        <h3 className="font-serif font-bold text-xl text-slate-900">Employee Service Efficiency Ratings</h3>
                        <div className="divide-y divide-slate-100">
                            {[
                                { name: 'Staff Le Minh', role: 'Head Waiter', rating: '4.9 ⭐', orders: 42 },
                                { name: 'Chef Antoine Le', role: 'Executive Chef', rating: '5.0 ⭐', orders: 86 },
                                { name: 'Tran Hoang Nam', role: 'Senior Bartender', rating: '4.8 ⭐', orders: 35 },
                            ].map((s, idx) => (
                                <div key={idx} className="py-3 flex justify-between items-center">
                                    <div>
                                        <span className="font-bold text-slate-900">{s.name} ({s.role})</span>
                                        <span className="text-slate-400 block text-[10px]">{s.orders} tables served</span>
                                    </div>
                                    <span className="font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">{s.rating}</span>
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
                                <span className="font-mono text-emerald-700 font-bold">Used 28 times · Sales Generated: 84,000,000 đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold text-slate-800">AUTUMN500K (500k Voucher)</span>
                                <span className="font-mono text-emerald-700 font-bold">Used 12 times · Sales Generated: 42,000,000 đ</span>
                            </div>
                        </div>
                    </div>
                )}

            </div>

        </div>
    );
}
