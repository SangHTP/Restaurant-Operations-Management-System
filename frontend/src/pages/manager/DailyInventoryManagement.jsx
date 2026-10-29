
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMenuItems } from '../../api/menuApi';
import {
    createDailyInventory,
    getDailyInventories,
    updateDailyInventory,
} from '../../api/dailyInventoryApi';

function getToday() {
    const now = new Date();
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('-');
}

function getInventoryId(item) {
    return item.inventoryID ?? item.InventoryID;
}

function getMenuItemId(item) {
    return item.menuItemID ?? item.MenuItemID;
}

function getItemName(item) {
    return item.itemName ?? item.ItemName ?? 'Items';
}

function getInitialQuantity(item) {
    return Number(item.initialQuantity ?? item.InitialQuantity ?? 0);
}

function getRemainingQuantity(item) {
    return Number(item.remainingQuantity ?? item.RemainingQuantity ?? 0);
}

function formatDate(value) {
    if (!value) return '—';
    const [year, month, day] = String(value).slice(0, 10).split('-');
    return `${day}/${month}/${year}`;
}

export default function DailyInventoryManagement() {
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [inventories, setInventories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const [form, setForm] = useState({
        menuItemID: '',
        initialQuantity: '50',
        remainingQuantity: '50',
    });

    const [editForm, setEditForm] = useState({
        initialQuantity: '0',
        remainingQuantity: '0',
    });

    const availableMenuItems = useMemo(() => {
        const existingIds = new Set(
            inventories.map(item => Number(getMenuItemId(item)))
        );

        return menuItems.filter(item => {
            const id = Number(getMenuItemId(item));
            const isActive = item.isActive ?? item.IsActive ?? true;

            return id > 0 && !existingIds.has(id) && isActive;
        });
    }, [inventories, menuItems]);

    const filteredInventories = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return inventories.filter(item => {
            const name = getItemName(item).toLowerCase();
            const id = String(getInventoryId(item));

            return name.includes(keyword) || id.includes(keyword);
        });
    }, [inventories, search]);

    const stats = useMemo(() => {
        const initial = inventories.reduce(
            (sum, item) => sum + getInitialQuantity(item), 0
        );

        const remaining = inventories.reduce(
            (sum, item) => sum + getRemainingQuantity(item), 0
        );

        const lowStock = inventories.filter(item => {
            const total = getInitialQuantity(item);
            return total > 0 && getRemainingQuantity(item) / total <= 0.2;
        }).length;

        return {
            count: inventories.length,
            initial,
            remaining,
            used: initial - remaining,
            lowStock,
        };
    }, [inventories]);

    const loadMenuItems = useCallback(async () => {
        const result = await getMenuItems();

        const items = Array.isArray(result)
            ? result
            : Array.isArray(result?.data)
                ? result.data
                : Array.isArray(result?.value)
                    ? result.value
                    : [];

        setMenuItems(items);
    }, []);

    const loadInventories = useCallback(async () => {
        if (!selectedDate) return;

        setLoading(true);
        setError('');

        try {
            const result = await getDailyInventories(selectedDate);
            setInventories(Array.isArray(result) ? result : []);
        } catch (err) {
            setError(err.message || 'Failed to load inventory data.');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadMenuItems().catch(err => {
            setError(err.message || 'Failed to load menu items.');
        });
    }, [loadMenuItems]);

    useEffect(() => {
        loadInventories();
    }, [loadInventories]);

    function resetMessages() {
        setError('');
        setNotice('');
    }

    function resetForm() {
        setForm({
            menuItemID: '',
            initialQuantity: '50',
            remainingQuantity: '50',
        });
        setEditingId(null);
    }

    async function handleCreate(event) {
        event.preventDefault();
        resetMessages();

        const menuItemID = Number(form.menuItemID);
        const initialQuantity = Number(form.initialQuantity);
        const remainingQuantity = Number(form.remainingQuantity);

        if (!menuItemID) {
            setError('Please select a menu item.');
            return;
        }

        if (
            !Number.isInteger(initialQuantity) ||
            !Number.isInteger(remainingQuantity) ||
            initialQuantity < 0 ||
            remainingQuantity < 0
        ) {
            setError('Quantity must be a non-negative integer.');
            return;
        }

        if (remainingQuantity > initialQuantity) {
            setError('Remaining quantity cannot exceed initial quantity.');
            return;
        }

        setSaving(true);

        try {
            await createDailyInventory({
                menuItemID,
                date: selectedDate,
                initialQuantity,
                remainingQuantity,
            });

            setNotice('Food quantity added successfully.');
            resetForm();
            await loadInventories();
        } catch (err) {
            setError(err.message || 'Failed to add food quantity.');
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(item) {
        setEditingId(getInventoryId(item));
        setEditForm({
            initialQuantity: String(getInitialQuantity(item)),
            remainingQuantity: String(getRemainingQuantity(item)),
        });
        resetMessages();

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }

    async function handleUpdate(id) {
        resetMessages();

        const initialQuantity = Number(editForm.initialQuantity);
        const remainingQuantity = Number(editForm.remainingQuantity);

        if (
            !Number.isInteger(initialQuantity) ||
            !Number.isInteger(remainingQuantity) ||
            initialQuantity < 0 ||
            remainingQuantity < 0
        ) {
            setError('	Quantity must be a non-negative integer.');
            return;
        }

        if (remainingQuantity > initialQuantity) {
            setError('Remaining quantity cannot exceed initial quantity.');
            return;
        }

        setSaving(true);

        try {
            await updateDailyInventory(id, {
                initialQuantity,
                remainingQuantity,
            });

            setEditingId(null);
            setNotice('Food quantity updated successfully.');
            await loadInventories();
        } catch (err) {
            setError(err.message || 'Failed to update food quantity.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-2 py-4 sm:px-4">
            {/* Header theo phong cách Manage Food Categories */}
            <section className="rounded-3xl border border-[#DCC8A8]/30 bg-[#081126] p-6 text-white shadow-xl sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#DCC8A8]">
                    Menu & Inventory
                </p>

                <div className="mt-3 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <h1 className="text-3xl font-bold sm:text-4xl">
                            Daily Food Quantity
                        </h1>
                        <p className="mt-2 text-sm text-slate-300">
                            Manage daily food preparation quantities.
                        </p>
                    </div>

                    <div className="w-full sm:w-56">
                        <label
                            htmlFor="inventory-date"
                            className="mb-2 block text-xs font-bold text-[#DCC8A8]"
                        >
                            Management Date
                        </label>
                        <input
                            id="inventory-date"
                            type="date"
                            value={selectedDate}
                            onChange={event => {
                                setSelectedDate(event.target.value);
                                setEditingId(null);
                                resetMessages();
                            }}
                            className="w-full rounded-xl border border-white/15 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-[#DCC8A8]"
                        />
                    </div>
                </div>
            </section>

            {error && (
                <div
                    role="alert"
                    className="flex items-start justify-between gap-3 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError('')}
                        className="font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {notice && (
                <div
                    role="status"
                    className="flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                    <span>{notice}</span>
                    <button
                        type="button"
                        onClick={() => setNotice('')}
                        className="font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Thống kê */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                    {
                        label: 'Registered Items',
                        value: stats.count,
                        detail: 'Daily Menu Items',
                    },
                    {
                        label: 'Initial Quantity',
                        value: stats.initial,
                        detail: 'Total Prepared Quantity',
                    },
                    {
                        label: 'Remaining Quantity',
                        value: stats.remaining,
                        detail: 'Current Inventory',
                    },
                    {
                        label: 'Used Quantity',
                        value: stats.used,
                        detail: 'Quantity Used',
                    },
                    {
                        label: 'Low Stock Items',
                        value: stats.lowStock,
                        detail: '20% or less remaining',
                    },
                ].map((stat, index) => (
                    <article
                        key={stat.label}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-500">
                                {stat.label}
                            </span>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#081126] text-sm font-black text-[#DCC8A8]">
                                {['▦', '＋', '✓', '↘', '!'][index]}
                            </span>
                        </div>
                        <div className="text-2xl font-black text-[#081126]">
                            {stat.value}
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                            {stat.detail}
                        </p>
                    </article>
                ))}
            </section>

            {/* Form thêm món */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Add Food Quantity
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Set inventory for {formatDate(selectedDate)}.
                        </p>
                    </div>

                    <span className="rounded-xl bg-[#081126] px-3 py-2 text-xs font-black text-[#DCC8A8]">
                        INVENTORY
                    </span>
                </div>

                <form
                    onSubmit={handleCreate}
                    className="mt-5 grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    <div>
                        <label
                            htmlFor="menu-item"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Menu Item
                        </label>
                        <select
                            id="menu-item"
                            value={form.menuItemID}
                            onChange={event => setForm({
                                ...form,
                                menuItemID: event.target.value,
                            })}
                            required
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                        >
                            <option value="">-- Select a menu item --</option>
                            {availableMenuItems.map(item => (
                                <option
                                    key={getMenuItemId(item)}
                                    value={getMenuItemId(item)}
                                >
                                    {getItemName(item)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="initial-quantity"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Initial Quantity
                        </label>
                        <input
                            id="initial-quantity"
                            type="number"
                            min="0"
                            step="1"
                            value={form.initialQuantity}
                            onChange={event => setForm({
                                ...form,
                                initialQuantity: event.target.value,
                            })}
                            required
                            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="remaining-quantity"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                        >
                            Remaining Quantity
                        </label>
                        <input
                            id="remaining-quantity"
                            type="number"
                            min="0"
                            step="1"
                            value={form.remainingQuantity}
                            onChange={event => setForm({
                                ...form,
                                remainingQuantity: event.target.value,
                            })}
                            required
                            className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving || !selectedDate}
                        className="rounded-xl bg-[#081126] px-5 py-3 text-sm font-bold text-[#DCC8A8] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : '+ Add Item'}
                    </button>
                </form>

                {availableMenuItems.length === 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                        No active menu items are available to register for this date, or the menu items have not loaded.
                    </p>
                )}
            </section>

            {/* Bảng danh sách */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="font-bold text-slate-900">
                            Food Inventory List
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                            Total: {inventories.length} · Date{' '}
                            {formatDate(selectedDate)}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadInventories}
                        disabled={loading}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : '↻ Refresh'}
                    </button>
                </div>

                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
                    <input
                        type="search"
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        placeholder="Search by item name or inventory ID..."
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100 sm:max-w-sm"
                    />

                    <span className="text-xs text-slate-500">
                        Showing {filteredInventories.length} / {inventories.length} items
                    </span>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                        Loading data from API...
                    </div>
                ) : filteredInventories.length === 0 ? (
                    <div className="p-10 text-center">
                        <div className="text-3xl text-slate-300">▤</div>
                        <p className="mt-3 text-sm font-bold text-slate-700">
                            {inventories.length === 0
                                    ? 'No inventory data available'
                                    : 'No items found'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            {inventories.length === 0
                                    ? 'Add a menu item using the form above.'
                                    : 'Try a different search keyword.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                            <th className="px-5 py-3">ID</th>
                                            <th className="px-5 py-3">Item Name</th>
                                            <th className="px-5 py-3">Date</th>
                                            <th className="px-5 py-3">Initial</th>
                                            <th className="px-5 py-3">Remaining</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredInventories.map(item => {
                                    const id = getInventoryId(item);
                                    const initial = getInitialQuantity(item);
                                    const remaining = getRemainingQuantity(item);
                                    const isEditing = editingId === id;
                                    const lowStock =
                                        initial > 0 && remaining / initial <= 0.2;

                                    return (
                                        <tr
                                            key={id}
                                            className="transition hover:bg-slate-50/70"
                                        >
                                            <td className="px-5 py-4 font-mono text-slate-500">
                                                #{id}
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-slate-900">
                                                {getItemName(item)}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                                {formatDate(item.date ?? item.Date)}
                                            </td>

                                            <td className="px-5 py-4">
                                                {isEditing ? (
                                                    <input
                                                        aria-label="Initial Quantity"
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={editForm.initialQuantity}
                                                        onChange={event => setEditForm({
                                                            ...editForm,
                                                            initialQuantity: event.target.value,
                                                        })}
                                                        className="w-20 rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-amber-600"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-slate-800">
                                                        {initial}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                {isEditing ? (
                                                    <input
                                                        aria-label="Remaining Quantity"
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={editForm.remainingQuantity}
                                                        onChange={event => setEditForm({
                                                            ...editForm,
                                                            remainingQuantity: event.target.value,
                                                        })}
                                                        className="w-20 rounded-lg border border-slate-300 px-2 py-2 outline-none focus:border-amber-600"
                                                    />
                                                ) : (
                                                    <span className={
                                                        `font-bold ${lowStock
                                                            ? 'text-rose-600'
                                                            : 'text-emerald-700'
                                                        }`
                                                    }>
                                                        {remaining}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                {isEditing ? (
                                                    <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                                                        Editing
                                                    </span>
                                                ) : initial === 0 ? (
                                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                                                        Not Set
                                                    </span>
                                                ) : remaining === 0 ? (
                                                    <span className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700">
                                                        Out of Stock
                                                    </span>
                                                ) : lowStock ? (
                                                    <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-800">
                                                        Low Stock
                                                    </span>
                                                ) : (
                                                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                                                        In Stock
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => handleUpdate(id)}
                                                                className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                                            >
                                                                {saving ? 'Saving...' : 'Save'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() => setEditingId(null)}
                                                                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() => handleEdit(item)}
                                                            className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                                                        >
                                                               Edit
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-wrap justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-xs text-slate-500">
                    <span>
                        Total Items: <strong className="text-slate-800">{stats.count}</strong>
                    </span>
                    <span>
                        Remaining: <strong className="text-slate-800">{stats.remaining}</strong>
                        {' / '}
                        <strong className="text-slate-800">{stats.initial}</strong>
                    </span>
                </div>
            </section>
        </div>
    );
}
