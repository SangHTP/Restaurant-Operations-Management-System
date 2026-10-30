import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import logoApp from '../../assets/logo/logo.png';
import { useAuth } from '../../context/AuthContext';

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

        </div>
    );
}