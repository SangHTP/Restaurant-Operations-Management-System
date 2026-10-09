import { useState, useMemo } from 'react';
import { INITIAL_AREAS, INITIAL_TABLES, STATUS_STYLES, TABLE_STATUSES } from '../../data/mockTables';
import { useAuth } from '../../context/AuthContext';

/* ─── Refined Status Badge ─── */
function StatusBadge({ status, small = false }) {
    const s = STATUS_STYLES[status] || STATUS_STYLES.Available;
    return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-md border
            ${small ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5'}
            ${s.light} ${s.text} ${s.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.bg}`} />
            {status}
        </span>
    );
}

/* ─── Elegant Table on Floor Plan ─── */
function FloorTable({ table, isSelected, onSelect, onRightClick }) {
    const s = STATUS_STYLES[table.status] || STATUS_STYLES.Available;
    const seats = table.seats;
    const isLarge = seats >= 6;

    // Generate chair positions around table
    const chairs = [];
    const count = seats;
    for (let i = 0; i < count; i++) {
        const angle = (360 / count) * i - 90;
        const rad = (angle * Math.PI) / 180;
        const dist = isLarge ? 38 : 32;
        chairs.push({
            x: Math.cos(rad) * dist,
            y: Math.sin(rad) * dist,
        });
    }

    return (
        <div
            className="absolute cursor-pointer group"
            style={{ left: `${table.x}%`, top: `${table.y}%`, transform: 'translate(-50%, -50%)' }}
            onClick={() => onSelect(table)}
            onContextMenu={(e) => { e.preventDefault(); onRightClick(table); }}
        >
            {/* Chairs around table */}
            {chairs.map((c, i) => (
                <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-sm border transition-colors duration-300
                        ${table.status === 'Available' ? 'bg-emerald-200 border-emerald-400' :
                          table.status === 'Occupied' ? 'bg-rose-200 border-rose-400' :
                          table.status === 'Reserved' ? 'bg-amber-200 border-amber-400' :
                          table.status === 'Cleaning' ? 'bg-sky-200 border-sky-300' :
                          table.status === 'Merged' ? 'bg-violet-200 border-violet-400' :
                          'bg-orange-200 border-orange-400'}`}
                    style={{
                        left: `calc(50% + ${c.x}px - 6px)`,
                        top: `calc(50% + ${c.y}px - 6px)`,
                        borderRadius: '3px',
                    }}
                />
            ))}

            {/* Table body */}
            <div className={`
                relative z-10 flex flex-col items-center justify-center
                transition-all duration-300 border-2 shadow-md
                ${isLarge ? 'w-16 h-12 rounded-xl' : 'w-14 h-14 rounded-full'}
                ${isSelected
                    ? 'ring-[3px] ring-offset-2 ring-[#DCC8A8] shadow-lg scale-110 z-30'
                    : 'group-hover:scale-105 group-hover:shadow-lg'}
                ${table.status === 'Available' ? 'bg-white border-emerald-400 text-emerald-700' :
                  table.status === 'Occupied' ? 'bg-rose-50 border-rose-400 text-rose-700' :
                  table.status === 'Reserved' ? 'bg-amber-50 border-amber-400 text-amber-700' :
                  table.status === 'Cleaning' ? 'bg-sky-50 border-sky-400 text-sky-700' :
                  table.status === 'Merged' ? 'bg-violet-50 border-violet-400 text-violet-700' :
                  'bg-orange-50 border-orange-400 text-orange-700'}
            `}>
                <span className="text-[11px] font-bold leading-none">{table.name}</span>
                <span className="text-[8px] font-medium opacity-70 mt-0.5">{seats}p</span>

                {table.mergedWith && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-violet-500 text-white text-[7px] font-bold flex items-center justify-center border border-white">
                        M
                    </div>
                )}
            </div>

            {/* Hover tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-40">
                <span className="text-[9px] font-medium bg-slate-800 text-white px-2 py-0.5 rounded shadow-lg">
                    {table.guest || table.status}
                </span>
            </div>
        </div>
    );
}

/* ─── Main Component ─── */
export default function TableLayout() {
    const { currentUser } = useAuth();
    const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Owner';
    const isStaff = currentUser?.role === 'Staff' || isManager;

    const [areas, setAreas] = useState(INITIAL_AREAS);
    const [tables, setTables] = useState(INITIAL_TABLES);
    const [selectedAreaId, setSelectedAreaId] = useState('area-1');
    const [selectedTable, setSelectedTable] = useState(null);
    const [viewMode, setViewMode] = useState('floorplan');

    const [toast, setToast] = useState(null);
    const showToast = (msg, type = 'info') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    // Modals
    const [areaModal, setAreaModal] = useState(null);
    const [tableModal, setTableModal] = useState(null);
    const [statusModal, setStatusModal] = useState(null);
    const [transferModal, setTransferModal] = useState(null);
    const [mergeModal, setMergeModal] = useState(null);

    // Forms
    const [areaForm, setAreaForm] = useState({ name: '', description: '', capacity: 40, icon: '🏛️' });
    const [tableForm, setTableForm] = useState({ name: '', seats: 4, areaId: selectedAreaId, status: 'Available' });

    const currentArea = useMemo(() => areas.find(a => a.id === selectedAreaId), [areas, selectedAreaId]);
    const areaTableMap = useMemo(() => {
        const m = {};
        areas.forEach(a => { m[a.id] = tables.filter(t => t.areaId === a.id); });
        return m;
    }, [areas, tables]);
    const floorTables = areaTableMap[selectedAreaId] || [];

    const stats = useMemo(() => {
        const t = floorTables;
        return {
            total: t.length,
            available: t.filter(x => x.status === 'Available').length,
            occupied: t.filter(x => x.status === 'Occupied').length,
            reserved: t.filter(x => x.status === 'Reserved').length,
            cleaning: t.filter(x => x.status === 'Cleaning').length,
            merged: t.filter(x => x.status === 'Merged').length,
        };
    }, [floorTables]);

    // ── Handlers ──
    const handleCreateArea = (e) => {
        e.preventDefault();
        setAreas([...areas, { id: `area-${Date.now()}`, ...areaForm, color: '#0b132b' }]);
        setAreaModal(null);
        showToast(`Area "${areaForm.name}" created`);
    };
    const handleUpdateArea = (e) => {
        e.preventDefault();
        setAreas(prev => prev.map(a => a.id === areaModal.id ? { ...areaModal } : a));
        setAreaModal(null);
        showToast(`Area updated`);
    };
    const [confirmModal, setConfirmModal] = useState(null);

    const handleDeleteArea = (id, name) => {
        setConfirmModal({
            title: 'Delete Dining Area',
            message: `Are you sure you want to delete area "${name}" and all its tables? This action cannot be undone.`,
            actionText: 'Delete Area',
            onConfirm: () => {
                setAreas(prev => prev.filter(a => a.id !== id));
                setTables(prev => prev.filter(t => t.areaId !== id));
                if (selectedAreaId === id) setSelectedAreaId(areas[0]?.id);
                showToast(`Area "${name}" deleted`, 'error');
                setConfirmModal(null);
            }
        });
    };
    const handleCreateTable = (e) => {
        e.preventDefault();
        const count = (areaTableMap[tableForm.areaId] || []).length;
        setTables([...tables, {
            id: `T-${Date.now()}`, ...tableForm,
            seats: Number(tableForm.seats),
            x: 12 + (count % 5) * 18, y: 18 + Math.floor(count / 5) * 32,
            guest: null, mergedWith: null, note: '',
        }]);
        setTableModal(null);
        showToast(`Table "${tableForm.name}" created`);
    };
    const handleUpdateTable = (e) => {
        e.preventDefault();
        setTables(prev => prev.map(t => t.id === tableModal.id ? { ...tableModal, seats: Number(tableModal.seats) } : t));
        setTableModal(null); setSelectedTable(null);
        showToast(`Table updated`);
    };
    const handleDeleteTable = (t) => {
        setConfirmModal({
            title: 'Delete Table',
            message: `Are you sure you want to remove table "${t.name}" from the floor plan?`,
            actionText: 'Delete Table',
            onConfirm: () => {
                setTables(prev => prev.filter(x => x.id !== t.id));
                setSelectedTable(null);
                showToast(`Table "${t.name}" deleted`, 'error');
                setConfirmModal(null);
            }
        });
    };
    const handleSetStatus = (id, status, guest, note) => {
        setTables(prev => prev.map(t =>
            t.id === id ? { ...t, status, guest: guest ?? t.guest, note: note ?? t.note } : t
        ));
        setStatusModal(null);
        if (selectedTable?.id === id) setSelectedTable(p => ({ ...p, status, guest: guest ?? p.guest, note: note ?? p.note }));
        showToast(`Status → ${status}`);
    };
    const handleTransfer = (from, toId) => {
        const to = tables.find(t => t.id === toId);
        if (!to) return;
        setTables(prev => prev.map(t => {
            if (t.id === from.id) return { ...t, status: 'Cleaning', guest: null, note: `Transferred → ${to.name}` };
            if (t.id === toId) return { ...t, status: 'Transferred', guest: from.guest, note: `← ${from.name}` };
            return t;
        }));
        setTransferModal(null); setSelectedTable(null);
        showToast(`${from.name} → ${to.name}`);
    };
    const handleMerge = (a, bId) => {
        const b = tables.find(t => t.id === bId);
        if (!b) return;
        const g = a.guest || b.guest || 'Merged Group';
        setTables(prev => prev.map(t => {
            if (t.id === a.id) return { ...t, status: 'Merged', mergedWith: b.name, guest: g };
            if (t.id === bId) return { ...t, status: 'Merged', mergedWith: a.name, guest: g };
            return t;
        }));
        setMergeModal(null); setSelectedTable(null);
        showToast(`${a.name} & ${b.name} merged`);
    };
    const handleSplit = (t) => {
        if (!t.mergedWith) return;
        setTables(prev => prev.map(x =>
            x.mergedWith === t.name || x.id === t.id
                ? { ...x, status: 'Available', mergedWith: null, guest: null, note: 'Split' } : x
        ));
        setSelectedTable(null);
        showToast(`Split done`);
    };

    const availTransfer = tables.filter(t => t.areaId === selectedAreaId && t.status === 'Available' && t.id !== selectedTable?.id);
    const availMerge = tables.filter(t => t.areaId === selectedAreaId && t.id !== mergeModal?.id && t.status !== 'Merged');

    return (
        <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5 font-sans">

            {/* Toast */}
            {toast && (
                <div className={`fixed top-20 right-6 z-[100] px-5 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border animate-bounce
                    ${toast.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]/30'}`}>
                    <span>{toast.type === 'error' ? '⚠' : '✓'}</span> {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="bg-[#081126] rounded-2xl p-6 border border-[#DCC8A8]/20 shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-60 h-60 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <p className="text-[10px] font-bold text-[#DCC8A8] tracking-[.2em] uppercase">✦ Lumière Restaurant ✦</p>
                        <h1 className="text-2xl font-serif font-bold text-[#F5F2EA] mt-0.5">Table & Floor Plan</h1>
                        <p className="text-[11px] text-[#8995AD] mt-1">Interactive layout with real-time status management</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-white/10 rounded-lg p-0.5 border border-white/10">
                            {['floorplan', 'list'].map(m => (
                                <button key={m} onClick={() => setViewMode(m)}
                                    className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition cursor-pointer
                                        ${viewMode === m ? 'bg-[#DCC8A8] text-[#081126] shadow' : 'text-slate-400 hover:text-white'}`}>
                                    {m === 'floorplan' ? '🗺 Floor Plan' : '📋 List'}
                                </button>
                            ))}
                        </div>
                        {isManager && (
                            <>
                                <button onClick={() => { setAreaForm({ name:'', description:'', capacity:40, icon:'🏛️' }); setAreaModal('create'); }}
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-[#DCC8A8] text-[11px] font-semibold rounded-lg transition cursor-pointer">+ Area</button>
                                <button onClick={() => { setTableForm({ name:'', seats:4, areaId:selectedAreaId, status:'Available' }); setTableModal('create'); }}
                                    className="px-3.5 py-1.5 bg-[#DCC8A8] text-[#081126] text-[11px] font-bold rounded-lg shadow hover:brightness-110 transition cursor-pointer">+ Table</button>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                    {[
                        { l: 'Total', v: stats.total, c: 'text-white/90' },
                        { l: 'Available', v: stats.available, c: 'text-emerald-400' },
                        { l: 'Occupied', v: stats.occupied, c: 'text-rose-400' },
                        { l: 'Reserved', v: stats.reserved, c: 'text-amber-400' },
                        { l: 'Cleaning', v: stats.cleaning, c: 'text-sky-400' },
                        { l: 'Merged', v: stats.merged, c: 'text-violet-400' },
                    ].map(s => (
                        <div key={s.l} className="bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 min-w-[80px]">
                            <span className={`text-lg font-bold block leading-none ${s.c}`}>{s.v}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-semibold tracking-wide">{s.l}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Area Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-0.5">
                {areas.map(area => (
                    <button key={area.id}
                        onClick={() => { setSelectedAreaId(area.id); setSelectedTable(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-left whitespace-nowrap transition cursor-pointer group
                            ${selectedAreaId === area.id
                                ? 'bg-[#081126] text-[#F5F2EA] border-[#DCC8A8]/40 shadow-md'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}>
                        <span className="text-base">{area.icon}</span>
                        <div>
                            <div className="text-xs font-bold">{area.name}</div>
                            <div className={`text-[10px] ${selectedAreaId === area.id ? 'text-[#DCC8A8]/60' : 'text-slate-400'}`}>
                                {areaTableMap[area.id]?.length || 0} tables
                            </div>
                        </div>
                        {isManager && (
                            <div className="flex gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">
                                <span onClick={e => { e.stopPropagation(); setAreaModal({...area}); }} className="hover:bg-white/20 p-1 rounded cursor-pointer">✏️</span>
                                <span onClick={e => { e.stopPropagation(); handleDeleteArea(area.id, area.name); }} className="hover:bg-rose-100 p-1 rounded cursor-pointer">🗑</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ FLOOR PLAN ═══ */}
            {viewMode === 'floorplan' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">

                    {/* Canvas */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Header bar */}
                        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span>{currentArea?.icon}</span>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">{currentArea?.name}</h2>
                                    <p className="text-[10px] text-slate-400">{currentArea?.description} · Cap {currentArea?.capacity}</p>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-400 hidden sm:block">Click table to select · Right-click for quick status</div>
                        </div>

                        {/* Legend */}
                        <div className="px-4 py-2 border-b border-slate-50 flex flex-wrap gap-3">
                            {Object.entries(STATUS_STYLES).map(([k, s]) => (
                                <div key={k} className="flex items-center gap-1 text-[9px] font-medium text-slate-500">
                                    <span className={`w-2 h-2 rounded-full ${s.bg}`} />{k}
                                </div>
                            ))}
                        </div>

                        {/* Canvas area */}
                        <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50" style={{ minHeight: '480px' }}>
                            {/* Subtle dot grid */}
                            <div className="absolute inset-0" style={{
                                backgroundImage: 'radial-gradient(circle, #cbd5e1 0.6px, transparent 0.6px)',
                                backgroundSize: '24px 24px',
                                opacity: 0.4,
                            }} />

                            {/* Entrance label */}
                            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-semibold text-slate-300 tracking-[.15em] uppercase pointer-events-none select-none">
                                ▼ Entrance
                            </div>

                            {/* Tables */}
                            {floorTables.map(t => (
                                <FloorTable
                                    key={t.id}
                                    table={t}
                                    isSelected={selectedTable?.id === t.id}
                                    onSelect={setSelectedTable}
                                    onRightClick={(tbl) => { setSelectedTable(tbl); setStatusModal(tbl); }}
                                />
                            ))}

                            {floorTables.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                    <span className="text-4xl mb-2">🪑</span>
                                    <p className="text-sm font-medium">No tables in this area</p>
                                    {isManager && (
                                        <button onClick={() => { setTableForm({ name:'', seats:4, areaId:selectedAreaId, status:'Available' }); setTableModal('create'); }}
                                            className="mt-3 text-xs font-semibold px-4 py-2 bg-[#081126] text-[#DCC8A8] rounded-lg cursor-pointer">
                                            + Add First Table
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Kitchen label */}
                            <div className="absolute bottom-2.5 right-4 text-[8px] font-semibold text-slate-300 tracking-[.15em] uppercase pointer-events-none select-none">
                                Kitchen & Bar ▸
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {selectedTable ? (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className={`px-4 py-4 border-b ${STATUS_STYLES[selectedTable.status]?.light || 'bg-slate-50'}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Selected Table</p>
                                            <h3 className="text-xl font-serif font-bold text-slate-900 mt-0.5">{selectedTable.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <StatusBadge status={selectedTable.status} />
                                                <span className="text-[10px] font-medium text-slate-500">{selectedTable.seats} seats</span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedTable(null)}
                                            className="w-6 h-6 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center text-xs cursor-pointer hover:bg-slate-300">✕</button>
                                    </div>
                                </div>

                                <div className="p-4 space-y-3">
                                    {selectedTable.guest && (
                                        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Guest</p>
                                            <p className="text-xs font-semibold text-slate-800 mt-0.5">👥 {selectedTable.guest}</p>
                                        </div>
                                    )}
                                    {selectedTable.mergedWith && (
                                        <div className="bg-violet-50 rounded-lg p-3 border border-violet-100">
                                            <p className="text-[9px] font-bold text-violet-400 uppercase">Merged With</p>
                                            <p className="text-xs font-semibold text-violet-800 mt-0.5">🔗 {selectedTable.mergedWith}</p>
                                        </div>
                                    )}
                                    {selectedTable.note && (
                                        <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                            <p className="text-[9px] font-bold text-amber-500 uppercase">Note</p>
                                            <p className="text-[11px] text-amber-800 mt-0.5">{selectedTable.note}</p>
                                        </div>
                                    )}

                                    <div className="space-y-1.5 pt-1">
                                        {isStaff && (
                                            <button onClick={() => setStatusModal(selectedTable)}
                                                className="w-full py-2 bg-[#081126] text-[#DCC8A8] text-[11px] font-semibold rounded-lg hover:bg-slate-800 cursor-pointer transition">
                                                ⚡ Update Status
                                            </button>
                                        )}
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {isStaff && selectedTable.status === 'Occupied' && (
                                                <button onClick={() => setTransferModal(selectedTable)}
                                                    className="py-1.5 bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-semibold rounded-lg cursor-pointer hover:bg-orange-100 transition">
                                                    🔄 Transfer
                                                </button>
                                            )}
                                            {isStaff && (
                                                <button onClick={() => selectedTable.mergedWith ? handleSplit(selectedTable) : setMergeModal(selectedTable)}
                                                    className="py-1.5 bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-semibold rounded-lg cursor-pointer hover:bg-violet-100 transition">
                                                    {selectedTable.mergedWith ? '✂ Split' : '🔗 Merge'}
                                                </button>
                                            )}
                                        </div>
                                        {isManager && (
                                            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                                                <button onClick={() => setTableModal({...selectedTable})}
                                                    className="py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg cursor-pointer hover:bg-slate-100 transition">
                                                    ✏ Edit
                                                </button>
                                                <button onClick={() => handleDeleteTable(selectedTable)}
                                                    className="py-1.5 bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-semibold rounded-lg cursor-pointer hover:bg-rose-100 transition">
                                                    🗑 Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                                <span className="text-3xl block mb-2 opacity-40">🖱️</span>
                                <p className="text-xs font-medium text-slate-500">Select a table on the floor plan</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">to view details and take actions</p>
                            </div>
                        )}

                        {/* Table list in sidebar */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Tables Overview</h4>
                                <span className="text-[10px] text-slate-400">{floorTables.length}</span>
                            </div>
                            <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                                {floorTables.map(t => (
                                    <div key={t.id}
                                        onClick={() => setSelectedTable(t)}
                                        className={`px-4 py-2 flex items-center justify-between cursor-pointer transition hover:bg-slate-50
                                            ${selectedTable?.id === t.id ? 'bg-amber-50/50' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold ${STATUS_STYLES[t.status]?.bg}`}>
                                                {t.name.slice(-2)}
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-semibold text-slate-800 block leading-tight">{t.name}</span>
                                                <span className="text-[9px] text-slate-400">{t.seats}p{t.guest ? ` · ${t.guest}` : ''}</span>
                                            </div>
                                        </div>
                                        <StatusBadge status={t.status} small />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ LIST VIEW ═══ */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h2 className="text-sm font-bold text-slate-800">{currentArea?.name} — All Tables</h2>
                        <span className="text-[10px] text-slate-400">{floorTables.length} tables</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    {['Table', 'Seats', 'Status', 'Guest', 'Note', 'Actions'].map(h => (
                                        <th key={h} className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {floorTables.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                                        <td className="px-4 py-2.5 font-bold text-slate-800 font-mono">{t.name}</td>
                                        <td className="px-4 py-2.5 text-slate-600">{t.seats}</td>
                                        <td className="px-4 py-2.5"><StatusBadge status={t.status} small /></td>
                                        <td className="px-4 py-2.5 text-slate-600">{t.guest || <span className="text-slate-300">—</span>}</td>
                                        <td className="px-4 py-2.5 text-slate-400 max-w-[160px] truncate">{t.note || '—'}</td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex gap-1">
                                                {isStaff && (
                                                    <button onClick={() => { setSelectedTable(t); setStatusModal(t); }}
                                                        className="px-2 py-1 bg-[#081126] text-[#DCC8A8] rounded text-[10px] font-semibold cursor-pointer hover:bg-slate-800">Status</button>
                                                )}
                                                {isManager && (
                                                    <>
                                                        <button onClick={() => { setSelectedTable(t); setTableModal({...t}); }}
                                                            className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-semibold cursor-pointer hover:bg-slate-200">Edit</button>
                                                        <button onClick={() => handleDeleteTable(t)}
                                                            className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-[10px] font-semibold cursor-pointer hover:bg-rose-100">Del</button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ═══ MODALS ═══ */}
            {statusModal && (
                <ModalShell title={`Status: ${statusModal.name}`} onClose={() => setStatusModal(null)}>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {Object.values(TABLE_STATUSES).map(s => (
                            <button key={s} type="button" onClick={() => handleSetStatus(statusModal.id, s)}
                                className={`py-2 px-2 rounded-lg border text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 transition
                                    ${s === statusModal.status ? 'ring-2 ring-[#081126]' : 'hover:brightness-95'}
                                    ${STATUS_STYLES[s]?.light} ${STATUS_STYLES[s]?.text} ${STATUS_STYLES[s]?.border}`}>
                                <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[s]?.bg}`} />{s}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2.5">
                        <InputField label="Guest Name" id="guestInput" defaultValue={statusModal.guest || ''} placeholder="e.g. Nguyen Family" />
                        <InputField label="Staff Note" id="noteInput" defaultValue={statusModal.note || ''} placeholder="e.g. Birthday setup" />
                        <button type="button" onClick={() => {
                            handleSetStatus(statusModal.id, statusModal.status,
                                document.getElementById('guestInput')?.value,
                                document.getElementById('noteInput')?.value);
                        }} className="w-full py-2 bg-[#081126] text-[#DCC8A8] text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-slate-800">
                            Save Details
                        </button>
                    </div>
                </ModalShell>
            )}

            {transferModal && (
                <ModalShell title={`Transfer: ${transferModal.name}`} onClose={() => setTransferModal(null)}>
                    <p className="text-[11px] text-slate-500 mb-3">Guest: <strong>{transferModal.guest}</strong> → Select destination:</p>
                    {availTransfer.length === 0
                        ? <p className="text-center text-xs text-slate-400 py-4">No available tables.</p>
                        : <div className="grid grid-cols-3 gap-2">
                            {availTransfer.map(t => (
                                <button key={t.id} onClick={() => handleTransfer(transferModal, t.id)}
                                    className="py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-emerald-100 transition text-center">
                                    {t.name}<br /><span className="text-[9px] text-emerald-600">{t.seats}p</span>
                                </button>
                            ))}
                        </div>
                    }
                </ModalShell>
            )}

            {mergeModal && (
                <ModalShell title={`Merge: ${mergeModal.name}`} onClose={() => setMergeModal(null)}>
                    <p className="text-[11px] text-slate-500 mb-3">Select table to merge with <strong>{mergeModal.name}</strong>:</p>
                    {availMerge.length === 0
                        ? <p className="text-center text-xs text-slate-400 py-4">No tables available.</p>
                        : <div className="grid grid-cols-3 gap-2">
                            {availMerge.map(t => (
                                <button key={t.id} onClick={() => handleMerge(mergeModal, t.id)}
                                    className={`py-2 border rounded-lg text-[11px] font-semibold cursor-pointer hover:brightness-95 transition text-center
                                        ${STATUS_STYLES[t.status]?.light} ${STATUS_STYLES[t.status]?.border} ${STATUS_STYLES[t.status]?.text}`}>
                                    {t.name}<br /><span className="text-[9px]">{t.seats}p</span>
                                </button>
                            ))}
                        </div>
                    }
                </ModalShell>
            )}

            {areaModal && (
                <ModalShell title={typeof areaModal === 'string' ? 'New Area' : `Edit: ${areaModal.name}`} onClose={() => setAreaModal(null)}>
                    <form onSubmit={typeof areaModal === 'string' ? handleCreateArea : handleUpdateArea} className="space-y-3">
                        <InputField label="Area Name" required value={typeof areaModal === 'string' ? areaForm.name : areaModal.name}
                            onChange={e => typeof areaModal === 'string' ? setAreaForm({...areaForm, name:e.target.value}) : setAreaModal({...areaModal, name:e.target.value})} />
                        <InputField label="Description" value={typeof areaModal === 'string' ? areaForm.description : areaModal.description}
                            onChange={e => typeof areaModal === 'string' ? setAreaForm({...areaForm, description:e.target.value}) : setAreaModal({...areaModal, description:e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                            <InputField label="Capacity" type="number" value={typeof areaModal === 'string' ? areaForm.capacity : areaModal.capacity}
                                onChange={e => typeof areaModal === 'string' ? setAreaForm({...areaForm, capacity:+e.target.value}) : setAreaModal({...areaModal, capacity:+e.target.value})} />
                            <InputField label="Icon" value={typeof areaModal === 'string' ? areaForm.icon : areaModal.icon}
                                onChange={e => typeof areaModal === 'string' ? setAreaForm({...areaForm, icon:e.target.value}) : setAreaModal({...areaModal, icon:e.target.value})} />
                        </div>
                        <button type="submit" className="w-full py-2 bg-[#081126] text-[#DCC8A8] text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-slate-800">
                            {typeof areaModal === 'string' ? 'Create' : 'Save'}
                        </button>
                    </form>
                </ModalShell>
            )}

            {tableModal && (
                <ModalShell title={typeof tableModal === 'string' ? 'New Table' : `Edit: ${tableModal.name}`} onClose={() => setTableModal(null)}>
                    <form onSubmit={typeof tableModal === 'string' ? handleCreateTable : handleUpdateTable} className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <InputField label="Table Name" required value={typeof tableModal === 'string' ? tableForm.name : tableModal.name}
                                onChange={e => typeof tableModal === 'string' ? setTableForm({...tableForm, name:e.target.value}) : setTableModal({...tableModal, name:e.target.value})} />
                            <InputField label="Seats" type="number" min="1" max="20" value={typeof tableModal === 'string' ? tableForm.seats : tableModal.seats}
                                onChange={e => typeof tableModal === 'string' ? setTableForm({...tableForm, seats:+e.target.value}) : setTableModal({...tableModal, seats:+e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Area</label>
                            <select value={typeof tableModal === 'string' ? tableForm.areaId : tableModal.areaId}
                                onChange={e => typeof tableModal === 'string' ? setTableForm({...tableForm, areaId:e.target.value}) : setTableModal({...tableModal, areaId:e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs cursor-pointer focus:ring-1 focus:ring-[#DCC8A8]">
                                {areas.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="w-full py-2 bg-[#081126] text-[#DCC8A8] text-[11px] font-semibold rounded-lg cursor-pointer hover:bg-slate-800">
                            {typeof tableModal === 'string' ? 'Create' : 'Save'}
                        </button>
                    </form>
                </ModalShell>
            )}

            {confirmModal && (
                <ModalShell title={confirmModal.title} onClose={() => setConfirmModal(null)}>
                    <div className="space-y-4 font-sans">
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 leading-relaxed font-medium">
                            {confirmModal.message}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer transition"
                            >
                                {confirmModal.actionText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </ModalShell>
            )}
        </div>
    );
}

/* ─── Reusable Components ─── */
function ModalShell({ title, children, onClose }) {
    return (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] cursor-pointer hover:bg-slate-200">✕</button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

function InputField({ label, id, ...props }) {
    return (
        <div>
            {label && <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{label}</label>}
            <input
                id={id}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#DCC8A8] focus:outline-none transition"
                {...props}
            />
        </div>
    );
}
