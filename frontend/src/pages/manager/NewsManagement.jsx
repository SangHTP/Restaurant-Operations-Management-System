import { useCallback, useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { newsApi } from '../../api/contentApi';
import { useConfirm } from '../../context/ConfirmContext';

// Render content: parse markdown image syntax ![alt](url) thành <img>
function renderArticleContent(content) {
    if (!content) return <p className="text-slate-400 italic">Bài viết chưa có nội dung.</p>;
    return content.split('\n').map((line, index) => {
        const imageMatch = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/);
        if (imageMatch) {
            const [, alt, src] = imageMatch;
            return (
                <figure key={`img-${index}`} className="my-4">
                    <img
                        src={src}
                        alt={alt}
                        className="w-full max-h-[480px] rounded-xl object-contain bg-slate-100"
                    />
                    {alt && <figcaption className="mt-1 text-center text-xs text-slate-400">{alt}</figcaption>}
                </figure>
            );
        }
        if (!line.trim()) return <div key={`sp-${index}`} className="h-2" />;
        return <p key={`p-${index}`} className="whitespace-pre-wrap">{line}</p>;
    });
}

// Lấy URL ảnh đầu tiên trong content — fallback khi không có thumbnail
function extractFirstImage(content) {
    if (!content) return null;
    const match = content.match(/!\[[^\]]*\]\(([^)\s]+)\)/);
    return match ? match[1] : null;
}

// Ảnh hiện trong dạnh sách: thumbnail nếu có, fallback nhảnh đầu content
function getDisplayImage(item) {
    return item.thumbnailUrl || extractFirstImage(item.content) || null;
}

const emptyNews = {
    title: '',
    summary: '',
    content: '',
    thumbnailUrl: '',
    category: '',
    author: '',
    isPublished: false,
    isFeatured: false,
};

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

const dateLabel = (value) =>
    value ? new Date(value).toLocaleDateString('en-US') : '—';

export default function NewsManagement() {
    const confirm = useConfirm();

    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [error, setError] = useState('');
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyNews);
    const [detail, setDetail] = useState(null);
    const thumbnailInputRef = useRef(null);

    const uploadImageFile = async (file) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            setError('Chỉ chấp nhận JPG, PNG, WEBP hoặc GIF.');
            return null;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('Ảnh không được vượt quá 5 MB.');
            return null;
        }
        const { url } = await newsApi.uploadImage(file);
        if (!url) throw new Error('Server không trả về URL ảnh.');
        return url;
    };

    // Upload ảnh chèn vào nội dung (content)
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setUploadingImage(true);
        setError('');
        try {
            const url = await uploadImageFile(file);
            if (!url) return;
            const altText = file.name.replace(/\.[^.]+$/, '').replace(/[\[\]]/g, '');
            const imageMarkdown = `![${altText}](${url})`;
            setForm((current) => ({
                ...current,
                content: `${current.content}${current.content && !current.content.endsWith('\n') ? '\n' : ''}${imageMarkdown}\n`,
                thumbnailUrl: current.thumbnailUrl || url,
            }));
        } catch (err) {
            setError(`Không thể upload ảnh: ${err.message}`);
        } finally {
            setUploadingImage(false);
        }
    };

    // Upload ảnh thumbnail riêng
    const handleThumbnailUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setUploadingThumbnail(true);
        setError('');
        try {
            const url = await uploadImageFile(file);
            if (!url) return;
            setForm((current) => ({ ...current, thumbnailUrl: url }));
        } catch (err) {
            setError(`Không thể upload thumbnail: ${err.message}`);
        } finally {
            setUploadingThumbnail(false);
        }
    };

    const loadNews = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const result = await newsApi.list({ page, pageSize, search });
            setItems(result.items || []);
            setTotalCount(result.totalCount || 0);
        } catch (err) {
            setError(`Unable to load news: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, search]);

    useEffect(() => {
        loadNews();
    }, [loadNews]);

    const openCreate = () => {
        setEditing(null);
        setForm({ ...emptyNews });
        setFormOpen(true);
        setError('');
    };

    const openEdit = async (item) => {
        setError('');

        try {
            const fullNews = await newsApi.get(item.newsID);

            setEditing(fullNews);
            setForm({
                title: fullNews.title || '',
                summary: fullNews.summary || '',
                content: fullNews.content || '',
                thumbnailUrl: fullNews.thumbnailUrl || '',
                category: fullNews.category || '',
                author: fullNews.author || '',
                isPublished: fullNews.isPublished,
                isFeatured: fullNews.isFeatured,
            });
            setFormOpen(true);
        } catch (err) {
            setError(`Unable to load the article for editing: ${err.message}`);
        }
    };

    const openDetail = async (item) => {
        setError('');

        try {
            setDetail(await newsApi.get(item.newsID));
            await loadNews();
        } catch (err) {
            setError(`Unable to load article details: ${err.message}`);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        const payload = {
            ...form,
            summary: form.summary || null,
            content: form.content || null,
            thumbnailUrl: form.thumbnailUrl || null,
            category: form.category || null,
            author: form.author || null,
        };

        try {
            if (editing) {
                await newsApi.update(editing.newsID, payload);
            } else {
                await newsApi.create(payload);
            }

            setFormOpen(false);
            await loadNews();
        } catch (err) {
            setError(`Unable to save article: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item) => {
        const shouldDelete = await confirm({
            title: 'Delete this article?',
            message: `The article "${item.title}" will be permanently deleted.`,
            confirmText: 'Delete Article',
        });

        if (!shouldDelete) return;

        setError('');

        try {
            await newsApi.remove(item.newsID);

            if (items.length === 1 && page > 1) {
                setPage((current) => current - 1);
            } else {
                await loadNews();
            }
        } catch (err) {
            setError(`Unable to delete article: ${err.message}`);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput);
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-col justify-between gap-4 rounded-3xl bg-[#081126] p-6 text-white shadow-xl sm:flex-row sm:items-center">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#DCC8A8]">
                        UC-30 · Content management
                    </p>
                    <h1 className="mt-1 font-serif text-3xl font-bold">
                        News Management
                    </h1>
                    <p className="mt-2 text-sm text-slate-300">
                        Browse, view, and manage restaurant articles.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-xl bg-[#DCC8A8] px-5 py-3 text-sm font-bold text-[#081126] hover:bg-amber-200"
                >
                    + Create Article
                </button>
            </header>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                    {error}
                </div>
            )}

            <form
                onSubmit={handleSearch}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row"
            >
                <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search by title or summary..."
                    className={`${inputClass} flex-1`}
                />
                <button
                    type="submit"
                    className="rounded-xl bg-[#081126] px-5 py-2.5 text-sm font-bold text-white"
                >
                    Search
                </button>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <p className="p-10 text-center text-slate-500">Loading news...</p>
                ) : items.length === 0 ? (
                    <p className="p-10 text-center text-slate-500">
                        No matching articles found.
                    </p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                    <tr>
                                        <th className="px-5 py-4">Article</th>
                                        <th className="px-5 py-4">Category</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">Created</th>
                                        <th className="px-5 py-4">Views</th>
                                        <th className="px-5 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <tr key={item.newsID} className="hover:bg-slate-50">
                                            <td className="max-w-sm px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {(() => {
                                                        const img = getDisplayImage(item);
                                                        return img ? (
                                                            <img
                                                                src={img}
                                                                alt=""
                                                                className="h-12 w-16 shrink-0 rounded-lg bg-slate-100 object-cover"
                                                            />
                                                        ) : null;
                                                    })()}
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-slate-900">
                                                            {item.title}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs text-slate-500">
                                                            {item.summary || 'No summary'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {item.category || '—'}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.isPublished
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                >
                                                    {item.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                                {item.isFeatured && (
                                                    <span className="ml-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                                                        Featured
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {dateLabel(item.createdAt)}
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {item.viewCount}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDetail(item)}
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                                    >
                                                        Details
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEdit(item)}
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
                            <span>
                                {totalCount} articles · Page {page}/{totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    disabled={page <= 1 || loading}
                                    onClick={() => setPage((current) => current - 1)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    disabled={page >= totalPages || loading}
                                    onClick={() => setPage((current) => current + 1)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {formOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                    <form
                        onSubmit={handleSubmit}
                        className="my-8 max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="news-form-title"
                    >
                        <div className="flex items-center justify-between">
                            <h2
                                id="news-form-title"
                                className="font-serif text-xl font-bold text-slate-900"
                            >
                                {editing ? 'Edit Article' : 'Create Article'}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setFormOpen(false)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                            >
                                {error}
                            </div>
                        )}

                        <label className="block space-y-1 text-sm font-semibold text-slate-700">
                            Title *
                            <input
                                required
                                maxLength={300}
                                className={inputClass}
                                value={form.title}
                                onChange={(event) =>
                                    setForm({ ...form, title: event.target.value })
                                }
                            />
                        </label>

                        <label className="block space-y-1 text-sm font-semibold text-slate-700">
                            Summary
                            <textarea
                                maxLength={500}
                                rows={2}
                                className={inputClass}
                                value={form.summary}
                                onChange={(event) =>
                                    setForm({ ...form, summary: event.target.value })
                                }
                            />
                        </label>

                        <label className="block space-y-1 text-sm font-semibold text-slate-700">
                            Content
                            <textarea
                                rows={7}
                                className={inputClass}
                                value={form.content}
                                onChange={(event) =>
                                    setForm({ ...form, content: event.target.value })
                                }
                            />
                        </label>

                        <div className="flex flex-wrap items-center gap-3">
                            <label
                                className={`inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 ${uploadingImage
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'cursor-pointer hover:bg-slate-50'
                                    }`}
                            >
                                {uploadingImage ? 'Uploading image...' : 'Insert image'}
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="sr-only"
                                    disabled={uploadingImage || saving}
                                    onChange={handleImageUpload}
                                />
                            </label>
                            <span className="text-xs text-slate-500">
                                JPG, PNG, WEBP, or GIF · up to 5 MB
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            The uploaded image will be added at the end of the article content.
                        </p>

                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-700">Ảnh thumbnail</p>
                            {/* Preview thumbnail */}
                            {form.thumbnailUrl && (
                                <div className="relative inline-block">
                                    <img
                                        src={form.thumbnailUrl}
                                        alt="thumbnail preview"
                                        className="h-28 w-48 rounded-lg object-cover border border-slate-200 bg-slate-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, thumbnailUrl: '' })}
                                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600"
                                        title="Xóa thumbnail"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Nút upload thumbnail */}
                                <label
                                    className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 ${
                                        uploadingThumbnail ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-50'
                                    }`}
                                >
                                    <ImagePlus size={15} />
                                    {uploadingThumbnail ? 'Đang upload...' : 'Upload thumbnail'}
                                    <input
                                        ref={thumbnailInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        className="sr-only"
                                        disabled={uploadingThumbnail || saving}
                                        onChange={handleThumbnailUpload}
                                    />
                                </label>
                                <span className="text-xs text-slate-400">hoặc nhập URL:</span>
                                <input
                                    type="url"
                                    maxLength={500}
                                    className={`${inputClass} flex-1 min-w-[180px]`}
                                    value={form.thumbnailUrl}
                                    onChange={(event) =>
                                        setForm({ ...form, thumbnailUrl: event.target.value })
                                    }
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="block space-y-1 text-sm font-semibold text-slate-700">
                                Category
                                <input
                                    maxLength={100}
                                    className={inputClass}
                                    value={form.category}
                                    onChange={(event) =>
                                        setForm({ ...form, category: event.target.value })
                                    }
                                />
                            </label>
                            <label className="block space-y-1 text-sm font-semibold text-slate-700">
                                Author
                                <input
                                    maxLength={100}
                                    className={inputClass}
                                    value={form.author}
                                    onChange={(event) =>
                                        setForm({ ...form, author: event.target.value })
                                    }
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.isPublished}
                                    onChange={(event) =>
                                        setForm({ ...form, isPublished: event.target.checked })
                                    }
                                    className="h-4 w-4 accent-amber-700"
                                />
                                Publish
                            </label>
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.isFeatured}
                                    onChange={(event) =>
                                        setForm({ ...form, isFeatured: event.target.checked })
                                    }
                                    className="h-4 w-4 accent-amber-700"
                                />
                                Featured article
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setFormOpen(false)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving || uploadingImage || uploadingThumbnail}
                                className="rounded-xl bg-[#081126] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
                            >
                                {saving ? 'Đang lưu...' : uploadingImage ? 'Đang upload ảnh...' : uploadingThumbnail ? 'Đang upload thumbnail...' : 'Lưu bài viết'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                    <section
                        className="my-8 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="news-detail-title"
                    >
                        <div className="flex items-center justify-between gap-4">
                            <h2
                                id="news-detail-title"
                                className="font-serif text-xl font-bold text-slate-900"
                            >
                                Article Details
                            </h2>
                            <button
                                type="button"
                                onClick={() => setDetail(null)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {detail.thumbnailUrl && (
                            <img
                                src={detail.thumbnailUrl}
                                alt={detail.title}
                                className="mt-4 max-h-64 w-full rounded-xl bg-slate-100 object-cover"
                            />
                        )}
                        <h3 className="mt-5 font-serif text-2xl font-bold text-slate-900">
                            {detail.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                            {detail.category || 'Uncategorized'} · {detail.author || 'Unknown author'} · {dateLabel(detail.publishedAt || detail.createdAt)} · {detail.viewCount} views
                        </p>
                        {detail.summary && (
                            <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700">
                                {detail.summary}
                            </p>
                        )}
                        <div className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                            {renderArticleContent(detail.content)}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}