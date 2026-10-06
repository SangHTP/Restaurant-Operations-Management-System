import { Outlet, Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import logoApp from '../assets/logo/logo.png';

export default function CustomerLayout() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800 relative overflow-x-hidden font-sans">

            {/* Ambient Background Glow */}
            <div className="fixed -top-20 -left-20 w-96 h-96 bg-purple-300/40 rounded-full blur-3xl pointer-events-none"></div>
            <div className="fixed top-1/4 -right-20 w-96 h-96 bg-cyan-300/40 rounded-full blur-3xl pointer-events-none"></div>

            {/* HEADER GALAXY NIGHT */}
            <header className="bg-[#0c2040] border-b border-indigo-900/60 sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">

                    {/* BRAND LOGO */}
                    <Link to="/" className="flex items-center space-x-3 group py-1">
                        <div className="h-12 w-14 sm:w-40 rounded-xl bg-[#0c2040] p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                            <img
                                src={logoApp}
                                alt="Lumière Logo"
                                className="h-full w-full object-contain scale-125"
                            />
                        </div>
                    </Link>

                    <nav className="hidden md:flex space-x-6 font-serif text-sm font-semibold tracking-wider">
                        <Link to="/" className="text-[#fff8e7] hover:text-[#D9C6A5] transition-colors duration-200">
                            HOME
                        </Link>
                        <Link to="/menu" className="text-[#fff8e7] hover:text-[#D9C6A5] transition-colors duration-200">
                            MENU
                        </Link>
                        <Link to="/restaurant-info" className="text-[#fff8e7] hover:text-[#D9C6A5] transition-colors duration-200">
                            RESTAURANT INFO
                        </Link>
                        <Link to="/restaurant-layout" className="text-[#fff8e7] hover:text-[#D9C6A5] transition-colors duration-200">
                            LAYOUT
                        </Link>
                    </nav>

                    {/* DYNAMIC AUTH HEADER BUTTONS */}
                    <div className="flex items-center space-x-3">
                        {currentUser ? (
                            <div className="flex items-center gap-3">
                                {/* Profile Link with Avatar */}
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-[#DCC8A8]/30 px-3 py-1.5 rounded-full transition cursor-pointer"
                                >
                                    <img
                                        src={currentUser.avatar}
                                        alt={currentUser.name}
                                        className="w-6 h-6 rounded-full object-cover border border-[#DCC8A8]"
                                    />
                                    <span className="text-xs font-bold text-[#F5F2EA] hidden sm:inline">
                                        {currentUser.name.split(' ')[0]}
                                    </span>
                                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#DCC8A8] text-[#081126]">
                                        {currentUser.role}
                                    </span>
                                </Link>

                                {/* Dashboard Switch for Admin/Staff */}
                                {currentUser.role !== 'Customer' && (
                                    <Link
                                        to="/dashboard/accounts"
                                        className="text-xs font-bold bg-cyan-900/60 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 px-3 py-1.5 rounded-full transition"
                                    >
                                        Manager Portal
                                    </Link>
                                )}

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    title="Sign Out"
                                    className="text-xs font-bold text-rose-300 hover:text-rose-100 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 px-3 py-1.5 rounded-full transition cursor-pointer"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase">
                                    <span></span> Guest
                                </span>
                                <Link to="/login">
                                    <Button variant="gold" size="sm" className="font-bold text-xs uppercase cursor-pointer">
                                        Sign In
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* BODY CONTENT */}
            <main className="flex-1 relative z-10">
                <Outlet />
            </main>

            {/* FOOTER — PREMIUM REDESIGN */}
            <footer className="relative z-10 font-sans overflow-hidden" style={{ background: 'linear-gradient(180deg, #081126 0%, #040d1a 100%)' }}>
                {/* Gold decorative top border */}
                <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent 0%, #DCC8A8 30%, #f0ddb0 50%, #DCC8A8 70%, transparent 100%)' }} />

                {/* Main footer content: 2-column split */}
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[380px]">

                        {/* LEFT: Brand + Info */}
                        <div className="py-12 pr-0 lg:pr-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[rgba(220,200,168,0.12)]">

                            {/* Brand */}
                            <div>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="h-12 w-16 rounded-xl bg-[#0c2040] p-1.5 flex items-center justify-center border border-[rgba(220,200,168,0.25)] shadow-lg">
                                        <img src={logoApp} alt="Lumière" className="h-full w-full object-contain" />
                                    </div>
                                    <div>
                                        <span className="block text-2xl font-serif font-bold text-[#DCC8A8] tracking-wide leading-tight">
                                            Lumière
                                        </span>
                                        <span className="block text-[10px] tracking-[0.3em] text-[#8995AD] uppercase">
                                            Restaurant
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-[#6b7a94] leading-relaxed max-w-xs mb-8">
                                    An exquisite fine dining experience at the heart of FPT University, Cần Thơ. Where culinary artistry meets elegant ambiance.
                                </p>

                                {/* Info grid */}
                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    <div>
                                        <h4 className="text-[#DCC8A8] font-serif font-bold text-[10px] tracking-[0.2em] uppercase mb-3">Explore</h4>
                                        <ul className="space-y-2 text-xs text-[#6b7a94]">
                                            <li><Link to="/" className="hover:text-[#DCC8A8] transition-colors duration-200 flex items-center gap-1.5"><span className="text-[#DCC8A8] opacity-50">›</span>Home</Link></li>
                                            <li><Link to="/menu" className="hover:text-[#DCC8A8] transition-colors duration-200 flex items-center gap-1.5"><span className="text-[#DCC8A8] opacity-50">›</span>Menu</Link></li>
                                            <li><Link to="/restaurant-info" className="hover:text-[#DCC8A8] transition-colors duration-200 flex items-center gap-1.5"><span className="text-[#DCC8A8] opacity-50">›</span>Restaurant Info</Link></li>
                                            <li><Link to="/restaurant-layout" className="hover:text-[#DCC8A8] transition-colors duration-200 flex items-center gap-1.5"><span className="text-[#DCC8A8] opacity-50">›</span>Layout</Link></li>
                                        </ul>
                                    </div>
                                    <div className="space-y-5">
                                        <div>
                                            <h4 className="text-[#DCC8A8] font-serif font-bold text-[10px] tracking-[0.2em] uppercase mb-3">Hours</h4>
                                            <p className="text-xs text-[#6b7a94]">Mon – Sun</p>
                                            <p className="text-sm font-semibold text-[#DCC8A8]">10:00 – 23:00</p>
                                        </div>
                                        <div>
                                            <h4 className="text-[#DCC8A8] font-serif font-bold text-[10px] tracking-[0.2em] uppercase mb-3">Contact</h4>
                                            <p className="text-xs text-[#6b7a94] leading-relaxed">
                                                FPT University<br />
                                                Cần Thơ City, Vietnam
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social icons */}
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] tracking-widest uppercase text-[#4a5568] mr-1">Follow</span>
                                {[
                                    { label: 'Facebook', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
                                    { label: 'Instagram', path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z' },
                                    { label: 'Twitter/X', path: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
                                ].map(({ label, path }) => (
                                    <button
                                        key={label}
                                        title={label}
                                        className="w-8 h-8 rounded-full flex items-center justify-center border border-[rgba(220,200,168,0.2)] text-[#6b7a94] hover:text-[#DCC8A8] hover:border-[#DCC8A8] hover:bg-[rgba(220,200,168,0.08)] transition-all duration-200 cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d={path} />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Google Maps */}
                        <div className="lg:pl-10 py-12 flex flex-col">
                            <h4 className="text-[#DCC8A8] font-serif font-bold text-[10px] tracking-[0.2em] uppercase mb-5 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                Find Us
                            </h4>
                            <div className="flex-1 rounded-2xl overflow-hidden border border-[rgba(220,200,168,0.2)] shadow-2xl" style={{ minHeight: '280px', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(220,200,168,0.1)' }}>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3929.0532902991354!2d105.7298566747584!3d10.012457072820814!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31a0882139720a77%3A0x3916a227d0b95a64!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgQ-G6p24gVGjGoQ!5e0!3m2!1sen!2s!4v1791269118301!5m2!1sen!2s"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, display: 'block', minHeight: '280px' }}
                                    allowFullScreen=""
                                    loading="lazy"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    title="FPT University Can Tho - Lumière Restaurant Location"
                                ></iframe>
                            </div>
                            <p className="mt-3 text-[10px] text-[#4a5568] flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                Trường Đại học FPT Cần Thơ, Việt Nam
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom copyright bar */}
                <div style={{ borderTop: '1px solid rgba(220,200,168,0.10)' }}>
                    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <p className="text-[10px] text-[#4a5568] tracking-wide">
                            © 2026 <span className="text-[#6b7a94]">Lumière Restaurant</span>. All rights reserved.
                        </p>
                        <p className="text-[10px] text-[#4a5568] tracking-widest uppercase">
                            Fine Dining · Cần Thơ
                        </p>
                    </div>
                </div>
            </footer>

        </div>
    );
}