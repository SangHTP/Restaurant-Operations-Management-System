import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, UserRound, X } from 'lucide-react';
import logoApp from '../../assets/logo/logo.png';
import { useAuth, MOCK_ACCOUNTS_DB } from '../../context/AuthContext';
import IconGlyph from '../../components/common/IconGlyph';

export default function Login() {
    const navigate = useNavigate();
    const { loginWithCredentials } = useAuth();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage('');
        try {
            const user = await loginWithCredentials(formData.username, formData.password);
            navigate(['Owner', 'Admin', 'Manager'].includes(user.role) ? '/dashboard/accounts' : '/dashboard/profile');
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 sm:p-6 font-sans"
            style={{
                background: `
          radial-gradient(circle at 10% 20%, #E8E1F7 0%, transparent 30%),
          radial-gradient(circle at 90% 80%, #DFF4F4 0%, transparent 30%),
          #F7F5F1
        `
            }}
        >
            <div className="w-full max-w-4xl bg-white/80 backdrop-blur-2xl border border-white/90 rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 min-h-[640px]">

                {/* LEFT BRANDING SHOWCASE */}
                <div className="lg:col-span-5 bg-[#081126] relative p-8 flex flex-col justify-between overflow-hidden border-r border-[#DCC8A8]/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md text-[#fff8e7] text-xs font-bold tracking-wider transition-all duration-300 hover:border-[#DCC8A8]/60 group w-fit"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 text-[#DCC8A8] transition-transform duration-300 group-hover:-translate-x-1" strokeWidth={2.5} aria-hidden="true" />
                            <span className="group-hover:text-[#DCC8A8] transition-colors font-serif uppercase tracking-widest text-[10px]">
                                Home
                            </span>
                        </Link>
                    </div>

                    <div className="relative z-10 my-auto py-6 text-center flex flex-col items-center">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 mb-5 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-[#DCC8A8]/30 backdrop-blur-md p-2.5 flex items-center justify-center shadow-lg shadow-black/40 group transition-all duration-300 hover:scale-105 hover:border-[#DCC8A8]">
                            <img src={logoApp} alt="Lumière Logo" className="w-full h-full object-contain" />
                        </div>

                        <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-[#F5F2EA] tracking-wider">
                            Lumière Restaurant
                        </h2>
                        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#DCC8A8]/50 to-transparent my-4"></div>
                        <span className="font-sans text-[10px] font-extrabold tracking-[0.25em] text-[#DCC8A8] uppercase">
                            Operations & Customer Portal
                        </span>
                        <p className="font-serif italic text-xs text-[#8995AD] font-light mt-3 max-w-[220px] leading-relaxed">
                            &ldquo;Where every detail creates an experience.&rdquo;
                        </p>
                    </div>

                    <div className="relative z-10 text-center text-[10px] text-slate-400 font-medium tracking-wide">
                        © Lumière RMS · 2026.
                    </div>
                </div>

                {/* RIGHT LOGIN FORM */}
                <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white/60 backdrop-blur-md">
                    <div className="max-w-md mx-auto w-full space-y-6">

                        {/* QUICK DEMO ACCOUNTS SELECTOR */}
                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-[#DCC8A8]/30 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-widest flex items-center gap-1.5">
                                    <span className="animate-pulse text-amber-400"><IconGlyph glyph="⚡" size={16} /></span> Quick Demo Roles
                                </span>
                                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">1-Click Auto Login</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {MOCK_ACCOUNTS_DB.map((acc) => (
                                    <button
                                        key={acc.id}
                                        type="button"
                                        onClick={() => handleQuickLogin(acc)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                                            acc.role === 'Customer' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900' :
                                            acc.role === 'Staff' ? 'bg-blue-950/80 text-blue-300 border-blue-500/40 hover:bg-blue-900' :
                                            acc.role === 'Kitchen' ? 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900' :
                                            acc.role === 'Manager' ? 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-900' :
                                            'bg-yellow-950/80 text-yellow-300 border-yellow-500/40 hover:bg-yellow-900'
                                        }`}
                                    >
                                        {acc.role === 'Customer' && <><IconGlyph glyph="👤" size={15} /> Customer</>}
                                        {acc.role === 'Staff' && <><IconGlyph glyph="👨‍💼" size={15} /> Staff (POS)</>}
                                        {acc.role === 'Kitchen' && <><IconGlyph glyph="🍳" size={15} /> Kitchen</>}
                                        {acc.role === 'Manager' && <><IconGlyph glyph="📊" size={15} /> Manager</>}
                                        {acc.role === 'Owner' && <><IconGlyph glyph="👑" size={15} /> Owner</>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h1 className="font-serif text-3xl font-bold text-[#081126] tracking-wide">
                                Sign In
                            </h1>
                            <p className="font-sans text-xs text-slate-500 font-medium mt-1">
                                Sign in with the username and password stored in the account database.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 font-sans">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Username or Email
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoComplete="username"
                                    placeholder="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full bg-white/90 border border-slate-300 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#081126] transition shadow-xs"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative flex items-center">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-white/90 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#081126] transition shadow-xs"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" aria-hidden="true" />
                                        ) : (
                                            <Eye className="w-4 h-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {errorMessage && (
                                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                    {errorMessage}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#081126] text-[#DCC8A8] hover:bg-slate-900 font-extrabold text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#DCC8A8]/30"
                            >
                                {isLoading ? (
                                    <span>Authenticating...</span>
                                ) : (
                                    <span>Sign In to Portal</span>
                                )}
                            </button>
                        </form>

                        {/* REGISTER FOOTER */}
                        <div className="text-center text-xs text-slate-500 font-medium pt-2">
                            New to Lumière?{' '}
                            <Link to="/register" className="font-extrabold text-[#081126] hover:underline">
                                Register an account
                            </Link>
                        </div>
                    </div>
                </div>

            </div>

            {/* GOOGLE OAUTH ACCOUNT CHOOSER MODAL */}
            {isGoogleModalOpen && (
                <div className="fixed inset-0 z-50 bg-[#081126]/65 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full max-h-[calc(100vh-2rem)] p-5 sm:p-8 shadow-2xl border border-white/70 animate-fadeIn overflow-y-auto">
                        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                                    <svg className="w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-sans font-bold text-xl text-slate-900">
                                        Choose an account
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Continue to <span className="font-semibold text-[#081126]">Lumière Restaurant</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsGoogleModalOpen(false)}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                aria-label="Close account chooser"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="py-5 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Available demo accounts
                            </p>
                            {GOOGLE_ACCOUNTS.map((acc) => (
                                <button
                                    key={acc.email}
                                    onClick={() => handleSelectGoogleAccount(acc.email)}
                                    disabled={googleLoadingEmail !== ''}
                                    className="w-full min-w-0 text-left p-3 sm:p-4 border border-slate-200 hover:border-[#DCC8A8] hover:bg-amber-50/40 rounded-2xl flex items-center gap-3 sm:gap-4 transition cursor-pointer group disabled:opacity-60 disabled:cursor-wait"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <img
                                            src={acc.avatar}
                                            alt={acc.name}
                                            className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                                        />
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-slate-800 group-hover:text-[#081126]">
                                                {acc.name}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 break-all">
                                                {acc.email}
                                            </div>
                                        </div>
                                    </div>

                                    {googleLoadingEmail === acc.email ? (
                                        <span className="text-xs font-semibold text-amber-700 animate-pulse shrink-0">
                                            Signing in...
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 shrink-0">
                                            {acc.badge}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-200">
                            <button
                                onClick={() => handleSelectGoogleAccount('havanon@fpt.edu.vn')}
                                className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-sm font-semibold text-slate-600 flex items-center gap-3 cursor-pointer transition"
                            >
                                <UserRound size={18} className="text-slate-400" aria-hidden="true" />
                                <span>Use another account</span>
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs text-slate-400">
                            <span>Demo sign-in preview</span>
                            <button
                                onClick={() => setIsGoogleModalOpen(false)}
                                className="sm:ml-auto px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer transition"
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}