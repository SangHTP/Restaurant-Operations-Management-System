import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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

    const handleUpdateStatus = (id, nextStatus) => {
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
        return (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
                ● {status}
            </span>
        );
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
                        ✦ TABLE RESERVATIONS & BOOKINGS ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Reservation Management Hub
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Create, track, update, and manage table reservations in real-time.
                    </p>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="relative z-10 px-5 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer"
                >
                    + New Table Reservation
                </button>
            </div>

            {/* SEARCH & FILTER TOOLBAR */}
            <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="w-full md:w-80 relative">
                    <input
                        type="text"
                        placeholder="Search guest name, phone, reservation ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DCC8A8]"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
                    {['All', 'Pending', 'Confirmed', 'Seated', 'Cancelled'].map(st => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                filterStatus === st
                                    ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* RESERVATION LIST (2 COLS) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="font-serif font-bold text-[#081126]">Reservations List</h2>
                        <span className="text-xs text-slate-500 font-medium">{filteredReservations.length} total bookings</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredReservations.map(res => (
                            <div
                                key={res.id}
                                onClick={() => setSelectedRes(res)}
                                className={`p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                                    selectedRes?.id === res.id ? 'bg-amber-50/60 border-l-4 border-[#081126]' : ''
                                }`}
                            >
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-black text-slate-400">{res.id}</span>
                                        {getStatusBadge(res.status)}
                                    </div>
                                    <h3 className="font-serif font-bold text-slate-900 text-lg mt-1">{res.customerName}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        📞 {res.phone} · 👥 {res.guests} Guests · 📍 {res.tableArea} ({res.tableNumber})
                                    </p>
                                </div>

                                <div className="text-right sm:text-right">
                                    <div className="text-xs font-black text-[#081126]">📅 {res.date} at {res.time}</div>
                                    <span className="text-[10px] text-slate-400 block mt-1">Booked: {res.createdAt}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RESERVATION DETAIL PANEL (1 COL) */}
                <div>
                    {selectedRes ? (
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-6 sticky top-20">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reservation Detail</span>
                                        <h3 className="font-serif text-2xl font-bold text-[#081126] mt-0.5">{selectedRes.customerName}</h3>
                                    </div>
                                    {getStatusBadge(selectedRes.status)}
                                </div>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Info</span>
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
                                        <p className="font-bold text-slate-800 mt-0.5">👥 {selectedRes.guests} People</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Table</span>
                                    <p className="font-bold text-indigo-900 mt-0.5">🏛️ {selectedRes.tableArea} — Table {selectedRes.tableNumber}</p>
                                </div>

                                {selectedRes.note && (
                                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                                        <span className="text-amber-600 block text-[10px] uppercase font-bold">Guest Request / Note</span>
                                        <p className="text-amber-900 font-medium mt-0.5">📝 {selectedRes.note}</p>
                                    </div>
                                )}
                            </div>

                            {/* ACTIONS */}
                            <div className="pt-2 space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Update Reservation Status</span>
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
                        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                            <span className="text-4xl block mb-2">📋</span>
                            <p className="font-serif font-bold text-slate-600 text-sm">Select a reservation</p>
                            <p className="text-xs mt-1">to view details and update booking status</p>
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
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
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
