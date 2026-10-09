import { useState } from 'react';
import staffAvatar from '../../assets/avartar/staff.jpg';
import chefAvatar from '../../assets/avartar/chef.jpeg';

const INITIAL_EMPLOYEES = [
    {
        id: 'EMP-01',
        name: 'Nguyen Van Minh',
        email: 'minh.nguyen@lumiere.com',
        phone: '0912345678',
        role: 'Staff',
        position: 'Head Waiter',
        area: 'Main Dining Hall',
        availability: 'Morning & Evening',
        shifts: ['Mon-Morning', 'Wed-Evening', 'Fri-Evening'],
        avatar: staffAvatar,
    },
    {
        id: 'EMP-02',
        name: 'Chef Antoine Le',
        email: 'antoine.chef@lumiere.com',
        phone: '0987654321',
        role: 'Kitchen',
        position: 'Executive Head Chef',
        area: 'Hot Kitchen Station',
        availability: 'All Shifts',
        shifts: ['Mon-Evening', 'Tue-Evening', 'Thu-Evening', 'Sat-Evening'],
        avatar: chefAvatar,
    },
    {
        id: 'EMP-03',
        name: 'Tran Hoang Nam',
        email: 'nam.tran@lumiere.com',
        phone: '0909090909',
        role: 'Staff',
        position: 'Senior Bartender',
        area: 'Sky Bar Terrace',
        availability: 'Evening & Night',
        shifts: ['Fri-Night', 'Sat-Night', 'Sun-Night'],
        avatar: staffAvatar,
    },
];

const SHIFTS = [
    { id: 'SH-1', name: 'Morning Shift', time: '08:00 AM – 04:00 PM', count: 6 },
    { id: 'SH-2', name: 'Evening Shift', time: '04:00 PM – 11:00 PM', count: 10 },
    { id: 'SH-3', name: 'Night Bar Shift', time: '07:00 PM – 02:00 AM', count: 4 },
];

export default function EmployeeScheduleManagement() {
    const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
    const [selectedEmp, setSelectedEmp] = useState(employees[0]);
    const [activeTab, setActiveTab] = useState('roster'); // roster | shifts | availability
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [toast, setToast] = useState('');

    const [formEmp, setFormEmp] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Staff',
        position: 'Waiter',
        area: 'Main Dining Hall',
        availability: 'Morning & Evening',
    });

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleCreateEmployee = (e) => {
        e.preventDefault();
        const newEmp = {
            id: `EMP-${Date.now().toString().slice(-2)}`,
            ...formEmp,
            shifts: ['Mon-Morning'],
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        };
        setEmployees([...employees, newEmp]);
        setIsAddModalOpen(false);
        showToast(`Registered new staff member "${newEmp.name}"`);
    };

    const handleUpdateAssignment = (id, newArea, newPosition) => {
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, area: newArea, position: newPosition } : e));
        setSelectedEmp(prev => prev?.id === id ? { ...prev, area: newArea, position: newPosition } : prev);
        showToast(`Updated area assignment for ${selectedEmp.name} → ${newArea}`);
    };

    const [confirmModal, setConfirmModal] = useState(null);

    const handleDeleteEmployee = (id, name) => {
        setConfirmModal({
            title: 'Remove Staff Member',
            message: `Are you sure you want to remove employee "${name}" from employee records? This action cannot be undone.`,
            onConfirm: () => {
                setEmployees(prev => prev.filter(e => e.id !== id));
                setSelectedEmp(null);
                showToast(`Removed employee ${name}`);
                setConfirmModal(null);
            }
        });
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
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ WORKFORCE, SCHEDULING & ROSTER ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Employee & Shift Scheduling Management
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Manage staff roster, shift assignments, working areas, and availability registration.
                    </p>
                </div>

                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="relative z-10 px-5 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer"
                >
                    + Add New Employee
                </button>
            </div>

            {/* TABS */}
            <div className="flex border-b border-slate-200 gap-4">
                {[
                    { id: 'roster', label: '👥 Staff Roster & Assignments' },
                    { id: 'shifts', label: '📅 Shift Master List' },
                    { id: 'availability', label: '📋 Work Availability' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`pb-3 text-xs font-bold transition cursor-pointer border-b-2 ${
                            activeTab === tab.id
                                ? 'border-[#081126] text-[#081126]'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            {activeTab === 'roster' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* EMPLOYEE LIST */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-serif font-bold text-[#081126]">Staff Members Directory</h2>
                            <span className="text-xs text-slate-400 font-bold">{employees.length} active staff</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {employees.map(emp => (
                                <div
                                    key={emp.id}
                                    onClick={() => setSelectedEmp(emp)}
                                    className={`p-5 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center ${
                                        selectedEmp?.id === emp.id ? 'bg-amber-50/50 border-l-4 border-[#081126]' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-full object-cover border-2 border-[#DCC8A8]" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-serif font-bold text-slate-900 text-base">{emp.name}</h3>
                                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border">{emp.role}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                📍 {emp.area} · 💼 {emp.position}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="font-mono text-xs text-slate-400 font-bold block">{emp.id}</span>
                                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                                            {emp.shifts.length} weekly shifts
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* EMPLOYEE DETAIL & ASSIGNMENT CONTROL */}
                    <div>
                        {selectedEmp ? (
                            <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-6 sticky top-20">
                                <div className="text-center pb-4 border-b border-slate-100 space-y-2">
                                    <img src={selectedEmp.avatar} alt={selectedEmp.name} className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-[#081126]" />
                                    <h3 className="font-serif text-xl font-bold text-[#081126]">{selectedEmp.name}</h3>
                                    <span className="text-xs font-mono text-slate-500">{selectedEmp.email}</span>
                                </div>

                                <div className="space-y-3 text-xs">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Working Position</label>
                                        <select
                                            value={selectedEmp.position}
                                            onChange={e => handleUpdateAssignment(selectedEmp.id, selectedEmp.area, e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                        >
                                            <option value="Head Waiter">Head Waiter</option>
                                            <option value="Waiter / Server">Waiter / Server</option>
                                            <option value="Executive Head Chef">Executive Head Chef</option>
                                            <option value="Sous Chef">Sous Chef</option>
                                            <option value="Senior Bartender">Senior Bartender</option>
                                            <option value="Hostess">Hostess</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Dining Area</label>
                                        <select
                                            value={selectedEmp.area}
                                            onChange={e => handleUpdateAssignment(selectedEmp.id, e.target.value, selectedEmp.position)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                        >
                                            <option value="Main Dining Hall">Main Dining Hall</option>
                                            <option value="VIP Garden Lounge">VIP Garden Lounge</option>
                                            <option value="Sky Bar Terrace">Sky Bar Terrace</option>
                                            <option value="Hot Kitchen Station">Hot Kitchen Station</option>
                                        </select>
                                    </div>

                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                        <span className="text-[10px] font-black text-slate-400 uppercase block">Registered Availability</span>
                                        <span className="font-bold text-slate-800">{selectedEmp.availability}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDeleteEmployee(selectedEmp.id, selectedEmp.name)}
                                    className="w-full py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs uppercase rounded-xl hover:bg-rose-100 transition cursor-pointer"
                                >
                                    Delete Employee Record
                                </button>
                            </div>
                        ) : null}
                    </div>

                </div>
            )}

            {activeTab === 'shifts' && (
                <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-4">
                    <h2 className="font-serif text-xl font-bold text-[#081126]">Restaurant Master Shift Schedules</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {SHIFTS.map(sh => (
                            <div key={sh.id} className="p-6 rounded-3xl border border-slate-200 bg-slate-50 space-y-3">
                                <span className="text-[10px] font-mono text-amber-800 font-bold uppercase">{sh.id}</span>
                                <h3 className="font-serif font-bold text-lg text-slate-900">{sh.name}</h3>
                                <div className="text-xs text-slate-600 font-mono">⏱ {sh.time}</div>
                                <div className="pt-2 border-t border-slate-200 text-xs font-bold text-indigo-900">
                                    👥 Required Staff: {sh.count} employees
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'availability' && (
                <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-4">
                    <h2 className="font-serif text-xl font-bold text-[#081126]">Work Availability Submissions</h2>
                    <p className="text-xs text-slate-500">Staff register their available working hours for shift scheduling</p>
                    <div className="divide-y divide-slate-100">
                        {employees.map(e => (
                            <div key={e.id} className="py-3 flex justify-between items-center text-xs">
                                <div>
                                    <span className="font-bold text-slate-900 block">{e.name} ({e.role})</span>
                                    <span className="text-slate-500">Available: {e.availability}</span>
                                </div>
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                                    Confirmed
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CREATE EMPLOYEE MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">Add New Employee</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleCreateEmployee} className="space-y-4 mt-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Employee Name"
                                    value={formEmp.name}
                                    onChange={e => setFormEmp({ ...formEmp, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="email@lumiere.com"
                                        value={formEmp.email}
                                        onChange={e => setFormEmp({ ...formEmp, email: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Role</label>
                                    <select
                                        value={formEmp.role}
                                        onChange={e => setFormEmp({ ...formEmp, role: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        <option value="Staff">Staff</option>
                                        <option value="Kitchen">Kitchen</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Position</label>
                                    <input
                                        type="text"
                                        value={formEmp.position}
                                        onChange={e => setFormEmp({ ...formEmp, position: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Area</label>
                                    <input
                                        type="text"
                                        value={formEmp.area}
                                        onChange={e => setFormEmp({ ...formEmp, area: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800">Add Staff</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center animate-fadeIn">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                            ⚠️
                        </div>
                        <h3 className="font-serif font-bold text-lg text-[#081126] mb-2">
                            {confirmModal.title}
                        </h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                            {confirmModal.message}
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase rounded-xl hover:bg-slate-200 transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmModal.onConfirm}
                                className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-rose-700 shadow-md transition cursor-pointer"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
