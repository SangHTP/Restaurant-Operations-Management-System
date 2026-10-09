import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

const SLIDES = [
    {
        id: 'galaxy-glass',
        badge: '✦ DÙNG BỮA ĐÊM NGÂN HÀ ✦',
        subtitle: 'LUMIÈRE LUXURY DINING EXPERIENCE',
        title: 'Thưởng Thức Ẩm Thực Không Gian Kính Mờ Vũ Trụ',
        description: 'Trải nghiệm phong cách ẩm thực đỉnh cao với thực đơn 5 sao, cocktail sáng tạo và ưu đãi đặc quyền giảm đến 50% khi đặt bàn trước.',
        primaryBtnText: 'Khám phá Menu & Đặt bàn',
        primaryBtnLink: '/menu',
        secondaryBtnText: 'Xem Sơ Đồ Đặt Bàn',
        secondaryBtnLink: '/restaurant-layout',
        bgImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85',
        // Split screen image shown on the right panel
        splitImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=85',
        accentColor: '#DCC8A8',
        tag: 'HOT DEAL',
        stat1: '5★ Rating', stat2: '10+ Years', stat3: '200+ Tables',
    },
    {
        id: 'signature-gourmet',
        badge: '✦ TINH HOA BẮT MẮT ✦',
        subtitle: 'FINE DINING & SEAFOOD GOURMET',
        title: 'Tuyệt Tác Hải Sản Thượng Hạng & Bò Mỹ Sốt BBQ',
        description: 'Mỗi món ăn là một tác phẩm nghệ thuật chế biến bởi đầu bếp 5 sao, mang lại dư vị đậm đà ngất ngây trong từng giác quan.',
        primaryBtnText: 'Thưởng thức ngay',
        primaryBtnLink: '/menu',
        secondaryBtnText: 'Xem danh mục món',
        secondaryBtnLink: '/menu',
        bgImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2000&q=85',
        splitImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
        accentColor: '#60A5FA',
        tag: 'SIGNATURE',
        stat1: '60+ Dishes', stat2: 'Wagyu A5', stat3: 'Live Seafood',
    },
    {
        id: 'starlight-party',
        badge: '✦ TIỆC SỰ KIỆN & PRIVATE DINING ✦',
        subtitle: 'VIP STARLIGHT LOUNGE',
        title: 'Tổ Chức Sinh Nhật & Tiệc Kỷ Niệm Sang Trọng',
        description: 'Gói trang trí ánh sáng LED Galaxy độc quyền, tặng bánh kem Starlight cao cấp & không gian riêng tư đẳng cấp cho nhóm từ 6 khách.',
        primaryBtnText: 'Đặt tiệc ngay',
        primaryBtnLink: '/restaurant-layout',
        secondaryBtnText: 'Tư vấn sự kiện',
        secondaryBtnLink: '/restaurant-info',
        bgImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=2000&q=85',
        splitImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=85',
        accentColor: '#F472B6',
        tag: 'EXCLUSIVE',
        stat1: 'Private Room', stat2: 'LED Decor', stat3: 'Cake Included',
    },
    {
        id: 'cocktail-bar',
        badge: '✦ COCKTAIL & NIGHT BAR ✦',
        subtitle: 'STARLIGHT MIXOLOGY',
        title: 'Cocktail Starlight & Âm Nhạc Đêm Ngân Hà',
        description: 'Thư giãn trong không gian quầy bar lung linh, thưởng thức những ly cocktail được pha chế độc bản theo phong cách Galaxy.',
        primaryBtnText: 'Xem Menu Đồ Uống',
        primaryBtnLink: '/menu',
        secondaryBtnText: null,
        bgImage: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=2000&q=85',
        splitImage: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=85',
        accentColor: '#C084FC',
        tag: 'NIGHT LOUNGE',
        stat1: '40+ Cocktails', stat2: 'Live DJ', stat3: 'Sky Bar',
    },
    {
        id: 'buffet-bbq',
        badge: '✦ BUFFET LẨU NƯỚNG ĐÊM ✦',
        subtitle: 'NEBULA DEALS - ĐI 4 TÍNH 3',
        title: 'Đại Tiệc Lẩu Nướng BBQ Không Giới Hạn',
        description: 'Thỏa thích thưởng thức hơn 60 món lẩu nướng đa dạng, tặng kèm Mocktail Ngân Hà không giới hạn cho bàn đi từ 4 người.',
        primaryBtnText: 'Nhận Ưu Đãi 4 Tính 3',
        primaryBtnLink: '/menu',
        secondaryBtnText: null,
        bgImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2000&q=85',
        splitImage: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1200&q=85',
        accentColor: '#F59E0B',
        tag: 'SPECIAL PROMO',
        stat1: '60+ Dishes', stat2: 'Mocktail Free', stat3: '4 Tính 3',
    }
];

export default function HeroCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const [progress, setProgress] = useState(0);
    const [parallaxY, setParallaxY] = useState(0);
    const [mouseX, setMouseX] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const containerRef = useRef(null);

    const changeSlide = useCallback((newIndex) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setPrevIndex(currentIndex);
        setCurrentIndex(newIndex);
        setProgress(0);
        setTimeout(() => {
            setPrevIndex(null);
            setIsTransitioning(false);
        }, 900);
    }, [currentIndex, isTransitioning]);

    const nextSlide = useCallback(() => {
        changeSlide((currentIndex + 1) % SLIDES.length);
    }, [currentIndex, changeSlide]);

    const prevSlide = useCallback(() => {
        changeSlide(currentIndex === 0 ? SLIDES.length - 1 : currentIndex - 1);
    }, [currentIndex, changeSlide]);

    const goToSlide = (index) => {
        if (index !== currentIndex) changeSlide(index);
    };

    // Auto-advance timer
    useEffect(() => {
        if (isHovered) return;
        const stepTime = 50;
        const totalDuration = 6000;
        const increment = (stepTime / totalDuration) * 100;

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    nextSlide();
                    return 0;
                }
                return prev + increment;
            });
        }, stepTime);

        return () => clearInterval(interval);
    }, [isHovered, nextSlide, currentIndex]);

    // Parallax scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const scrolled = -rect.top * 0.35;
                setParallaxY(scrolled);
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Mouse parallax (subtle tilt)
    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        setMouseX(x);
    };

    const slide = SLIDES[currentIndex];
    const prevSlideData = prevIndex !== null ? SLIDES[prevIndex] : null;

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden bg-[#081126] select-none"
            style={{ height: 'clamp(560px, 80vh, 820px)' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setMouseX(0); }}
            onMouseMove={handleMouseMove}
        >
            <style>{`
                /* Ken Burns variations per slide direction */
                @keyframes kbZoomInRight {
                    0%   { transform: scale(1.0) translate(0%, 0%); }
                    100% { transform: scale(1.18) translate(-3%, -2%); }
                }
                @keyframes kbZoomInLeft {
                    0%   { transform: scale(1.0) translate(0%, 0%); }
                    100% { transform: scale(1.18) translate(3%, -2%); }
                }
                @keyframes kbZoomOut {
                    0%   { transform: scale(1.18) translate(2%, 1%); }
                    100% { transform: scale(1.0) translate(-1%, 0%); }
                }
                @keyframes kbPan {
                    0%   { transform: scale(1.12) translate(-4%, 0%); }
                    100% { transform: scale(1.12) translate(4%, -2%); }
                }
                @keyframes kbPanRight {
                    0%   { transform: scale(1.12) translate(4%, 0%); }
                    100% { transform: scale(1.12) translate(-4%, -2%); }
                }

                /* Split screen slide-in animations */
                @keyframes splitLeftIn {
                    0%   { clip-path: inset(0 100% 0 0); opacity: 0; }
                    100% { clip-path: inset(0 0% 0 0);   opacity: 1; }
                }
                @keyframes splitRightIn {
                    0%   { clip-path: inset(0 0 0 100%); opacity: 0; }
                    100% { clip-path: inset(0 0 0 0%);   opacity: 1; }
                }
                @keyframes splitLeftOut {
                    0%   { clip-path: inset(0 0% 0 0);   opacity: 1; }
                    100% { clip-path: inset(0 100% 0 0); opacity: 0; }
                }
                @keyframes splitRightOut {
                    0%   { clip-path: inset(0 0 0 0%);   opacity: 1; }
                    100% { clip-path: inset(0 0 0 100%); opacity: 0; }
                }

                /* Text stagger */
                @keyframes textRiseIn {
                    0%  { opacity: 0; transform: translateY(32px) skewY(1.5deg); filter: blur(4px); }
                    100%{ opacity: 1; transform: translateY(0)    skewY(0deg);   filter: blur(0); }
                }
                @keyframes vertDivider {
                    0%   { transform: scaleY(0); opacity: 0; }
                    100% { transform: scaleY(1); opacity: 1; }
                }
                @keyframes statsSlideIn {
                    0%   { opacity: 0; transform: translateX(-20px); }
                    100% { opacity: 1; transform: translateX(0); }
                }

                .kb-zoom-right { animation: kbZoomInRight 10s ease-out forwards; }
                .kb-zoom-left  { animation: kbZoomInLeft  10s ease-out forwards; }
                .kb-zoom-out   { animation: kbZoomOut     10s ease-out forwards; }
                .kb-pan        { animation: kbPan         12s linear  forwards; }
                .kb-pan-right  { animation: kbPanRight    12s linear  forwards; }

                .split-left-in   { animation: splitLeftIn  0.9s cubic-bezier(0.77,0,0.18,1) forwards; }
                .split-right-in  { animation: splitRightIn 0.9s cubic-bezier(0.77,0,0.18,1) forwards; }
                .split-left-out  { animation: splitLeftOut 0.9s cubic-bezier(0.77,0,0.18,1) forwards; }
                .split-right-out { animation: splitRightOut 0.9s cubic-bezier(0.77,0,0.18,1) forwards; }

                .text-rise { animation: textRiseIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
                .divider-grow { animation: vertDivider 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
                .stats-in { animation: statsSlideIn 0.6s ease-out both; }
            `}</style>

            {/* ── SLIDE LAYERS ─────────────────────────────────── */}
            {/* Previous slide (exiting) */}
            {prevSlideData && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                    {/* LEFT panel exit */}
                    <div className="split-left-out absolute inset-0 w-[60%]">
                        <div className="absolute inset-0 overflow-hidden">
                            <img
                                src={prevSlideData.bgImage}
                                alt=""
                                className="absolute w-full h-full object-cover object-center"
                                style={{ transform: `translateY(${parallaxY}px)` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#081126]/95 via-[#081126]/60 to-transparent" />
                        </div>
                    </div>
                    {/* RIGHT panel exit */}
                    <div className="split-right-out absolute inset-0 left-[60%]">
                        <div className="absolute inset-0 overflow-hidden">
                            <img
                                src={prevSlideData.splitImage}
                                alt=""
                                className="absolute w-full h-full object-cover object-center scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-l from-[#081126]/80 via-[#081126]/30 to-transparent" />
                        </div>
                    </div>
                </div>
            )}

            {/* Current slide (entering) */}
            <div key={`slide-${currentIndex}`} className="absolute inset-0 z-20">

                {/* ── LEFT PANEL: Background + Parallax + Ken Burns ── */}
                <div className={`split-left-in absolute inset-0`} style={{ width: '62%' }}>
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={slide.bgImage}
                            alt={slide.title}
                            className={`absolute w-[115%] h-[115%] object-cover object-center ${
                                currentIndex % 5 === 0 ? 'kb-zoom-right' :
                                currentIndex % 5 === 1 ? 'kb-zoom-left' :
                                currentIndex % 5 === 2 ? 'kb-zoom-out' :
                                currentIndex % 5 === 3 ? 'kb-pan' : 'kb-pan-right'
                            }`}
                            style={{
                                top: '-7.5%',
                                left: '-7.5%',
                                transformOrigin: 'center center',
                                // Parallax scroll + subtle mouse tilt
                                marginTop: `${parallaxY}px`,
                                marginLeft: `${mouseX * 18}px`,
                                transition: 'margin 0.1s linear',
                            }}
                        />
                        {/* Gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#081126] via-[#081126]/80 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#081126]/90 via-transparent to-black/30" />
                        {/* Ambient glow */}
                        <div
                            className="absolute bottom-0 left-0 w-[500px] h-[300px] rounded-full blur-[100px] pointer-events-none"
                            style={{ background: `${slide.accentColor}22` }}
                        />
                    </div>
                </div>

                {/* ── RIGHT PANEL: Split Image + Ken Burns ── */}
                <div className="split-right-in absolute inset-0" style={{ left: '62%' }}>
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={slide.splitImage}
                            alt=""
                            className={`absolute w-[120%] h-[120%] object-cover object-center ${
                                currentIndex % 2 === 0 ? 'kb-pan' : 'kb-pan-right'
                            }`}
                            style={{
                                top: '-10%',
                                left: '-10%',
                                // Opposite parallax direction for depth effect
                                marginTop: `${parallaxY * 0.5}px`,
                                marginLeft: `${-mouseX * 12}px`,
                                transition: 'margin 0.1s linear',
                            }}
                        />
                        {/* Beautiful left edge blend to main panel */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#081126] via-[#081126]/20 to-[#081126]/50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#081126]/70 via-transparent to-black/30" />
                        {/* Colored tint overlay */}
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{ background: `linear-gradient(135deg, ${slide.accentColor}55, transparent)` }}
                        />
                    </div>
                </div>

                {/* ── VERTICAL SPLIT DIVIDER LINE ── */}
                <div
                    className="divider-grow absolute z-40 top-0 bottom-0 pointer-events-none"
                    style={{
                        left: 'calc(62% - 1px)',
                        width: '2px',
                        background: `linear-gradient(to bottom, transparent, ${slide.accentColor}80, ${slide.accentColor}, ${slide.accentColor}80, transparent)`,
                        transformOrigin: 'top',
                        boxShadow: `0 0 20px ${slide.accentColor}60`,
                    }}
                />

                {/* ── SLIDE TEXT CONTENT ── */}
                <div
                    key={`content-${currentIndex}`}
                    className="relative z-50 h-full flex flex-col justify-center px-8 sm:px-12 lg:px-16 pb-16 pt-8"
                    style={{ maxWidth: '62%' }}
                >
                    {/* Badge row */}
                    <div
                        className="flex items-center gap-3 mb-5 opacity-0 text-rise"
                        style={{ animationDelay: '100ms' }}
                    >
                        <span
                            className="text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-xl"
                            style={{
                                background: slide.accentColor,
                                color: '#081126',
                            }}
                        >
                            {slide.tag}
                        </span>
                        <span
                            className="text-[11px] font-serif font-bold tracking-widest uppercase"
                            style={{ color: slide.accentColor }}
                        >
                            {slide.subtitle}
                        </span>
                    </div>

                    {/* Title */}
                    <h1
                        className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-serif font-bold leading-[1.08] text-[#F5F2EA] drop-shadow-2xl tracking-tight max-w-2xl mb-5 opacity-0 text-rise"
                        style={{ animationDelay: '230ms' }}
                    >
                        {slide.title}
                    </h1>

                    {/* Description */}
                    <p
                        className="text-sm sm:text-base text-[#C4D0E3] font-normal leading-relaxed max-w-xl mb-7 opacity-0 text-rise"
                        style={{ animationDelay: '380ms' }}
                    >
                        {slide.description}
                    </p>

                    {/* Buttons */}
                    <div
                        className="flex flex-wrap items-center gap-4 mb-8 opacity-0 text-rise"
                        style={{ animationDelay: '510ms' }}
                    >
                        <Link
                            to={slide.primaryBtnLink}
                            className="px-8 py-4 font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-3 cursor-pointer"
                            style={{
                                background: `linear-gradient(135deg, ${slide.accentColor}, #ebd9bd, ${slide.accentColor})`,
                                color: '#081126',
                                border: `1px solid ${slide.accentColor}80`,
                            }}
                        >
                            <span>{slide.primaryBtnText}</span>
                            <span className="text-lg font-black">→</span>
                        </Link>

                        {slide.secondaryBtnText && (
                            <Link
                                to={slide.secondaryBtnLink}
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-2xl backdrop-blur-md transition-all duration-300 hover:border-white/60 active:scale-95 flex items-center cursor-pointer"
                            >
                                {slide.secondaryBtnText}
                            </Link>
                        )}
                    </div>

                    {/* Stats bar */}
                    <div
                        className="flex items-center gap-6 opacity-0 stats-in"
                        style={{ animationDelay: '640ms' }}
                    >
                        {[slide.stat1, slide.stat2, slide.stat3].map((stat, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {i > 0 && (
                                    <div className="w-px h-6 bg-white/20 mx-1" />
                                )}
                                <span
                                    className="text-xs font-bold uppercase tracking-wider"
                                    style={{ color: slide.accentColor }}
                                >
                                    {stat}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── RIGHT PANEL BADGE (corner) ── */}
                <div
                    className="absolute z-50 top-10 right-10 text-right opacity-0 text-rise"
                    style={{ animationDelay: '700ms' }}
                >
                    <div
                        className="text-[10px] font-black uppercase tracking-[0.3em] mb-1"
                        style={{ color: slide.accentColor }}
                    >
                        {slide.badge}
                    </div>
                    <div className="text-[11px] text-white/50 font-mono">
                        Est. Lumière 2023
                    </div>
                </div>
            </div>

            {/* ── NAV BUTTONS ─────────────────────────────────── */}
            <button
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="absolute left-5 sm:left-8 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-2xl bg-[#081126]/80 hover:bg-[#DCC8A8] border border-[#DCC8A8]/40 text-[#DCC8A8] hover:text-[#081126] flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110 cursor-pointer shadow-2xl"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button
                onClick={nextSlide}
                aria-label="Next Slide"
                className="absolute right-5 sm:right-8 top-1/2 -translate-y-1/2 z-[60] w-12 h-12 rounded-2xl bg-[#081126]/80 hover:bg-[#DCC8A8] border border-[#DCC8A8]/40 text-[#DCC8A8] hover:text-[#081126] flex items-center justify-center backdrop-blur-md transition-all duration-300 opacity-70 hover:opacity-100 hover:scale-110 cursor-pointer shadow-2xl"
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* ── SLIDE INDICATORS ────────────────────────────── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 bg-[#081126]/70 px-5 py-2.5 rounded-2xl backdrop-blur-md border border-[#DCC8A8]/25">
                <span className="font-mono text-xs font-bold text-[#DCC8A8]">
                    0{currentIndex + 1} <span className="text-white/30">/</span> 0{SLIDES.length}
                </span>

                <div className="flex items-center gap-1.5">
                    {SLIDES.map((s, idx) => (
                        <button
                            key={s.id}
                            onClick={() => goToSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                                idx === currentIndex
                                    ? 'w-8 shadow-[0_0_8px_var(--accent)]'
                                    : 'w-1.5 bg-white/25 hover:bg-white/50'
                            }`}
                            style={idx === currentIndex ? { background: slide.accentColor, '--accent': slide.accentColor } : {}}
                        />
                    ))}
                </div>
            </div>

            {/* ── PROGRESS LINE ────────────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] z-[60] bg-white/10">
                <div
                    className="h-full transition-all duration-75 ease-linear shadow-[0_0_10px_var(--pcolor)]"
                    style={{
                        width: `${progress}%`,
                        background: `linear-gradient(to right, ${slide.accentColor}, ${slide.accentColor}cc)`,
                        '--pcolor': slide.accentColor,
                    }}
                />
            </div>
        </div>
    );
}