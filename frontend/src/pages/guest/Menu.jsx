import { useState } from 'react';
import { mockFoods, INITIAL_CATEGORIES } from '../../data/mockFoods';
import { useAuth } from '../../context/AuthContext';

export default function Menu() {
    const { currentUser } = useAuth();
    const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Owner';
    const isKitchen = currentUser?.role === 'Kitchen';

    // State lists
    const [foods, setFoods] = useState(mockFoods);
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [selectedCategory, setSelectedCategory] = useState('All Dishes');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Toast feedback state
    const [toast, setToast] = useState('');
    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    // Modal States
    const [viewingFood, setViewingFood] = useState(null); // Food Detail Modal
    const [editingFood, setEditingFood] = useState(null); // Update Food Modal
    const [isCreateFoodModalOpen, setIsCreateFoodModalOpen] = useState(false); // Create Food Modal
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false); // Category Modal

    // Form state for Create / Edit Food
    const [foodForm, setFoodForm] = useState({
        name: '',
        category: 'Galaxy Hotpot',
        price: 300000,
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        badge: 'NEW DISH',
        description: '',
        dailyMax: 30,
        dailyLeft: 30,
        prepTime: '15 mins',
        calories: '500 kcal',
        active: true,
    });

    // New Category Name input
    const [newCatName, setNewCatName] = useState('');

    // Activate / Deactivate Food
    const handleToggleActive = (id) => {
        setFoods((prev) =>
            prev.map((f) => {
                if (f.id === id) {
                    const nextActive = !f.active;
                    showToast(`Dish "${f.name}" is now ${nextActive ? 'ACTIVE ✅' : 'INACTIVE 🚫'}`);
                    return { ...f, active: nextActive };
                }
                return f;
            })
        );
    };

    // Update Daily Quantity
    const handleUpdateQuantity = (id, delta) => {
        setFoods((prev) =>
            prev.map((f) => {
                if (f.id === id) {
                    const newLeft = Math.max(0, f.dailyLeft + delta);
                    showToast(`Updated stock for "${f.name}": ${newLeft} / ${f.dailyMax} portions left`);
                    return { ...f, dailyLeft: newLeft };
                }
                return f;
            })
        );
    };

    // Create Food Submit
    const handleCreateFoodSubmit = (e) => {
        e.preventDefault();
        const newDish = {
            id: `f-${Date.now()}`,
            ...foodForm,
            rating: 5.0,
            reviews: 1,
            price: Number(foodForm.price),
            dailyMax: Number(foodForm.dailyMax),
            dailyLeft: Number(foodForm.dailyLeft),
        };
        setFoods([newDish, ...foods]);
        setIsCreateFoodModalOpen(false);
        showToast(`Created new dish "${newDish.name}" successfully`);
    };

    // Update Food Submit
    const handleEditFoodSubmit = (e) => {
        e.preventDefault();
        setFoods((prev) =>
            prev.map((f) => (f.id === editingFood.id ? { ...editingFood } : f))
        );
        showToast(`Updated dish details for "${editingFood.name}"`);
        setEditingFood(null);
    };

    const [confirmModal, setConfirmModal] = useState(null);

    // Delete Food
    const handleDeleteFood = (id, name) => {
        setConfirmModal({
            title: 'Delete Dish',
            message: `Are you sure you want to delete "${name}" from the menu?`,
            onConfirm: () => {
                setFoods((prev) => prev.filter((f) => f.id !== id));
                showToast(`Deleted dish "${name}" from menu`);
                setConfirmModal(null);
            }
        });
    };

    // Create Food Category
    const handleAddCategory = (e) => {
        e.preventDefault();
        const trimmed = newCatName.trim();
        if (!trimmed) {
            showToast('⚠️ Please enter a category name first!');
            return;
        }
        if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
            showToast(`⚠️ Category "${trimmed}" already exists!`);
            return;
        }
        const icons = ['🍲', '🍱', '🍷', '🍰', '🍕', '🥩', '🥗', '🍣', '🥂', '✦'];
        const randomIcon = icons[categories.length % icons.length];
        const newCat = {
            id: `cat-${Date.now()}`,
            name: trimmed,
            icon: randomIcon,
            count: 0,
        };
        setCategories((prev) => [...prev, newCat]);
        setNewCatName('');
        showToast(`✅ Successfully added category "${trimmed}"`);
    };

    // Delete Food Category
    const handleDeleteCategory = (id, name) => {
        if (categories.length <= 1) {
            showToast('Cannot delete all categories! At least 1 must remain.');
            return;
        }
        setCategories((prev) => prev.filter((c) => c.id !== id));
        if (selectedCategory === name) setSelectedCategory('All Dishes');
        showToast(`Deleted category "${name}"`);
    };

    // Filtered Food List
    const filteredFoods = foods.filter((food) => {
        const matchesSearch =
            food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            food.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            selectedCategory === 'All Dishes' || food.category === selectedCategory;
        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Active' && food.active) ||
            (statusFilter === 'Inactive' && !food.active) ||
            (statusFilter === 'LowStock' && food.dailyLeft <= 5);

        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-8">

            {/* TOAST NOTIFICATION */}
            {toast && (
                <div className="fixed top-20 right-6 z-[300] bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
                    <span className="text-[#DCC8A8] font-bold">✦ MENU NOTICE ✦</span>
                    <span className="text-xs font-bold">{toast}</span>
                </div>
            )}

            {/* HERO TITLE HEADER */}
            <div className="bg-[#081126] text-white p-8 rounded-3xl border border-[#DCC8A8]/20 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-[#DCC8A8] tracking-[0.25em]">
                        ✦ LUMIÈRE GOURMET MENU ✦
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F2EA] mt-1">
                        Restaurant Menu & Inventory
                    </h1>
                    <p className="text-xs text-[#8995AD] mt-1.5 max-w-xl">
                        Explore our luxury dining offerings, view ingredient details, and manage daily kitchen portion availability in real time.
                    </p>
                </div>

                {/* MANAGER / KITCHEN CONTROLS */}
                <div className="relative z-10 flex flex-wrap gap-2.5">
                    {isManager && (
                        <>
                            <button
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-[#DCC8A8] border border-[#DCC8A8]/30 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                            >
                                📁 Categories
                            </button>
                            <button
                                onClick={() => {
                                    setFoodForm({
                                        name: '',
                                        category: categories[1]?.name || 'Galaxy Hotpot',
                                        price: 350000,
                                        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
                                        badge: 'NEW DISH',
                                        description: '',
                                        dailyMax: 30,
                                        dailyLeft: 30,
                                        prepTime: '15 mins',
                                        calories: '500 kcal',
                                        active: true,
                                    });
                                    setIsCreateFoodModalOpen(true);
                                }}
                                className="px-5 py-2.5 bg-gradient-to-r from-[#DCC8A8] via-[#ebd9bd] to-[#DCC8A8] text-[#081126] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 transition cursor-pointer"
                            >
                                + Add New Dish
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* SEARCH & FILTER TOOLBAR */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-md flex flex-col lg:flex-row gap-4 items-center justify-between">

                {/* Search Bar */}
                <div className="w-full lg:w-96 relative flex items-center">
                    <span className="absolute left-4 text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search gourmet dishes, ingredients, hotpot, BBQ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#DCC8A8]"
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    <span className="text-xs font-bold text-slate-500 uppercase">Filter Status:</span>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active Dishes Only</option>
                        <option value="Inactive">Inactive / Hidden Dishes</option>
                        <option value="LowStock">Low Stock (≤ 5 left)</option>
                    </select>
                </div>
            </div>

            {/* FOOD CATEGORIES TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                            selectedCategory === cat.name
                                ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]/40 shadow-lg scale-105'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        <span>{cat.icon}</span>
                        <span>{cat.name}</span>
                    </button>
                ))}

                {isManager && (
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs"
                    >
                        <span>➕</span>
                        <span>Manage Categories</span>
                    </button>
                )}
            </div>

            {/* FOOD LIST GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredFoods.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                        <span className="text-4xl block mb-2">🍽️</span>
                        <p className="font-serif font-bold text-slate-700 text-lg">No dishes found matching your criteria</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting search keywords or category filters.</p>
                    </div>
                ) : (
                    filteredFoods.map((food) => (
                        <div
                            key={food.id}
                            className={`bg-white rounded-3xl border transition-all duration-300 shadow-md hover:shadow-2xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between group ${
                                !food.active ? 'opacity-60 bg-slate-50 border-slate-300' : 'border-stone-200/80 hover:border-[#DCC8A8]'
                            }`}
                        >
                            <div>
                                {/* Food Image & Badges */}
                                <div
                                    onClick={() => setViewingFood(food)}
                                    className="relative h-48 bg-slate-900 overflow-hidden cursor-pointer"
                                >
                                    <img
                                        src={food.image}
                                        alt={food.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-90 group-hover:brightness-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                                    {/* Top Left Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-[#081126]/90 text-[#DCC8A8] border border-[#DCC8A8]/40 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-lg backdrop-blur-md shadow-md">
                                            {food.badge}
                                        </span>
                                    </div>

                                    {/* Top Right Active Status Badge */}
                                    <div className="absolute top-3 right-3">
                                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border backdrop-blur-md shadow-sm ${
                                            food.active
                                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                                                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                                        }`}>
                                            {food.active ? '● Active' : '✕ Inactive'}
                                        </span>
                                    </div>

                                    {/* Category pill at bottom image */}
                                    <div className="absolute bottom-3 left-3 text-[11px] text-slate-200 font-mono">
                                        {food.category}
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="p-4">
                                    <div className="flex justify-between items-start">
                                        <h3
                                            onClick={() => setViewingFood(food)}
                                            className="font-serif font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-800 transition-colors cursor-pointer"
                                        >
                                            {food.name}
                                        </h3>
                                    </div>

                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-normal leading-relaxed">
                                        {food.description}
                                    </p>

                                    <div className="mt-3 flex justify-between items-baseline">
                                        <span className="text-lg font-black text-[#081126]">
                                            {food.price.toLocaleString('vi-VN')} đ
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            ⏱ {food.prepTime}
                                        </span>
                                    </div>

                                    {/* DAILY PORTION TRACKER */}
                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <div className="text-xs">
                                            <span className="text-slate-400 font-medium block text-[10px] uppercase">Daily Portion Left:</span>
                                            <span className={`font-bold ${
                                                food.dailyLeft === 0 ? 'text-rose-600 font-black' :
                                                food.dailyLeft <= 5 ? 'text-amber-600 font-bold' : 'text-emerald-700 font-bold'
                                            }`}>
                                                {food.dailyLeft} / {food.dailyMax} portions
                                            </span>
                                        </div>

                                        {/* Kitchen / Manager Quick Counter */}
                                        {(isManager || isKitchen) && (
                                            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 border border-slate-200">
                                                <button
                                                    onClick={() => handleUpdateQuantity(food.id, -1)}
                                                    title="Decrease portion"
                                                    className="w-6 h-6 rounded-lg bg-white text-slate-700 font-bold hover:bg-rose-100 hover:text-rose-700 transition flex items-center justify-center cursor-pointer shadow-xs"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateQuantity(food.id, 1)}
                                                    title="Increase portion"
                                                    className="w-6 h-6 rounded-lg bg-white text-slate-700 font-bold hover:bg-emerald-100 hover:text-emerald-700 transition flex items-center justify-center cursor-pointer shadow-xs"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* CARD ACTION FOOTER */}
                            <div className="p-4 pt-0 space-y-2">
                                {/* Manager Action Toolbar */}
                                {isManager && (
                                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                        <button
                                            onClick={() => handleToggleActive(food.id)}
                                            className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold uppercase transition cursor-pointer border ${
                                                food.active
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                            }`}
                                        >
                                            {food.active ? 'Hide' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => setEditingFood({ ...food })}
                                            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-[11px] font-bold uppercase rounded-xl transition cursor-pointer"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteFood(food.id, food.name)}
                                            className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer font-bold text-xs"
                                            title="Delete dish"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={() => setViewingFood(food)}
                                    className="w-full py-2.5 bg-[#081126] text-[#DCC8A8] font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 transition cursor-pointer shadow-sm"
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* VIEW FOOD DETAIL MODAL */}
            {viewingFood && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-fadeIn">
                        <div className="relative h-64 bg-slate-900">
                            <img
                                src={viewingFood.image}
                                alt={viewingFood.name}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => setViewingFood(null)}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white font-bold flex items-center justify-center hover:bg-black cursor-pointer"
                            >
                                ✕
                            </button>
                            <div className="absolute bottom-4 left-4">
                                <span className="bg-[#081126] text-[#DCC8A8] border border-[#DCC8A8]/40 font-extrabold text-xs uppercase px-3 py-1 rounded-xl">
                                    {viewingFood.badge}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-xs font-mono text-amber-800 font-bold uppercase block">{viewingFood.category}</span>
                                    <h2 className="font-serif text-2xl font-bold text-slate-900">{viewingFood.name}</h2>
                                </div>
                                <span className="text-2xl font-black text-[#081126]">
                                    {viewingFood.price.toLocaleString('vi-VN')} đ
                                </span>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                {viewingFood.description}
                            </p>

                            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Prep Time</span>
                                    <span className="font-bold text-slate-800">{viewingFood.prepTime}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Energy</span>
                                    <span className="font-bold text-slate-800">{viewingFood.calories}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Daily Stock</span>
                                    <span className="font-bold text-emerald-700">{viewingFood.dailyLeft} remaining</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3">
                                <button
                                    onClick={() => setViewingFood(null)}
                                    className="px-6 py-2.5 bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded-xl hover:bg-slate-300 cursor-pointer"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        showToast(`Added "${viewingFood.name}" to reservation menu!`);
                                        setViewingFood(null);
                                    }}
                                    className="px-6 py-2.5 bg-[#081126] text-[#DCC8A8] text-xs font-extrabold uppercase rounded-xl hover:bg-slate-800 cursor-pointer shadow-md"
                                >
                                    Book Dish Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE FOOD MODAL */}
            {isCreateFoodModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">
                                Create New Dish
                            </h3>
                            <button
                                onClick={() => setIsCreateFoodModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateFoodSubmit} className="space-y-4 mt-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Dish Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Lobster Bisque Flambé"
                                    value={foodForm.name}
                                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                                    <select
                                        value={foodForm.category}
                                        onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                                    >
                                        {categories.filter(c => c.name !== 'All Dishes').map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Price (VND)</label>
                                    <input
                                        type="number"
                                        required
                                        value={foodForm.price}
                                        onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Image Unsplash URL</label>
                                <input
                                    type="text"
                                    value={foodForm.image}
                                    onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Badge Tag</label>
                                    <input
                                        type="text"
                                        value={foodForm.badge}
                                        onChange={(e) => setFoodForm({ ...foodForm, badge: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Daily Max Portion</label>
                                    <input
                                        type="number"
                                        value={foodForm.dailyMax}
                                        onChange={(e) => setFoodForm({
                                            ...foodForm,
                                            dailyMax: e.target.value,
                                            dailyLeft: e.target.value,
                                        })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={foodForm.description}
                                    onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateFoodModalOpen(false)}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold uppercase rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800"
                                >
                                    Create Dish
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT FOOD MODAL */}
            {editingFood && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">
                                Update Dish Details
                            </h3>
                            <button
                                onClick={() => setEditingFood(null)}
                                className="text-slate-400 hover:text-slate-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEditFoodSubmit} className="space-y-4 mt-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Dish Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editingFood.name}
                                    onChange={(e) => setEditingFood({ ...editingFood, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                                    <select
                                        value={editingFood.category}
                                        onChange={(e) => setEditingFood({ ...editingFood, category: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                                    >
                                        {categories.filter(c => c.name !== 'All Dishes').map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-700 uppercase mb-1">Price (VND)</label>
                                    <input
                                        type="number"
                                        required
                                        value={editingFood.price}
                                        onChange={(e) => setEditingFood({ ...editingFood, price: Number(e.target.value) })}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                                <textarea
                                    rows="2"
                                    value={editingFood.description}
                                    onChange={(e) => setEditingFood({ ...editingFood, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                                ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setEditingFood(null)}
                                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold uppercase rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 bg-[#081126] text-[#DCC8A8] font-bold uppercase rounded-xl hover:bg-slate-800"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CATEGORY MANAGEMENT MODAL */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
                        <div className="flex justify-between items-center pb-3 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-lg text-[#081126]">
                                Food Categories
                            </h3>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Add Category Form */}
                        <form onSubmit={handleAddCategory} className="mt-4 flex gap-2">
                            <input
                                type="text"
                                placeholder="New category name..."
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#DCC8A8]"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-[#081126] text-[#DCC8A8] font-bold text-xs uppercase rounded-xl hover:bg-slate-800 cursor-pointer"
                            >
                                + Add
                            </button>
                        </form>

                        {/* Category List */}
                        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                            {categories.map((c) => (
                                <div key={c.id} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span>{c.icon}</span>
                                        <span className="font-bold text-slate-800">{c.name}</span>
                                    </div>
                                    {c.name !== 'All Dishes' && (
                                        <button
                                            onClick={() => handleDeleteCategory(c.id, c.name)}
                                            className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg cursor-pointer"
                                            title="Delete Category"
                                        >
                                            🗑 Delete
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-4 border-t border-slate-200 mt-4">
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="px-5 py-2 bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION DIALOG MODAL */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 font-sans">
                        <h3 className="font-serif font-bold text-lg text-slate-900 mb-2">
                            {confirmModal.title}
                        </h3>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed mb-6">
                            {confirmModal.message}
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmModal.onConfirm}
                                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase rounded-xl shadow-md transition cursor-pointer"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
