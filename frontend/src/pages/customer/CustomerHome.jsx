import { useState } from 'react';
import { mockFoods } from "../../data/mockFoods";
import { Search, Star, MapPin } from 'lucide-react';

export default function CustomerHome() {
    const [selectedCat, setSelectedCat] = useState('all');

    const filteredFoods = selectedCat === 'all'
        ? FOODS
        : FOODS.filter(f => f.categoryId === selectedCat);

    return (
        <div>
            {/* Search Bar */}
            <div className="bg-white border-b border-gray-200 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 flex gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Tìm kiếm món ăn, ưu đãi nhà hàng..."
                            className="w-full bg-gray-100 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-red-500"
                        />
                        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    </div>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-6 rounded-xl font-bold text-sm">
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Category Icons Carousel */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex space-x-4 overflow-x-auto pb-2">
                    <button
                        onClick={() => setSelectedCat('all')}
                        className={`flex flex-col items-center min-w-[70px] p-2 rounded-2xl transition ${selectedCat === 'all' ? 'bg-red-100 text-red-600 font-bold' : 'text-gray-600'}`}
                    >
                        <span className="text-2xl mb-1">🍽️</span>
                        <span className="text-xs">Tất cả</span>
                    </button>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCat(cat.id)}
                            className={`flex flex-col items-center min-w-[70px] p-2 rounded-2xl transition ${selectedCat === cat.id ? 'bg-red-100 text-red-600 font-bold' : 'text-gray-600'}`}
                        >
                            <span className="text-2xl mb-1">{cat.icon}</span>
                            <span className="text-xs">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Food Cards Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Gợi ý món ngon hôm nay</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFoods.map(food => (
                        <div key={food.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                            <img src={food.image} alt={food.name} className="w-full h-48 object-cover" />
                            <div className="p-4">
                                <h3 className="font-bold text-gray-900 text-lg">{food.name}</h3>
                                <p className="text-red-600 font-black text-lg mt-1">{food.price.toLocaleString('vi-VN')} đ</p>
                                <button className="w-full mt-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition">
                                    Đặt bàn / Gọi món
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}