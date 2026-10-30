import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    Clock3,
    Folder,
    Plus,
    Search,
    Trash2,
    Utensils,
} from 'lucide-react';
import IconGlyph from '../../components/common/IconGlyph';

import {
    getMenuItems,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    createMenuItem,
} from '../../api/menuApi';
import { getDailyInventories } from '../../api/dailyInventoryApi';
// Lấy ngày hiện tại theo múi giờ máy tính, định dạng YYYY-MM-DD
function getTodayLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

// Ghép thông tin Daily Inventory vào danh sách Menu Items
function mapMenuItemsWithInventory(menuItems, inventories) {
    return menuItems.map((item) => {
        const menuItemId = Number(
            item.menuItemID ?? item.MenuItemID
        );

        const inventory = inventories.find(
            (stock) =>
                Number(stock.menuItemID ?? stock.MenuItemID) === menuItemId
        );

        const isActive = Boolean(item.isActive ?? item.IsActive);

        return {
            id: menuItemId,
            categoryId: item.categoryID ?? item.CategoryID,
            name: item.itemName ?? item.ItemName ?? '',
            category: item.categoryName ?? item.CategoryName ?? '',
            price: Number(item.price ?? item.Price ?? 0),
            image: item.imageUrl ?? item.ImageUrl ?? '',
            badge: isActive ? 'MENU ITEM' : 'INACTIVE',
            description: item.description ?? item.Description ?? '',

            // Daily Inventory
            dailyMax: inventory
                ? Number(inventory.initialQuantity ?? inventory.InitialQuantity)
                : null,

            dailyLeft: inventory
                ? Number(inventory.remainingQuantity ?? inventory.RemainingQuantity)
                : null,

            prepTime: '—',
            calories: '—',
            active: isActive,
        };
    });
}
export default function Menu() {
    const { currentUser } = useAuth();
    const isManager = currentUser?.role === 'Manager' || currentUser?.role === 'Owner';
    const isKitchen = currentUser?.role === 'Kitchen';

    // State lists
    const [foods, setFoods] = useState([]);
    const [foodsLoading, setFoodsLoading] = useState(true);
    const [foodsError, setFoodsError] = useState('');
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const [categoryError, setCategoryError] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCatName, setEditCatName] = useState('');
    const [categorySubmitting, setCategorySubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All Dishes');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [quantityDrafts, setQuantityDrafts] = useState({});

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
            prev.map((food) => {
                if (food.id !== id) return food;

                const nextActive = !food.active;

                showToast(
                    `Dish "${food.name}" is now ${nextActive ? 'ACTIVE' : 'INACTIVE'
                    }`
                );

                return { ...food, active: nextActive };
            })
        );
    };

    // Update daily quantity
    const handleSetDailyQuantity = (id, value) => {
        const quantity = Number(value);

        if (value === '' || !Number.isInteger(quantity) || quantity < 0) {
            return;
        }

        setFoods((prev) =>
            prev.map((food) => {
                if (food.id !== id) return food;

                const dailyLeft =
                    food.dailyMax == null
                        ? quantity
                        : Math.min(food.dailyMax, quantity);

                showToast(
                    `Updated stock for "${food.name}": ${dailyLeft} portions left`
                );

                return { ...food, dailyLeft };
            })
        );

        setQuantityDrafts((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleCreateFoodSubmit = async (e) => {
        e.preventDefault();

        try {
            const selectedCategory = categories.find(
                (category) =>
                    category.name === foodForm.category ||
                    category.categoryName === foodForm.category
            );

            const categoryID = Number(
                selectedCategory?.categoryID ??
                selectedCategory?.CategoryID ??
                selectedCategory?.id
            );

            if (!Number.isInteger(categoryID) || categoryID <= 0) {
                showToast('Please select a valid category.');
                return;
            }

            if (!foodForm.name.trim()) {
                showToast('Food name is required.');
                return;
            }

            if (Number(foodForm.price) < 0) {
                showToast('Price cannot be negative.');
                return;
            }

            await createMenuItem({
                categoryID: categoryID,
                name: foodForm.name,
                price: foodForm.price,
                description: foodForm.description,
                image: foodForm.image,
                active: foodForm.active,
            });

            const today = getTodayLocalDate();

            const [menuData, inventoryData] = await Promise.all([
                getMenuItems(),
                getDailyInventories(today),
            ]);

            const updatedFoods = mapMenuItemsWithInventory(
                menuData,
                inventoryData
            );

            setFoods(updatedFoods);

            setIsCreateFoodModalOpen(false);
            showToast('Menu item created successfully.');
        } catch (error) {
            showToast(error.message || 'Failed to create menu item.');
        }
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
    const handleAddCategory = async (e) => {
        e.preventDefault();

        const trimmed = newCatName.trim();

        if (!trimmed) {
            showToast('Please enter a category name.');
            return;
        }

        if (categories.some(
            (category) =>
                String(category.name ?? '').toLowerCase() === trimmed.toLowerCase()
        )) {
            showToast(`Category "${trimmed}" already exists.`);
            return;
        }

        setCategorySubmitting(true);
        setCategoryError('');

        try {
            await createCategory(trimmed);

            const data = await getCategories();

            setCategories([
                { id: 'all-dishes', name: 'All Dishes', icon: '✨', count: 0 },
                ...data.map((category) => ({
                    id: category.categoryID ?? category.CategoryID,
                    name: category.categoryName ?? category.CategoryName,
                    icon: '🍽️',
                    count: 0,
                })),
            ]);

            setNewCatName('');
            showToast(`Category "${trimmed}" created successfully.`);
        } catch (error) {
            setCategoryError(error.message || 'Failed to create category.');
        } finally {
            setCategorySubmitting(false);
        }
    };


    const handleUpdateCategory = async (e) => {
        e.preventDefault();

        if (!editingCategory) return;

        const trimmed = editCatName.trim();

        if (!trimmed) {
            setCategoryError('Please enter a category name.');
            return;
        }

        const duplicate = categories.some(
            (category) =>
                category.id !== editingCategory.id &&
                String(category.name ?? '').toLowerCase() === trimmed.toLowerCase() &&
                category.name !== 'All Dishes'
        );

        if (duplicate) {
            setCategoryError(`Category "${trimmed}" already exists.`);
            return;
        }

        setCategorySubmitting(true);
        setCategoryError('');

        try {
            await updateCategory(editingCategory.id, trimmed);

            const data = await getCategories();

            setCategories([
                {
                    id: 'all-dishes',
                    name: 'All Dishes',
                    icon: '✨',
                    count: 0,
                },
                ...data.map((category) => ({
                    id: category.categoryID ?? category.CategoryID,
                    name: category.categoryName ?? category.CategoryName,
                    icon: '🍽️',
                    count: 0,
                })),
            ]);

            if (selectedCategory === editingCategory.name) {
                setSelectedCategory(trimmed);
            }

            setEditingCategory(null);
            setEditCatName('');
            showToast(`Category "${trimmed}" updated successfully.`);
        } catch (error) {
            setCategoryError(
                error.message || 'Failed to update category.'
            );
        } finally {
            setCategorySubmitting(false);
        }
    };


    // Delete Food Category
    const handleDeleteCategory = (id, name) => {
        setConfirmModal({
            title: 'Delete Category',
            message: `Are you sure you want to delete "${name}"?`,
            onConfirm: async () => {
                setCategorySubmitting(true);
                setCategoryError('');

                try {
                    await deleteCategory(id);

                    setCategories((prev) =>
                        prev.filter((category) => category.id !== id)
                    );

                    if (selectedCategory === name) {
                        setSelectedCategory('All Dishes');
                    }

                    showToast(`Category "${name}" deleted successfully.`);
                    setConfirmModal(null);
                } catch (error) {
                    setCategoryError(
                        error.message || 'Failed to delete category.'
                    );
                    setConfirmModal(null);
                } finally {
                    setCategorySubmitting(false);
                }
            },
        });
    };

    // Load menu items and today's daily inventory
    useEffect(() => {
        let cancelled = false;

        async function loadFoods() {
            setFoodsLoading(true);
            setFoodsError('');

            try {
                const today = getTodayLocalDate();

                // Load menu items and inventory in parallel
                const [menuData, inventoryData] = await Promise.all([
                    getMenuItems(),
                    getDailyInventories(today),
                ]);

                if (cancelled) return;

                const mappedFoods = mapMenuItemsWithInventory(
                    menuData,
                    inventoryData
                );

                setFoods(mappedFoods);
            } catch (error) {
                if (!cancelled) {
                    setFoodsError(
                        error.message || 'Unable to load menu items and daily inventory.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setFoodsLoading(false);
                }
            }
        }

        loadFoods();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadCategories() {
            setCategoriesLoading(true);
            setCategoryError('');

            try {
                const data = await getCategories();

                if (cancelled) return;

                const mapped = data.map((category) => ({
                    id: category.categoryID ?? category.CategoryID,
                    name: category.categoryName ?? category.CategoryName,
                    icon: '🍽️',
                    count: 0,
                }));

                setCategories([
                    { id: 'all-dishes', name: 'All Dishes', icon: '✨', count: 0 },
                    ...mapped,
                ]);
            } catch (error) {
                if (!cancelled) {
                    setCategoryError(error.message || 'Unable to load categories.');
                }
            } finally {
                if (!cancelled) {
                    setCategoriesLoading(false);
                }
            }
        }

        loadCategories();

        return () => {
            cancelled = true;
        };
    }, []);

    // Filtered Food List
    const filteredFoods = foods.filter((food) => {
        const matchesSearch =
            String(food.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(food.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory =
            selectedCategory === 'All Dishes' || food.category === selectedCategory;
        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Active' && food.active) ||
            (statusFilter === 'Inactive' && !food.active) ||
            (statusFilter === 'LowStock' &&
                food.dailyLeft != null &&
                food.dailyLeft <= 5);

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
                                <Folder size={16} aria-hidden="true" /> Categories
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
                    <Search size={18} className="absolute left-4 text-slate-400" aria-hidden="true" />
                    <span className="absolute left-4 text-slate-400"></span>
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
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${selectedCategory === cat.name
                            ? 'bg-[#081126] text-[#DCC8A8] border-[#DCC8A8]/40 shadow-lg scale-105'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                    >
                        <IconGlyph glyph={cat.icon} size={16} />
                        <span>{cat.name}</span>
                    </button>
                ))}

                {isManager && (
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-xs"
                    >
                        <Plus size={16} aria-hidden="true" />
                        <span></span>
                        <span>Manage Categories</span>
                    </button>
                )}
            </div>


            {/* FOOD LIST TABLE */}
            {foodsLoading && (
                <div className="py-12 text-center bg-white rounded-2xl border border-stone-200">
                    <p className="font-bold text-slate-700">
                        Loading menu items...
                    </p>
                </div>
            )}

            {foodsError && (
                <div className="py-4 px-5 text-sm text-rose-700 bg-rose-50 rounded-2xl border border-rose-200">
                    <p className="font-bold">
                        Unable to load menu items from the backend.
                    </p>
                    <p className="mt-1">{foodsError}</p>
                </div>
            )}

            {!foodsLoading && !foodsError && (
                <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-200">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Menu Items
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                Total: {filteredFoods.length} dishes
                            </p>
                        </div>

                        {isManager && (
                            <button
                                type="button"
                                onClick={() => {
                                    setFoodForm({
                                        name: '',
                                        category: categories.find(
                                            (c) => c.name !== 'All Dishes'
                                        )?.name || '',
                                        price: 350000,
                                        image: '',
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
                                className="px-4 py-2.5 rounded-xl bg-[#081126] text-[#DCC8A8] text-sm font-bold hover:bg-slate-800"
                            >
                                <Plus size={16} className="inline mr-2" />
                                Add New Dish
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-5 py-4">Dish Name</th>
                                    <th className="px-5 py-4">Category</th>
                                    <th className="px-5 py-4 text-right">Price</th>
                                    <th className="px-5 py-4 text-center">Status</th>
                                    <th className="px-5 py-4 text-center">Daily Stock</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredFoods.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-slate-500"
                                        >
                                            <Utensils
                                                size={30}
                                                className="mx-auto mb-2 text-slate-400"
                                            />
                                            No dishes found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFoods.map((food) => (
                                        <tr
                                            key={food.id}
                                            className={`hover:bg-amber-50/40 transition ${!food.active ? 'bg-slate-50 opacity-70' : ''
                                                }`}
                                        >
                                            <td className="px-5 py-4 min-w-[220px]">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingFood(food)}
                                                    className="font-bold text-slate-900 hover:text-amber-800 text-left"
                                                >
                                                    {food.name}
                                                </button>
                                                <p className="text-xs text-slate-500 mt-1 max-w-xs truncate">
                                                    {food.description || 'No description provided.'}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                                                {food.category || 'Uncategorized'}
                                            </td>

                                            <td className="px-5 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                                                {Number(food.price || 0).toLocaleString('vi-VN')} ₫
                                            </td>

                                            <td className="px-5 py-4 text-center">
                                                <span
                                                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${food.active
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-rose-100 text-rose-700'
                                                        }`}
                                                >
                                                    {food.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-center whitespace-nowrap">
                                                {food.dailyLeft != null &&
                                                    food.dailyMax != null ? (
                                                    <span
                                                        className={`font-semibold ${food.dailyLeft === 0
                                                                ? 'text-rose-600'
                                                                : food.dailyLeft <= 5
                                                                    ? 'text-amber-600'
                                                                    : 'text-emerald-700'
                                                            }`}
                                                    >
                                                        {food.dailyLeft} / {food.dailyMax}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        Not available
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end items-center gap-2 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingFood(food)}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                                                    >
                                                        View
                                                    </button>

                                                    {isManager && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleActive(food.id)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${food.active
                                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    }`}
                                                            >
                                                                {food.active ? 'Hide' : 'Activate'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingFood({ ...food })}
                                                                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold"
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteFood(food.id, food.name)}
                                                                title="Delete dish"
                                                                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}


            {/* VIEW FOOD DETAIL MODAL */}
            {viewingFood && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-stone-200 animate-fadeIn">
                        <div className="relative h-64 bg-slate-900">
                            <img
                                src={viewingFood.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                                alt={viewingFood.name}
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => setViewingFood(null)}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white font-bold flex items-center justify-center hover:bg-black cursor-pointer"
                            >
                                ×
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
                                    {Number(viewingFood.price || 0).toLocaleString('vi-VN')} ₫
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
                                ×
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

                            <label className={`flex items-center justify-between gap-4 rounded-xl border p-3.5 cursor-pointer transition ${foodForm.active
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-slate-50 border-slate-200'
                                }`}>
                                <span>
                                    <span className="block text-xs font-bold text-slate-800">Dish availability</span>
                                    <span className="block text-[11px] text-slate-500 mt-0.5">
                                        {foodForm.active ? 'Visible and available to order' : 'Hidden from the customer menu'}
                                    </span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={Boolean(foodForm.active)}
                                    onChange={(e) => setFoodForm({ ...foodForm, active: e.target.checked })}
                                    className="h-5 w-5 shrink-0 accent-emerald-700"
                                />
                            </label>

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
                                ×
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

                            {/* Active / Hide Toggle */}
                            <label className={`flex items-center justify-between gap-4 rounded-xl border p-3.5 cursor-pointer transition ${editingFood.active
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-rose-50 border-rose-200'
                                }`}>
                                <span>
                                    <span className={`block text-[11px] mt-0.5 ${editingFood.active
                                        ? 'text-green-600'
                                        : 'text-slate-500'
                                        }`}>
                                        {editingFood.active ? 'Active' : 'Hidden'}
                                    </span>
                                </span>
                                <input
                                    type="checkbox"
                                    checked={Boolean(editingFood.active)}
                                    onChange={(e) => setEditingFood({ ...editingFood, active: e.target.checked })}
                                    className="h-5 w-5 shrink-0 accent-emerald-700"
                                />
                            </label>

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
                    <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[calc(100vh-2rem)] p-6 sm:p-8 shadow-2xl border border-stone-200 flex flex-col">
                        <div className="flex justify-between items-center pb-4 border-b border-stone-200">
                            <h3 className="font-serif font-bold text-xl text-[#081126]">
                                Food Categories
                            </h3>
                            <button
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="text-slate-400 hover:text-slate-700 font-bold"
                            >
                                ×
                            </button>
                        </div>

                        {/* Add Category Form */}
                        <form onSubmit={handleAddCategory} className="mt-5 flex gap-3">
                            <input
                                type="text"
                                placeholder="New category name..."
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#DCC8A8]"
                            />
                            <button
                                type="submit"
                                className="px-5 py-3 bg-[#081126] text-[#DCC8A8] font-bold text-xs uppercase rounded-xl hover:bg-slate-800 cursor-pointer"
                            >
                                + Add
                            </button>
                        </form>


                        {/* Category List */}
                        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                            {categoriesLoading && (
                                <p className="text-xs text-slate-500 py-2">
                                    Loading categories...
                                </p>
                            )}

                            {categoryError && (
                                <p className="text-xs text-rose-600 py-2">
                                    {categoryError}
                                </p>
                            )}

                            {categories.map((c) => (
                                <div
                                    key={c.id}
                                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                                >
                                    {editingCategory?.id === c.id ? (
                                        <form
                                            onSubmit={handleUpdateCategory}
                                            className="flex items-center gap-2"
                                        >
                                            <input
                                                autoFocus
                                                value={editCatName}
                                                onChange={(e) => setEditCatName(e.target.value)}
                                                className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-2 focus:ring-2 focus:ring-[#DCC8A8] outline-none"
                                                placeholder="Category name"
                                                disabled={categorySubmitting}
                                            />

                                            <button
                                                type="submit"
                                                disabled={categorySubmitting}
                                                className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 disabled:opacity-50"
                                            >
                                                {categorySubmitting ? 'Saving...' : 'Save'}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={categorySubmitting}
                                                onClick={() => {
                                                    setEditingCategory(null);
                                                    setEditCatName('');
                                                    setCategoryError('');
                                                }}
                                                className="text-slate-500 hover:text-slate-700 font-bold px-1 py-1"
                                            >
                                                Cancel
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span>{c.icon}</span>
                                                <span className="font-bold text-slate-800 break-words">
                                                    {c.name}
                                                </span>
                                            </div>

                                            {c.name !== 'All Dishes' && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={categorySubmitting}
                                                        onClick={() => {
                                                            setEditingCategory(c);
                                                            setEditCatName(c.name);
                                                            setCategoryError('');
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 font-bold px-2 py-1 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                                                        title="Edit Category"
                                                    >
                                                        ✏️ Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={categorySubmitting}
                                                        onClick={() => handleDeleteCategory(c.id, c.name)}
                                                        className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:bg-rose-50 rounded-lg disabled:opacity-50"
                                                        title="Delete Category"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
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
