import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import IconGlyph from '../../components/common/IconGlyph';

const AREAS = [
    {
        id: 'area-1',
        name: 'Grand Dining Hall',
        icon: '🏛️',
        capacity: 60,
        description: 'Atmospheric main hall featuring live piano & violin performances',
        stageText: 'LIVE PIANO & VIOLIN STAGE',
        ambientBg: 'from-amber-950/20 to-slate-950',
    },
    {
        id: 'area-2',
        name: 'Botanical Garden Lounge',
        icon: '🌿',
        capacity: 24,
        description: 'Alfresco dining surrounded by lush indoor water fountains & flora',
        stageText: 'BOTANICAL WATERFALL & LIGHTED FOUNTAIN',
        ambientBg: 'from-emerald-950/20 to-slate-950',
    },
    {
        id: 'area-3',
        name: 'Sky Bar Terrace',
        icon: '🍸',
        capacity: 30,
        description: 'Rooftop dining with 360° panoramic city skyline views',
        stageText: 'PANORAMIC CITY NIGHT SKYLINE VIEW',
        ambientBg: 'from-sky-950/20 to-slate-950',
    },
    {
        id: 'area-4',
        name: 'Private Sommelier Suite',
        icon: '👑',
        capacity: 16,
        description: 'Exclusive enclosed dining rooms with private wine sommelier service',
        stageText: 'VINTAGE SOMMELIER WINE CELLAR WALL',
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
        setToast(`Table ${selectedTable.name} (${selectedArea.name}) reserved successfully for ${bookingData.customerName || 'Guest'}!`);
        setSelectedTable(null);
        setTimeout(() => setToast(''), 4500);
    };

    // Calculate map columns based on table count for a balanced floor plan.
    const getGridColsClass = () => {
        if (currentTables.length <= 2) {
            return 'grid-cols-2 max-w-3xl mx-auto gap-6';
        }
        return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 w-full';
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 font-sans space-y-8 pb-40">

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className="fixed top-20 right-6 z-[100] bg-[#081126] text-[#DCC8A8] border-2 border-[#DCC8A8] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <IconGlyph glyph="✨" size={20} />
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
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${currentUser
                            ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                            : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                            }`}>
                            {currentUser ? <><IconGlyph glyph="👤" size={14} /> {currentUser.name} ({currentUser.role})</> : <><IconGlyph glyph="👁️" size={14} /> Guest (View Only)</>}
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
                            className={`group relative p-5 rounded-3xl border transition-all duration-300 text-left cursor-pointer overflow-hidden flex flex-col justify-between ${isActive
                                ? 'bg-[#081126] text-white border-2 border-[#DCC8A8] shadow-xl scale-[1.02]'
                                : 'bg-white text-slate-800 border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DCC8A8] to-transparent" />
                            )}
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <IconGlyph glyph={area.icon} size={30} className="drop-shadow" />
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isActive ? 'bg-[#DCC8A8] text-[#081126]' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        Cap {area.capacity}
                                    </span>
                                </div>
                                <h3 className={`font-serif font-bold text-base transition-colors ${isActive ? 'text-[#F5F2EA]' : 'text-slate-800 group-hover:text-amber-900'
                                    }`}>
                                    {area.name}
                                </h3>
                                <p className={`text-[11px] mt-1 line-clamp-2 leading-snug ${isActive ? 'text-slate-300' : 'text-slate-500'
                                    }`}>
                                    {area.description}
                                </p>
                            </div>

                            <div className={`mt-4 pt-3 border-t flex justify-between items-center text-[10px] ${isActive ? 'border-white/10' : 'border-slate-100'
                                }`}>
                                <span className={`font-mono font-medium ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {tableCount} Tables
                                </span>
                                <span className={`font-bold transition-transform group-hover:translate-x-1 ${isActive ? 'text-[#DCC8A8]' : 'text-slate-600 group-hover:text-amber-800'
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
                        <IconGlyph glyph="🚪" size={15} /> MAIN ENTRANCE & CONCIERGE
                    </div>
                    <div className="absolute bottom-4 right-6 text-[9px] font-bold text-slate-400 tracking-widest uppercase pointer-events-none font-mono">
                        <IconGlyph glyph="🍸" size={15} /> BAR & SOMMELIER DISPATCH <IconGlyph glyph="🍷" size={15} />
                    </div>

                    {/* FLOOR PLAN */}
                    <div className="relative z-10 my-4 rounded-2xl border border-white/10 bg-slate-950/30 p-4 sm:p-8">
                        <div className="mb-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] font-semibold text-slate-300">
                            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Available</span>
                            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /> Reserved</span>
                            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#DCC8A8]" /> Selected</span>
                        </div>
                        <div className={`grid ${getGridColsClass()}`}>
                            {currentTables.map((tbl) => {
                                const isSelected = selectedTable?.id === tbl.id;
                                const isReserved = tbl.status === 'reserved';
                                const isRound = tbl.shape === 'round';
                                const chairCount = Math.min(Math.max(tbl.seats, 2), 8);
                                const chairs = Array.from({ length: chairCount }, (_, index) => {
                                    const angle = ((360 / chairCount) * index - 90) * Math.PI / 180;
                                    return { x: Math.cos(angle) * 43, y: Math.sin(angle) * 36 };
                                });

                                return (
                                    <div
                                        key={tbl.id}
                                        onClick={() => handleSelectTable(tbl)}
                                        className={`group relative flex min-h-[210px] cursor-pointer flex-col items-center rounded-2xl border px-3 py-4 text-center transition-all duration-300 ${isReserved
                                            ? 'border-slate-800/80 bg-slate-950/60 text-slate-500 opacity-60'
                                            : isSelected
                                                ? 'border-[#DCC8A8] bg-[#0f224a]/70 text-white ring-2 ring-[#DCC8A8]/30 shadow-[0_10px_25px_rgba(220,200,168,0.18)]'
                                                : 'border-white/10 bg-white/[0.03] text-white shadow-lg hover:border-[#DCC8A8]/60 hover:bg-white/[0.07]'
                                            }`}
                                    >
                                        <div className="relative mb-2 flex h-28 w-32 items-center justify-center">
                                            {chairs.map((chair, index) => (
                                                <span
                                                    key={index}
                                                    aria-hidden="true"
                                                    className={`absolute z-10 h-3 w-3 rounded-[3px] border shadow-sm ${isReserved
                                                        ? 'border-rose-800 bg-rose-400/70'
                                                        : isSelected
                                                            ? 'border-[#DCC8A8] bg-[#DCC8A8]'
                                                            : 'border-emerald-400 bg-emerald-300'
                                                        }`}
                                                    style={{
                                                        left: `calc(50% + ${chair.x}px - 6px)`,
                                                        top: `calc(50% + ${chair.y}px - 6px)`,
                                                    }}
                                                />
                                            ))}
                                            <div className={`relative z-20 flex flex-col items-center justify-center border-2 shadow-md transition-all ${isRound ? 'h-16 w-16 rounded-full' : tbl.shape === 'square' ? 'h-14 w-14 rounded-xl' : 'h-12 w-[4.5rem] rounded-xl'
                                                } ${isReserved
                                                    ? 'border-rose-400 bg-rose-950/80 text-rose-200'
                                                    : isSelected
                                                        ? 'border-[#DCC8A8] bg-[#DCC8A8] text-[#081126]'
                                                        : 'border-emerald-400 bg-slate-900 text-emerald-200 group-hover:bg-emerald-950/60'
                                                }`}>
                                                <span className="text-[10px] font-black tracking-tight">{tbl.id}</span>
                                                <span className="text-[9px] font-bold opacity-80">{tbl.seats}p</span>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-1">
                                            <span className="block text-xs font-bold text-[#F5F2EA]">{tbl.name}</span>
                                            <span className="inline-flex items-center gap-1 text-[9px] text-slate-400">
                                                <IconGlyph glyph="📍" size={11} /> {tbl.view}
                                            </span>
                                        </div>
                                        <div className="mt-auto flex w-full justify-center pt-2 text-[9px]">
                                            <span className={`rounded-lg px-2.5 py-1 font-extrabold uppercase transition ${isReserved
                                                ? 'border border-rose-800/60 bg-rose-950/80 text-rose-300'
                                                : isSelected
                                                    ? 'bg-[#DCC8A8] text-[#081126] shadow-md'
                                                    : 'border border-emerald-800/60 bg-emerald-950/50 text-emerald-300 group-hover:bg-emerald-900/60'
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
            </div>

            {/* FLOATING BOOKING BAR FOR GUEST */}
            {selectedTable && createPortal(
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] max-w-3xl w-[92%] bg-[#081126]/95 backdrop-blur-2xl text-white border-2 border-[#DCC8A8] p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row justify-between items-center gap-4 animate-slide-up">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DCC8A8] to-[#bfa780] text-[#081126] flex items-center justify-center text-xl font-black shadow-lg">
                            <IconGlyph glyph="⭐" size={16} />
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
                </div>,
                document.body,
            )}

            {/* RESERVATION FORM / GUEST PROMPT MODAL */}
            {isBookingModalOpen && selectedTable && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative animate-fadeIn">

                        {/* Header strip */}
                        <div className="bg-gradient-to-r from-[#081126] via-[#0f224a] to-[#081126] px-7 py-5 flex justify-between items-start">
                            <div>
                                <span className="text-[10px] font-black text-[#DCC8A8] tracking-[0.22em] uppercase block">
                                    ✦ LUMIÈRE TABLE RESERVATION ✦
                                </span>
                                <h3 className="font-serif font-bold text-xl text-white mt-1">
                                    {!currentUser ? 'Sign In to Reserve' : `${selectedTable.name} (${selectedArea.name})`}
                                </h3>
                                {currentUser && (
                                    <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                                        <IconGlyph glyph="📍" size={12} /> {selectedTable.view} · Up to {selectedTable.seats} guests
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsBookingModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white font-bold flex items-center justify-center text-sm cursor-pointer mt-0.5 shrink-0 transition"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {!currentUser ? (
                            <div className="text-center space-y-5 px-8 py-8">
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-3xl mx-auto shadow-sm">
                                    <IconGlyph glyph="🔒" size={28} />
                                </div>
                                <div>
                                    <h4 className="font-serif font-bold text-xl text-slate-900">Sign In Required</h4>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
                                        To reserve <span className="text-amber-700 font-bold">{selectedTable.name} ({selectedArea.name})</span>, please sign in first.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="w-full py-3.5 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-[1.02] transition cursor-pointer shadow-md"
                                    >
                                        Sign In to Reserve →
                                    </button>
                                    <button
                                        onClick={() => setIsBookingModalOpen(false)}
                                        className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase rounded-2xl transition cursor-pointer"
                                    >
                                        Continue Browsing
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleConfirmBooking} className="px-7 py-6 space-y-4 text-xs">

                                <div>
                                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Guest Full Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter your full name"
                                        value={bookingData.customerName}
                                        onChange={e => setBookingData({ ...bookingData, customerName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contact Phone Number *</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="0912 345 678"
                                        value={bookingData.phone}
                                        onChange={e => setBookingData({ ...bookingData, phone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-mono font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={bookingData.date}
                                            onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time Slot *</label>
                                        <select
                                            value={bookingData.time}
                                            onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer transition"
                                        >
                                            <option value="18:00">18:00 PM - Early Dinner</option>
                                            <option value="19:00">19:00 PM - Prime Hour</option>
                                            <option value="20:00">20:00 PM - Evening Dining</option>
                                            <option value="21:00">21:00 PM - Late Supper</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Party Size (Guests)</label>
                                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 justify-between">
                                            <button
                                                type="button"
                                                onClick={() => setBookingData(prev => ({ ...prev, guests: Math.max(1, Number(prev.guests) - 1) }))}
                                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-amber-200 text-slate-700 font-bold transition flex items-center justify-center cursor-pointer text-sm"
                                            >
                                                -
                                            </button>
                                            <span className="font-bold text-slate-800 text-sm">
                                                {bookingData.guests} {Number(bookingData.guests) > 1 ? 'Guests' : 'Guest'}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setBookingData(prev => ({ ...prev, guests: Math.min(selectedTable?.seats || 12, Number(prev.guests) + 1) }))}
                                                className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-amber-200 text-slate-700 font-bold transition flex items-center justify-center cursor-pointer text-sm"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Occasion</label>
                                        <select
                                            value={bookingData.occasion}
                                            onChange={e => setBookingData({ ...bookingData, occasion: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 cursor-pointer transition"
                                        >
                                            <option value="Dining">Casual Fine Dining</option>
                                            <option value="Birthday">Birthday Celebration</option>
                                            <option value="Anniversary">Anniversary Date</option>
                                            <option value="Business">Business Dinner</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-500 uppercase tracking-wider mb-1.5">Special Requests / Dietary Restrictions</label>
                                    <textarea
                                        rows="2"
                                        placeholder="e.g. Birthday cake preparation, wine recommendation..."
                                        value={bookingData.notes}
                                        onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition resize-none"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsBookingModalOpen(false)}
                                        className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase rounded-xl transition cursor-pointer text-xs"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-black uppercase rounded-xl hover:scale-105 transition cursor-pointer shadow-md text-xs tracking-wide"
                                    >
                                        Confirm Reservation
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>,
                document.body,
            )}

        </div>
    );
}
