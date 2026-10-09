import { useState } from 'react';

export default function RestaurantInfo() {
    const [activeTab, setActiveTab] = useState('overview');
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleContactSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 4000);
        setContactForm({ name: '', email: '', message: '' });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-10">

            {/* HERO HEADER */}
            <div className="bg-[#081126] text-white p-8 sm:p-12 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10 max-w-3xl">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ HAUTE CUISINE & ELEGANCE ✦
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-serif font-bold text-[#F5F2EA] mt-2">
                        About Lumière Restaurant
                    </h1>
                    <p className="text-xs sm:text-sm text-[#8995AD] mt-3 leading-relaxed">
                        Established in 2026, Lumière brings together fine dining traditions, contemporary gastronomy, and warm hospitality in the heart of Can Tho.
                    </p>
                </div>
            </div>

            {/* QUICK STATS & HOURS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                    { icon: '📍', label: 'Prime Location', value: '123 Boulevard, Ninh Kieu, Can Tho' },
                    { icon: '🕒', label: 'Opening Hours', value: '09:00 AM – 11:00 PM Daily' },
                    { icon: '📞', label: 'Reservation Hotline', value: '0900 000 888' },
                    { icon: '👑', label: 'Culinary Distinction', value: 'Michelin Recommended 2026' },
                ].map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-3xl border border-stone-200 shadow-md hover:shadow-lg transition">
                        <span className="text-3xl block mb-2">{item.icon}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{item.label}</span>
                        <p className="font-bold text-slate-800 text-sm mt-1">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* TABBED INFORMATION */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 sm:p-8">
                <div className="flex border-b border-slate-200 gap-4 mb-6">
                    {[
                        { id: 'overview', label: '✨ Culinary Vision' },
                        { id: 'chef', label: '👨‍🍳 Executive Chef' },
                        { id: 'contact', label: '📩 Contact & Inquiries' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`pb-3 text-xs sm:text-sm font-bold transition cursor-pointer border-b-2 ${
                                activeTab === tab.id
                                    ? 'border-[#081126] text-[#081126]'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <h3 className="font-serif text-2xl font-bold text-slate-900">Crafting Unforgettable Moments</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Every dish at Lumière tells a story of passion, local sustainable ingredients, and refined techniques. From hotpot broths simmering for 18 hours to artisanal grilled steaks, we aim for sensory perfection.
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <span className="text-xl font-bold text-amber-900">4 Distinct Dining Areas</span>
                                    <p className="text-[11px] text-slate-500 mt-1">Main Hall, Sky Terrace, VIP Lounges & Bar</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <span className="text-xl font-bold text-amber-900">Over 120 Dishes</span>
                                    <p className="text-[11px] text-slate-500 mt-1">Curated seasonal menu & premium cellar</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 h-72">
                            <img
                                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=80"
                                alt="Lumière Dining Room"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'chef' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                        <div className="md:col-span-1 rounded-3xl overflow-hidden shadow-xl border border-slate-200 h-80">
                            <img
                                src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=800&q=80"
                                alt="Executive Chef"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-3">
                            <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Master Culinary Director</span>
                            <h3 className="font-serif text-3xl font-bold text-slate-900">Chef Antoine Nguyen</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                With over 20 years of experience across Michelin-starred establishments in Paris and Tokyo, Chef Antoine reimagines classic Vietnamese flavors using international techniques.
                            </p>
                            <div className="italic text-xs font-serif text-amber-900 border-l-2 border-amber-800 pl-4 py-1 mt-4">
                                &ldquo;Food is an emotional journey. We honor ingredients by presenting them in their purest, most vibrant forms.&rdquo;
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'contact' && (
                    <div className="max-w-xl mx-auto">
                        {submitted && (
                            <div className="mb-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-4 rounded-2xl font-bold text-center">
                                ✅ Thank you for reaching out! Our team will contact you within 24 hours.
                            </div>
                        )}
                        <form onSubmit={handleContactSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter your name"
                                    value={contactForm.name}
                                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#DCC8A8]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@example.com"
                                    value={contactForm.email}
                                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#DCC8A8]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Message / Event Request</label>
                                <textarea
                                    rows="4"
                                    required
                                    placeholder="Tell us about your banquet, event, or private dining request..."
                                    value={contactForm.message}
                                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-[#DCC8A8]"
                                ></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-[#081126] text-[#DCC8A8] font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-md"
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                )}
            </div>

        </div>
    );
}
