import { useEffect, useState } from 'react';
import IconGlyph from '../../components/common/IconGlyph';
import { useConfirm } from '../../context/ConfirmContext';
import { useAuth } from '../../context/AuthContext';

/* ─── Mock Data ─── */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SHIFT_TEMPLATES = [
    { key: 'morning', name: 'Shift 1 · Morning', time: '09:00 – 13:00', capacity: 6, color: 'amber', hours: 4 },
    { key: 'afternoon', name: 'Shift 2 · Afternoon', time: '13:00 – 17:00', capacity: 10, color: 'indigo', hours: 4 },
    { key: 'evening', name: 'Shift 3 · Evening', time: '17:00 – 21:00', capacity: 4, color: 'violet', hours: 4 },
];
const MASTER_SHIFTS = DAYS.flatMap((day) => SHIFT_TEMPLATES.map((template) => ({
    id: `SH-${day.toUpperCase()}-${template.key.toUpperCase()}`,
    name: template.name,
    shiftKey: template.key,
    time: template.time,
    capacity: template.capacity,
    color: template.color,
    hours: template.hours,
    day,
    format: template.key === 'evening' ? 'Online' : 'Offline · Online',
})));

const INITIAL_MY_REGISTRATIONS = [
    { id: 'REG-01', employeeName: 'Tran Van Minh', employeeEmail: 'minhtran.staff@lumiere.com', shiftId: 'SH-MONDAY-AFTERNOON', day: 'Monday', shiftName: 'Shift 2 · Afternoon', time: '13:00 – 17:00', status: 'Approved', note: '' },
    { id: 'REG-02', employeeName: 'Tran Van Minh', employeeEmail: 'minhtran.staff@lumiere.com', shiftId: 'SH-WEDNESDAY-AFTERNOON', day: 'Wednesday', shiftName: 'Shift 2 · Afternoon', time: '13:00 – 17:00', status: 'Pending', note: 'Prefer bar area' },
    { id: 'REG-03', employeeName: 'Master Chef Le Hoang', employeeEmail: 'hoangle.chef@lumiere.com', shiftId: 'SH-FRIDAY-EVENING', day: 'Friday', shiftName: 'Shift 3 · Evening', time: '17:00 – 21:00', status: 'Approved', note: '' },
    { id: 'REG-04', employeeName: 'Master Chef Le Hoang', employeeEmail: 'hoangle.chef@lumiere.com', shiftId: 'SH-SATURDAY-EVENING', day: 'Saturday', shiftName: 'Shift 3 · Evening', time: '17:00 – 21:00', status: 'Pending', note: '' },
];
const REGISTRATIONS_STORAGE_KEY = 'lumiere_shift_registrations';

const ALL_EMPLOYEES = [
    { id: 'EMP-01', name: 'Nguyen Van Minh', role: 'Staff', area: 'Main Dining Hall', position: 'Head Waiter' },
    { id: 'EMP-02', name: 'Chef Antoine Le', role: 'Kitchen', area: 'Hot Kitchen Station', position: 'Executive Head Chef' },
    { id: 'EMP-03', name: 'Tran Hoang Nam', role: 'Staff', area: 'Sky Bar Terrace', position: 'Senior Bartender' },
    { id: 'EMP-04', name: 'Le Thi Hong', role: 'Staff', area: 'VIP Garden Lounge', position: 'Hostess' },
    { id: 'EMP-05', name: 'Pham Quoc Dung', role: 'Kitchen', area: 'Cold Kitchen Station', position: 'Sous Chef' },
];

const DAY_LABELS = {
    Monday: 'Mon',
    Tuesday: 'Tue',
    Wednesday: 'Wed',
    Thursday: 'Thu',
    Friday: 'Fri',
    Saturday: 'Sat',
    Sunday: 'Sun',
};

function getWeekDates() {
    const today = new Date();
    const monday = new Date(today);
    const offset = (today.getDay() + 6) % 7;
    monday.setDate(today.getDate() - offset);
    return DAYS.map((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return {
            day,
            label: DAY_LABELS[day],
            date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'numeric' }),
        };
    });
}

export default function ShiftManagement() {
    const confirm = useConfirm();
    const { currentUser } = useAuth();
    const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Owner';
    const canRegister = currentUser?.role === 'Staff' || currentUser?.role === 'Kitchen';
    const [activeTab, setActiveTab] = useState(() => isManager ? 'manage-shifts' : 'my-schedule');
    const [myRegistrations, setMyRegistrations] = useState(() => {
        const saved = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_MY_REGISTRATIONS;
    });
    const [masterShifts, setMasterShifts] = useState(MASTER_SHIFTS);
    const [employees] = useState(ALL_EMPLOYEES);
    const [toast, setToast] = useState('');
    const [registerModal, setRegisterModal] = useState(null); // shift to register for
    const [editModal, setEditModal] = useState(null); // registration to edit
    const [confirmCancel, setConfirmCancel] = useState(null);
    const [shiftModal, setShiftModal] = useState(null); // create/edit master shift
    const [regNote, setRegNote] = useState('');
    const [shiftForm, setShiftForm] = useState({ name: '', time: '', capacity: 6, day: 'Monday', color: 'amber' });

    useEffect(() => {
        localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(myRegistrations));
    }, [myRegistrations]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    /* ─── 3.8.2 Register for a Shift ─── */
    const handleRegisterShift = () => {
        if (!canRegister || !registerModal) return;
        const shift = registerModal;
        const newReg = {
            id: `REG-${Date.now().toString().slice(-4)}`,
            employeeName: currentUser?.name || 'Employee',
            employeeEmail: currentUser?.email || '',
            shiftId: shift.id,
            day: shift.day,
            shiftName: shift.name,
            time: shift.time,
            status: 'Pending',
            note: regNote,
        };
        setMyRegistrations((previous) => [...previous, newReg]);
        setRegisterModal(null);
        setRegNote('');
        showToast(`Registered for ${shift.name} on ${shift.day}! Awaiting approval.`);
    };

    /* ─── 3.8.3 Edit Registered Shift ─── */
    const handleEditRegistration = () => {
        if (!canRegister || !editModal || editModal.employeeEmail !== currentUser?.email || editModal.status !== 'Pending') return;
        setMyRegistrations(prev => prev.map(r => r.id === editModal.id ? { ...r, note: regNote } : r));
        setEditModal(null);
        setRegNote('');
        showToast('Registration note updated successfully.');
    };

    /* ─── 3.8.4 Cancel Registered Shift ─── */
    const handleCancelRegistration = (id) => {
        if (!canRegister) return;
        setMyRegistrations(prev => prev.filter(r => r.id !== id || r.employeeEmail !== currentUser?.email));
        setConfirmCancel(null);
        showToast('Shift registration cancelled.');
    };

    const handleReviewRegistration = (id, status) => {
        if (!isManager || !['Approved', 'Rejected'].includes(status)) return;
        setMyRegistrations((previous) => previous.map((registration) => (
            registration.id === id && registration.status === 'Pending'
                ? { ...registration, status, reviewedBy: currentUser.name }
                : registration
        )));
        showToast(status === 'Approved' ? 'Shift request approved.' : 'Shift request rejected.');
    };

    /* ─── 3.8.5 Manage Shift (Manager) ─── */
    const handleCreateShift = (e) => {
        if (!isManager) return;
        e.preventDefault();
        const template = SHIFT_TEMPLATES.find((item) => item.name === shiftForm.name) || SHIFT_TEMPLATES[0];
        const newShift = {
            id: `SH-${Date.now().toString().slice(-3)}`,
            ...shiftForm,
            shiftKey: template.key,
            hours: template.hours,
            format: template.key === 'evening' ? 'Online' : 'Offline · Online',
            capacity: Number(shiftForm.capacity),
        };
        setMasterShifts([...masterShifts, newShift]);
        setShiftModal(null);
        showToast(`Shift "${newShift.name}" on ${newShift.day} created.`);
    };

    const handleUpdateShift = (e) => {
        if (!isManager) return;
        e.preventDefault();
        setMasterShifts(prev => prev.map(s => s.id === shiftModal.id ? { ...shiftModal, capacity: Number(shiftModal.capacity) } : s));
        setShiftModal(null);
        showToast('Shift updated successfully.');
    };

    const handleDeleteShift = async (id) => {
        if (!isManager) return;
        const shift = masterShifts.find((item) => item.id === id);
        const shouldDelete = await confirm({
            title: 'Delete shift?',
            message: `Shift ${shift?.name || id}${shift ? ` on ${shift.day}` : ''} will be removed from the schedule. Are you sure you want to continue?`,
            confirmText: 'Delete shift',
        });
        if (!shouldDelete) return;
        setMasterShifts(prev => prev.filter(s => s.id !== id));
        showToast('Shift deleted.');
    };

    const myEmployeeRegistrations = myRegistrations.filter((registration) => registration.employeeEmail === currentUser?.email);
    const pendingRegistrations = myRegistrations.filter((registration) => registration.status === 'Pending');
    const weekDates = getWeekDates();

    const handleScheduleCellChange = (shift, value) => {
        if (!canRegister) return;
        const registration = myEmployeeRegistrations.find((item) => item.shiftId === shift.id && item.status !== 'Rejected');
        if (value === 'register' && !registration) {
            setRegNote('');
            setRegisterModal(shift);
        } else if (value === 'cancel' && registration) {
            setConfirmCancel(registration);
        }
    };

    const tabs = [
        ...(canRegister ? [
            { id: 'my-schedule', label: 'My Work Schedule', icon: '📅', desc: 'UC 3.8.6' },
        ] : []),
        ...(isManager ? [
            { id: 'manage-shifts', label: 'Manage Shifts', icon: '⚙️', desc: 'UC 3.8.5' },
            { id: 'approvals', label: `Shift Requests${pendingRegistrations.length ? ` (${pendingRegistrations.length})` : ''}`, icon: '📝', desc: 'Review registrations' },
            { id: 'assignments', label: 'Employee Assignments', icon: '👥', desc: 'UC 3.8.9' },
        ] : []),
    ];

    useEffect(() => {
        const validTab = isManager
            ? ['manage-shifts', 'approvals', 'assignments'].includes(activeTab)
            : canRegister && activeTab === 'my-schedule';
        if (!validTab) {
            setActiveTab(isManager ? 'manage-shifts' : 'my-schedule');
        }
    }, [activeTab, canRegister, isManager]);

    if (!isManager && !canRegister) {
        return (
            <div className="mx-auto max-w-2xl rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
                <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
                <p className="mt-2 text-sm text-slate-600">Shift scheduling is available to Staff, Kitchen, Manager, and Owner roles only.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {/* Toast */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="font-black text-sm">✦</span>
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            {/* Header */}
            <div className="bg-[#081126] text-white p-8 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ SHIFT SCHEDULING & WORKFORCE ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Shift & Work Schedule Management
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Register shifts, manage your work schedule, view assignments, and configure master shift templates.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 gap-4 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 text-xs font-bold transition cursor-pointer border-b-2 whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'border-[#081126] text-[#081126]'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <><IconGlyph glyph={tab.icon} size={15} /> {tab.label}</>
                    </button>
                ))}
            </div>

            {/* ═══ TAB: My Work Schedule (3.8.6) ═══ */}
            {activeTab === 'my-schedule' && (
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg">
                        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                            <div>
                                <h2 className="font-serif text-xl font-bold text-[#081126]">Weekly Shift Registration</h2>
                                <p className="mt-1 text-xs text-slate-500">Select a status for each day and shift that fits your schedule.</p>
                            </div>
                            <div className="rounded-xl border border-[#DCC8A8]/60 bg-white px-4 py-2 text-sm font-bold text-slate-800">
                                {currentUser?.name || 'Employee'}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px] border-collapse text-sm">
                                <thead>
                                    <tr className="bg-[#fff8e7] text-slate-800">
                                        <th className="sticky left-0 z-10 min-w-40 border-b border-r border-amber-200 bg-[#fff8e7] px-4 py-3 text-left font-bold">Shift</th>
                                        <th className="min-w-32 border-b border-r border-amber-200 px-3 py-3 text-left font-bold">Format</th>
                                        <th className="min-w-20 border-b border-r border-amber-200 px-3 py-3 text-center font-bold">Hours</th>
                                        {weekDates.map(({ day, label, date }) => (
                                            <th key={day} className="min-w-28 border-b border-r border-amber-200 px-2 py-2 text-center">
                                                <span className="block font-bold">{label}</span>
                                                <span className="mt-0.5 block text-xs font-medium text-slate-500">{date}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {SHIFT_TEMPLATES.map((template) => {
                                        const rowShifts = masterShifts.filter((shift) => shift.shiftKey === template.key);
                                        return (
                                            <tr key={template.key} className="odd:bg-white even:bg-slate-50/70">
                                                <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-4 py-3 text-left">
                                                    <span className="block font-bold text-slate-800">{template.name}</span>
                                                    <span className="mt-1 block text-xs font-normal text-slate-500">{template.time}</span>
                                                </th>
                                                <td className="border-b border-r border-slate-200 px-3 py-3 text-xs text-slate-600">{template.key === 'evening' ? 'Online' : 'Offline · Online'}</td>
                                                <td className="border-b border-r border-slate-200 px-3 py-3 text-center font-semibold text-slate-600">{template.hours}</td>
                                                {weekDates.map(({ day }) => {
                                                    const shift = rowShifts.find((item) => item.day === day);
                                                    const registration = shift && myEmployeeRegistrations.find((item) => item.shiftId === shift.id && item.status !== 'Rejected');
                                                    const value = registration ? registration.status : '';
                                                    const statusClass = registration
                                                        ? registration.status === 'Approved'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                            : 'border-amber-200 bg-amber-100 text-amber-900'
                                                        : 'border-slate-200 bg-slate-100 text-slate-500';
                                                    return (
                                                        <td key={day} className="border-b border-r border-slate-200 px-2 py-2 text-center">
                                                            {shift ? (
                                                                <select
                                                                    aria-label={`${template.name} ${day}`}
                                                                    value={value}
                                                                    onChange={(event) => handleScheduleCellChange(shift, event.target.value)}
                                                                    className={`w-full cursor-pointer rounded-full border px-2 py-2 text-xs font-semibold outline-none transition focus:ring-2 focus:ring-amber-200 ${statusClass}`}
                                                                >
                                                                    <option value="">Not registered</option>
                                                                    {registration && (
                                                                        <option value={registration.status}>
                                                                            {registration.status === 'Approved' ? 'Approved' : 'Pending approval'}
                                                                        </option>
                                                                    )}
                                                                    {!registration && <option value="register">Register for shift</option>}
                                                                    {registration && <option value="cancel">Cancel registration</option>}
                                                                </select>
                                                            ) : (
                                                                <span className="text-xs text-slate-300">—</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-[#fff8e7] font-bold text-slate-800">
                                        <th className="sticky left-0 z-10 border-r border-amber-200 bg-[#fff8e7] px-4 py-3 text-left">TOTAL HOURS</th>
                                        <td className="border-r border-amber-200 px-3 py-3 text-center text-xs text-slate-500">—</td>
                                        <td className="border-r border-amber-200 px-3 py-3 text-center">{myEmployeeRegistrations.filter((registration) => registration.status !== 'Rejected').reduce((total, registration) => total + (masterShifts.find((shift) => shift.id === registration.shiftId)?.hours || 0), 0)}</td>
                                        {weekDates.map(({ day }) => {
                                            const dayHours = myEmployeeRegistrations.reduce((total, registration) => {
                                                if (registration.day !== day || registration.status === 'Rejected') return total;
                                                return total + (masterShifts.find((shift) => shift.id === registration.shiftId)?.hours || 0);
                                            }, 0);
                                            return <td key={day} className="border-r border-amber-200 px-2 py-3 text-center">{dayHours || '—'}</td>;
                                        })}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:px-6">
                            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Approved</span>
                            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Pending approval</span>
                            <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Not registered</span>
                        </div>
                    </div>

                    {/* My Registrations List (3.8.3 Edit + 3.8.4 Cancel) */}
                    <div className="bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-serif font-bold text-[#081126]">My Registered Shifts</h2>
                            <span className="text-xs text-slate-400 font-bold">{myEmployeeRegistrations.length} registrations</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {myEmployeeRegistrations.map(reg => (
                                <div key={reg.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-black text-slate-400">{reg.id}</span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                reg.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                                reg.status === 'Rejected' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                                'bg-amber-100 text-amber-800 border-amber-300'
                                            }`}>
                                                ● {reg.status}
                                            </span>
                                        </div>
                                        <span className="font-serif font-bold text-slate-900 text-sm block mt-1">{reg.shiftName} — {reg.day}</span>
                                        <span className="text-xs text-slate-500"><IconGlyph glyph="⏰" size={13} /> {reg.time}</span>
                                        {reg.note && <span className="text-xs text-amber-700 block"><IconGlyph glyph="📝" size={13} /> {reg.note}</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        {reg.status === 'Pending' && (
                                            <button
                                                onClick={() => { setEditModal(reg); setRegNote(reg.note); }}
                                                className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] uppercase rounded-xl hover:bg-slate-200 cursor-pointer"
                                            >
                                                <IconGlyph glyph="✏️" size={14} /> Edit
                                            </button>
                                        )}
                                        {reg.status !== 'Rejected' && <button
                                            onClick={() => setConfirmCancel(reg)}
                                            className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] uppercase rounded-xl hover:bg-rose-100 cursor-pointer"
                                        >
                                            <IconGlyph glyph="🗑" size={14} /> Cancel
                                        </button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TAB: Manage Shifts (3.8.5 - Manager) ═══ */}
            {activeTab === 'manage-shifts' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="font-serif text-xl font-bold text-[#081126]">Master Shift Configuration</h2>
                            <p className="text-xs text-slate-500">Create, edit, and remove shift templates for roster planning</p>
                        </div>
                        <button
                            onClick={() => {
                                setShiftForm({
                                    name: SHIFT_TEMPLATES[0].name,
                                    time: SHIFT_TEMPLATES[0].time,
                                    capacity: SHIFT_TEMPLATES[0].capacity,
                                    day: 'Monday',
                                    color: SHIFT_TEMPLATES[0].color,
                                });
                                setShiftModal('create');
                            }}
                            className="px-5 py-2.5 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer"
                        >
                            + New Shift
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        {['ID', 'Shift Name', 'Day', 'Time', 'Capacity', 'Actions'].map(h => (
                                            <th key={h} className="px-4 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {masterShifts.map(sh => (
                                        <tr key={sh.id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 font-mono font-bold text-slate-400">{sh.id}</td>
                                            <td className="px-4 py-3 font-bold text-slate-900">{sh.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{sh.day}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono">{sh.time}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 font-bold">{sh.capacity}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => setShiftModal({ ...sh })}
                                                        className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-bold cursor-pointer hover:bg-slate-200"
                                                    >Edit</button>
                                                    <button
                                                        onClick={() => handleDeleteShift(sh.id)}
                                                        className="px-2 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded text-[10px] font-bold cursor-pointer hover:bg-rose-100"
                                                    >Del</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'approvals' && isManager && (
                <div className="space-y-5">
                    <div>
                        <h2 className="font-serif text-xl font-bold text-[#081126]">Shift Registration Requests</h2>
                        <p className="mt-1 text-xs text-slate-500">Review Staff and Kitchen registrations. Only Manager and Owner can approve or reject.</p>
                    </div>
                    <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg">
                        {myRegistrations.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Employee</th>
                                            <th className="px-5 py-4">Shift</th>
                                            <th className="px-5 py-4">Note</th>
                                            <th className="px-5 py-4">Status</th>
                                            <th className="px-5 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {myRegistrations.map((registration) => (
                                            <tr key={registration.id} className="align-top">
                                                <td className="px-5 py-4">
                                                    <span className="block font-bold text-slate-900">{registration.employeeName || 'Employee'}</span>
                                                    <span className="mt-1 block text-xs text-slate-500">{registration.employeeEmail}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="block font-semibold text-slate-800">{registration.shiftName} · {registration.day}</span>
                                                    <span className="mt-1 block text-xs text-slate-500">{registration.time}</span>
                                                </td>
                                                <td className="max-w-56 px-5 py-4 text-xs text-slate-600">{registration.note || '—'}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                                                        registration.status === 'Approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                            : registration.status === 'Rejected' ? 'border-rose-200 bg-rose-50 text-rose-800'
                                                                : 'border-amber-200 bg-amber-50 text-amber-800'
                                                    }`}>{registration.status}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {registration.status === 'Pending' ? (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleReviewRegistration(registration.id, 'Approved')}
                                                                className="rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-emerald-700"
                                                            >Approve</button>
                                                            <button
                                                                onClick={() => handleReviewRegistration(registration.id, 'Rejected')}
                                                                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-700 hover:bg-rose-100"
                                                            >Reject</button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">{registration.reviewedBy ? `Reviewed by ${registration.reviewedBy}` : '—'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-10 text-center text-sm text-slate-500">No shift registration requests yet.</div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ TAB: Employee Assignments (3.8.9) ═══ */}
            {activeTab === 'assignments' && (
                <div className="space-y-6">
                    <h2 className="font-serif text-xl font-bold text-[#081126]">Employee Working Assignments</h2>
                    <p className="text-xs text-slate-500">Overview of all employees' assigned areas and positions</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {employees.map(emp => (
                            <div key={emp.id} className="bg-white rounded-2xl border border-stone-200 shadow-md p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#081126] text-[#DCC8A8] flex items-center justify-center font-black text-sm">
                                        {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="font-serif font-bold text-slate-900 text-sm">{emp.name}</h3>
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">{emp.id}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Role</span>
                                        <span className="font-bold text-slate-800">{emp.role}</span>
                                    </div>
                                    <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                                        <span className="text-[10px] font-bold text-indigo-400 uppercase block">Working Area</span>
                                        <span className="font-bold text-indigo-900"><IconGlyph glyph="📍" size={13} /> {emp.area}</span>
                                    </div>
                                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                                        <span className="text-[10px] font-bold text-amber-400 uppercase block">Position</span>
                                        <span className="font-bold text-amber-900"><IconGlyph glyph="💼" size={13} /> {emp.position}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ MODALS ═══ */}

            {/* Register Shift Modal (3.8.2) */}
            {registerModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">Register for Shift</h3>
                            <button onClick={() => setRegisterModal(null)} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">✕</button>
                        </div>
                        <div className="mt-4 space-y-4 text-xs">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                                <span className="font-bold text-slate-900 block">{registerModal.name}</span>
                                <span className="text-slate-600 block"><IconGlyph glyph="📅" size={13} /> {registerModal.day} · <IconGlyph glyph="⏰" size={13} /> {registerModal.time}</span>
                                <span className="text-slate-500 block"><IconGlyph glyph="👥" size={13} /> {registerModal.capacity} slots available</span>
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Note (optional)</label>
                                <textarea
                                    rows="2"
                                    placeholder="e.g. Prefer bar area, available from 5PM..."
                                    value={regNote}
                                    onChange={e => setRegNote(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setRegisterModal(null)} className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl cursor-pointer">Cancel</button>
                                <button onClick={handleRegisterShift} className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800 cursor-pointer">Confirm Registration</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Registration Modal (3.8.3) */}
            {editModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">Edit Shift Registration</h3>
                            <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">✕</button>
                        </div>
                        <div className="mt-4 space-y-4 text-xs">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                <span className="font-bold text-slate-900 block">{editModal.shiftName} — {editModal.day}</span>
                                <span className="text-slate-600"><IconGlyph glyph="⏰" size={13} /> {editModal.time}</span>
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Update Note</label>
                                <textarea
                                    rows="2"
                                    value={regNote}
                                    onChange={e => setRegNote(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditModal(null)} className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl cursor-pointer">Cancel</button>
                                <button onClick={handleEditRegistration} className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800 cursor-pointer">Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Registration Confirm (3.8.4) */}
            {confirmCancel && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3"><IconGlyph glyph="⚠️" size={24} /></div>
                        <h3 className="font-serif font-bold text-lg text-[#081126] mb-2">Cancel Shift Registration?</h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                            Cancel your registration for <strong>{confirmCancel.shiftName}</strong> on <strong>{confirmCancel.day}</strong>?
                        </p>
                        <div className="flex justify-center gap-3">
                            <button onClick={() => setConfirmCancel(null)} className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase rounded-xl hover:bg-slate-200 transition cursor-pointer">Keep</button>
                            <button onClick={() => handleCancelRegistration(confirmCancel.id)} className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-rose-700 shadow-md transition cursor-pointer">Cancel Shift</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Master Shift Modal (3.8.5) */}
            {shiftModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">
                                {typeof shiftModal === 'string' ? 'Create New Shift' : 'Edit Shift'}
                            </h3>
                            <button onClick={() => setShiftModal(null)} className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer">✕</button>
                        </div>
                        <form onSubmit={typeof shiftModal === 'string' ? handleCreateShift : handleUpdateShift} className="space-y-4 mt-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Shift Name</label>
                                    <select
                                        value={typeof shiftModal === 'string' ? shiftForm.name : shiftModal.name}
                                        onChange={(e) => {
                                            const template = SHIFT_TEMPLATES.find((item) => item.name === e.target.value);
                                            if (!template) return;
                                            if (typeof shiftModal === 'string') {
                                                setShiftForm({
                                                    ...shiftForm,
                                                    name: template.name,
                                                    time: template.time,
                                                    capacity: template.capacity,
                                                    color: template.color,
                                                });
                                            } else {
                                                setShiftModal({
                                                    ...shiftModal,
                                                    name: template.name,
                                                    shiftKey: template.key,
                                                    time: template.time,
                                                    hours: template.hours,
                                                    capacity: template.capacity,
                                                    color: template.color,
                                                    format: template.key === 'evening' ? 'Online' : 'Offline · Online',
                                                });
                                            }
                                        }}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        {SHIFT_TEMPLATES.map((template) => (
                                            <option key={template.key} value={template.name}>{template.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Day</label>
                                    <select
                                        value={typeof shiftModal === 'string' ? shiftForm.day : shiftModal.day}
                                        onChange={e => typeof shiftModal === 'string' ? setShiftForm({...shiftForm, day: e.target.value}) : setShiftModal({...shiftModal, day: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Time Slot</label>
                                    <input
                                        type="text"
                                        required
                                        value={typeof shiftModal === 'string' ? shiftForm.time : shiftModal.time}
                                        onChange={e => typeof shiftModal === 'string' ? setShiftForm({...shiftForm, time: e.target.value}) : setShiftModal({...shiftModal, time: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Capacity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={typeof shiftModal === 'string' ? shiftForm.capacity : shiftModal.capacity}
                                        onChange={e => typeof shiftModal === 'string' ? setShiftForm({...shiftForm, capacity: e.target.value}) : setShiftModal({...shiftModal, capacity: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-3">
                                <button type="button" onClick={() => setShiftModal(null)} className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl cursor-pointer">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800 cursor-pointer">
                                    {typeof shiftModal === 'string' ? 'Create Shift' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
