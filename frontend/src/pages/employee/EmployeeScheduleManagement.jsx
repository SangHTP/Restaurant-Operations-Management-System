import { useCallback, useEffect, useState } from 'react';
import { useState } from 'react';
import IconGlyph from '../../components/common/IconGlyph';
import staffAvatar from '../../assets/avartar/staff.jpg';
import chefAvatar from '../../assets/avartar/chef.jpeg';
import { employeeApi } from '../../api/employeeApi';

function mapEmployee(employee) {
    return {
        id: String(employee.employeeId),
        name: employee.fullName,
        email: employee.email ?? '',
        phone: employee.phone,
        role: employee.roleName,
        departmentId: employee.departmentId ? String(employee.departmentId) : '',
        departmentName: employee.departmentName ?? '',
        position: employee.position ?? employee.roleName,
        area: 'Unassigned',
        availability: 'Managed in Work Availability',
        shifts: [],
        avatar: employee.roleName === 'Kitchen' ? chefAvatar : staffAvatar,
        status: employee.status,
        createdAt: employee.createdAt,
    };
}

const SHIFTS = [
    { id: 'SH-1', name: 'Morning Shift', time: '08:00 AM – 04:00 PM', count: 6 },
    { id: 'SH-2', name: 'Evening Shift', time: '04:00 PM – 11:00 PM', count: 10 },
    { id: 'SH-3', name: 'Night Bar Shift', time: '07:00 PM – 02:00 AM', count: 4 },
];

export default function EmployeeScheduleManagement() {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [activeTab, setActiveTab] = useState('roster'); // roster | shifts | availability
    const [employeeModal, setEmployeeModal] = useState(null);
    const [toast, setToast] = useState('');
    const [pageError, setPageError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('Active');

    const [formEmp, setFormEmp] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'Staff',
        departmentId: '',
        position: 'Waiter',
        area: 'Main Dining Hall',
        availability: 'Morning & Evening',
        status: 'Active',
    });

    const loadDirectory = useCallback(async (selectedId = null) => {
        setIsLoading(true);
        try {
            const [employeeRows, roleRows, departmentRows] = await Promise.all([
                employeeApi.getEmployees(),
                employeeApi.getRoles(),
                employeeApi.getDepartments(),
            ]);
            const mappedEmployees = employeeRows.map(mapEmployee);
            setEmployees(mappedEmployees);
            setRoles(roleRows.map(role => role.roleName));
            setDepartments(departmentRows);
            setSelectedEmp(
                mappedEmployees.find(employee => employee.id === String(selectedId)) ??
                mappedEmployees.find(employee => employee.status === 'Active') ??
                null
            );
            setPageError('');
        } catch (error) {
            setPageError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDirectory();
    }, [loadDirectory]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const reloadEmployees = async (selectedId = null) => {
        const rows = await employeeApi.getEmployees();
        const mappedEmployees = rows.map(mapEmployee);
        setEmployees(mappedEmployees);
        setSelectedEmp(
            mappedEmployees.find(employee => employee.id === String(selectedId)) ??
            mappedEmployees.find(employee => employee.status === 'Active') ??
            null
        );
    };

    const openCreateModal = () => {
        setFormEmp({
            name: '',
            email: '',
            phone: '',
            role: 'Staff',
            departmentId: '',
            position: 'Waiter',
            area: 'Main Dining Hall',
            availability: 'Morning & Evening',
            status: 'Active',
        });
        setEmployeeModal('create');
    };

    const openEditModal = (employee) => {
        setFormEmp({
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            role: employee.role,
            departmentId: employee.departmentId ? String(employee.departmentId) : '',
            position: employee.position,
            area: employee.area,
            availability: employee.availability,
            status: employee.status ?? 'Active',
        });
        setEmployeeModal({ type: 'edit', employee });
    };

    const handleSaveEmployee = async (e) => {
        e.preventDefault();
        setPageError('');
        const normalized = {
            ...formEmp,
            name: formEmp.name.trim(),
            email: formEmp.email.trim().toLowerCase(),
            phone: formEmp.phone.trim(),
            position: formEmp.position.trim(),
            area: formEmp.area.trim(),
            availability: formEmp.availability.trim(),
        };
        const editingId = employeeModal?.type === 'edit' ? employeeModal.employee.id : null;
        const duplicate = employees.some(employee =>
            employee.id !== editingId &&
            ((normalized.email && employee.email.toLowerCase() === normalized.email) ||
                employee.phone === normalized.phone)
        );

        if (duplicate) {
            showToast('An employee with this email address or phone number already exists.');
            return;
        }

        try {
            setIsSaving(true);
            setPageError('');
            const payload = {
                fullName: normalized.name,
                email: normalized.email || null,
                phone: normalized.phone,
                roleName: normalized.role,
                departmentId: normalized.departmentId ? Number(normalized.departmentId) : null,
                position: normalized.position || null,
                status: normalized.status,
            };
            if (employeeModal === 'create') {
                const created = await employeeApi.createEmployee(payload);
                await reloadEmployees(created.employeeId);
                showToast(`Created employee "${normalized.name}".`);
            } else if (employeeModal?.type === 'edit') {
                await employeeApi.updateEmployee(employeeModal.employee.id, payload);
                await reloadEmployees(employeeModal.employee.id);
                showToast(`Updated employee "${normalized.name}".`);
            }
            setEmployeeModal(null);
        } catch (error) {
            showToast(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateAssignment = async (id, newArea, newPosition) => {
        const employee = employees.find(item => item.id === id);
        if (!employee) return;
        try {
            setPageError('');
            if (employee.position !== newPosition) {
                await employeeApi.updateEmployee(id, {
                    fullName: employee.name,
                    email: employee.email || null,
                    phone: employee.phone,
                    roleName: employee.role,
                    departmentId: employee.departmentId ? Number(employee.departmentId) : null,
                    position: newPosition,
                    status: employee.status,
                });
            }
            await reloadEmployees(id);
            if (employee.area !== newArea) {
                showToast('Working area is part of shift assignments and is not stored by the employee API yet.');
            } else {
                showToast(`Updated position for ${employee.name}.`);
            }
        } catch (error) {
            showToast(error.message);
        }
    };

    const handleAssignRole = async (id, role) => {
        try {
            setPageError('');
            await employeeApi.assignRole(id, role);
            await reloadEmployees(id);
            showToast(`Assigned the ${role} role to ${selectedEmp?.name ?? 'employee'}.`);
        } catch (error) {
            showToast(error.message);
        }
    };

    const [confirmModal, setConfirmModal] = useState(null);

    const handleDeleteEmployee = (id, name) => {
        setConfirmModal({
            title: 'Delete Employee',
            message: `Delete "${name}"? If this employee has no related shifts, orders, or other records, the employee will be permanently deleted. Otherwise, the employee will be set to Inactive to preserve history.`,
            onConfirm: async () => {
                try {
                    setPageError('');
                    const result = await employeeApi.deleteEmployee(id);
                    await reloadEmployees();
                    showToast(result?.message ?? `Processed deletion for ${name}.`);
                    setConfirmModal(null);
                } catch (error) {
                    showToast(error.message);
                }
            }
        });
    };

    const filteredEmployees = employees.filter(employee => {
        const query = searchTerm.trim().toLowerCase();
        const matchesSearch = !query ||
            employee.name.toLowerCase().includes(query) ||
            employee.email.toLowerCase().includes(query) ||
            employee.phone.toLowerCase().includes(query) ||
            employee.id.toLowerCase().includes(query);
        const matchesRole = roleFilter === 'All' || employee.role === roleFilter;
        const matchesStatus = statusFilter === 'All' || (employee.status ?? 'Active') === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {/* TOAST */}
            {toast && (
                <div className="fixed top-20 right-6 z-50 bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="font-black text-sm">✦</span>
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}
            {pageError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {pageError}
                    <button type="button" onClick={loadDirectory} className="ml-3 font-bold underline">Retry</button>
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
                    onClick={openCreateModal}
                    disabled={isLoading || roles.length === 0}
                    className="relative z-10 px-5 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer disabled:opacity-50"
                >
                    + Add New Employee
                </button>
            </div>

            {/* TABS */}
            <div className="flex border-b border-slate-200 gap-4">
                {[
                    { id: 'roster', label: 'Staff Roster & Assignments', icon: '👥' },
                    { id: 'shifts', label: 'Shift Master List', icon: '📅' },
                    { id: 'availability', label: 'Work Availability', icon: '📋' },
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
                        <><IconGlyph glyph={tab.icon} size={15} /> {tab.label}</>
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            {activeTab === 'roster' && isLoading && (
                <div role="status" className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500 shadow">
                    Loading employee directory…
                </div>
            )}

            {activeTab === 'roster' && !isLoading && !pageError && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* EMPLOYEE LIST */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-serif font-bold text-[#081126]">Staff Members Directory</h2>
                            <span className="text-xs text-slate-400 font-bold">
                                {employees.filter(employee => (employee.status ?? 'Active') === 'Active').length} active staff
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            <div className="p-4 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={event => setSearchTerm(event.target.value)}
                                    placeholder="Search name, email, phone or ID..."
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs"
                                />
                                <select value={roleFilter} onChange={event => setRoleFilter(event.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                                    <option value="All">All roles</option>
                                    {roles.map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                                <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs">
                                    <option value="Active">Active employees</option>
                                    <option value="Inactive">Inactive employees</option>
                                    <option value="All">All statuses</option>
                                </select>
                            </div>

                            {filteredEmployees.length === 0 ? (
                                <div className="p-10 text-center text-sm text-slate-400">No employees match your search.</div>
                            ) : filteredEmployees.map(emp => (
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
                                                <IconGlyph glyph="📍" size={13} /> {emp.area} · <IconGlyph glyph="💼" size={13} /> {emp.position}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="font-mono text-xs text-slate-400 font-bold block">{emp.id}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                                            (emp.status ?? 'Active') === 'Active'
                                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                                : 'text-slate-600 bg-slate-100 border-slate-200'
                                        }`}>
                                            {emp.status ?? 'Active'}
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
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-400 uppercase">Employee ID</span>
                                            <span className="font-mono text-slate-800">{selectedEmp.id}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-400 uppercase">Department</span>
                                            <span className="text-slate-800">{selectedEmp.departmentName || 'Unassigned'}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] font-black text-slate-400 uppercase">Phone</span>
                                            <span className="text-slate-800">{selectedEmp.phone}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">System Role</label>
                                        <select
                                            value={selectedEmp.role}
                                            disabled={(selectedEmp.status ?? 'Active') !== 'Active'}
                                            onChange={e => handleAssignRole(selectedEmp.id, e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold disabled:opacity-50"
                                        >
                                            {roles.map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </div>
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
                                            <option value="Unassigned">Unassigned</option>
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
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(selectedEmp)}
                                            className="flex-1 py-2 bg-[#081126] text-[#DCC8A8] font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer"
                                        >
                                            Edit Employee
                                        </button>
                                        {(selectedEmp.status ?? 'Active') === 'Active' && (
                                            <button
                                                onClick={() => handleDeleteEmployee(selectedEmp.id, selectedEmp.name)}
                                                className="flex-1 py-2 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs uppercase rounded-xl hover:bg-rose-100 transition cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
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
                                <div className="text-xs text-slate-600 font-mono"><IconGlyph glyph="⏱" size={13} /> {sh.time}</div>
                                <div className="pt-2 border-t border-slate-200 text-xs font-bold text-indigo-900">
                                    <IconGlyph glyph="👥" size={13} /> Required Staff: {sh.count} employees
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
                        {employees.filter(employee => (employee.status ?? 'Active') === 'Active').map(e => (
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
            {employeeModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">
                                {employeeModal === 'create' ? 'Add New Employee' : 'Update Employee'}
                            </h3>
                            <button onClick={() => setEmployeeModal(null)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSaveEmployee} className="space-y-4 mt-4 text-xs">
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
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="0912345678"
                                        value={formEmp.phone}
                                        onChange={e => setFormEmp({ ...formEmp, phone: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">System Role</label>
                                    <select
                                        value={formEmp.role}
                                        onChange={e => setFormEmp({ ...formEmp, role: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        {roles.map(role => <option key={role} value={role}>{role}</option>)}
                                    </select>
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
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                                    <select
                                        value={formEmp.departmentId}
                                        onChange={e => setFormEmp({ ...formEmp, departmentId: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    >
                                        <option value="">No department</option>
                                        {departments.map(department => (
                                            <option key={department.departmentId} value={department.departmentId}>
                                                {department.departmentName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {employeeModal !== 'create' && (
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Employment Status</label>
                                    <select
                                        value={formEmp.status}
                                        onChange={e => setFormEmp({ ...formEmp, status: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-3">
                                <button type="button" onClick={() => setEmployeeModal(null)} className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800">
                                    {employeeModal === 'create' ? 'Add Staff' : 'Save Changes'}
                                </button>
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
                            <IconGlyph glyph="⚠️" size={22} />
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
