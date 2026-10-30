import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import IconGlyph from '../../components/common/IconGlyph';
import { useConfirm } from '../../context/ConfirmContext';
import { CalendarDays, Clock3, FileText, MapPin, Phone, Users } from 'lucide-react';

const INITIAL_RESERVATIONS = [
    {
        id: 'RES-1001',
        customerName: 'Le Van An',
        phone: '0901234567',
        email: 'an.le@example.com',
        guests: 4,
        date: '2026-10-06',
        time: '19:00',
        tableArea: 'Main Dining Hall',
        tableNumber: 'M03',
        status: 'Confirmed',
        note: 'Birthday celebration, requested window table',
        createdAt: '2026-10-05 14:20',
    },
    {
        id: 'RES-1002',
        customerName: 'Tran Thi Bich',
        phone: '0988776655',
        email: 'bich.tran@example.com',
        guests: 8,
        date: '2026-10-06',
        time: '20:00',
        tableArea: 'VIP Garden Lounge',
        tableNumber: 'V01',
        status: 'Pending',
        note: 'Business dinner, wine pairing needed',
        createdAt: '2026-10-06 09:15',
    },
    {
        id: 'RES-1003',
        customerName: 'Nguyen Hoang Nam',
        phone: '0933445566',
        email: 'nam.nguyen@example.com',
        guests: 2,
        date: '2026-10-07',
        time: '18:30',
        tableArea: 'Sky Bar Terrace',
        tableNumber: 'S04',
        status: 'Seated',
        note: 'Anniversary, champagne on arrival',
        createdAt: '2026-10-04 11:00',
    },
    {
        id: 'RES-1004',
        customerName: 'Pham Minh Khang',
        phone: '0912998877',
        email: 'khang.pham@example.com',
        guests: 6,
        date: '2026-10-07',
        time: '19:30',
        tableArea: 'Main Dining Hall',
        tableNumber: 'M08',
        status: 'Cancelled',
        note: 'Cancelled by customer via hotline',
        createdAt: '2026-10-05 16:45',
    },
];

export default function ReservationManagement() {
    const { currentUser } = useAuth();
    const confirm = useConfirm();
    const isStaffOrManager = currentUser?.role === 'Staff' || currentUser?.role === 'Manager' || currentUser?.role === 'Owner';

    const [reservations, setReservations] = useState(INITIAL_RESERVATIONS);
    const [selectedRes, setSelectedRes] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [toast, setToast] = useState('');

    const [formRes, setFormRes] = useState({
        customerName: '',
        phone: '',
        email: '',
        guests: 2,
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        tableArea: 'Main Dining Hall',
        tableNumber: 'M01',
        note: '',
    });

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleCreateReservation = (e) => {
        e.preventDefault();
        const newRes = {
            id: `RES-${Date.now().toString().slice(-4)}`,
            ...formRes,
            guests: Number(formRes.guests),
            status: 'Confirmed',
            createdAt: new Date().toLocaleString(),
        };
        setReservations([newRes, ...reservations]);
        setIsCreateModalOpen(false);
        showToast(`Reservation ${newRes.id} created successfully`);
    };

    const handleUpdateStatus = async (id, nextStatus) => {
        if (nextStatus === 'Cancelled') {
            const reservation = reservations.find((item) => item.id === id);
            const shouldCancel = await confirm({
                title: 'Cancel this reservation?',
                message: `Are you sure you want to cancel${reservation ? ` ${reservation.customerName}'s reservation` : ' this reservation'} (${id})?`,
                confirmText: 'Cancel Reservation',
            });
            if (!shouldCancel) return;
        }
        setReservations(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r));
        if (selectedRes?.id === id) setSelectedRes(prev => ({ ...prev, status: nextStatus }));
        showToast(`Reservation ${id} updated → ${nextStatus}`);
    };

    const filteredReservations = reservations.filter(r => {
        const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
        const matchesSearch = r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.phone.includes(searchQuery) ||
            r.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusBadge = (status) => {
        const styles = {
            Confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            Pending: 'bg-amber-100 text-amber-800 border-amber-300',
            Seated: 'bg-indigo-100 text-indigo-800 border-indigo-300',
            Cancelled: 'bg-rose-100 text-rose-800 border-rose-300',
        };
        const labels = {
            Confirmed: 'Confirmed',
            Pending: 'Pending',
            Seated: 'Seated',
            Cancelled: 'Cancelled',
        };
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 font-sans space-y-6">

            {/* TOAST */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <IconGlyph glyph="✨" size={16} />
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-[#081126] text-white px-6 py-6 sm:px-8 rounded-2xl border border-[#DCC8A8]/20 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative overflow-hidden">
                <div className="absolute -top-24 -right-12 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[11px] font-bold uppercase text-[#DCC8A8] tracking-[0.18em]">
                        OPERATIONS · RESERVATIONS
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F2EA] mt-2">
                        Reservation Management
                    </h1>
                    <p className="text-sm text-[#B7C0D1] mt-2">
                        Manage bookings, confirm guests, and coordinate table assignments.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="relative z-10 px-5 py-3 bg-[#DCC8A8] text-[#081126] font-bold text-sm rounded-xl shadow hover:bg-[#ebd9bd] transition cursor-pointer"
                >
                    + New Reservation
                </button>
            </div>

            {/* SEARCH & FILTER TOOLBAR */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-80 relative">
                    <input
                        type="text"
                        placeholder="Search by guest name, phone number, or reservation ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DCC8A8]"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                    {['All', 'Pending', 'Confirmed', 'Seated', 'Cancelled'].map(st => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition whitespace-nowrap cursor-pointer ${
                                filterStatus === st
                                    ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {{ All: 'All', Pending: 'Pending', Confirmed: 'Confirmed', Seated: 'Seated', Cancelled: 'Cancelled' }[st]}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* RESERVATION LIST (2 COLS) */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex justify-between items-center">
                        <div>
                            <h2 className="font-serif font-bold text-[#081126]">Reservations</h2>
                            <p className="text-xs text-slate-500 mt-1">Select a reservation to view its details.</p>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{filteredReservations.length} reservations</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredReservations.map(res => (
                            <button
                                type="button"
                                key={res.id}
                                onClick={() => setSelectedRes(res)}
                                className={`w-full p-4 sm:px-5 sm:py-4 text-left transition cursor-pointer grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-l-[3px] ${
                                    selectedRes?.id === res.id
                                        ? 'bg-amber-50/70 border-l-[#081126]'
                                        : 'bg-white hover:bg-slate-50 border-l-transparent'
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="font-mono text-[11px] font-bold tracking-wide text-slate-400">{res.id}</span>
                                        {getStatusBadge(res.status)}
                                    </div>
                                    <h3 className="font-semibold text-slate-900 text-base mt-2">{res.customerName}</h3>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />{res.phone}</span>
                                        <span className="inline-flex items-center gap-1.5"><Users size={14} className="text-slate-400" />{res.guests} guests</span>
                                        <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" />{res.tableArea} · Table {res.tableNumber}</span>
                                    </div>
                                </div>

                                <div className="sm:min-w-[150px] sm:text-right border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                                    <div className="inline-flex sm:flex sm:justify-end items-center gap-2 text-sm font-bold text-[#081126]">
                                        <CalendarDays size={15} className="text-amber-700" />
                                        {res.date}
                                    </div>
                                    <div className="flex sm:justify-end items-center gap-1.5 text-xs text-slate-600 mt-1">
                                        <Clock3 size={13} className="text-slate-400" />
                                        {res.time}
                                    </div>
                                    <span className="text-[10px] text-slate-400 block mt-1.5">Booked {res.createdAt}</span>
                                </div>
                            </button>
                        ))}
                        {filteredReservations.length === 0 && (
                            <div className="px-5 py-12 text-center">
                                <CalendarDays size={28} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-sm font-semibold text-slate-700">No reservations found</p>
                                <p className="text-xs text-slate-500 mt-1">Try changing your search or status filter.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RESERVATION DETAIL PANEL (1 COL) */}
                <div>
                    {selectedRes ? (
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-6 sticky top-20">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reservation Details</span>
                                        <h3 className="font-serif text-2xl font-bold text-[#081126] mt-0.5">{selectedRes.customerName}</h3>
                                    </div>
                                    {getStatusBadge(selectedRes.status)}
                                </div>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Information</span>
                                    <p className="font-bold text-slate-800 mt-0.5">Phone: {selectedRes.phone}</p>
                                    <p className="text-slate-600">Email: {selectedRes.email}</p>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                                        <p className="font-bold text-slate-800 mt-0.5">{selectedRes.date} ({selectedRes.time})</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Party Size</span>
                                        <p className="font-bold text-slate-800 mt-0.5"><IconGlyph glyph="👥" size={14} /> {selectedRes.guests} guests</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Area & Table</span>
                                    <p className="font-bold text-indigo-900 mt-0.5"><IconGlyph glyph="🏛️" size={14} /> {selectedRes.tableArea} — Table {selectedRes.tableNumber}</p>
                                </div>

                                {selectedRes.note && (
                                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                                        <span className="text-amber-600 block text-[10px] uppercase font-bold">Requests / Notes</span>
                                        <p className="text-amber-900 font-medium mt-0.5"><IconGlyph glyph="📝" size={14} /> {selectedRes.note}</p>
                                    </div>
                                )}
                            </div>

                            {/* ACTIONS */}
                            <div className="pt-2 space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Update Status</span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRes.id, 'Confirmed')}
                                        className="py-2.5 bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl hover:bg-emerald-800 transition cursor-pointer"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRes.id, 'Seated')}
                                        className="py-2.5 bg-indigo-700 text-white font-bold text-xs uppercase rounded-xl hover:bg-indigo-800 transition cursor-pointer"
                                    >
                                        Seat Guests
                                    </button>
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRes.id, 'Cancelled')}
                                        className="col-span-2 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs uppercase rounded-xl hover:bg-rose-100 transition cursor-pointer"
                                    >
                                        Cancel Reservation
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center sticky top-20">
                            <div className="h-12 w-12 mx-auto mb-3 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <FileText size={22} />
                            </div>
                            <p className="font-semibold text-slate-700 text-sm">Select a reservation</p>
                            <p className="text-xs text-slate-500 mt-1">Reservation details and available actions will appear here.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* CREATE RESERVATION MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">New Table Reservation</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold"><IconGlyph glyph="✕" /></button>
                        </div>

                        <form onSubmit={handleCreateReservation} className="space-y-4 mt-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Full Name"
                                    value={formRes.customerName}
                                    onChange={e => setFormRes({ ...formRes, customerName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="0901234567"
                                        value={formRes.phone}
                                        onChange={e => setFormRes({ ...formRes, phone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Guests Count</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={formRes.guests}
                                        onChange={e => setFormRes({ ...formRes, guests: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={formRes.date}
                                        onChange={e => setFormRes({ ...formRes, date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Time Slot</label>
                                    <input
                                        type="time"
                                        required
                                        value={formRes.time}
                                        onChange={e => setFormRes({ ...formRes, time: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Dining Area</label>
                                    <select
                                        value={formRes.tableArea}
                                        onChange={e => setFormRes({ ...formRes, tableArea: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        <option value="Main Dining Hall">Main Dining Hall</option>
                                        <option value="VIP Garden Lounge">VIP Garden Lounge</option>
                                        <option value="Sky Bar Terrace">Sky Bar Terrace</option>
                                        <option value="Private Royal Suite">Private Royal Suite</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Table Number</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. M04"
                                        value={formRes.tableNumber}
                                        onChange={e => setFormRes({ ...formRes, tableNumber: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Special Requests / Notes</label>
                                <textarea
                                    rows="2"
                                    placeholder="High chair needed, allergies, candle setup..."
                                    value={formRes.note}
                                    onChange={e => setFormRes({ ...formRes, note: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800">Save Reservation</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
