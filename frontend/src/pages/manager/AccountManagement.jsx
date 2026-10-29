import { useCallback, useEffect, useState } from 'react';
import customerAvatar from '../../assets/avartar/customer.jpg';
import staffAvatar from '../../assets/avartar/staff.jpg';
import chefAvatar from '../../assets/avartar/chef.jpeg';
import ownAvatar from '../../assets/avartar/own.jpg';
import { accountApi } from '../../api/accountApi';
import { employeeApi } from '../../api/employeeApi';
import { useAuth } from '../../context/AuthContext';

function mapAccount(account) {
    const role = account.roleName;
    return {
        id: `${account.accountType}-${account.accountId}`,
        accountId: account.accountId,
        accountType: account.accountType.toLowerCase(),
        username: account.username,
        name: account.fullName,
        email: account.email ?? '',
        phone: account.phone,
        departmentId: account.departmentId ?? '',
        departmentName: account.departmentName ?? '',
        role,
        status: account.status,
        avatar: role === 'Customer' ? customerAvatar : role === 'Kitchen' ? chefAvatar :
            ['Manager', 'Owner', 'Admin'].includes(role) ? ownAvatar : staffAvatar,
        createdDate: account.createdAt?.slice(0, 10) ?? '',
    };
}

export default function AccountManagement() {
    const { currentUser } = useAuth();
    const isElevated = ['Owner', 'Admin'].includes(currentUser?.role);
    const canManageAccounts = isElevated || currentUser?.role === 'Manager';
    const [accounts, setAccounts] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [pageError, setPageError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    // Toast feedback state
    const [toast, setToast] = useState('');
    const [showTempPassword, setShowTempPassword] = useState(false);

    // Modal state for Create / Edit Account
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAccount, setNewAccount] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        role: 'Staff',
        departmentId: '',
        tempPassword: '',
    });

    const [editingAccount, setEditingAccount] = useState(null);

    // Show feedback toast
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const loadAccounts = useCallback(async () => {
        setIsLoading(true);
        try {
            const [rows, departmentRows] = await Promise.all([
                accountApi.getAccounts(),
                employeeApi.getDepartments(),
            ]);
            setAccounts(rows.map(mapAccount));
            setDepartments(departmentRows);
            setPageError('');
        } catch (error) {
            setPageError(error.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const refreshAccounts = async () => {
        const rows = await accountApi.getAccounts();
        setAccounts(rows.map(mapAccount));
        setPageError('');
    };

    const handleToggleAccountStatus = async (account) => {
        const isActive = account.status !== 'Active';
        try {
            setIsSaving(true);
            setPageError('');
            await accountApi.setAccountStatus(account.accountType, account.accountId, isActive);
            await refreshAccounts();
            showToast(`Account ${account.name} is now ${isActive ? 'active' : 'inactive'}.`);
        } catch (error) {
            showToast(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateAccountSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            setPageError('');
            await accountApi.createAccount({
                accountType: newAccount.role === 'Customer' ? 'Customer' : 'Employee',
                username: newAccount.username.trim(),
                password: newAccount.tempPassword,
                fullName: newAccount.name.trim(),
                email: newAccount.email.trim() || null,
                phone: newAccount.phone.trim(),
                roleName: newAccount.role,
                departmentId: newAccount.role === 'Customer'
                    ? null
                    : Number(newAccount.departmentId || currentUser?.departmentId),
            });
            await refreshAccounts();
            setIsCreateModalOpen(false);
            setNewAccount({ name: '', username: '', email: '', phone: '', role: 'Staff', departmentId: '', tempPassword: '' });
            showToast(`Created account for ${newAccount.name}.`);
        } catch (error) {
            showToast(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditAccountSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            setPageError('');
            await accountApi.updateAccount(editingAccount.accountType, editingAccount.accountId, {
                username: editingAccount.username.trim(),
                fullName: editingAccount.name.trim(),
                email: editingAccount.email.trim() || null,
                phone: editingAccount.phone.trim(),
                roleName: editingAccount.role,
                departmentId: editingAccount.accountType === 'customer'
                    ? null
                    : Number(editingAccount.departmentId || currentUser?.departmentId),
            });
            await refreshAccounts();
            showToast(`Updated account details for ${editingAccount.name}.`);
            setEditingAccount(null);
        } catch (error) {
            showToast(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Filtered accounts
    const filteredAccounts = accounts.filter((acc) => {
        const matchesSearch =
            acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (acc.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.phone.includes(searchTerm);
        const matchesRole = roleFilter === 'All' || acc.role === roleFilter;
        const matchesStatus = statusFilter === 'All' || acc.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div role="status" aria-live="polite" className="fixed top-20 right-6 z-[60] bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="text-[#DCC8A8] font-bold">✦ SYSTEM NOTICE ✦</span>
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            {/* HEADER BAR */}
            <div className="bg-[#081126] text-white p-6 rounded-3xl border border-[#DCC8A8]/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.2em]">
                        ✦ MANAGER CONTROL CENTER ✦
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Manage Accounts & Permissions
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1">
                        {currentUser?.role === 'Manager'
                            ? `Managing Staff and Kitchen accounts in ${currentUser.departmentName || 'your assigned department'} only.`
                            : 'Manage accounts across departments. Owner/Admin accounts are protected.'}
                    </p>
                </div>

                {canManageAccounts && <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                    <span className="text-lg font-black">+</span>
                    <span>Create New Account</span>
                </button>}
            </div>

            {/* SEARCH & FILTER TOOLBAR */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                {/* Search Input */}
                <div className="w-full sm:w-80 relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search by name, email or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DCC8A8]"
                    />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-slate-500">Role:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                        >
                            <option value="All">All Roles</option>
                            <option value="Customer">Customer</option>
                            <option value="Staff">Staff</option>
                            <option value="Kitchen">Kitchen</option>
                            <option value="Manager">Manager</option>
                            <option value="Owner">Owner</option>
                            {isElevated && <option value="Admin">Admin</option>}
                            <option value="Admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-semibold text-slate-500">Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer"
                        >
                            <option value="All">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {pageError && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    <span>{pageError}</span>
                    <button onClick={loadAccounts} className="font-bold underline" type="button">Retry</button>
                </div>
            )}

            {/* ACCOUNTS TABLE LIST */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#081126] text-[#DCC8A8] text-[11px] uppercase font-bold tracking-wider">
                                <th className="p-4 pl-6">User Account</th>
                                <th className="p-4">Contact Info</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Joined Date</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-xs text-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                                        Loading accounts from the database...
                                    </td>
                                </tr>
                            ) : filteredAccounts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                                        No accounts found matching your filter criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredAccounts.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Avatar & Name */}
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={acc.avatar}
                                                    alt={acc.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                                                />
                                                <div>
                                                    <span className="font-serif font-bold text-slate-900 text-sm block">{acc.name}</span>
                                                    <span className="font-mono text-[10px] text-slate-400">ID: {acc.id}</span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Contact */}
                                        <td className="p-4">
                                            <p className="font-mono text-slate-800 font-medium">{acc.email}</p>
                                            <p className="text-slate-500 text-[11px]">{acc.phone}</p>
                                            {acc.departmentName && (
                                                <p className="text-slate-400 text-[10px] mt-0.5">{acc.departmentName}</p>
                                            )}
                                        </td>

                                        {/* Role */}
                                        <td className="p-4">
                                            <span className={`inline-flex h-7 min-w-[88px] items-center justify-center rounded-full px-2.5 text-[10px] font-extrabold uppercase ${
                                                acc.role === 'Owner' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                                                acc.role === 'Manager' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                                                acc.role === 'Kitchen' ? 'bg-orange-100 text-orange-900 border border-orange-300' :
                                                acc.role === 'Staff' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                                                'bg-slate-100 text-slate-700 border border-slate-300'
                                            }`}>
                                                {acc.role}
                                            </span>
                                        </td>

                                        {/* Joined Date */}
                                        <td className="p-4 font-mono text-slate-500">
                                            {acc.createdDate}
                                        </td>

                                        {/* Account Status */}
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex h-7 min-w-[88px] items-center justify-center rounded-full px-2.5 text-[10px] font-bold ${
                                                acc.status === 'Active'
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                            }`}>
                                                ● {acc.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Activate / Deactivate Button */}
                                                {!['Owner', 'Admin'].includes(acc.role) && <button
                                                    onClick={() => handleToggleAccountStatus(acc)}
                                                    disabled={isSaving}
                                                    title={acc.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                                                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase transition cursor-pointer ${
                                                        acc.status === 'Active'
                                                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                                    }`}
                                                >
                                                    {acc.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                </button>}

                                                {/* Edit Account */}
                                                {!['Owner', 'Admin'].includes(acc.role) && <button
                                                    onClick={() => setEditingAccount({ ...acc })}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] uppercase rounded-xl border border-slate-300 transition cursor-pointer"
                                                >
                                                    ✏ Edit
                                                </button>}
                                                {['Owner', 'Admin'].includes(acc.role) && (
                                                    <span className="text-[10px] font-bold text-slate-400">Protected</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE ACCOUNT MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fadeIn">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">
                                Create New Account
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateAccountSubmit} className="space-y-4 mt-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={newAccount.name}
                                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={50}
                                    autoComplete="username"
                                    placeholder="e.g. john.doe"
                                    value={newAccount.username}
                                    onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    placeholder="name@lumiere.com"
                                    value={newAccount.email}
                                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="0901 234 567"
                                    value={newAccount.phone}
                                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Role Assignment</label>
                                <select
                                    value={newAccount.role}
                                    onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                                >
                                    <option value="Staff">Staff (POS)</option>
                                    <option value="Kitchen">Kitchen Chef</option>
                                    {isElevated && <option value="Customer">Customer</option>}
                                    {isElevated && <option value="Manager">Manager</option>}
                                </select>
                            </div>

                            {newAccount.role !== 'Customer' && (
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                                    {isElevated ? (
                                        <select
                                            required
                                            value={newAccount.departmentId}
                                            onChange={(e) => setNewAccount({ ...newAccount, departmentId: e.target.value })}
                                            className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                                        >
                                            <option value="">Select department</option>
                                            {departments.map((department) => (
                                                <option key={department.departmentId} value={department.departmentId}>
                                                    {department.departmentName}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="rounded-xl border border-stone-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                                            {currentUser?.departmentName || 'Your department is not assigned. Contact Owner/Admin.'}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Temporary Password</label>
                                <div className="relative flex items-center">
                                    <input
                                        type={showTempPassword ? 'text' : 'password'}
                                        required
                                        minLength={8}
                                        placeholder="••••••••"
                                        value={newAccount.tempPassword}
                                        onChange={(e) => setNewAccount({ ...newAccount, tempPassword: e.target.value })}
                                        className="w-full bg-slate-50 border border-stone-300 rounded-xl pl-3 pr-10 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowTempPassword(!showTempPassword)}
                                        className="absolute right-3 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                                        title={showTempPassword ? "Hide password" : "Show password"}
                                    >
                                        {showTempPassword ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.273-4.337 5.29-7.5 10.04-7.5 4.75 0 8.767 3.163 10.041 7.5-1.274 4.337-5.29 7.5-10.041 7.5-4.75 0-8.767-3.163-10.04-7.5z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold uppercase rounded-xl hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800"
                                >
                                    {isSaving ? 'Saving...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT ACCOUNT MODAL */}
            {editingAccount && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-fadeIn">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">
                                Edit Account Information
                            </h3>
                            <button
                                onClick={() => setEditingAccount(null)}
                                className="text-slate-400 hover:text-slate-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEditAccountSubmit} className="space-y-4 mt-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingAccount.name}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={50}
                                    autoComplete="username"
                                    value={editingAccount.username}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, username: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={editingAccount.email}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    required
                                    value={editingAccount.phone}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, phone: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                />
                            </div>

                            {editingAccount.accountType !== 'customer' && (
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Department</label>
                                    {isElevated ? (
                                        <select
                                            required
                                            value={editingAccount.departmentId}
                                            onChange={(e) => setEditingAccount({ ...editingAccount, departmentId: e.target.value })}
                                            className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                                        >
                                            <option value="">Select department</option>
                                            {departments.map((department) => (
                                                <option key={department.departmentId} value={department.departmentId}>
                                                    {department.departmentName}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="rounded-xl border border-stone-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                                            {editingAccount.departmentName || currentUser?.departmentName}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Role</label>
                                <select
                                    value={editingAccount.role}
                                    disabled={editingAccount.accountType === 'customer'}
                                    onChange={(e) => setEditingAccount({ ...editingAccount, role: e.target.value })}
                                    className="w-full bg-slate-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer"
                                >
                                    <option value="Customer">Customer</option>
                                    <option value="Staff">Staff</option>
                                    <option value="Kitchen">Kitchen</option>
                                    {isElevated && <option value="Manager">Manager</option>}
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingAccount(null)}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold uppercase rounded-xl hover:bg-slate-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800"
                                >
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
