import { useState } from 'react';

const INITIAL_FEEDBACKS = [
    {
        id: 'FB-501',
        customerName: 'Doan Viet Hoang',
        rating: 5,
        dishName: 'Wagyu A5 Ribeye Flambé',
        comment: 'Exquisite steak! The flambé table presentation was unbelievable. Staff Le Minh provided top-tier service.',
        date: '2026-10-06 18:30',
        reply: 'Thank you Mr. Hoang! It was an absolute pleasure hosting you.',
        hidden: false,
    },
    {
        id: 'FB-502',
        customerName: 'Pham Quynh Anh',
        rating: 4,
        dishName: 'Galaxy Lobster Hotpot',
        comment: 'Delicious hotpot broth! Table atmosphere in the VIP Garden Lounge was lovely. Will return next month.',
        date: '2026-10-05 20:15',
        reply: '',
        hidden: false,
    },
    {
        id: 'FB-503',
        customerName: 'Anonymous Guest',
        rating: 1,
        dishName: 'Spam review',
        comment: 'Inappropriate offensive text payload example for moderation test.',
        date: '2026-10-04 12:00',
        reply: '',
        hidden: true,
    },
];

export default function FeedbackManagement() {
    const [feedbacks, setFeedbacks] = useState(INITIAL_FEEDBACKS);
    const [selectedFb, setSelectedFb] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [toast, setToast] = useState('');

    const [newReview, setNewReview] = useState({
        customerName: '',
        rating: 5,
        dishName: 'Wagyu A5 Ribeye Flambé',
        comment: '',
    });

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleSendReply = (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setFeedbacks(prev => prev.map(f => f.id === selectedFb.id ? { ...f, reply: replyText } : f));
        setSelectedFb(prev => ({ ...prev, reply: replyText }));
        setReplyText('');
        showToast('Official staff reply posted to customer review!');
    };

    const handleToggleHide = (id) => {
        setFeedbacks(prev => prev.map(f => {
            if (f.id === id) {
                const nextHidden = !f.hidden;
                showToast(`Review ${id} is now ${nextHidden ? 'HIDDEN 🚫' : 'VISIBLE ✅'}`);
                return { ...f, hidden: nextHidden };
            }
            return f;
        }));
    };

    const handleSubmitCustomerReview = (e) => {
        e.preventDefault();
        const created = {
            id: `FB-${Date.now().toString().slice(-3)}`,
            ...newReview,
            rating: Number(newReview.rating),
            date: new Date().toLocaleString(),
            reply: '',
            hidden: false,
        };
        setFeedbacks([created, ...feedbacks]);
        setIsSubmitModalOpen(false);
        showToast('Thank you! Your review has been submitted.');
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
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ GUEST FEEDBACK & REVIEWS ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Customer Ratings & Reviews Hub
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        Submit feedback, review customer satisfaction ratings, reply officially, and moderate inappropriate comments.
                    </p>
                </div>

                <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="relative z-10 px-5 py-3 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition cursor-pointer"
                >
                    ⭐ Write a Review
                </button>
            </div>

            {/* FEEDBACK LIST GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* REVIEWS LIST */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-serif font-bold text-[#081126]">All Customer Reviews</h2>
                        <span className="text-xs text-slate-400 font-bold">{feedbacks.length} reviews</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {feedbacks.map(fb => (
                            <div
                                key={fb.id}
                                onClick={() => setSelectedFb(fb)}
                                className={`p-5 hover:bg-slate-50 transition cursor-pointer space-y-2 ${
                                    fb.hidden ? 'opacity-50 bg-slate-100' : ''
                                } ${selectedFb?.id === fb.id ? 'bg-amber-50/50 border-l-4 border-[#081126]' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-serif font-bold text-slate-900 text-base">{fb.customerName}</h3>
                                            <span className="text-amber-500 font-bold text-xs">{'⭐'.repeat(fb.rating)}</span>
                                        </div>
                                        <span className="text-xs font-mono text-amber-900 font-bold">Dish: {fb.dishName}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-400 block">{fb.date}</span>
                                        {fb.hidden && <span className="text-[9px] font-bold text-rose-700 uppercase bg-rose-100 px-2 py-0.5 rounded">Hidden</span>}
                                    </div>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed">&ldquo;{fb.comment}&rdquo;</p>

                                {fb.reply && (
                                    <div className="bg-slate-100 p-3 rounded-2xl text-xs border border-slate-200 mt-2">
                                        <span className="font-bold text-[#081126] block text-[10px] uppercase">Lumière Staff Reply:</span>
                                        <p className="text-slate-700 italic mt-0.5">{fb.reply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* MODERATION & REPLY PANEL */}
                <div>
                    {selectedFb ? (
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-6 sticky top-20">
                            <div className="border-b border-slate-100 pb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback Detail</span>
                                <h3 className="font-serif text-xl font-bold text-[#081126] mt-0.5">{selectedFb.customerName}</h3>
                                <span className="text-amber-500 font-bold text-sm block mt-1">{'⭐'.repeat(selectedFb.rating)} ({selectedFb.rating}/5)</span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Comment Payload</span>
                                    <p className="text-slate-800 font-medium mt-1">&ldquo;{selectedFb.comment}&rdquo;</p>
                                </div>

                                {/* STAFF REPLY FORM */}
                                <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-slate-100">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Official Management Reply</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Write an official response to this review..."
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    ></textarea>
                                    <button
                                        type="submit"
                                        className="w-full py-2.5 bg-[#081126] text-[#DCC8A8] font-bold text-xs uppercase rounded-xl hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        Post Reply
                                    </button>
                                </form>

                                {/* MODERATION HIDE BUTTON */}
                                <button
                                    onClick={() => handleToggleHide(selectedFb.id)}
                                    className={`w-full py-2 rounded-xl text-xs font-bold uppercase transition cursor-pointer border ${
                                        selectedFb.hidden ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                >
                                    {selectedFb.hidden ? 'Restore / Unhide Review' : 'Hide Inappropriate Review'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                            <span className="text-4xl block mb-2">⭐</span>
                            <p className="font-serif font-bold text-slate-600 text-sm">Select a customer review</p>
                            <p className="text-xs mt-1">to reply or moderate</p>
                        </div>
                    )}
                </div>

            </div>

            {/* SUBMIT REVIEW MODAL */}
            {isSubmitModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">Submit Customer Review</h3>
                            <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
                        </div>

                        <form onSubmit={handleSubmitCustomerReview} className="space-y-4 mt-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Your Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Tran Minh Tuan"
                                    value={newReview.customerName}
                                    onChange={e => setNewReview({ ...newReview, customerName: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Rating Stars</label>
                                    <select
                                        value={newReview.rating}
                                        onChange={e => setNewReview({ ...newReview, rating: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold"
                                    >
                                        <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                                        <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                                        <option value={3}>⭐⭐⭐ (3 Stars)</option>
                                        <option value={2}>⭐⭐ (2 Stars)</option>
                                        <option value={1}>⭐ (1 Star)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Ordered Dish</label>
                                    <input
                                        type="text"
                                        value={newReview.dishName}
                                        onChange={e => setNewReview({ ...newReview, dishName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Your Review / Comments</label>
                                <textarea
                                    rows="3"
                                    required
                                    placeholder="Tell us about the food quality, service, and ambiance..."
                                    value={newReview.comment}
                                    onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button type="button" onClick={() => setIsSubmitModalOpen(false)} className="px-4 py-2 bg-slate-200 font-bold uppercase rounded-xl">Cancel</button>
                                <button type="submit" className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800">Submit Feedback</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
