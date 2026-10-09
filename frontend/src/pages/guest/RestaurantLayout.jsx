import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AREAS = [
    {
        id: 'area-1',
        name: 'Grand Dining Hall',
        icon: '🏛️',
        capacity: 60,
        description: 'Atmospheric main hall featuring live piano & violin performances',
        stageText: '🎹 LIVE PIANO & VIOLIN STAGE 🎻',
        ambientBg: 'from-amber-950/20 to-slate-950',
    },
    {
        id: 'area-2',
        name: 'Botanical Garden Lounge',
        icon: '🌿',
        capacity: 24,
        description: 'Alfresco dining surrounded by lush indoor water fountains & flora',
        stageText: '🌺 BOTANICAL WATERFALL & LIGHTED FOUNTAIN 🌺',
        ambientBg: 'from-emerald-950/20 to-slate-950',
    },
    {
        id: 'area-3',
        name: 'Sky Bar Terrace',
        icon: '🍸',
        capacity: 30,
        description: 'Rooftop dining with 360° panoramic city skyline views',
        stageText: '🏙️ PANORAMIC CITY NIGHT SKYLINE VIEW 🏙️',
        ambientBg: 'from-sky-950/20 to-slate-950',
    },
    {
        id: 'area-4',
        name: 'Private Sommelier Suite',
        icon: '👑',
        capacity: 16,
        description: 'Exclusive enclosed dining rooms with private wine sommelier service',
        stageText: '🍷 VINTAGE SOMMELIER WINE CELLAR WALL 🍷',
        ambientBg: 'from-purple-950/20 to-slate-950',
    },
];

const INITIAL_TABLES_LAYOUT = {
    'area-1': [
        { id: 'M01', name: 'Table M01', seats: 4, view: 'Front Stage', status: 'available', shape: 'rect', perk: 'Prime acoustics & stage view' },
        { id: 'M02', name: 'Table M02', seats: 4, view: 'Front Stage', status: 'reserved', shape: 'rect', perk: 'Direct piano proximity' },
        { id: 'M03', name: 'Table M03', seats: 6, view: 'VIP Center', status: 'available', shape: 'round', perk: 'Spacious central dining' },
        { id: 'M04', name: 'Table M04', seats: 2, view: 'Window View', status: 'available', shape: 'square', perk: 'Romantic street view' },
        { id: 'M05', name: 'Table M05', seats: 4, view: 'Window View', status: 'reserved', shape: 'rect', perk: 'Cozy booth arrangement' },
        { id: 'M06', name: 'Table M06', seats: 8, view: 'Grand Family', status: 'available', shape: 'round', perk: 'Large family banquet table' },
        { id: 'M07', name: 'Table M07', seats: 4, view: 'Quiet Corner', status: 'available', shape: 'square', perk: 'Private & discreet corner' },
        { id: 'M08', name: 'Table M08', seats: 2, view: 'Quiet Corner', status: 'reserved', shape: 'square', perk: 'Intimate date table' },
    ],
    'area-2': [
        { id: 'V01', name: 'Garden V01', seats: 6, view: 'Waterfall View', status: 'available', shape: 'round', perk: 'Sounds of soothing water' },
        { id: 'V02', name: 'Garden V02', seats: 4, view: 'Gazebo Shade', status: 'reserved', shape: 'rect', perk: 'Enclosed botanical canopy' },
        { id: 'V03', name: 'Garden V03', seats: 6, view: 'Poolside', status: 'available', shape: 'round', perk: 'Illuminated pool view' },
        { id: 'V04', name: 'Garden V04', seats: 8, view: 'Grand Terrace', status: 'available', shape: 'rect', perk: 'Open air garden dining' },
    ],
    'area-3': [
        { id: 'S01', name: 'Sky Bar S01', seats: 2, view: 'Rooftop Edge', status: 'available', shape: 'square', perk: 'Direct glass balcony view' },
        { id: 'S02', name: 'Sky Bar S02', seats: 2, view: 'Rooftop Edge', status: 'reserved', shape: 'square', perk: 'City skyline sunset spot' },
        { id: 'S03', name: 'Sky Bar S03', seats: 4, view: 'Cocktail Lounge', status: 'available', shape: 'rect', perk: 'Beside main mixology bar' },
        { id: 'S04', name: 'Sky Bar S04', seats: 6, view: 'DJ & Music Front', status: 'available', shape: 'round', perk: 'Lively lounge vibe' },
    ],
    'area-4': [
        { id: 'R01', name: 'Royal Suite R01', seats: 8, view: 'Private Balcony', status: 'available', shape: 'round', perk: 'Personal butler & private lounge' },
        { id: 'R02', name: 'Royal Suite R02', seats: 8, view: 'Wine Cellar View', status: 'available', shape: 'round', perk: 'Sommelier tasting setup included' },
    ]
};

export default function RestaurantLayout() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [selectedArea, setSelectedArea] = useState(AREAS[0]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [toast, setToast] = useState('');

    // Booking Form State for Guest / Customer
    const [bookingData, setBookingData] = useState({
        customerName: currentUser?.name || '',
        phone: currentUser?.phone || '',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        guests: 2,
        notes: '',
        occasion: 'Dining',
    });

    const currentTables = INITIAL_TABLES_LAYOUT[selectedArea.id] || [];

    const handleSelectTable = (tbl) => {
        if (tbl.status === 'reserved') return;
        if (selectedTable?.id === tbl.id) {
            setSelectedTable(null);
        } else {
            setSelectedTable(tbl);
            setBookingData(prev => ({
                ...prev,
                customerName: currentUser?.name || prev.customerName,
                phone: currentUser?.phone || prev.phone,
                guests: tbl.seats,
            }));
        }
    };

    const handleConfirmBooking = (e) => {
        e.preventDefault();
        setIsBookingModalOpen(false);
        setToast(`🎉 Table ${selectedTable.name} (${selectedArea.name}) reserved successfully for ${bookingData.customerName || 'Guest'}!`);
        setSelectedTable(null);
        setTimeout(() => setToast(''), 4500);
    };

    // Calculate Grid column style based on table count for optimal layout proportion
    const getGridColsClass = () => {
        if (currentTables.length <= 2) {
            return 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto gap-8';
        }
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 font-sans space-y-8 pb-40">
            
            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className="fixed top-20 right-6 z-[100] bg-[#081126] text-[#DCC8A8] border-2 border-[#DCC8A8] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="text-xl">✨</span>
                    <span className="text-xs sm:text-sm font-bold tracking-wide">{toast}</span>
                </div>
            )}

            {/* HERO HEADER CARD */}
            <div className="bg-[#081126] text-white p-6 sm:p-10 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCC8A8]/15 border border-[#DCC8A8]/30 text-[#DCC8A8] text-[10px] font-black tracking-[0.25em] uppercase mb-3">
                            <span>✦</span> {currentUser ? 'TABLE RESERVATION PORTAL' : 'GUEST SEATING MAP (VIEW ONLY)'} <span>✦</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#F5F2EA] tracking-tight">
                            Interactive Table Map
                        </h1>
                        <p className="text-xs sm:text-sm text-[#8995AD] mt-2 max-w-2xl leading-relaxed">
                            {currentUser
                                ? 'Explore dining zones, select table seats, and complete your reservation instantly.'
                                : 'Browse Lumière dining zones & layout positions. Sign in to place online table reservations.'}
                        </p>
                    </div>

                    {/* STATUS LEGEND & AUTH BADGE */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium text-slate-300 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                <span className="text-emerald-300 font-semibold">Available</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-rose-500/70 border border-rose-400/50" />
                                <span className="text-slate-400">Reserved</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-[#DCC8A8] ring-2 ring-[#DCC8A8]/50 shadow-[0_0_10px_#DCC8A8]" />
                                <span className="text-[#DCC8A8] font-bold">Selected</span>
                            </div>
                        </div>
                        <span className="hidden sm:inline text-slate-600">|</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            currentUser
                                ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                                : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                        }`}>
                            {currentUser ? `👤 ${currentUser.name} (${currentUser.role})` : '👁️ Guest (View Only)'}
                        </span>
                    </div>
                </div>
            </div>

            {/* ZONE / AREA SELECTION TABS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AREAS.map(area => {
                    const isActive = selectedArea.id === area.id;
                    const tableCount = INITIAL_TABLES_LAYOUT[area.id]?.length || 0;
                    return (
                        <button
                            key={area.id}
                            onClick={() => { setSelectedArea(area); setSelectedTable(null); }}
                            className={`group relative p-5 rounded-3xl border transition-all duration-300 text-left cursor-pointer overflow-hidden flex flex-col justify-between ${
                                isActive
                                    ? 'bg-[#081126] text-white border-2 border-[#DCC8A8] shadow-xl scale-[1.02]'
                                    : 'bg-white text-slate-800 border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                            }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DCC8A8] to-transparent" />
                            )}
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-3xl filter drop-shadow">{area.icon}</span>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                        isActive ? 'bg-[#DCC8A8] text-[#081126]' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        Cap {area.capacity}
                                    </span>
                                </div>
                                <h3 className={`font-serif font-bold text-base transition-colors ${
                                    isActive ? 'text-[#F5F2EA]' : 'text-slate-800 group-hover:text-amber-900'
                                }`}>
                                    {area.name}
                                </h3>
                                <p className={`text-[11px] mt-1 line-clamp-2 leading-snug ${
                                    isActive ? 'text-slate-300' : 'text-slate-500'
                                }`}>
                                    {area.description}
                                </p>
                            </div>

                            <div className={`mt-4 pt-3 border-t flex justify-between items-center text-[10px] ${
                                isActive ? 'border-white/10' : 'border-slate-100'
                            }`}>
                                <span className={`font-mono font-medium ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {tableCount} Tables
                                </span>
                                <span className={`font-bold transition-transform group-hover:translate-x-1 ${
                                    isActive ? 'text-[#DCC8A8]' : 'text-slate-600 group-hover:text-amber-800'
                                }`}>
                                    {isActive ? 'Selected ✓' : 'View Zone →'}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* FLOOR BLUEPRINT DISPLAY CANVAS */}
            <div className="bg-[#081126] rounded-3xl border border-[#DCC8A8]/30 shadow-2xl overflow-hidden relative">
                
                {/* TOP STAGE / AMBIANCE FOCUS BAR */}
                <div className="relative py-5 px-6 border-b border-white/10 bg-gradient-to-r from-slate-950 via-[#0a1630] to-slate-950 text-center">
                    <div className="w-full max-w-xl mx-auto h-1.5 bg-gradient-to-r from-transparent via-[#DCC8A8] to-transparent rounded-full shadow-[0_0_20px_#DCC8A8]" />
                    <h2 className="text-xs font-black text-[#DCC8A8] tracking-[0.25em] uppercase mt-2.5">
                        {selectedArea.stageText}
                    </h2>
                    <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                        ✦ MAIN AMBIANCE DIRECTION ✦
                    </span>
                </div>

                {/* BLUEPRINT CANVAS CONTAINER */}
                <div className="relative min-h-[460px] p-6 sm:p-10 bg-gradient-to-b from-[#081126] via-[#091530] to-[#050a14]">
                    
                    {/* Subtle Blueprint Grid overlay */}
                    <div
                        className="absolute inset-0 opacity-15 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(220,200,168,0.5) 1px, transparent 1px)',
                            backgroundSize: '28px 28px',
                        }}
                    />

                    {/* Architectural Landmarks */}
                    <div className="absolute bottom-4 left-6 text-[9px] font-bold text-slate-400 tracking-widest uppercase pointer-events-none font-mono">
                        🚪 MAIN ENTRANCE & CONCIERGE
                    </div>
                    <div className="absolute bottom-4 right-6 text-[9px] font-bold text-slate-400 tracking-widest uppercase pointer-events-none font-mono">
                        🍸 BAR & SOMMELIER DISPATCH 🍷
                    </div>

                    {/* DYNAMIC CARDS GRID */}
                    <div className={`grid ${getGridColsClass()} relative z-10 my-4`}>
                        {currentTables.map((tbl) => {
                            const isSelected = selectedTable?.id === tbl.id;
                            const isReserved = tbl.status === 'reserved';
                            const isRound = tbl.shape === 'round';

                            return (
                                <div
                                    key={tbl.id}
                                    onClick={() => handleSelectTable(tbl)}
                                    className={`group relative p-6 rounded-3xl border-2 transition-all duration-300 flex flex-col justify-between items-center text-center cursor-pointer min-h-[230px] ${
                                        isReserved
                                            ? 'bg-slate-950/80 border-slate-800/80 text-slate-500 opacity-60 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-gradient-to-b from-[#0f224a] to-[#081126] border-[#DCC8A8] text-white ring-4 ring-[#DCC8A8]/30 scale-105 shadow-[0_15px_35px_rgba(220,200,168,0.25)]'
                                            : 'bg-white/[0.05] border-white/10 hover:border-[#DCC8A8]/70 hover:bg-white/[0.09] hover:-translate-y-1 shadow-lg'
                                    }`}
                                >
                                    {/* TABLE VISUALIZER WITH CHAIR DASHED RING */}
                                    <div className="relative mb-3 flex items-center justify-center">
                                        <div className="absolute inset-0 -m-3 flex items-center justify-center">
                                            <div className={`w-full h-full border border-dashed rounded-full transition-colors ${
                                                isSelected ? 'border-[#DCC8A8]/80 animate-spin-slow' : 'border-slate-700'
                                            }`} style={{ animationDuration: '20s' }} />
                                        </div>

                                        {/* Table central shape */}
                                        <div className={`
                                            relative z-10 flex flex-col items-center justify-center transition-all duration-300 shadow-md border
                                            ${isRound ? 'w-20 h-20 rounded-full' : 'w-24 h-16 rounded-2xl'}
                                            ${isReserved
                                                ? 'bg-slate-900 border-slate-700 text-slate-500'
                                                : isSelected
                                                ? 'bg-gradient-to-r from-[#DCC8A8] to-[#ebd9bd] text-[#081126] border-white shadow-xl font-bold'
                                                : 'bg-slate-800/90 border-[#DCC8A8]/30 text-[#DCC8A8] group-hover:border-[#DCC8A8] group-hover:bg-[#081126]'}
                                        `}>
                                            <span className="text-xs font-black tracking-tight">{tbl.name}</span>
                                            <span className="text-[9px] font-bold opacity-80">{tbl.seats} Seats</span>
                                        </div>
                                    </div>

                                    {/* TABLE DETAILS */}
                                    <div className="space-y-1.5 w-full">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-200">
                                            <span>📍</span>
                                            <span>{tbl.view}</span>
                                        </div>

                                        <p className="text-[11px] text-slate-300 line-clamp-1 italic font-serif">
                                            "{tbl.perk}"
                                        </p>
                                    </div>

                                    {/* STATUS BADGE BUTTON */}
                                    <div className="w-full pt-3 mt-2 border-t border-white/10 flex justify-between items-center text-[10px]">
                                        <span className="text-slate-300 font-bold">🪑 {tbl.seats} Guests</span>
                                        <span className={`font-extrabold uppercase px-3 py-1.5 rounded-xl transition cursor-pointer ${
                                            isReserved
                                                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                                                : isSelected
                                                ? 'bg-[#DCC8A8] text-[#081126] shadow-md font-black'
                                                : 'bg-[#DCC8A8]/20 text-[#DCC8A8] border border-[#DCC8A8]/40 group-hover:bg-[#DCC8A8] group-hover:text-[#081126]'
                                        }`}>
                                            {isReserved ? 'Reserved' : isSelected ? 'Selected ✓' : 'Book Table'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* FLOATING BOOKING BAR FOR GUEST */}
            {selectedTable && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] max-w-3xl w-[92%] bg-[#081126]/95 backdrop-blur-2xl text-white border-2 border-[#DCC8A8] p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row justify-between items-center gap-4 animate-slide-up">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DCC8A8] to-[#bfa780] text-[#081126] flex items-center justify-center text-xl font-black shadow-lg">
                            ⭐
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-serif text-lg font-bold text-[#F5F2EA]">{selectedTable.name}</span>
                                <span className="bg-[#DCC8A8]/20 border border-[#DCC8A8]/40 text-[#DCC8A8] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                                    {selectedArea.name}
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                                Capacity: <strong>{selectedTable.seats} Guests</strong> · View: <strong>{selectedTable.view}</strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setSelectedTable(null)}
                            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs rounded-2xl transition cursor-pointer"
                        >
                            Change Table
                        </button>
                        <button
                            onClick={() => setIsBookingModalOpen(true)}
                            className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-105 transition cursor-pointer shadow-xl flex items-center justify-center gap-2"
                        >
                            <span>Reserve Table {selectedTable.id} Now</span>
                            <span>→</span>
                        </button>
                    </div>
                </div>
            )}

            {/* RESERVATION FORM / GUEST PROMPT MODAL */}
            {isBookingModalOpen && selectedTable && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-[#081126] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#DCC8A8]/40 text-white relative animate-fadeIn">
                        
                        {!currentUser ? (
                            /* GUEST VIEW ONLY PROMPT */
                            <div className="text-center space-y-4 py-2">
                                <div className="w-16 h-16 rounded-2xl bg-[#DCC8A8]/10 border border-[#DCC8A8]/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
                                    🔒
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-[#DCC8A8] tracking-[0.25em] uppercase block mb-1">
                                        ✦ GUEST VIEW MODE ✦
                                    </span>
                                    <h3 className="font-serif font-bold text-2xl text-[#F5F2EA]">
                                        Sign In Required to Reserve Table
                                    </h3>
                                    <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
                                        You are currently browsing as a <strong>Guest</strong>. To place a table reservation for <span className="text-[#DCC8A8] font-bold">{selectedTable.name} ({selectedArea.name})</span>, please sign in to your account.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 pt-3">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full py-3.5 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-[1.02] transition cursor-pointer shadow-xl flex items-center justify-center gap-2"
                                    >
                                        <span>Sign In to Reserve Now</span>
                                        <span>→</span>
                                    </button>
                                    <button
                                        onClick={() => setIsBookingModalOpen(false)}
                                        className="w-full py-3 bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-xs uppercase rounded-2xl transition cursor-pointer"
                                    >
                                        Continue Browsing Map
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* LOGGED IN CUSTOMER RESERVATION FORM */
                            <>
                                <div className="flex justify-between items-start pb-4 border-b border-white/10">
                                    <div>
                                        <span className="text-[10px] font-black text-[#DCC8A8] tracking-[0.2em] uppercase">
                                            ✦ LUMIÈRE TABLE RESERVATION ✦
                                        </span>
                                        <h3 className="font-serif font-bold text-2xl text-[#F5F2EA] mt-1">
                                            {selectedTable.name} ({selectedArea.name})
                                        </h3>
                                        <p className="text-xs text-slate-300 mt-0.5">
                                            📍 {selectedTable.view} · Capacity up to {selectedTable.seats} guests
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsBookingModalOpen(false)}
                                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 font-bold flex items-center justify-center text-sm cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <form onSubmit={handleConfirmBooking} className="space-y-4 mt-5 text-xs">
                                    <div>
                                        <label className="block font-bold text-[#DCC8A8] uppercase tracking-wider mb-1.5">
                                            Guest Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Enter your full name"
                                            value={bookingData.customerName}
                                            onChange={e => setBookingData({ ...bookingData, customerName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#DCC8A8] transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-bold text-[#DCC8A8] uppercase tracking-wider mb-1.5">
                                            Contact Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0912 345 678"
                                            value={bookingData.phone}
                                            onChange={e => setBookingData({ ...bookingData, phone: e.target.value })}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-[#DCC8A8] transition"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-bold text-[#DCC8A8] uppercase tracking-wider mb-1.5">
                                                Date *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                value={bookingData.date}
                                                onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                                className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#DCC8A8] transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-[#DCC8A8] uppercase tracking-wider mb-1.5">
                                                Time Slot *
                                            </label>
                                            <select
                                                value={bookingData.time}
                                                onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                                                className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-[#DCC8A8] cursor-pointer transition"
                                            >
                                                <option value="18:00" className="bg-[#081126]">18:00 PM - Early Dinner</option>
                                                <option value="19:00" className="bg-[#081126]">19:00 PM - Prime Hour</option>
                                                <option value="20:00" className="bg-[#081126]">20:00 PM - Evening Dining</option>
                                                <option value="21:00" className="bg-[#081126]">21:00 PM - Late Supper</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block font-bold text-[#DCC8A8] uppercase tracking-wider mb-1.5">
                                                Party Size (Guests)
                                            </label>
                                            <div className="flex items-center bg-white/5 border border-white/15 rounded-xl p-1 justify-between">
                                                <button
                                                    type="button"
                                                    onClick={() => setBookingData(prev => ({ ...prev, guests: Math.max(1, Number(prev.guests) - 1) }))}
                                                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#DCC8A8] hover:text-[#081126] text-white font-bold transition flex items-center justify-center cursor-pointer text-sm"
                                                >
                                                    -
                                                </button>
                                                <span className="font-bold text-white text-xs px-2">
                                                    {bookingData.guests} {Number(bookingData.guests) > 1 ? 'Guests' : 'Guest'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setBookingData(prev => ({ ...prev, guests: Math.min(selectedTable?.seats || 12, Number(prev.guests) + 1) }))}
                                                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-[#DCC8A8] hover:text-[#081126] text-white font-bold transition flex items-center justify-center cursor-pointer text-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block font-bold text-[#DCC8A8] uppercase tracking-wider mb-1.5">
                                                Occasion
                                            </label>
                                            <select
                                                value={bookingData.occasion}
                                                onChange={e => setBookingData({ ...bookingData, occasion: e.target.value })}
                                                className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-[#DCC8A8] cursor-pointer transition"
                                            >
                                                <option value="Dining" className="bg-[#081126]">Casual Fine Dining</option>
                                                <option value="Birthday" className="bg-[#081126]">Birthday Celebration</option>
                                                <option value="Anniversary" className="bg-[#081126]">Anniversary Date</option>
                                                <option value="Business" className="bg-[#081126]">Business Dinner</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-bold text-[#DCC8A8] uppercase tracking-wider mb-1.5">
                                            Special Requests / Dietary Restrictions
                                        </label>
                                        <textarea
                                            rows="2"
                                            placeholder="e.g. Birthday cake preparation, wine recommendation..."
                                            value={bookingData.notes}
                                            onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                                            className="w-full bg-white/5 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#DCC8A8] transition"
                                        ></textarea>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                        <button
                                            type="button"
                                            onClick={() => setIsBookingModalOpen(false)}
                                            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-slate-300 font-bold uppercase rounded-xl transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-6 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-black uppercase rounded-xl hover:scale-105 transition cursor-pointer shadow-xl"
                                        >
                                            Confirm Reservation
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
