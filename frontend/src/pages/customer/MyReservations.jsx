import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import IconGlyph from '../../components/common/IconGlyph';
import { MessageSquareText, Pencil, Star } from 'lucide-react';
import { customerReservationsApi, reservationFeedbackApi } from '../../api/reservationFeedbackApi';

const statusStyles = {
    Confirmed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' },
    Pending: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
    Completed: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', dot: 'bg-indigo-500' },
    Cancelled: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', dot: 'bg-rose-500' },
};

const mapReservationStatus = (status, canReview) => {
    if (canReview) return 'Completed';
    if (status === 'Đã hủy' || status === 'Cancelled') return 'Cancelled';
    if (status === 'Đã xác nhận' || status === 'Confirmed') return 'Confirmed';
    return 'Pending';
};

export default function MyReservations() {
    const { currentUser } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [filter, setFilter] = useState('All');
    const [selectedRes, setSelectedRes] = useState(null);
    const [toast, setToast] = useState('');
    const [confirmCancel, setConfirmCancel] = useState(null);
    const [reviews, setReviews] = useState({});
    const [reviewModal, setReviewModal] = useState(null);
    const [reviewDraft, setReviewDraft] = useState({ rating: 5, comment: '' });

    const loadReservations = async () => {
        if (!currentUser?.email) {
            setLoadError('Sign in with a customer account to view your bookings.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setLoadError('');
        try {
            const result = await customerReservationsApi.list(currentUser.email);
            const mapped = result.map(reservation => ({
                id: `RES-${reservation.reservationID}`,
                reservationID: reservation.reservationID,
                guests: reservation.numberOfGuests,
                date: new Date(reservation.reservationTime).toLocaleDateString('en-US'),
                time: new Date(reservation.reservationTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                tableArea: reservation.areaName || 'Dining Area',
                tableNumber: reservation.tableName || 'Unassigned',
                status: mapReservationStatus(reservation.status, reservation.canReview),
                canReview: reservation.canReview,
                note: '',
                createdAt: '',
                feedback: reservation.feedback,
            }));
            setReservations(mapped);
            setReviews(Object.fromEntries(mapped
                .filter(reservation => reservation.feedback)
                .map(reservation => [reservation.id, {
                    id: reservation.feedback.reservationFeedbackID,
                    rating: reservation.feedback.rating,
                    comment: reservation.feedback.content || '',
                }])));
        } catch (error) {
            setLoadError(error.message || 'Could not load your bookings.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReservations();
    }, [currentUser?.email]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleCancelReservation = async (reservation) => {
        try {
            await customerReservationsApi.cancel(reservation.reservationID, currentUser.email);
            setReservations(prev => prev.map(item =>
                item.id === reservation.id ? { ...item, status: 'Cancelled' } : item
            ));
            if (selectedRes?.id === reservation.id) setSelectedRes(prev => ({ ...prev, status: 'Cancelled' }));
            setConfirmCancel(null);
            showToast(`Reservation ${reservation.id} has been cancelled successfully.`);
        } catch (error) {
            showToast(error.message || 'Could not cancel this reservation.');
        }
    };

    const openReviewForm = (reservation) => {
        const existingReview = reviews[reservation.id];
        setReviewDraft(existingReview
            ? { rating: existingReview.rating, comment: existingReview.comment }
            : { rating: 5, comment: '' });
        setReviewModal(reservation);
    };

    const handleSubmitReview = async (event) => {
        event.preventDefault();
        if (!reviewModal || !reviewModal.canReview) return;

        const payload = {
            customerEmail: currentUser.email,
            rating: Number(reviewDraft.rating),
            content: reviewDraft.comment.trim() || null,
        };
        const existingReview = reviews[reviewModal.id];
        try {
            let savedReview;
            if (existingReview?.id) {
                await reservationFeedbackApi.update(existingReview.id, payload);
                savedReview = { ...existingReview, ...payload, comment: payload.content || '' };
            } else {
                const response = await reservationFeedbackApi.submit({
                    ...payload,
                    reservationID: reviewModal.reservationID,
                });
                savedReview = {
                    id: response.reservationFeedbackID,
                    rating: response.rating,
                    comment: response.content || '',
                };
            }
            setReviews(prev => ({ ...prev, [reviewModal.id]: savedReview }));
            setReservations(prev => prev.map(reservation =>
                reservation.id === reviewModal.id
                    ? { ...reservation, feedback: savedReview }
                    : reservation
            ));
            setReviewModal(null);
            showToast(existingReview ? 'Your review has been updated.' : 'Your review has been saved.');
        } catch (error) {
            showToast(error.message || 'Could not save your review.');
        }
    };

    const filtered = reservations.filter(r => filter === 'All' || r.status === filter);

    const upcomingCount = reservations.filter(r => r.status === 'Confirmed' || r.status === 'Pending').length;

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 font-sans space-y-8">

            {/* Toast */}
            {toast && (
                <div className="fixed top-24 right-6 z-50 bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="font-black text-sm">✦</span>
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="bg-[#081126] text-white p-8 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.3em]">
                        ✦ MY DINING RESERVATIONS ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Your Table Bookings
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5">
                        View and manage your upcoming and past dining reservations at Lumière.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="relative z-10 flex gap-4 mt-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <span className="text-2xl font-black text-[#DCC8A8] block">{reservations.length}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Total Bookings</span>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                        <span className="text-2xl font-black text-emerald-400 block">{upcomingCount}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Upcoming</span>
                    </div>
                </div>
            </div>

            {loadError && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {loadError}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map(st => (
                    <button
                        key={st}
                        onClick={() => setFilter(st)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            filter === st
                                ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        {st}
                    </button>
                ))}
            </div>

            {/* Reservations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* List */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-lg overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <h2 className="font-serif font-bold text-[#081126]">My Reservations</h2>
                        <span className="text-xs text-slate-400 font-bold">{filtered.length} bookings</span>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center text-sm text-slate-500">Loading your bookings...</div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <IconGlyph glyph="📅" size={36} className="mb-2" />
                            <p className="font-serif font-bold text-slate-600 text-sm">No reservations found</p>
                            <p className="text-xs mt-1">Try adjusting the filter or make a new reservation.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map(res => {
                                const s = statusStyles[res.status] || statusStyles.Pending;
                                return (
                                    <div
                                        key={res.id}
                                        onClick={() => setSelectedRes(res)}
                                        className={`p-5 hover:bg-slate-50 transition cursor-pointer flex justify-between items-center ${
                                            selectedRes?.id === res.id ? 'bg-amber-50/50 border-l-4 border-[#081126]' : ''
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs font-black text-slate-400">{res.id}</span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${s.bg} ${s.text} ${s.border}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                                                    {res.status}
                                                </span>
                                            </div>
                                            <div className="mt-1.5">
                                                <span className="font-serif font-bold text-slate-900 text-base block">
                                                    <IconGlyph glyph="📍" size={14} /> {res.tableArea} — Table {res.tableNumber}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    <IconGlyph glyph="👥" size={14} /> {res.guests} Guests · <IconGlyph glyph="📝" size={14} /> {res.note}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className="text-xs font-black text-[#081126] block"><IconGlyph glyph="📅" size={13} /> {res.date}</span>
                                            <span className="text-xs font-bold text-amber-800 block"><IconGlyph glyph="⏰" size={13} /> {res.time}</span>
                                            <span className="text-[10px] text-slate-400 block mt-1">Booked: {res.createdAt}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <div>
                    {selectedRes ? (
                        <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 space-y-5 sticky top-24">
                            <div className="border-b border-slate-100 pb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reservation Detail</span>
                                <h3 className="font-serif text-xl font-bold text-[#081126] mt-0.5">{selectedRes.id}</h3>
                                <div className="mt-2">
                                    {(() => {
                                        const s = statusStyles[selectedRes.status] || statusStyles.Pending;
                                        return (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${s.bg} ${s.text} ${s.border}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                                                {selectedRes.status}
                                            </span>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Time</span>
                                    <p className="font-bold text-slate-800 mt-0.5"><IconGlyph glyph="📅" size={14} /> {selectedRes.date} at {selectedRes.time}</p>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Party Size</span>
                                        <p className="font-bold text-slate-800 mt-0.5"><IconGlyph glyph="👥" size={14} /> {selectedRes.guests} People</p>
                                    </div>
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Area</span>
                                        <p className="font-bold text-indigo-900 mt-0.5"><IconGlyph glyph="🏛️" size={14} /> {selectedRes.tableArea}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Table</span>
                                    <p className="font-bold text-slate-800 mt-0.5">Table {selectedRes.tableNumber}</p>
                                </div>

                                {selectedRes.note && (
                                    <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                                        <span className="text-amber-600 block text-[10px] uppercase font-bold">Special Request</span>
                                        <p className="text-amber-900 font-medium mt-0.5"><IconGlyph glyph="📝" size={14} /> {selectedRes.note}</p>
                                    </div>
                                )}
                            </div>

                            {selectedRes.canReview && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                                            <MessageSquareText size={18} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-bold text-slate-900">How was your visit?</h4>
                                            <p className="mt-1 text-xs leading-5 text-slate-600">
                                                Share your experience after your completed booking.
                                            </p>
                                            {reviews[selectedRes.id] ? (
                                                <div className="mt-3 rounded-xl border border-amber-100 bg-white p-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-0.5 text-amber-500" aria-label={`${reviews[selectedRes.id].rating} out of 5 stars`}>
                                                            {Array.from({ length: 5 }, (_, index) => (
                                                                <Star
                                                                    key={index}
                                                                    size={15}
                                                                    fill={index < reviews[selectedRes.id].rating ? 'currentColor' : 'none'}
                                                                />
                                                            ))}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => openReviewForm(selectedRes)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                                        >
                                                            <Pencil size={13} /> Edit review
                                                        </button>
                                                    </div>
                                                    {reviews[selectedRes.id].comment && (
                                                        <p className="mt-2 text-sm leading-5 text-slate-700">{reviews[selectedRes.id].comment}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => openReviewForm(selectedRes)}
                                                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#081126] px-3.5 py-2 text-xs font-bold text-[#DCC8A8] transition hover:bg-slate-800"
                                                >
                                                    <Star size={14} /> Write a review
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Cancel Action */}
                            {(selectedRes.status === 'Confirmed' || selectedRes.status === 'Pending') && (
                                <button
                                    onClick={() => setConfirmCancel(selectedRes)}
                                    className="w-full py-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs uppercase rounded-xl hover:bg-rose-100 transition cursor-pointer"
                                >
                                    Cancel This Reservation
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
                            <IconGlyph glyph="📋" size={36} className="mb-2" />
                            <p className="font-serif font-bold text-slate-600 text-sm">Select a reservation</p>
                            <p className="text-xs mt-1">to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Completed Booking Review Modal */}
            {reviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <form
                        onSubmit={handleSubmitReview}
                        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Completed booking</p>
                                <h3 className="mt-1 font-serif text-xl font-bold text-[#081126]">Rate your visit</h3>
                                <p className="mt-1 text-xs text-slate-500">{reviewModal.id} · {reviewModal.date}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setReviewModal(null)}
                                aria-label="Close review form"
                                className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                ×
                            </button>
                        </div>

                        <fieldset className="mt-5">
                            <legend className="text-sm font-semibold text-slate-800">Your rating</legend>
                            <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Rating from 1 to 5 stars">
                                {Array.from({ length: 5 }, (_, index) => {
                                    const rating = index + 1;
                                    const selected = rating <= Number(reviewDraft.rating);
                                    return (
                                        <button
                                            key={rating}
                                            type="button"
                                            role="radio"
                                            aria-checked={Number(reviewDraft.rating) === rating}
                                            aria-label={`${rating} ${rating === 1 ? 'star' : 'stars'}`}
                                            onClick={() => setReviewDraft(prev => ({ ...prev, rating }))}
                                            className="rounded-md p-1 text-amber-500 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300"
                                        >
                                            <Star size={28} fill={selected ? 'currentColor' : 'none'} />
                                        </button>
                                    );
                                })}
                                <span className="ml-2 text-xs font-medium text-slate-500">{reviewDraft.rating} of 5</span>
                            </div>
                        </fieldset>

                        <label className="mt-5 block">
                            <span className="text-sm font-semibold text-slate-800">Your comments <span className="font-normal text-slate-400">(optional)</span></span>
                            <textarea
                                rows="4"
                                maxLength="1000"
                                value={reviewDraft.comment}
                                onChange={(event) => setReviewDraft(prev => ({ ...prev, comment: event.target.value }))}
                                placeholder="Tell us what you enjoyed or what we could improve..."
                                className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                            />
                        </label>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setReviewModal(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-xl bg-[#081126] px-4 py-2.5 text-sm font-bold text-[#DCC8A8] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {reviews[reviewModal.id] ? 'Save changes' : 'Submit review'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Confirm Cancel Modal */}
            {confirmCancel && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 text-center">
                        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3"><IconGlyph glyph="⚠️" size={24} /></div>
                        <h3 className="font-serif font-bold text-lg text-[#081126] mb-2">Cancel Reservation?</h3>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                            Are you sure you want to cancel reservation <strong>{confirmCancel.id}</strong> on <strong>{confirmCancel.date}</strong> at <strong>{confirmCancel.time}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setConfirmCancel(null)}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs uppercase rounded-xl hover:bg-slate-200 transition cursor-pointer"
                            >
                                Keep Reservation
                            </button>
                            <button
                                onClick={() => handleCancelReservation(confirmCancel)}
                                className="px-5 py-2.5 bg-rose-600 text-white font-bold text-xs uppercase rounded-xl hover:bg-rose-700 shadow-md transition cursor-pointer"
                            >
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
