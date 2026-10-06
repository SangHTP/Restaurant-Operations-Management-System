import { useState } from 'react';

const INITIAL_BILLS = [
    {
        id: 'INV-9901',
        table: 'Table M03',
        customer: 'Le Van An',
        subtotal: 2850000,
        discount: 285000, // 10% promo
        vat: 256500, // 10% VAT
        total: 2821500,
        status: 'Unpaid',
        paymentMethod: 'Pending',
        items: [
            { name: 'Wagyu A5 Ribeye Flambé', qty: 2, price: 1200000 },
            { name: 'Truffle Mushroom Risotto', qty: 1, price: 450000 },
        ],
        createdAt: '2026-10-06 20:10',
    },
    {
        id: 'INV-9902',
        table: 'Table V01',
        customer: 'Tran Thi Bich',
        subtotal: 2800000,
        discount: 0,
        vat: 280000,
        total: 3080000,
        status: 'Paid',
        paymentMethod: 'MoMo',
        items: [
            { name: 'Galaxy Lobster Hotpot', qty: 1, price: 1800000 },
            { name: 'Gold Leaf Cocktails', qty: 4, price: 250000 },
        ],
        createdAt: '2026-10-06 19:45',
    },
];

export default function BillingPayment() {
    const [bills, setBills] = useState(INITIAL_BILLS);
    const [selectedBill, setSelectedBill] = useState(bills[0]);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [cashGiven, setCashGiven] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(selectedBill?.discount || 0);
    const [toast, setToast] = useState('');
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleApplyPromo = () => {
        if (promoCode.toUpperCase() === 'LUMIERE10') {
            const discountAmount = Math.round(selectedBill.subtotal * 0.1);
            setAppliedDiscount(discountAmount);
            showToast('Applied 10% VIP Discount Code LUMIERE10!');
        } else {
            showToast('Invalid promo code');
        }
    };

    const handleProcessPayment = (e) => {
        e.preventDefault();
        const updatedTotal = selectedBill.subtotal - appliedDiscount + Math.round((selectedBill.subtotal - appliedDiscount) * 0.1);
        
        setBills(prev => prev.map(b => b.id === selectedBill.id ? {
            ...b,
            status: 'Paid',
            paymentMethod,
            discount: appliedDiscount,
            total: updatedTotal,
        } : b));

        setSelectedBill(prev => ({
            ...prev,
            status: 'Paid',
            paymentMethod,
            discount: appliedDiscount,
            total: updatedTotal,
        }));

        showToast(`Payment of ${updatedTotal.toLocaleString('vi-VN')} đ confirmed via ${paymentMethod}!`);
    };

    const calculatedChange = Math.max(0, Number(cashGiven) - (selectedBill ? selectedBill.total : 0));

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
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#DCC8A8]/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ CASH REGISTER & PAYMENT GATEWAY ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Billing & Payment Processing
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Calculate totals, apply promotions, process Cash / QR / VNPay / MoMo payments, and export receipts.
                    </p>
                </div>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* BILL LIST */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-serif font-bold text-[#081126]">Bills & Invoices</h2>
                        <span className="text-xs font-bold text-slate-400">{bills.length} bills</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {bills.map(bill => (
                            <div
                                key={bill.id}
                                onClick={() => { setSelectedBill(bill); setAppliedDiscount(bill.discount); }}
                                className={`p-5 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center ${
                                    selectedBill?.id === bill.id ? 'bg-amber-50/50 border-l-4 border-[#081126]' : ''
                                }`}
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-black text-slate-800">{bill.id}</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                            bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                                        }`}>
                                            ● {bill.status}
                                        </span>
                                    </div>
                                    <h3 className="font-serif font-bold text-slate-900 text-base mt-1">{bill.table} ({bill.customer})</h3>
                                    <span className="text-xs text-slate-400">{bill.createdAt}</span>
                                </div>

                                <div className="text-right">
                                    <span className="text-base font-black text-[#081126] block">
                                        {bill.total.toLocaleString('vi-VN')} đ
                                    </span>
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Method: {bill.paymentMethod}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* PAYMENT TERMINAL PANEL */}
                <div>
                    {selectedBill ? (
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-6 sticky top-20">
                            <div className="border-b border-slate-100 pb-4 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Terminal</span>
                                    <h3 className="font-serif text-2xl font-bold text-[#081126] mt-0.5">{selectedBill.table}</h3>
                                    <span className="text-xs text-slate-500 font-mono">{selectedBill.id}</span>
                                </div>
                                <button
                                    onClick={() => setShowReceiptModal(true)}
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
                                >
                                    🖨️ Receipt
                                </button>
                            </div>

                            {/* ITEMIZED BREAKDOWN */}
                            <div className="space-y-2 text-xs">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Items</span>
                                {selectedBill.items.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-slate-700">
                                        <span>{it.name} x{it.qty}</span>
                                        <span className="font-mono font-bold">{(it.price * it.qty).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                ))}
                            </div>

                            {/* PROMO CODE */}
                            <div className="pt-2 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Apply Promotion</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Code (e.g. LUMIERE10)"
                                        value={promoCode}
                                        onChange={e => setPromoCode(e.target.value)}
                                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs uppercase"
                                    />
                                    <button
                                        onClick={handleApplyPromo}
                                        className="px-3 py-2 bg-[#081126] text-[#DCC8A8] font-bold text-xs uppercase rounded-xl hover:bg-slate-800 cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>

                            {/* SUMMARY CALCULATION */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span className="font-mono font-bold">{selectedBill.subtotal.toLocaleString('vi-VN')} đ</span>
                                </div>
                                {appliedDiscount > 0 && (
                                    <div className="flex justify-between text-emerald-700 font-bold">
                                        <span>Discount</span>
                                        <span className="font-mono">-{appliedDiscount.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-600">
                                    <span>VAT (10%)</span>
                                    <span className="font-mono font-bold">{selectedBill.vat.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-base font-black text-[#081126] pt-2 border-t border-slate-200">
                                    <span>Grand Total</span>
                                    <span>{(selectedBill.subtotal - appliedDiscount + selectedBill.vat).toLocaleString('vi-VN')} đ</span>
                                </div>
                            </div>

                            {/* PAYMENT METHOD SELECTOR */}
                            {selectedBill.status === 'Unpaid' ? (
                                <form onSubmit={handleProcessPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Gateway</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['Cash', 'QR Code', 'VNPay', 'MoMo'].map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => setPaymentMethod(m)}
                                                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                                                        paymentMethod === m
                                                            ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]'
                                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {m === 'Cash' && '💵 Cash'}
                                                    {m === 'QR Code' && '📱 QR Code'}
                                                    {m === 'VNPay' && '💳 VNPay'}
                                                    {m === 'MoMo' && '🟣 MoMo'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {paymentMethod === 'Cash' && (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Cash Amount Received</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 3000000"
                                                value={cashGiven}
                                                onChange={e => setCashGiven(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                                            />
                                            {cashGiven && (
                                                <div className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                                                    Change Due: {calculatedChange.toLocaleString('vi-VN')} đ
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-emerald-800 transition cursor-pointer shadow-lg"
                                    >
                                        Confirm Payment & Issue Receipt
                                    </button>
                                </form>
                            ) : (
                                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-center text-emerald-800 text-xs font-bold">
                                    ✅ Paid via {selectedBill.paymentMethod}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

            </div>

            {/* RECEIPT MODAL PREVIEW */}
            {showReceiptModal && selectedBill && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-slate-900 font-mono text-xs">
                        <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
                            <h3 className="font-serif font-black text-lg text-[#081126]">Lumière RMS</h3>
                            <p className="text-[10px] text-slate-500">123 Boulevard, Can Tho</p>
                            <p className="text-[10px] font-bold">Invoice: {selectedBill.id}</p>
                        </div>

                        <div className="py-4 space-y-2 border-b border-dashed border-slate-300">
                            {selectedBill.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{it.name} x{it.qty}</span>
                                    <span>{(it.price * it.qty).toLocaleString('vi-VN')} đ</span>
                                </div>
                            ))}
                        </div>

                        <div className="py-4 space-y-1.5 border-b border-dashed border-slate-300">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{selectedBill.subtotal.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between">
                                <span>VAT 10%</span>
                                <span>{selectedBill.vat.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm pt-2">
                                <span>TOTAL</span>
                                <span>{selectedBill.total.toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-between">
                            <button onClick={() => setShowReceiptModal(false)} className="px-4 py-2 bg-slate-200 rounded-xl font-bold uppercase cursor-pointer">Close</button>
                            <button onClick={() => { window.print(); setShowReceiptModal(false); }} className="px-4 py-2 bg-[#081126] text-[#DCC8A8] rounded-xl font-bold uppercase cursor-pointer">Print PDF</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
