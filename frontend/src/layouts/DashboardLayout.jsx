import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        {
            group: 'Executive & Reports',
            items: [
                { path: '/dashboard/analytics', label: '📊 Business Dashboard', icon: '📊' },
            ]
        },
        {
            group: 'Operations & Dining',
            items: [
                { path: '/dashboard/reservations', label: '📅 Reservations', icon: '📅' },
                { path: '/dashboard/tables', label: '🗺️ Table Layout', icon: '🗺️' },
                { path: '/dashboard/orders', label: '🍽️ Orders & Dispatch', icon: '🍽️' },
                { path: '/dashboard/kitchen', label: '🧑‍🍳 Kitchen Display (KDS)', icon: '🧑‍🍳' },
                { path: '/dashboard/billing', label: '💳 Billing & Cashier', icon: '💳' },
            ]
        },
        {
            group: 'Inventory & Marketing',
            items: [
                { path: '/dashboard/menu', label: '📖 Menu & Stock', icon: '📖' },
                { path: '/dashboard/promotions', label: '🎟️ Promotions & Vouchers', icon: '🎟️' },
            ]
        },
        {
            group: 'Workforce & Accounts',
            items: [
                { path: '/dashboard/employees', label: '👔 Staff & Schedules', icon: '👔' },
                { path: '/dashboard/accounts', label: '👥 Account Management', icon: '👥' },
                { path: '/dashboard/feedback', label: '⭐ Customer Reviews', icon: '⭐' },
                { path: '/dashboard/profile', label: '👤 My Profile', icon: '👤' },
            ]
        }
    ];

    return (
        <div className="h-screen flex flex-col bg-slate-100 overflow-hidden font-sans">
            {/* HEADER MANAGEMENT */}
            <header className="bg-[#081126] text-white h-16 px-6 flex items-center justify-between border-b border-[#DCC8A8]/20 shadow-md">
                <div className="flex items-center space-x-3">
                    <Link to="/" className="font-serif font-bold text-lg text-[#DCC8A8] tracking-wider">
                        Lumière RMS Dashboard
                    </Link>
                    <span className="text-xs bg-[#DCC8A8]/20 border border-[#DCC8A8]/40 text-[#DCC8A8] px-2.5 py-0.5 rounded-full font-bold">
                        Manager & Staff Portal
                    </span>
                </div>

                <div className="flex items-center space-x-4">
                    {/* User Info */}
                    {currentUser && (
                        <div className="flex items-center gap-3">
                            <img
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                className="w-8 h-8 rounded-full object-cover border border-[#DCC8A8]"
                            />
                            <div className="hidden sm:block text-left">
                                <span className="text-xs font-serif font-bold text-[#F5F2EA] block leading-tight">
                                    {currentUser.name}
                                </span>
                                <span className="text-[9px] font-extrabold uppercase text-[#DCC8A8]">
                                    {currentUser.role}
                                </span>
                            </div>
                        </div>
                    )}

                    <Link
                        to="/dashboard/profile"
                        className="text-xs font-bold text-slate-300 hover:text-[#DCC8A8] transition"
                    >
                        My Profile
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="text-xs font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                        Logout
                    </button>

                    <Link
                        to="/"
                        className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/20 transition"
                    >
                        Main Site →
                    </Link>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR NAVIGATION */}
                <aside className="w-64 bg-white border-r border-slate-200 p-4 space-y-5 overflow-y-auto">
                    {navLinks.map((section, idx) => (
                        <div key={idx}>
                            <p className="text-[10px] font-extrabold text-slate-400 px-3 pb-2 uppercase tracking-widest">
                                {section.group}
                            </p>
                            <div className="space-y-1">
                                {section.items.map(item => {
                                    const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={`block px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                                                isActive
                                                    ? 'bg-[#081126] text-[#DCC8A8] shadow-md'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </aside>

                {/* MAIN CONTENT AREA */}
                <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}