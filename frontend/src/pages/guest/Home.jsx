import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeroCarousel from '../../components/home/HeroCarousel';
import { mockFoods } from '../../data/mockFoods';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const CATEGORIES = [
    {
        id: 'hotpot',
        name: 'Galaxy Hotpot',
        subtitle: 'Signature Broths',
        count: '18 Specialties',
        image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
        badge: 'POPULAR'
    },
    {
        id: 'bbq',
        name: 'Cosmos BBQ',
        subtitle: 'Prime Wagyu & Ribs',
        count: '24 Items',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        badge: 'CHEF CHOICE'
    },
    {
        id: 'seafood',
        name: '5-Star Seafood',
        subtitle: 'Fresh Live Catch',
        count: '15 Selections',
        image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
        badge: 'FRESH'
    },
    {
        id: 'japanese',
        name: 'Japanese Omakase',
        subtitle: 'Sashimi & Sushi',
        count: '20 Dishes',
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
        badge: 'PREMIUM'
    },
    {
        id: 'cocktails',
        name: 'Starlight Cocktails',
        subtitle: 'Craft Mixology',
        count: '12 Drinks',
        image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
        badge: 'NIGHT BAR'
    },
    {
        id: 'vegan',
        name: 'Artisan Vegan',
        subtitle: 'Organic & Healthy',
        count: '14 Dishes',
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
        badge: 'HEALTHY'
    },
];

const PROMO_CARDS = [
    {
        id: 'nebula-deals',
        badge: 'NEBULA DEALS',
        title: 'Midnight BBQ & Hotpot Buffet',
        description: 'Pay 3 for 4 guests – Free Premium Galaxy Mocktail & VIP Room upgrade.',
        price: 'From 399.000đ / guest',
        ctaText: 'Explore Offer',
        ctaLink: '/menu',
        bgImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
    },
    {
        id: 'starlight-party',
        badge: 'STARLIGHT PARTY',
        title: 'Birthday & Event Celebration',
        description: 'Complimentary Galaxy LED backdrop, Starlight cake & photo memory service.',
        price: 'Group packages from 6 guests',
        ctaText: 'Reserve Table',
        ctaLink: '/restaurant-layout',
        bgImage: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80',
    },
];

export default function Home() {
    const navigate = useNavigate();
    const [foods] = useState(mockFoods);
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        navigate('/menu');
    };

    return (
        <div className="w-full space-y-12 pb-16">

            {/* 1. FULL-BLEED HERO CAROUSEL BANNER */}
            <section className="w-full relative">
                <HeroCarousel />
            </section>

            {/* MAIN CONTENT WRAPPER */}
            <div className="max-w-7xl mx-auto px-4 space-y-14">

                {/* 2. ELEGANT GLASSMORPHISM SEARCH BAR */}
                <section className="relative z-10 max-w-4xl mx-auto">
                    <form onSubmit={handleSearchSubmit} className="bg-[#081126]/90 backdrop-blur-2xl border border-[#DCC8A8]/40 rounded-3xl p-3.5 sm:p-4 shadow-2xl shadow-black/70">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative flex items-center">
                                <span className="absolute left-4 text-[#DCC8A8]">🔍</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search gourmet dishes, VIP Galaxy tables, special offers..."
                                    className="w-full bg-[#101936]/80 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-xs sm:text-sm text-[#F5F2EA] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#DCC8A8] focus:border-transparent transition"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-8 py-3.5 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                                Search Menu
                            </button>
                        </div>
                    </form>
                </section>

                {/* 3. CATEGORY SHOWCASE */}
                <section>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-2">
                        <div>
                            <span className="text-[11px] font-bold text-[#DCC8A8] uppercase tracking-[0.2em]">
                                ✦ CURATED MENU ✦
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
                                Explore By Category
                            </h2>
                        </div>
                        <p className="text-xs text-slate-500 max-w-xs">
                            Indulge in our carefully crafted culinary selections prepared by 5-star master chefs.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {CATEGORIES.map((cat) => (
                            <Link
                                key={cat.id}
                                to="/menu"
                                className="group relative h-64 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md hover:shadow-2xl hover:border-[#DCC8A8] transition-all duration-500 flex flex-col justify-end p-4 cursor-pointer"
                            >
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110 brightness-[0.7] group-hover:brightness-[0.55]"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-[#081126] via-[#081126]/40 to-transparent"></div>

                                <div className="absolute top-3 left-3 z-10">
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[#081126]/80 text-[#DCC8A8] border border-[#DCC8A8]/40 backdrop-blur-md shadow-sm">
                                        {cat.badge}
                                    </span>
                                </div>

                                <div className="relative z-10 text-white">
                                    <span className="text-[10px] text-[#DCC8A8] font-medium tracking-wide uppercase block">
                                        {cat.subtitle}
                                    </span>
                                    <h3 className="text-sm font-serif font-bold text-[#F5F2EA] group-hover:text-[#DCC8A8] transition-colors leading-tight mt-0.5">
                                        {cat.name}
                                    </h3>
                                    <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between text-[11px] text-[#C4D0E3]">
                                        <span>{cat.count}</span>
                                        <span className="font-bold text-[#DCC8A8] group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 4. PROMOTION BANNER CARDS */}
                <section>
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <span className="text-[11px] font-bold text-[#DCC8A8] uppercase tracking-[0.2em]">
                                ✦ EXCLUSIVE OFFERS ✦
                            </span>
                            <h2 className="text-2xl font-serif font-bold text-slate-900 mt-0.5">
                                Lumière Special Packages
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {PROMO_CARDS.map((card) => (
                            <Link
                                key={card.id}
                                to={card.ctaLink}
                                className="relative min-h-[220px] rounded-3xl overflow-hidden border border-[#DCC8A8]/30 shadow-lg group cursor-pointer transition-all duration-500 hover:border-[#DCC8A8] hover:-translate-y-1 flex flex-col justify-between"
                            >
                                <img
                                    src={card.bgImage}
                                    alt={card.title}
                                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105 brightness-[0.5]"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-[#081126] via-[#081126]/60 to-black/20"></div>

                                <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#DCC8A8] text-[#081126] shadow-sm">
                                            {card.badge}
                                        </span>
                                        {card.price && (
                                            <span className="text-xs font-semibold text-[#DCC8A8] bg-[#081126]/80 px-3 py-1 rounded-xl backdrop-blur-md border border-[#DCC8A8]/30">
                                                {card.price}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-6">
                                        <h3 className="text-xl font-serif font-bold text-[#F5F2EA] group-hover:text-[#DCC8A8] transition-colors">
                                            {card.title}
                                        </h3>
                                        <p className="text-xs text-[#C4D0E3] mt-1.5 font-normal leading-relaxed">
                                            {card.description}
                                        </p>

                                        <div className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#DCC8A8] group-hover:text-white transition-colors">
                                            <span>{card.ctaText}</span>
                                            <span className="text-base transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* 5. CHEF'S SIGNATURE DISHES CARDS */}
                <section>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <span className="text-[11px] font-bold text-[#DCC8A8] uppercase tracking-[0.2em]">
                                ✦ FINE DINING ✦
                            </span>
                            <h2 className="text-2xl font-serif font-bold text-slate-900 mt-0.5">
                                Chef&apos;s Signature Dishes
                            </h2>
                        </div>
                        <Link to="/menu" className="text-xs font-bold text-[#081126] hover:text-[#DCC8A8] transition-colors flex items-center gap-1">
                            <span>View Full Menu ({foods.length})</span>
                            <span>→</span>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {foods.map((food) => (
                            <Card key={food.id} className="flex flex-col justify-between hover:shadow-2xl hover:-translate-y-1.5 transition duration-300 bg-white border-slate-200/80 overflow-hidden group">
                                <div>
                                    <div className="relative h-48 bg-slate-100 overflow-hidden">
                                        <img
                                            src={food.image}
                                            alt={food.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                        />
                                        <div className="absolute top-3 left-3">
                                            <span className="bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 font-bold text-[11px] px-2.5 py-1 rounded-lg shadow-md">
                                                {food.discount}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-serif font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-800 transition-colors">
                                            {food.name}
                                        </h3>
                                        <p className="text-sm font-black text-[#081126] mt-2">
                                            {food.price.toLocaleString('vi-VN')} đ
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 pt-0">
                                    <Button
                                        variant="gold"
                                        size="sm"
                                        onClick={() => navigate('/restaurant-layout')}
                                        className="w-full py-2.5 font-bold uppercase tracking-wider text-xs cursor-pointer"
                                    >
                                        Book Table Now
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

            </div>

        </div>
    );
}