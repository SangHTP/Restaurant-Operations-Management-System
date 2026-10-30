import { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { bannerApi } from '../../api/contentApi';
import { useConfirm } from '../../context/ConfirmContext';

const emptyBanner = {
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    displayOrder: 0,
    isActive: true,
};

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

export default function BannerManagement() {
    const confirm = useConfirm();
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editing, setEditing] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [form, setForm] = useState(emptyBanner);

    const loadBanners = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            setBanners(await bannerApi.list());
        } catch (err) {
            setError(`Unable to load banners: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBanners();
    }, [loadBanners]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyBanner);
        setIsFormOpen(true);
        setError('');
    };

    const openEdit = (banner) => {
        setEditing(banner);
        setForm({
            title: banner.title || '',
            subtitle: banner.subtitle || '',
            imageUrl: banner.imageUrl || '',
            linkUrl: banner.linkUrl || '',
            displayOrder: banner.displayOrder ?? 0,
            isActive: banner.isActive,
        });
        setIsFormOpen(true);
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        const payload = {
            ...form,
            displayOrder: Number(form.displayOrder),
            subtitle: form.subtitle || null,
            imageUrl: form.imageUrl || null,
            linkUrl: form.linkUrl || null,
        };
        try {
            if (editing) await bannerApi.update(editing.bannerID, payload);
            else await bannerApi.create(payload);
            setIsFormOpen(false);
            await loadBanners();
        } catch (err) {
            setError(`Unable to save banner: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (banner) => {
        const shouldDelete = await confirm({
            title: 'Delete this banner?',
            message: `The banner "${banner.title}" will be permanently deleted.`,
            confirmText: 'Delete Banner',
        });
        if (!shouldDelete) return;
        setError('');
        try {
            await bannerApi.remove(banner.bannerID);
            await loadBanners();
        } catch (err) {
            setError(`Unable to delete banner: ${err.message}`);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col justify-between gap-4 rounded-3xl bg-[#081126] p-6 text-white shadow-xl sm:flex-row sm:items-center">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#DCC8A8]">UC-29 · Content management</p>
                    <h1 className="mt-1 font-serif text-3xl font-bold">Banner Management</h1>
                    <p className="mt-2 text-sm text-slate-300">Create, edit, reorder, and delete banners displayed on the home page.</p>
                </div>
                <button onClick={openCreate} className="rounded-xl bg-[#DCC8A8] px-5 py-3 text-sm font-bold text-[#081126] hover:bg-amber-200">
                    + Create Banner
                </button>
            </header>

            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

            {loading ? (
                <p className="rounded-2xl bg-white p-8 text-center text-slate-500">Loading banners...</p>
            ) : banners.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <p className="font-semibold text-slate-700">No banners yet</p>
                    <p className="mt-1 text-sm text-slate-500">Select “Create Banner” to add your first banner.</p>
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {banners.map((banner) => (
                        <article key={banner.bannerID} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {banner.imageUrl ? (
                                <img src={banner.imageUrl} alt={banner.title} className="h-44 w-full bg-slate-100 object-cover" />
                            ) : (
                                <div className="flex h-44 items-center justify-center bg-slate-100 text-sm text-slate-400">No image available</div>
                            )}
                            <div className="space-y-3 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="font-serif text-lg font-bold text-slate-900">{banner.title}</h2>
                                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{banner.subtitle || 'No description'}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${banner.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                                        {banner.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    <p>Display order: <strong className="text-slate-700">{banner.displayOrder}</strong></p>
                                    {banner.linkUrl && <p className="mt-1 truncate">Link: {banner.linkUrl}</p>}
                                </div>
                                <div className="flex gap-2 border-t border-slate-100 pt-3">
                                    <button onClick={() => openEdit(banner)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                                    <button onClick={() => handleDelete(banner)} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4" role="presentation">
                    <form onSubmit={handleSubmit} className="my-8 w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="banner-form-title">
                        <div className="flex items-center justify-between">
                            <h2 id="banner-form-title" className="font-serif text-xl font-bold text-slate-900">{editing ? 'Edit Banner' : 'Create Banner'}</h2>
                            <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close"><X size={18} /></button>
                        </div>
                        {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
                        <label className="block space-y-1 text-sm font-semibold text-slate-700">Title *
                            <input required maxLength={200} className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </label>
                        <label className="block space-y-1 text-sm font-semibold text-slate-700">Subtitle
                            <textarea maxLength={500} rows={2} className={inputClass} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                        </label>
                        <label className="block space-y-1 text-sm font-semibold text-slate-700">Image URL
                            <input type="url" maxLength={500} className={inputClass} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
                        </label>
                        <label className="block space-y-1 text-sm font-semibold text-slate-700">Link URL
                            <input type="url" maxLength={255} className={inputClass} value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block space-y-1 text-sm font-semibold text-slate-700">Display Order
                                <input type="number" min="0" className={inputClass} value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
                            </label>
                            <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold text-slate-700">
                                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-amber-700" />
                                Active
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                            <button disabled={saving} className="rounded-xl bg-[#081126] px-5 py-2 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Banner'}</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
