import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import IconGlyph from '../../components/common/IconGlyph';
import { useAuth } from '../../context/AuthContext';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5249/api';
const API_BILL_URL = `${BASE_URL}/Bill`;
const API_PROMO_URL = `${BASE_URL}/Promotion`;

const RESTAURANT_PAYMENT_CONFIG = {
    bankId: 'BIDV',
    accountNo: '7302053542',
    accountName: 'TRAN LE GIA HUY',
    momoPhone: '0373719399',
};

export default function BillingPayment() {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('pending');
    const [pendingOrders, setPendingOrders] = useState([]);
    const [paidBills, setPaidBills] = useState([]);
    const [loading, setLoading] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState(null);

    // STATE CHO PHẦN BILL DETAIL
    const [selectedBillDetail, setSelectedBillDetail] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Thanh toán
    const [paymentMethod, setPaymentMethod] = useState('VietQR');
    const [cashGiven, setCashGiven] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'info' });

    const [vnpayQrCode, setVnpayQrCode] = useState('');
    const [receiptData, setReceiptData] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: 'info' }), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const resPending = await fetch(`${API_BILL_URL}/pending-orders`);
            if (resPending.ok) {
                const dataPending = await resPending.json();
                setPendingOrders(dataPending);
                if (dataPending.length > 0 && !selectedOrder) {
                    setSelectedOrder(dataPending[0]);
                }
            }

            const resPaid = await fetch(API_BILL_URL);
            if (resPaid.ok) {
                const dataPaid = await resPaid.json();
                setPaidBills(dataPaid);
            }
        } catch (error) {
            showToast('Lỗi tải dữ liệu: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenBillDetail = async (billId) => {
        try {
            const res = await fetch(`${API_BILL_URL}/${billId}`);
            if (!res.ok) throw new Error('Không thể tải chi tiết hóa đơn');
            const data = await res.json();
            setSelectedBillDetail(data);
            setShowDetailModal(true); 
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const subtotal = selectedOrder ? Number(selectedOrder.subTotal || 0) : 0;
    const discountAmount = appliedPromo ? Number(appliedPromo.discountAmount || 0) : 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const vatAmount = Math.round(taxableAmount * 0.08);
    const grandTotal = taxableAmount + vatAmount;
    const calculatedChange = Math.max(0, Number(cashGiven || 0) - grandTotal);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) {
            showToast('Vui lòng nhập mã khuyến mãi!', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_PROMO_URL}/check-apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: promoCode.trim().toUpperCase(),
                    orderAmount: subtotal
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Mã không hợp lệ');

            setAppliedPromo(data);
            showToast(`Áp dụng thành công mã ${data.code}: Giảm ${Number(data.discountAmount).toLocaleString('vi-VN')} đ`, 'success');
        } catch (error) {
            setAppliedPromo(null);
            showToast(error.message, 'error');
        }
    };

    const dynamicVietQrUrl = selectedOrder && grandTotal > 0
        ? `https://img.vietqr.io/image/${RESTAURANT_PAYMENT_CONFIG.bankId}-${RESTAURANT_PAYMENT_CONFIG.accountNo}-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(`HD ${selectedOrder.orderID} BAN ${selectedOrder.tableName}`)}&accountName=${encodeURIComponent(RESTAURANT_PAYMENT_CONFIG.accountName)}`
        : '';

    const dynamicMomoQrUrl = selectedOrder && grandTotal > 0
        ? `https://img.vietqr.io/image/971025-${RESTAURANT_PAYMENT_CONFIG.momoPhone}-compact2.png?amount=${grandTotal}&addInfo=${encodeURIComponent(`HD ${selectedOrder.orderID} BAN ${selectedOrder.tableName}`)}&accountName=${encodeURIComponent(RESTAURANT_PAYMENT_CONFIG.accountName)}`
        : '';

    useEffect(() => {
        if (paymentMethod === 'VNPay' && selectedOrder && grandTotal > 0) {
            const vnpayPayload = JSON.stringify({
                service: 'VNPAY-QR',
                merchant: 'LUMIERE RESTAURANT',
                orderId: selectedOrder.orderID,
                amount: grandTotal,
                note: `HD ${selectedOrder.orderID}`
            });
            QRCode.toDataURL(vnpayPayload, { width: 220, margin: 2, color: { dark: '#005BAA', light: '#FFFFFF' } })
                .then(url => setVnpayQrCode(url))
                .catch(() => setVnpayQrCode(''));
        }
    }, [paymentMethod, selectedOrder, grandTotal]);

    const handleProcessPayment = async (e) => {
        e.preventDefault();

        const employeeID = Number(currentUser?.employeeId);
        if (!Number.isInteger(employeeID) || employeeID <= 0) {
            showToast('Vui lòng đăng nhập bằng tài khoản nhân viên trước khi thanh toán.', 'error');
            return;
        }

        if (paymentMethod === 'Cash' && Number(cashGiven) < grandTotal) {
            showToast('Số tiền khách đưa chưa đủ để thanh toán!', 'error');
            return;
        }

        try {
            const payload = {
                orderID: selectedOrder.orderID,
                promotionCode: appliedPromo ? appliedPromo.code : null,
                employeeID,
                paymentMethod: paymentMethod,
                transactionNo: `${paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`
            };

            const res = await fetch(API_BILL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Thanh toán thất bại');

            showToast(`Đã thanh toán thành công qua ${paymentMethod}!`, 'success');

            setReceiptData({
                billID: data.billID,
                transactionNo: data.transactionNo,
                orderID: selectedOrder.orderID,
                tableName: selectedOrder.tableName,
                items: selectedOrder.items,
                subTotal: subtotal,
                discountAmount: discountAmount,
                taxAmount: vatAmount,
                finalAmount: grandTotal,
                paymentMethod: paymentMethod,
                createdAt: new Date().toLocaleString('vi-VN')
            });

            setShowReceiptModal(true);
            setPromoCode('');
            setAppliedPromo(null);
            setCashGiven('');
            setSelectedOrder(null);
            fetchData();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {toast.message && (
                <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error' ? 'bg-rose-950 text-rose-200 border-rose-500/50' : 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]/40'
                    }`}>
                    <span className="font-black text-sm">{toast.type === 'error' ? '⚠️' : '✦'}</span>
                    <span className="text-xs font-bold">{toast.message}</span>
                </div>
            )}

            <div className="bg-[#081126] text-white p-8 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#DCC8A8]/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ CASH REGISTER & BILL MANAGEMENT ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Billing & Payment Processing
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Quản lý hóa đơn, xem chi tiết món ăn, áp dụng khuyến mãi và thanh toán tự động.
                    </p>
                </div>

                <div className="relative z-10 flex bg-white/10 p-1.5 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${activeTab === 'pending' ? 'bg-[#DCC8A8] text-[#081126] shadow-lg' : 'text-slate-300 hover:text-white'
                            }`}
                    >
                        Chờ thanh toán ({pendingOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('paid')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer ${activeTab === 'paid' ? 'bg-[#DCC8A8] text-[#081126] shadow-lg' : 'text-slate-300 hover:text-white'
                            }`}
                    >
                        Đã xuất hóa đơn ({paidBills.length})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-serif font-bold text-[#081126]">
                                {activeTab === 'pending' ? 'Bàn chờ lập hóa đơn' : 'Lịch sử hóa đơn đã thanh toán'}
                            </h2>
                            <span className="text-xs font-bold text-slate-400">
                                {activeTab === 'pending' ? `${pendingOrders.length} đơn` : `${paidBills.length} hóa đơn`}
                            </span>
                        </div>

                        {loading && <div className="text-center py-12 text-slate-400 text-xs">Đang tải dữ liệu...</div>}

                        {activeTab === 'pending' && !loading && (
                            <div className="divide-y divide-slate-100">
                                {pendingOrders.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400 text-xs">Hiện không có bàn nào đang chờ thanh toán.</div>
                                ) : (
                                    pendingOrders.map(order => (
                                        <div
                                            key={order.orderID}
                                            onClick={() => { setSelectedOrder(order); setAppliedPromo(null); setPromoCode(''); }}
                                            className={`p-5 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center ${selectedOrder?.orderID === order.orderID ? 'bg-amber-50/60 border-l-4 border-[#081126]' : ''
                                                }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-black text-slate-800">Order #{order.orderID}</span>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-300">
                                                        ● {order.status}
                                                    </span>
                                                </div>
                                                <h3 className="font-serif font-bold text-slate-900 text-base mt-1">{order.tableName}</h3>
                                                <span className="text-xs text-slate-400">{new Date(order.orderTime).toLocaleString('vi-VN')}</span>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-base font-black text-[#081126] block">
                                                    {Number(order.subTotal).toLocaleString('vi-VN')} đ
                                                </span>
                                                <span className="text-[10px] text-slate-400 uppercase font-bold">{order.items?.length || 0} món</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'paid' && !loading && (
                            <div className="divide-y divide-slate-100">
                                {paidBills.length === 0 ? (
                                    <div className="text-center py-16 text-slate-400 text-xs">Chưa có hóa đơn nào được lưu.</div>
                                ) : (
                                    paidBills.map(bill => (
                                        <div key={bill.billID} className="p-5 hover:bg-slate-50 transition flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-black text-slate-800">HD-{String(bill.billID).padStart(4, '0')}</span>
                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300">
                                                        ● Đã thanh toán
                                                    </span>
                                                    {bill.promotionCode && (
                                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                                                            🎟️ {bill.promotionCode}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-serif font-bold text-slate-900 text-sm mt-1">Đơn hàng #{bill.orderID}</h3>
                                                <span className="text-xs text-slate-400">{new Date(bill.createdAt).toLocaleString('vi-VN')}</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <span className="text-base font-black text-emerald-700 block">
                                                        {Number(bill.finalAmount).toLocaleString('vi-VN')} đ
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Thuế: {Number(bill.taxAmount).toLocaleString('vi-VN')} đ</span>
                                                </div>

                                                <button
                                                    onClick={() => handleOpenBillDetail(bill.billID)}
                                                    className="px-3 py-2 bg-slate-100 hover:bg-[#081126] text-slate-700 hover:text-[#DCC8A8] text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer flex items-center gap-1 shadow-sm"
                                                >
                                                    👁️ Chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    {activeTab === 'pending' && selectedOrder && (
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-5 sticky top-20">
                            <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Terminal</span>
                                    <h3 className="font-serif text-2xl font-bold text-[#081126] mt-0.5">{selectedOrder.tableName}</h3>
                                    <span className="text-xs text-slate-500 font-mono">Order #{selectedOrder.orderID}</span>
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Món đã phục vụ</span>
                                {selectedOrder.items?.map((it, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-slate-700">
                                        <span>{it.itemName} <strong className="text-slate-900">x{it.quantity}</strong></span>
                                        <span className="font-mono font-bold">{Number(it.total).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-2 border-t border-slate-100">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã giảm giá</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="VD: LUMIERE10"
                                        value={promoCode}
                                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyPromo}
                                        className="px-3 py-2 bg-[#081126] text-[#DCC8A8] font-bold text-xs uppercase rounded-xl hover:bg-slate-800 cursor-pointer"
                                    >
                                        Áp dụng
                                    </button>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600">
                                    <span>Tiền món (Subtotal)</span>
                                    <span className="font-mono font-bold">{subtotal.toLocaleString('vi-VN')} đ</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-700 font-bold">
                                        <span>Giảm giá ({appliedPromo?.code})</span>
                                        <span className="font-mono">-{discountAmount.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-600">
                                    <span>Thuế VAT (8%)</span>
                                    <span className="font-mono font-bold">{vatAmount.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-base font-black text-[#081126] pt-2 border-t border-slate-200">
                                    <span>Tổng thanh toán</span>
                                    <span className="text-emerald-700">{grandTotal.toLocaleString('vi-VN')} đ</span>
                                </div>
                            </div>

                            <form onSubmit={handleProcessPayment} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Phương thức thanh toán</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'VietQR', name: 'VietQR (Bank)', icon: '📱' },
                                            { id: 'MoMo', name: 'Ví MoMo', icon: '👛' },
                                            { id: 'VNPay', name: 'VNPay-QR', icon: '💳' },
                                            { id: 'Cash', name: 'Tiền mặt', icon: '💵' },
                                        ].map(m => (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => setPaymentMethod(m.id)}
                                                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${paymentMethod === m.id ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8] shadow' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <span>{m.icon}</span>
                                                <span>{m.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {paymentMethod === 'VietQR' && (
                                    <div className="rounded-2xl border-2 border-sky-300 bg-sky-50/50 p-4 text-center space-y-3">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[11px] font-black text-[#081126] uppercase">VietQR • Tự điền tiền 100%</span>
                                            <span className="text-[10px] bg-sky-200 text-sky-800 font-bold px-2 py-0.5 rounded-full">Napas 24/7</span>
                                        </div>
                                        {dynamicVietQrUrl && (
                                            <div className="bg-white p-2.5 rounded-2xl border border-sky-100 shadow-md inline-block">
                                                <img src={dynamicVietQrUrl} alt="VietQR" className="mx-auto h-52 rounded-xl" />
                                            </div>
                                        )}
                                        <div className="text-xs text-slate-700 space-y-0.5 font-mono">
                                            <p className="font-bold text-slate-900">{RESTAURANT_PAYMENT_CONFIG.accountName}</p>
                                            <p className="text-slate-500">{RESTAURANT_PAYMENT_CONFIG.bankId} • {RESTAURANT_PAYMENT_CONFIG.accountNo}</p>
                                            <p className="text-base font-black text-emerald-700 pt-1 font-sans">
                                                Số tiền: {grandTotal.toLocaleString('vi-VN')} đ
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'MoMo' && (
                                    <div className="rounded-2xl border-2 border-pink-300 bg-pink-50/50 p-4 text-center space-y-3">
                                        <div className="flex items-center justify-between px-2">
                                            <span className="text-[11px] font-black text-[#A50064] uppercase">MoMo • Tự điền tiền 100%</span>
                                            <span className="text-[10px] bg-pink-200 text-[#A50064] font-bold px-2 py-0.5 rounded-full">Ví Điện Tử</span>
                                        </div>
                                        {dynamicMomoQrUrl && (
                                            <div className="bg-white p-2.5 rounded-2xl border border-pink-100 shadow-md inline-block">
                                                <img src={dynamicMomoQrUrl} alt="MoMo QR" className="mx-auto h-52 rounded-xl" />
                                            </div>
                                        )}
                                        <div className="text-xs text-slate-700 space-y-0.5 font-mono">
                                            <p className="font-bold text-[#A50064]">Ví MoMo: {RESTAURANT_PAYMENT_CONFIG.momoPhone}</p>
                                            <p className="font-bold text-slate-900">{RESTAURANT_PAYMENT_CONFIG.accountName}</p>
                                            <p className="text-base font-black text-[#A50064] pt-1 font-sans">
                                                Số tiền: {grandTotal.toLocaleString('vi-VN')} đ
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'VNPay' && (
                                    <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-center space-y-2">
                                        <span className="text-xs font-black text-[#005BAA] uppercase block">Cổng thanh toán VNPAY-QR</span>
                                        {vnpayQrCode ? (
                                            <img src={vnpayQrCode} alt="VNPay QR" className="mx-auto h-48 w-48 rounded-xl border border-blue-300 bg-white p-2 shadow-sm" />
                                        ) : (
                                            <div className="py-12 text-xs text-slate-400">Đang khởi tạo VNPay...</div>
                                        )}
                                        <p className="text-sm font-black text-[#005BAA] font-sans">Số tiền: {grandTotal.toLocaleString('vi-VN')} đ</p>
                                    </div>
                                )}

                                {paymentMethod === 'Cash' && (
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase">Tiền khách đưa (VND)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder={`Tối thiểu ${grandTotal}`}
                                            value={cashGiven}
                                            onChange={e => setCashGiven(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold"
                                        />
                                        {cashGiven && (
                                            <div className="text-xs font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex justify-between">
                                                <span>Tiền thối lại:</span>
                                                <span className="font-mono">{calculatedChange.toLocaleString('vi-VN')} đ</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-emerald-800 transition cursor-pointer shadow-lg"
                                >
                                    Xác nhận thanh toán & Xuất hóa đơn
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'paid' && (
                        <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-400 text-xs">
                            💡 Chọn bấm nút <strong className="text-slate-700">👁️ Chi tiết</strong> trên bất kỳ hóa đơn nào ở bảng bên trái để xem đầy đủ thông tin
                        </div>
                    )}
                </div>

            </div>

            {showDetailModal && selectedBillDetail && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 text-slate-900 space-y-5 animate-in fade-in zoom-in duration-200">
                        {/* Header Modal */}
                        <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                            <div>
                                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                                    ✦ CHI TIẾT HÓA ĐƠN HOÀN TẤT ✦
                                </span>
                                <h3 className="font-serif text-2xl font-bold text-[#081126] mt-0.5">
                                    {selectedBillDetail.InvoiceCode || `HD-${String(selectedBillDetail.billID).padStart(4, '0')}`}
                                </h3>
                                <p className="text-xs text-slate-400">Thời gian tạo: {new Date(selectedBillDetail.createdAt).toLocaleString('vi-VN')}</p>
                            </div>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer transition"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                            <div>
                                <span className="text-slate-400 block text-[10px] uppercase font-bold">Bàn phục vụ:</span>
                                <strong className="text-slate-800 text-sm">{selectedBillDetail.tableName || `Order #${selectedBillDetail.orderID}`}</strong>
                            </div>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden">
                            <div className="bg-slate-100 px-4 py-2 font-bold text-xs text-slate-700 grid grid-cols-12">
                                <span className="col-span-6">Tên món</span>
                                <span className="col-span-2 text-center">SL</span>
                                <span className="col-span-2 text-right">Đơn giá</span>
                                <span className="col-span-2 text-right">Thành tiền</span>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                                {selectedBillDetail.items?.map((it, idx) => (
                                    <div key={idx} className="px-4 py-2.5 grid grid-cols-12 items-center text-slate-700">
                                        <span className="col-span-6 font-bold text-slate-800">{it.itemName}</span>
                                        <span className="col-span-2 text-center font-mono">x{it.quantity}</span>
                                        <span className="col-span-2 text-right font-mono text-slate-500">{Number(it.unitPrice).toLocaleString('vi-VN')} đ</span>
                                        <span className="col-span-2 text-right font-mono font-bold text-slate-900">{Number(it.total).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Tổng tiền món (Subtotal):</span>
                                <span className="font-mono font-bold">{Number(selectedBillDetail.subTotal).toLocaleString('vi-VN')} đ</span>
                            </div>
                            {selectedBillDetail.discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-700 font-bold">
                                    <span>Voucher giảm giá ({selectedBillDetail.promotion?.code || 'Khuyến mãi'}):</span>
                                    <span className="font-mono">-{Number(selectedBillDetail.discountAmount).toLocaleString('vi-VN')} đ</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600">
                                <span>Thuế GTGT (VAT 8%):</span>
                                <span className="font-mono font-bold">{Number(selectedBillDetail.taxAmount).toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div className="flex justify-between text-base font-black text-emerald-800 pt-2 border-t border-slate-200">
                                <span>TỔNG CỘNG THANH TOÁN:</span>
                                <span>{Number(selectedBillDetail.finalAmount).toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold uppercase text-xs rounded-xl cursor-pointer"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => {
                                    setReceiptData({
                                        billID: selectedBillDetail.billID,
                                        transactionNo: selectedBillDetail.transactionNo,
                                        orderID: selectedBillDetail.orderID,
                                        tableName: selectedBillDetail.tableName,
                                        items: selectedBillDetail.items,
                                        subTotal: selectedBillDetail.subTotal,
                                        discountAmount: selectedBillDetail.discountAmount,
                                        taxAmount: selectedBillDetail.taxAmount,
                                        finalAmount: selectedBillDetail.finalAmount,
                                        paymentMethod: selectedBillDetail.paymentMethod,
                                        createdAt: new Date(selectedBillDetail.createdAt).toLocaleString('vi-VN')
                                    });
                                    setShowDetailModal(false);
                                    setShowReceiptModal(true); 
                                }}
                                className="px-5 py-2.5 bg-[#081126] text-[#DCC8A8] hover:bg-slate-800 font-bold uppercase text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-lg"
                            >
                                <IconGlyph glyph="🖨️" size={14} /> In / Xuất Hóa Đơn
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showReceiptModal && receiptData && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-slate-900 font-mono text-xs">
                        <div id="print-receipt-area">
                            <div className="text-center pb-4 border-b border-dashed border-slate-300 space-y-1">
                                <h3 className="font-serif font-black text-xl text-[#081126]">LUMIÈRE RESTAURANT</h3>
                                <p className="text-[10px] text-slate-500">123 Đại Lộ Hòa Bình, Cần Thơ</p>
                                <p className="text-[10px] font-bold">HÓA ĐƠN: HD-{String(receiptData.billID).padStart(4, '0')}</p>
                                {receiptData.transactionNo && <p className="text-[9px] text-slate-500">Mã GD: {receiptData.transactionNo}</p>}
                                <p className="text-[10px] text-slate-400">{receiptData.createdAt}</p>
                                <p className="text-[10px] font-bold text-slate-700">{receiptData.tableName}</p>
                            </div>

                            <div className="py-4 space-y-2 border-b border-dashed border-slate-300">
                                {receiptData.items?.map((it, idx) => (
                                    <div key={idx} className="flex justify-between">
                                        <span>{it.itemName} x{it.quantity}</span>
                                        <span>{Number(it.total || it.unitPrice * it.quantity).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                ))}
                            </div>

                            <div className="py-4 space-y-1.5 border-b border-dashed border-slate-300">
                                <div className="flex justify-between">
                                    <span>Tiền món (Subtotal):</span>
                                    <span>{Number(receiptData.subTotal).toLocaleString('vi-VN')} đ</span>
                                </div>
                                {receiptData.discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-800 font-bold">
                                        <span>Giảm giá (Voucher):</span>
                                        <span>-{Number(receiptData.discountAmount).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Thuế VAT (8%):</span>
                                    <span>{Number(receiptData.taxAmount).toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between font-bold text-sm pt-2 text-[#081126]">
                                    <span>TỔNG CỘNG:</span>
                                    <span>{Number(receiptData.finalAmount).toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                                    <span>Hình thức:</span>
                                    <span className="font-bold text-slate-800">{receiptData.paymentMethod}</span>
                                </div>
                            </div>

                            <div className="text-center pt-3 text-[10px] text-slate-400">Cảm ơn quý khách & Hẹn gặp lại!</div>
                        </div>

                        <div className="pt-5 flex justify-between gap-3">
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="w-1/2 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold uppercase cursor-pointer"
                            >
                                Đóng
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="w-1/2 py-2.5 bg-[#081126] text-[#DCC8A8] hover:bg-slate-800 rounded-xl font-bold uppercase cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <IconGlyph glyph="🖨️" size={14} /> In / Xuất PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}