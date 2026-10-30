import { useState, useEffect } from 'react';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5249/api'}/Promotion`;

const DEFAULT_FORM = {
    code: '',
    promotionName: '',
    discountType: 'Percent',
    discountValue: 15,
    minOrderValue: 500000,
    count: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2026-12-31',
    isActive: false
};

export default function PromotionManagement() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'info' });
    const [formPromo, setFormPromo] = useState(DEFAULT_FORM);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: 'info' }), 4000);
    };
    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
    };

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const res = await fetch(API_BASE_URL);
            if (!res.ok) throw new Error('Không thể tải danh sách khuyến mãi');
            const data = await res.json();
            setPromotions(data);
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const handleOpenCreateModal = () => {
        setEditingId(null);
        setFormPromo(DEFAULT_FORM);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (promo) => {
        setEditingId(promo.promotionID);
        setFormPromo({
            code: promo.code,
            promotionName: promo.promotionName || '',
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minOrderValue: promo.minOrderValue,
            count: promo.count ?? 0,
            startDate: formatDateForInput(promo.startDate),
            endDate: formatDateForInput(promo.endDate),
            isActive: promo.isActive
        });
        setIsModalOpen(true);
    };

    const handleSavePromo = async (e) => {
        e.preventDefault();

        const payload = {
            code: formPromo.code.trim().toUpperCase(),
            promotionName: formPromo.promotionName,
            discountType: formPromo.discountType,
            discountValue: Number(formPromo.discountValue),
            minOrderValue: Number(formPromo.minOrderValue),
            count: Number(formPromo.count),
            startDate: new Date(formPromo.startDate).toISOString(),
            endDate: new Date(formPromo.endDate).toISOString(),
            isActive: formPromo.isActive
        };

        const isEditing = editingId !== null;
        const url = isEditing ? `${API_BASE_URL}/${editingId}` : API_BASE_URL;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || (isEditing ? 'Cập nhật thất bại' : 'Thêm mới thất bại'));
            }

            showToast(isEditing ? `Đã cập nhật mã "${payload.code}"!` : `Đã tạo voucher "${payload.code}"!`, 'success');
            setIsModalOpen(false);
            fetchPromotions(); 
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleToggleActive = async (promo) => {
        const nextStatus = !promo.isActive;
        const now = new Date();
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);

        if (nextStatus === true) {
            const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startZero = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

            if (todayZero < startZero) {
                showToast("Ngày bắt đầu chưa tới, không thể mở khuyến mãi này!", "error");
                return;
            }

            if (now > endDate) {
                showToast("Đã qua ngày kết thúc, không thể mở khuyến mãi này!", "error");
                return;
            }

            if (promo.count <= 0) {
                showToast("Mã này đã hết lượt sử dụng (Count = 0), không thể kích hoạt!", "error");
                return;
            }
        }

        const payload = {
            code: promo.code,
            promotionName: promo.promotionName,
            discountType: promo.discountType,
            discountValue: promo.discountValue,
            minOrderValue: promo.minOrderValue,
            count: promo.count,
            startDate: promo.startDate,
            endDate: promo.endDate,
            isActive: nextStatus
        };

        try {
            const res = await fetch(`${API_BASE_URL}/${promo.promotionID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resData = await res.json();
            if (!res.ok) {
                throw new Error(resData.message || 'Cập nhật trạng thái thất bại');
            }

            setPromotions(prev => prev.map(p =>
                p.promotionID === promo.promotionID ? { ...p, isActive: nextStatus } : p
            ));
            showToast(`Mã "${promo.code}" hiện đang ${nextStatus ? 'KÍCH HOẠT ✅' : 'TẠM TẮT 🚫'}`);
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const handleDeletePromo = async (promo) => {
        if (promo.isActive) {
            showToast("Khuyến mãi đang được mở! Vui lòng Deactivate (tắt) trước khi xóa.", "error");
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn xóa mã "${promo.code}" không?`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/${promo.promotionID}`, {
                method: 'DELETE'
            });

            const resData = await res.json();
            if (!res.ok) {
                throw new Error(resData.message || 'Xóa khuyến mãi thất bại');
            }

            showToast(`Đã xóa thành công mã "${promo.code}"!`, 'success');
            setPromotions(prev => prev.filter(p => p.promotionID !== promo.promotionID));
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {toast.message && (
                <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error'
                        ? 'bg-rose-950 text-rose-200 border-rose-500/50'
                        : 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]/40'
                    }`}>
                    <span className="font-black text-sm">{toast.type === 'error' ? '⚠️' : '✦'}</span>
                    <span className="text-xs font-bold">{toast.message}</span>
                </div>
            )}

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
                        Tạo mã giảm giá, chỉnh sửa chiến dịch, điều kiện hóa đơn tối thiểu và quản lý trạng thái.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="relative z-10 px-5 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer"
                >
                    + Create New Campaign
                </button>
            </div>

            {loading && (
                <div className="text-center py-12 text-slate-400 font-medium">
                    Đang tải dữ liệu từ máy chủ...
                </div>
            )}

            {!loading && promotions.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 text-slate-400">
                    Chưa có chương trình khuyến mãi nào. Hãy nhấn <strong className="text-slate-700">+ Create New Campaign</strong> để tạo mới!
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {promotions.map(promo => {
                    const startDateStr = promo.startDate ? promo.startDate.split('T')[0] : '';
                    const endDateStr = promo.endDate ? promo.endDate.split('T')[0] : '';

                    return (
                        <div
                            key={promo.promotionID}
                            className={`bg-white rounded-3xl border shadow-lg overflow-hidden flex flex-col justify-between transition hover:-translate-y-1 ${!promo.isActive ? 'opacity-65 bg-slate-50 border-slate-300' : 'border-stone-200'
                                }`}
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="font-mono text-xs font-black text-amber-900 bg-amber-100 px-3 py-1 rounded-xl border border-amber-300">
                                        🎟️ {promo.code}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                        {/* Huy hiệu cảnh báo nguyên nhân Inactive */}
                                        {promo.count <= 0 && (
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 border border-rose-300">
                                                Hết lượt
                                            </span>
                                        )}
                                        {new Date(promo.endDate) < new Date() && (
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-300">
                                                Hết hạn
                                            </span>
                                        )}

                                        {/* Trạng thái Active / Inactive */}
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${promo.isActive
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                                : 'bg-slate-100 text-slate-600 border-slate-300'
                                            }`}>
                                            {promo.isActive ? '● Active' : '✕ Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-serif font-bold text-slate-900 text-lg">{promo.promotionName || 'Voucher Khuyến Mãi'}</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Discount: <strong className="text-slate-800 font-mono">
                                            {promo.discountType === 'Percent'
                                                ? `${promo.discountValue}% OFF`
                                                : `${Number(promo.discountValue).toLocaleString('vi-VN')} đ OFF`}
                                        </strong>
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Quantity Left:</span>
                                        <span className="font-mono font-bold text-amber-700">{promo.count ?? 0} lượt</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Min Bill Amount:</span>
                                        <span className="font-mono font-bold text-slate-800">{Number(promo.minOrderValue).toLocaleString('vi-VN')} đ</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>Valid Period:</span>
                                        <span className="font-bold text-slate-800">{startDateStr} ~ {endDateStr}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                                <button
                                    onClick={() => handleToggleActive(promo)}
                                    className={`w-full py-2 rounded-xl font-bold text-xs uppercase transition cursor-pointer border ${promo.isActive
                                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                >
                                    {promo.isActive ? 'Deactivate Campaign' : 'Activate Campaign'}
                                </button>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleOpenEditModal(promo)}
                                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-300"
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeletePromo(promo)}
                                        className="py-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 font-bold text-xs uppercase rounded-xl transition cursor-pointer border border-slate-300 hover:border-rose-300"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">
                                {editingId ? 'Edit Promotion Campaign' : 'New Promotion Campaign'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold text-base cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSavePromo} className="space-y-4 mt-4 text-xs">
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
                                    value={formPromo.promotionName}
                                    onChange={e => setFormPromo({ ...formPromo, promotionName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Discount Type</label>
                                    <select
                                        value={formPromo.discountType}
                                        onChange={e => setFormPromo({ ...formPromo, discountType: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        <option value="Percent">Percentage (%)</option>
                                        <option value="Amount">Fixed Amount (VND)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Value</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={formPromo.discountType === 'Percent' ? 100 : undefined}
                                        value={formPromo.discountValue}
                                        onChange={e => setFormPromo({ ...formPromo, discountValue: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                                    />
                                </div>
                            </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-bold text-slate-700 uppercase mb-1">Min Order Total (VND)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formPromo.minOrderValue}
                                                onChange={e => setFormPromo({ ...formPromo, minOrderValue: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-slate-700 uppercase mb-1">Voucher Quantity (Count)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                required
                                                value={formPromo.count}
                                                onChange={e => setFormPromo({ ...formPromo, count: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold"
                                            />
                                        </div>
                                    </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formPromo.startDate}
                                        onChange={e => setFormPromo({ ...formPromo, startDate: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formPromo.endDate}
                                        onChange={e => setFormPromo({ ...formPromo, endDate: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl cursor-pointer hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800 cursor-pointer"
                                >
                                    {editingId ? 'Save Changes' : 'Launch Campaign'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}