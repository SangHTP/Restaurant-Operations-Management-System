import { useState } from 'react';
import { useAuth, MOCK_ACCOUNTS_DB } from '../../context/AuthContext';

export default function Profile() {
    const { currentUser, updateProfile, login } = useAuth();

    // Default user fallback
    const user = currentUser || MOCK_ACCOUNTS_DB[0];

    const [activeTab, setActiveTab] = useState('view'); // 'view', 'edit', 'password'

    // Form Edit state
    const [editForm, setEditForm] = useState(user);
    const [toastMessage, setToastMessage] = useState('');

    // Form Change Password state
    const [passForm, setPassForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPass, setShowPass] = useState(false);

    // Role switcher simulator for teacher demo
    const handleRoleSwitch = (roleKey) => {
        const found = MOCK_ACCOUNTS_DB.find((u) => u.role === roleKey);
        if (found) {
            login(found.email);
            setEditForm(found);
            setToastMessage(`Switched logged-in account to ${found.name} (${found.role})`);
            setTimeout(() => setToastMessage(''), 3000);
        }
    };

    // Handle Avatar File Upload from Computer
    const handleAvatarFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditForm(prev => ({ ...prev, avatar: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Save Profile Changes
    const handleSaveProfile = (e) => {
        e.preventDefault();
        updateProfile(editForm);
        setToastMessage('Profile updated successfully!');
        setTimeout(() => setToastMessage(''), 3000);
        setActiveTab('view');
    };

    // Change Password
    const handleChangePassword = (e) => {
        e.preventDefault();
        if (passForm.newPassword !== passForm.confirmPassword) {
            setToastMessage('⚠️ New password and confirm password do not match!');
            setTimeout(() => setToastMessage(''), 3500);
            return;
        }
        setToastMessage('✅ Password changed successfully!');
        setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setToastMessage(''), 3000);
        setActiveTab('view');
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 font-sans">

            {/* TOAST SUCCESS NOTIFICATION */}
            {toastMessage && (
                <div className="fixed top-20 right-6 z-50 bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="text-xl">✅</span>
                    <span className="text-xs font-bold uppercase tracking-wider">{toastMessage}</span>
                </div>
            )}

            {/* TOP BAR WITH ROLE SELECTOR SIMULATOR */}
            <div className="bg-[#081126] text-white p-4 rounded-3xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#DCC8A8]/30 shadow-xl">
                <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#DCC8A8] tracking-[0.2em]">
                        ✦ AUTHENTICATED ACCOUNT CENTER ✦
                    </span>
                    <h1 className="text-lg font-serif font-bold text-[#F5F2EA]">
                        User Profile & Account Security
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Demo Role Switch:</span>
                    <select
                        value={user.role}
                        onChange={(e) => handleRoleSwitch(e.target.value)}
                        className="bg-[#101936] text-[#DCC8A8] text-xs font-bold border border-[#DCC8A8]/40 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
                    >
                        <option value="Customer">Customer</option>
                        <option value="Staff">Staff (POS)</option>
                        <option value="Kitchen">Kitchen Chef</option>
                        <option value="Manager">Manager</option>
                        <option value="Owner">Owner</option>
                    </select>
                </div>
            </div>

            {/* MAIN PROFILE CARD */}
            <div className="bg-white/90 backdrop-blur-xl border border-stone-200 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">

                {/* LEFT SIDEBAR: AVATAR & QUICK STATUS */}
                <div className="lg:col-span-4 bg-[#081126] text-white p-8 flex flex-col items-center justify-between border-r border-[#DCC8A8]/20 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 w-full flex flex-col items-center">
                        {/* Avatar */}
                        <div className="relative group mb-4">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-[#DCC8A8] shadow-2xl transition-transform duration-300 group-hover:scale-105"
                            />
                            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#081126] rounded-full" title="Status: Active"></span>
                        </div>

                        {/* Name & Role */}
                        <h2 className="font-serif text-xl font-bold text-[#F5F2EA]">{user.name}</h2>
                        <span className="mt-1 text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#DCC8A8] text-[#081126] shadow-sm">
                            {user.role}
                        </span>

                        <p className="text-xs text-[#8995AD] mt-3 font-mono">ID: {user.id}</p>

                        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#DCC8A8]/30 to-transparent my-6"></div>

                        {/* Quick Stats */}
                        <div className="w-full space-y-3 text-xs text-left">
                            <div className="flex justify-between text-slate-300">
                                <span className="text-slate-400">Account Status:</span>
                                <span className="font-bold text-emerald-400">● {user.status}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span className="text-slate-400">Member Since:</span>
                                <span className="font-semibold text-slate-200">{user.joinDate}</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span className="text-slate-400">Email:</span>
                                <span className="font-mono text-[11px] text-[#DCC8A8] truncate max-w-[150px]">{user.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="w-full mt-8 space-y-2 relative z-10">
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                activeTab === 'view'
                                    ? 'bg-[#DCC8A8] text-[#081126] shadow-lg'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                        >
                            View Profile
                        </button>
                        <button
                            onClick={() => {
                                setEditForm({ ...user });
                                setActiveTab('edit');
                            }}
                            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                activeTab === 'edit'
                                    ? 'bg-[#DCC8A8] text-[#081126] shadow-lg'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                        >
                            Update Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                activeTab === 'password'
                                    ? 'bg-[#DCC8A8] text-[#081126] shadow-lg'
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                        >
                            Change Password
                        </button>
                    </div>
                </div>

                {/* RIGHT PANEL: TAB CONTENT */}
                <div className="lg:col-span-8 p-8 flex flex-col justify-center">

                    {/* TAB 1: VIEW PROFILE DETAILS */}
                    {activeTab === 'view' && (
                        <div>
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-200">
                                <div>
                                    <h3 className="font-serif text-2xl font-bold text-[#081126]">
                                        Personal Details
                                    </h3>
                                    <p className="text-xs text-slate-500">Overview of your registered account profile</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setEditForm({ ...user });
                                        setActiveTab('edit');
                                    }}
                                    className="px-4 py-2 bg-[#081126] text-[#DCC8A8] text-xs font-bold uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer"
                                >
                                    ✏ Edit Profile
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-stone-200/80">
                                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Full Name</span>
                                    <span className="font-serif font-bold text-slate-800 text-base">{user.name}</span>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-stone-200/80">
                                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Email Address</span>
                                    <span className="font-mono text-slate-800">{user.email}</span>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-stone-200/80">
                                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Phone Number</span>
                                    <span className="font-mono text-slate-800">{user.phone}</span>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-stone-200/80">
                                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Gender / DOB</span>
                                    <span className="font-semibold text-slate-800">{user.gender} · {user.dob}</span>
                                </div>

                                <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-stone-200/80">
                                    <span className="text-xs text-slate-400 font-bold uppercase block mb-1">Contact Address</span>
                                    <span className="font-medium text-slate-800">{user.address}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: UPDATE PROFILE FORM */}
                    {activeTab === 'edit' && (
                        <div>
                            <div className="mb-6 pb-4 border-b border-stone-200">
                                <h3 className="font-serif text-2xl font-bold text-[#081126]">
                                    Update Profile
                                </h3>
                                <p className="text-xs text-slate-500">Edit your contact details and account information</p>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                                        <input
                                            type="text"
                                            required
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
                                        <select
                                            value={editForm.gender}
                                            onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none cursor-pointer"
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={editForm.dob}
                                            onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                                            className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Avatar Image</label>
                                    <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-stone-200">
                                        <img
                                            src={editForm.avatar}
                                            alt="Preview"
                                            className="w-12 h-12 rounded-full object-cover border-2 border-[#DCC8A8] shadow-xs"
                                        />
                                        <label className="px-4 py-2 bg-[#081126] hover:bg-slate-800 text-[#DCC8A8] border border-[#DCC8A8]/40 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-2">
                                            <span>📷 Select Photo from Computer</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarFileChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Or paste image URL (https://...)"
                                        value={editForm.avatar}
                                        onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2 text-xs font-mono focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
                                    <input
                                        type="text"
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('view')}
                                        className="px-5 py-2.5 bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl hover:bg-slate-300 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2.5 bg-[#081126] text-[#DCC8A8] text-xs font-bold uppercase rounded-xl hover:bg-slate-800 cursor-pointer shadow-md"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* TAB 3: CHANGE PASSWORD FORM */}
                    {activeTab === 'password' && (
                        <div>
                            <div className="mb-6 pb-4 border-b border-stone-200">
                                <h3 className="font-serif text-2xl font-bold text-[#081126]">
                                    Change Password
                                </h3>
                                <p className="text-xs text-slate-500">Update your account password for enhanced security</p>
                            </div>

                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        value={passForm.currentPassword}
                                        onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        value={passForm.newPassword}
                                        onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        value={passForm.confirmPassword}
                                        onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                                        className="w-full bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#DCC8A8] focus:outline-none"
                                    />
                                </div>

                                <div className="flex items-center gap-2 text-xs text-[#081126]">
                                    <input
                                        type="checkbox"
                                        id="showPassToggle"
                                        checked={showPass}
                                        onChange={() => setShowPass(!showPass)}
                                    />
                                    <label htmlFor="showPassToggle" className="cursor-pointer font-medium">Show password text</label>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:scale-[1.02] cursor-pointer transition"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
