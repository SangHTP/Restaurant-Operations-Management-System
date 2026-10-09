import { useState } from 'react';

const INITIAL_PROMOTIONS = [
    {
        id: 'PROMO-01',
        code: 'LUMIERE10',
        name: 'VIP Member 10% Off',
        type: 'Percentage',
        value: 10,
        minOrder: 1000000,
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        active: true,
    },
    {
        id: 'PROMO-02',
        code: 'AUTUMN500K',
        name: 'Autumn Gourmet Voucher 500k',
        type: 'FixedAmount',
        value: 500000,
        minOrder: 3000000,
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        active: true,
    },
    {
        id: 'PROMO-03',
        code: 'COCKTAILHOUR',
        name: 'Buy 1 Get 1 Gold Leaf Cocktail',
        type: 'Percentage',
        value: 50,
        minOrder: 500000,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        active: false,
    },
];

export default function PromotionManagement() {
    const [promotions, setPromotions] = useState(INITIAL_PROMOTIONS);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [toast, setToast] = useState('');

    const [formPromo, setFormPromo] = useState({
        code: '',
        name: '',
        type: 'Percentage',
        value: 15,
        minOrder: 500000,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2026-12-31',
    });

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleToggleActive = (id) => {
        setPromotions(prev => prev.map(p => {
            if (p.id === id) {
                const nextActive = !p.active;
                showToast(`Promotion "${p.code}" is now ${nextActive ? 'ACTIVE ✅' : 'INACTIVE 🚫'}`);
                return { ...p, active: nextActive };
            }
            return p;
        }));
    };

    const handleCreatePromo = (e) => {
        e.preventDefault();
        const newP = {
            id: `PROMO-${Date.now().toString().slice(-4)}`,
            ...formPromo,
            value: Number(formPromo.value),
            minOrder: Number(formPromo.minOrder),
            active: true,
        };
        setPromotions([newP, ...promotions]);
        setIsCreateModalOpen(false);
        showToast(`Created new voucher code "${newP.code}"!`);
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
                        ✦ VOUCHERS, DISCOUNTS & CAMPAIGNS ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Promotion & Voucher Management
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Create promo codes, manage discount campaigns, set minimum bill requirements, and toggle availability.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="relative z-10 px-5 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer"
                >
                    + Create New Campaign
                </button>
            </div>

            {/* PROMOTION GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {promotions.map(promo => (
                    <div key={promo.id} className={`bg-white rounded-3xl border shadow-lg overflow-hidden flex flex-col justify-between transition hover:-translate-y-1 ${
                        !promo.active ? 'opacity-60 bg-slate-50 border-slate-300' : 'border-stone-200'
                    }`}>
                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                                    🎟️ {promo.code}
                                </span>
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
                                    promo.active ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'
                                }`}>
                                    {promo.active ? '● Active' : '✕ Inactive'}
                                </span>
                            </div>

                            <div>
                                <h3 className="font-serif font-bold text-slate-900 text-lg">{promo.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Discount: <strong className="text-slate-800 font-mono">{promo.type === 'Percentage' ? `${promo.value}% OFF` : `${promo.value.toLocaleString('vi-VN')} đ OFF`}</strong>
                                </p>
                            </div>

                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1 text-xs">
                                <div className="flex justify-between text-slate-500">
                                    <span>Min Bill Amount:</span>
                                    <span className="font-mono font-bold text-slate-800">{promo.minOrder.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Valid Period:</span>
                                    <span className="font-bold text-slate-800">{promo.startDate} ~ {promo.endDate}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => handleToggleActive(promo.id)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase transition cursor-pointer border ${
                                    promo.active ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                }`}
                            >
                                {promo.active ? 'Deactivate Campaign' : 'Activate Campaign'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE PROMO MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">New Promotion Campaign</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleCreatePromo} className="space-y-4 mt-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Voucher Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. WINTER2026"
                                    value={formPromo.code}
                                    onChange={e => setFormPromo({ ...formPromo, code: e.target.value.toUpperCase() })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs uppercase font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Campaign Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Winter Seafood Feast 15% OFF"
                                    value={formPromo.name}
                                    onChange={e => setFormPromo({ ...formPromo, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Discount Type</label>
                                    <select
                                        value={formPromo.type}
                                        onChange={e => setFormPromo({ ...formPromo, type: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        <option value="Percentage">Percentage (%)</option>
                                        <option value="FixedAmount">Fixed Amount (VND)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        value={formPromo.value}
                                        onChange={e => setFormPromo({ ...formPromo, value: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Min Order Total (VND)</label>
                                <input
                                    type="number"
                                    value={formPromo.minOrder}
                                    onChange={e => setFormPromo({ ...formPromo, minOrder: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={formPromo.startDate}
                                        onChange={e => setFormPromo({ ...formPromo, startDate: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">End Date</label>
                                    <input
                                        type="date"
                                        value={formPromo.endDate}
                                        onChange={e => setFormPromo({ ...formPromo, endDate: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800">Launch Campaign</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
