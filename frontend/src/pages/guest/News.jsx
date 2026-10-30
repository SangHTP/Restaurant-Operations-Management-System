import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Eye, Newspaper, Search, X } from 'lucide-react';
import { newsApi } from '../../api/contentApi';

const PAGE_SIZE = 9;

// Lấy URL ảnh đầu tiên trong content (fallback khi không có thumbnail)
function extractFirstImage(content) {
    if (!content) return null;
    const match = content.match(/!\[[^\]]*\]\(([^)\s]+)\)/);
    return match ? match[1] : null;
}

// Trả về thumbnail: dùng thumbnailUrl nếu có, fallback về ảnh đầu tiên trong content
function getDisplayImage(item) {
    return item.thumbnailUrl || extractFirstImage(item.content) || null;
}
function renderArticleContent(content) {
    return content.split('\n').map((line, index) => {
        const imageMatch = line.trim().match(/^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/);

        if (imageMatch) {
            const [, alt, src] = imageMatch;

            return (
                <figure key={`image-${index}`} className="my-6">
                    <img
                        src={src}
                        alt={alt}
                        loading="lazy"
                        className="max-h-[520px] w-full rounded-2xl object-contain"
                    />
                    {alt && (
                        <figcaption className="mt-2 text-center text-xs text-slate-500">
                            {alt}
                        </figcaption>
                    )}
                </figure>
            );
        }

        if (!line.trim()) return <div key={`space-${index}`} className="h-3" />;

        return (
            <p key={`paragraph-${index}`} className="whitespace-pre-wrap">
                {line}
            </p>
        );
    });
}
function formatDate(value) {
    if (!value) return 'Recently updated';
    return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function News() {
    const [result, setResult] = useState({ items: [], totalCount: 0 });
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [selectedNews, setSelectedNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState('');

    const loadNews = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await newsApi.list({
                page,
                pageSize: PAGE_SIZE,
                search,
                category,
                isPublished: true,
            });
            setResult({ items: data.items || [], totalCount: data.totalCount || 0 });
        } catch (err) {
            setError(`Unable to load news. ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [category, page, search]);

    useEffect(() => {
        loadNews();
    }, [loadNews]);

    useEffect(() => {
        newsApi.categories()
            .then(setCategories)
            .catch((err) => setError(`Unable to load news categories. ${err.message}`));
    }, []);

    const openNews = async (item) => {
        setDetailLoading(true);
        setError('');
        try {
            setSelectedNews(await newsApi.get(item.newsID));
            setResult((current) => ({
                ...current,
                items: current.items.map((news) => news.newsID === item.newsID
                    ? { ...news, viewCount: (news.viewCount || 0) + 1 }
                    : news),
            }));
        } catch (err) {
            setError(`Unable to load this article. ${err.message}`);
        } finally {
            setDetailLoading(false);
        }
    };

    const submitSearch = (event) => {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const changeCategory = (nextCategory) => {
        setPage(1);
        setCategory(nextCategory);
    };

    const featuredNews = page === 1 && !category && !search
        ? result.items.find((item) => item.isFeatured)
        : null;
    const regularNews = result.items.filter((item) => item.newsID !== featuredNews?.newsID);
    const totalPages = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE));

    return (
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:py-12">
            <header className="relative overflow-hidden rounded-3xl bg-[#081126] px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14">
                <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
                <div className="relative max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#DCC8A8]/30 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#DCC8A8]">
                        <Newspaper size={15} aria-hidden="true" />
                        Lumière Journal
                    </div>
                    <h1 className="font-serif text-4xl font-bold sm:text-5xl">News & Stories</h1>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                        Discover the latest stories, events, and experiences from Lumière Restaurant.
                    </p>
                </div>
            </header>

            <section className="space-y-5" aria-label="News list">
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                            type="button"
                            onClick={() => changeCategory('')}
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${category === '' ? 'bg-[#081126] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            All
                        </button>
                        {categories.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => changeCategory(item)}
                                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${category === item ? 'bg-[#081126] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={submitSearch} className="flex w-full gap-2 sm:max-w-sm">
                        <label className="relative min-w-0 flex-1">
                            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                            <input
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search articles..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                            />
                        </label>
                        <button type="submit" className="rounded-xl bg-[#081126] px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                            Search
                        </button>
                    </form>
                </div>

                {error && (
                    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                        <span>{error}</span>
                        <button type="button" onClick={loadNews} className="font-bold underline">Try again</button>
                    </div>
                )}

                {loading ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }, (_, index) => (
                            <div key={index} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
                        ))}
                    </div>
                ) : result.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                        <Newspaper size={36} className="mx-auto text-slate-300" aria-hidden="true" />
                        <h2 className="mt-4 text-lg font-bold text-slate-800">No matching articles found</h2>
                        <p className="mt-2 text-sm text-slate-500">New articles will appear here.</p>
                    </div>
                ) : (
                    <>
                        {featuredNews && (
                            <button
                                type="button"
                                onClick={() => openNews(featuredNews)}
                                className="group grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl md:grid-cols-2"
                            >
                                <div className="h-64 overflow-hidden bg-slate-100 md:h-80">
                                    {getDisplayImage(featuredNews) ? (
                                        <img src={getDisplayImage(featuredNews)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50">
                                            <Newspaper size={48} className="text-slate-300" aria-hidden="true" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center p-6 sm:p-9">
                                    <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">Featured</span>
                                    <h2 className="mt-4 font-serif text-2xl font-bold text-slate-900 sm:text-3xl">{featuredNews.title}</h2>
                                    {featuredNews.summary && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{featuredNews.summary}</p>}
                                    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" />{formatDate(featuredNews.publishedAt || featuredNews.createdAt)}</span>
                                        {featuredNews.category && <span>{featuredNews.category}</span>}
                                    </div>
                                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-amber-900">Read article <ArrowRight size={16} aria-hidden="true" /></span>
                                </div>
                            </button>
                        )}

                        {regularNews.length > 0 && (
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {regularNews.map((item) => (
                                    <article key={item.newsID} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                                        <button type="button" onClick={() => openNews(item)} className="h-52 overflow-hidden bg-slate-100 text-left">
                                            {getDisplayImage(item) ? (
                                                <img src={getDisplayImage(item)} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50">
                                                    <Newspaper size={40} className="text-slate-300" aria-hidden="true" />
                                                </div>
                                            )}
                                        </button>
                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} aria-hidden="true" />{formatDate(item.publishedAt || item.createdAt)}</span>
                                                {item.category && <span className="truncate rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{item.category}</span>}
                                            </div>
                                            <button type="button" onClick={() => openNews(item)} className="mt-3 text-left font-serif text-xl font-bold leading-snug text-slate-900 transition group-hover:text-amber-900">
                                                {item.title}
                                            </button>
                                            {item.summary && <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.summary}</p>}
                                            <div className="mt-auto flex items-center justify-between pt-5 text-xs text-slate-400">
                                                <span>{item.author || 'Lumière Restaurant'}</span>
                                                <span className="inline-flex items-center gap-1"><Eye size={13} aria-hidden="true" />{item.viewCount || 0}</span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                                <p className="text-sm text-slate-500">{result.totalCount} articles</p>
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => setPage((current) => current - 1)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ArrowLeft size={15} aria-hidden="true" /> Previous
                                    </button>
                                    <span className="text-sm font-medium text-slate-600">{page} / {totalPages}</span>
                                    <button
                                        type="button"
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((current) => current + 1)}
                                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Sau <ArrowRight size={15} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>

            {(detailLoading || selectedNews) && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !detailLoading) setSelectedNews(null);
                    }}
                >
                    <section className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setSelectedNews(null)}
                            disabled={detailLoading}
                            aria-label="Close article"
                            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow transition hover:bg-white"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                        {detailLoading ? (
                            <div className="p-16 text-center text-sm text-slate-500">Loading article...</div>
                        ) : selectedNews && (
                            <>
                                {selectedNews.thumbnailUrl && <img src={selectedNews.thumbnailUrl} alt="" className="max-h-96 w-full object-cover" />}
                                <div className="p-6 sm:p-10">
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                                        {selectedNews.category && <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">{selectedNews.category}</span>}
                                        <span>{formatDate(selectedNews.publishedAt || selectedNews.createdAt)}</span>
                                        <span>{selectedNews.author || 'Lumière Restaurant'}</span>
                                    </div>
                                    <h2 className="mt-4 font-serif text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">{selectedNews.title}</h2>
                                    {selectedNews.summary && <p className="mt-4 border-l-4 border-[#DCC8A8] pl-4 text-base leading-7 text-slate-600">{selectedNews.summary}</p>}
                                    <div className="mt-7 space-y-3 text-sm leading-8 text-slate-700 sm:text-base">
                                        {renderArticleContent(
                                            selectedNews.content || selectedNews.summary || 'This article has no content yet.'
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                </div>,
                document.body,
            )}
        </main>
    );
}
