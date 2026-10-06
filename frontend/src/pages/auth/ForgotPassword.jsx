import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoApp from '../../assets/logo/logo.png';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP, 3: New Password, 4: Success
    const [email, setEmail] = useState('');
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Countdown timer for Resend OTP
    const [resendTimer, setResendTimer] = useState(60);
    useEffect(() => {
        let timer;
        if (step === 2 && resendTimer > 0) {
            timer = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [step, resendTimer]);

    // Step 1: Submit Email
    const handleSendEmail = (e) => {
        e.preventDefault();
        if (!email) return;
        setErrorMessage('');
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            setStep(2);
            setResendTimer(60);
        }, 1000);
    };

    // Step 2: Submit OTP Code
    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value.slice(-1);
        const newOtp = [...otpCode];
        newOtp[index] = value;
        setOtpCode(newOtp);

        // Auto-focus next input field
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            setStep(3);
        }, 1000);
    };

    // Step 3: Submit New Password
    const handleResetPassword = (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        if (newPassword !== confirmPassword) {
            setErrorMessage('New password and confirm password do not match. Please verify both fields.');
            return;
        }
        setIsLoading(true);

        setTimeout(() => {
            setIsLoading(false);
            setStep(4);
        }, 1200);
    };

    const handleResendCode = () => {
        setResendTimer(60);
        setErrorMessage('');
        setSuccessMessage(`A new 6-digit verification code has been dispatched to: ${email}`);
        setTimeout(() => setSuccessMessage(''), 5000);
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
            <div className="w-full max-w-4xl bg-white/75 backdrop-blur-xl border border-white/90 rounded-3xl shadow-2xl shadow-stone-900/10 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10 min-h-[620px]">

                {/* LEFT BRANDING PANEL */}
                <div className="lg:col-span-5 bg-[#0b132b] relative p-8 flex flex-col justify-between overflow-hidden border-r border-indigo-950/50">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none"></div>

                    <div className="relative z-10 my-auto py-6 text-center flex flex-col items-center">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 mb-5 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-[#D9C6A5]/30 backdrop-blur-md p-2.5 flex items-center justify-center shadow-lg shadow-black/40 group transition-all duration-300 hover:scale-105 hover:border-[#D9C6A5]">
                            <img src={logoApp} alt="Lumière Logo" className="w-full h-full object-contain" />
                        </div>

                        <h2 className="font-serif italic text-2xl sm:text-3xl font-bold text-[#fff8e7] tracking-wider">
                            Lumière Restaurant
                        </h2>
                        <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[#D9C6A5]/50 to-transparent my-4"></div>
                        <span className="font-sans text-[10px] font-extrabold tracking-[0.25em] text-[#D9C6A5] uppercase">
                            Account Recovery
                        </span>
                        <p className="font-serif italic text-xs text-[#fff8e7]/80 font-light mt-3 max-w-[220px] leading-relaxed">
                            &ldquo;Don&apos;t worry, we&apos;ll help you get back on track.&rdquo;
                        </p>
                        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#D9C6A5]/30 to-transparent my-4"></div>
                        <div className="font-sans text-[10px] font-extrabold text-[#D9C6A5]/90 tracking-[0.2em] uppercase flex items-center gap-2">
                            <span className="text-[8px] text-[#D9C6A5]">✦</span> EST. 2026 <span className="text-[8px] text-[#D9C6A5]">✦</span>
                        </div>
                    </div>

                    <div className="relative z-10 text-center text-[10px] text-slate-400/80 font-medium tracking-wide">
                        © 2026 Lumière RMS. All rights reserved.
                    </div>
                </div>

                {/* RIGHT PANEL: FORMS IN 100% ENGLISH */}
                <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white/70 backdrop-blur-md">
                    <div className="max-w-md mx-auto w-full">

                        {/* ERROR / SUCCESS ALERTS */}
                        {errorMessage && (
                            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                                <span className="text-base">⚠️</span>
                                <span>{errorMessage}</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
                                <span className="text-base">✅</span>
                                <span>{successMessage}</span>
                            </div>
                        )}

                        {/* STEP 1: ENTER EMAIL */}
                        {step === 1 && (
                            <>
                                <div className="mb-8">
                                    <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0b132b] tracking-wide">
                                        RESET PASSWORD
                                    </h1>
                                    <p className="font-sans text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                                        Enter your email address below and we&apos;ll send you a 6-digit verification code.
                                    </p>
                                </div>

                                <form onSubmit={handleSendEmail} className="space-y-4 font-sans">
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Email Address
                                        </label>
                                        <div className="relative flex items-center">
                                            <div className="absolute left-3.5 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                                </svg>
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/90 border border-stone-200/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9C6A5] focus:border-transparent transition shadow-xs"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full mt-2 bg-gradient-to-r from-[#D9C6A5] via-[#EADBC8] to-[#D9C6A5] bg-[length:200%_auto] hover:bg-right text-[#0b132b] font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl shadow-md shadow-amber-900/10 hover:shadow-xl hover:shadow-[#D9C6A5]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <span>SENDING CODE...</span>
                                        ) : (
                                            <span>SEND CODE</span>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* STEP 2: ENTER VERIFICATION CODE */}
                        {step === 2 && (
                            <>
                                <div className="mb-8">
                                    <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0b132b] tracking-wide">
                                        VERIFY CODE
                                    </h1>
                                    <p className="font-sans text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                                        We have sent a 6-digit verification code to <br />
                                        <strong className="text-slate-800 font-bold">{email}</strong>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="space-y-5 font-sans">
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 text-center">
                                            Enter 6-Digit Code
                                        </label>
                                        <div className="flex justify-center gap-2">
                                            {otpCode.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    id={`otp-input-${idx}`}
                                                    type="text"
                                                    maxLength="1"
                                                    value={digit}
                                                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                    className="w-11 h-12 text-center font-mono font-bold text-lg bg-white/90 border border-stone-200/80 rounded-xl focus:ring-2 focus:ring-[#D9C6A5] focus:outline-none transition shadow-xs"
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-center text-xs text-slate-500">
                                        {resendTimer > 0 ? (
                                            <span>Resend code in <strong className="text-amber-800 font-bold">{resendTimer}s</strong></span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResendCode}
                                                className="font-bold text-amber-800 hover:text-amber-900 hover:underline cursor-pointer"
                                            >
                                                Resend verification code
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-[#D9C6A5] via-[#EADBC8] to-[#D9C6A5] bg-[length:200%_auto] hover:bg-right text-[#0b132b] font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl shadow-md shadow-amber-900/10 hover:shadow-xl hover:shadow-[#D9C6A5]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <span>VERIFYING...</span>
                                        ) : (
                                            <span>VERIFY CODE</span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                    >
                                        ← Change email address
                                    </button>
                                </form>
                            </>
                        )}

                        {/* STEP 3: CREATE NEW PASSWORD */}
                        {step === 3 && (
                            <>
                                <div className="mb-8">
                                    <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#0b132b] tracking-wide">
                                        NEW PASSWORD
                                    </h1>
                                    <p className="font-sans text-xs text-slate-500 font-semibold mt-1.5 leading-relaxed">
                                        Verification successful! Please create your new password below.
                                    </p>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-4 font-sans">
                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                            New Password
                                        </label>
                                        <div className="relative flex items-center">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                placeholder="••••••••"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-white/90 border border-stone-200/80 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9C6A5] focus:border-transparent transition shadow-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
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

                                    <div>
                                        <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                                            Confirm New Password
                                        </label>
                                        <div className="relative flex items-center">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-white/90 border border-stone-200/80 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D9C6A5] focus:border-transparent transition shadow-xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                                                title={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
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

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full mt-2 bg-gradient-to-r from-[#D9C6A5] via-[#EADBC8] to-[#D9C6A5] bg-[length:200%_auto] hover:bg-right text-[#0b132b] font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl shadow-md shadow-amber-900/10 hover:shadow-xl hover:shadow-[#D9C6A5]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <span>RESETTING...</span>
                                        ) : (
                                            <span>RESET PASSWORD</span>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* STEP 4: SUCCESS CONFIRMATION */}
                        {step === 4 && (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                </div>
                                <h2 className="font-serif text-2xl font-bold text-[#0b132b] mb-2">Password Changed!</h2>
                                <p className="font-sans text-xs text-slate-500 mb-6 leading-relaxed">
                                    Your password for <strong className="text-slate-800 font-bold">{email}</strong> has been updated successfully. You can now sign in with your new password.
                                </p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-[#0b132b] text-[#D9C6A5] font-black text-xs uppercase tracking-widest py-3.5 px-4 rounded-xl shadow-md hover:bg-slate-800 cursor-pointer transition"
                                >
                                    BACK TO SIGN IN
                                </button>
                            </div>
                        )}

                        {step !== 4 && (
                            <div className="mt-8 text-center">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-[#0b132b] transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                                    </svg>
                                    <span>Back to Sign in</span>
                                </Link>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}