
import { useCallback, useEffect, useState } from 'react';
import {
    getOrders,
    createOrder,
    updateOrderStatus,
} from '../../api/orderApi';
import { getMenuItems } from '../../api/menuApi';

const STATUSES = [
    'In Progress',
    'Pending Payment',
    'Completed',
    'Cancelled',
];

const EMPTY_ITEM = {
    menuItemID: '',
    quantity: '1',
    note: '',
};

const EMPTY_FORM = {
    employeeID: '',
    tableIDs: '',
    items: [{ ...EMPTY_ITEM }],
};

function formatMoney(value) {
    return Number(value || 0).toLocaleString('vi-VN') + ' đ';
}

function getOrderId(order) {
    return order.orderID ?? order.OrderID;
}

function getOrderStatus(order) {
    return order.status ?? order.Status ?? '';
}

function getOrderItems(order) {
    return order.items ?? order.Items ?? order.orderDetails ?? order.OrderDetails ?? [];
}

function getOrderTables(order) {
    return order.tableIDs ?? order.TableIDs ?? [];
}

function getMenuId(item) {
    return item.menuItemID ?? item.MenuItemID ?? item.id ?? item.ID;
}

function getMenuName(item) {
    return item.itemName ?? item.ItemName ?? item.name ?? item.Name ?? '';
}

function getMenuPrice(item) {
    return Number(item.price ?? item.Price ?? 0);
}

function isMenuActive(item) {
    const value = item.isActive ?? item.IsActive ?? item.active ?? item.Active;
    return value === undefined || value === true || value === 1;
}

export default function OrderManagement() {
    const [orders, setOrders] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('All');
    const [form, setForm] = useState(EMPTY_FORM);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [menuLoading, setMenuLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await getOrders();
            const list = Array.isArray(data) ? data : [];

            setOrders(list);
            setSelectedId((currentId) => {
                if (list.some((order) => getOrderId(order) === currentId)) {
                    return currentId;
                }

                return list.length ? getOrderId(list[0]) : null;
            });
        } catch (err) {
            setError(err.message || 'Failed to load orders.');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadMenuItems = useCallback(async () => {
        setMenuLoading(true);

        try {
            const data = await getMenuItems();
            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.value)
                    ? data.value
                    : Array.isArray(data?.data)
                        ? data.data
                        : [];

            setMenuItems(list.filter(isMenuActive));
        } catch (err) {
            setError(
                `Failed to load menu items: ${err.message || 'API error'}`
            );
        } finally {
            setMenuLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
        loadMenuItems();
    }, [loadOrders, loadMenuItems]);

    const selectedOrder =
        orders.find((order) => getOrderId(order) === selectedId) ?? null;

    const filteredOrders =
        filterStatus === 'All'
            ? orders
            : orders.filter((order) => getOrderStatus(order) === filterStatus);

    function updateForm(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function updateItem(index, field, value) {
        setForm((current) => ({
            ...current,
            items: current.items.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: value }
                    : item
            ),
        }));
    }

    function addItemRow() {
        setForm((current) => ({
            ...current,
            items: [...current.items, { ...EMPTY_ITEM }],
        }));
    }

    function removeItemRow(index) {
        setForm((current) => ({
            ...current,
            items: current.items.filter((_, itemIndex) => itemIndex !== index),
        }));
    }

    function getSelectedMenuItem(menuItemID) {
        return menuItems.find(
            (item) => Number(getMenuId(item)) === Number(menuItemID)
        );
    }

    const estimatedTotal = form.items.reduce((sum, item) => {
        const menuItem = getSelectedMenuItem(item.menuItemID);
        return sum + getMenuPrice(menuItem || {}) * Number(item.quantity || 0);
    }, 0);

    async function handleCreateOrder(event) {
        event.preventDefault();
        setError('');
        setMessage('');

        const employeeID = Number(form.employeeID);

        if (!Number.isInteger(employeeID) || employeeID < 1) {
            setError('Employee ID must be a positive integer.');
            return;
        }

        if (!form.items.length) {
            setError('	An order must contain at least one item.');
            return;
        }

        const items = [];

        for (let index = 0; index < form.items.length; index += 1) {
            const item = form.items[index];
            const menuItemID = Number(item.menuItemID);
            const quantity = Number(item.quantity);

            if (!Number.isInteger(menuItemID) || menuItemID < 1) {
                setError(`Please select a menu item in row ${index + 1}.`);
                return;
            }

            if (!Number.isInteger(quantity) || quantity < 1) {
                setError(`Quantity in row ${index + 1} must be a positive integer.`);
                return;
            }

            if (item.note.trim().length > 255) {
                setError(`Note in row ${index + 1} must not exceed 255 characters.`);
                return;
            }

            if (!getSelectedMenuItem(menuItemID)) {
                setError(`Menu item with ID ${menuItemID}. Please reload the menu items.`);
                return;
            }

            items.push({
                menuItemID,
                quantity,
                note: item.note.trim() || null,
            });
        }

        // Gộp các dòng trùng món để tránh trigger trừ kho sai
        // khi cùng MenuItemID xuất hiện nhiều lần trong một INSERT.
        const mergedItems = new Map();

        for (const item of items) {
            const current = mergedItems.get(item.menuItemID);

            if (current) {
                current.quantity += item.quantity;

                if (item.note) {
                    current.note = current.note
                        ? `${current.note}; ${item.note}`
                        : item.note;
                }
            } else {
                mergedItems.set(item.menuItemID, { ...item });
            }
        }

        const tableIDs = form.tableIDs.trim()
            ? form.tableIDs.split(',').map((value) => Number(value.trim()))
            : [];

        if (tableIDs.some((id) => !Number.isInteger(id) || id < 1)) {
            setError('Table IDs must be valid IDs separated by commas.');
            return;
        }

        if (new Set(tableIDs).size !== tableIDs.length) {
            setError('Table IDs must not contain duplicates.');
            return;
        }

        setSaving(true);

        try {
            // Một request duy nhất chứa tất cả món.
            const created = await createOrder({
                employeeID,
                tableIDs,
                items: Array.from(mergedItems.values()),
            });

            await loadOrders();

            const newId = created?.orderID ?? created?.OrderID;
            if (newId != null) {
                setSelectedId(newId);
            }

            setForm({
                ...EMPTY_FORM,
                items: [{ ...EMPTY_ITEM }],
            });
            setShowCreateForm(false);
            setMessage('	Order with multiple items created successfully.');
        } catch (err) {
            setError(err.message || 'Failed to create order.');
        } finally {
            setSaving(false);
        }
    }

    async function handleStatusChange(order, newStatus) {
        const id = getOrderId(order);

        if (newStatus === getOrderStatus(order)) return;

        setError('');
        setMessage('');
        setSaving(true);

        try {
            await updateOrderStatus(id, newStatus);

            setOrders((current) =>
                current.map((item) =>
                    getOrderId(item) === id
                        ? { ...item, status: newStatus, Status: newStatus }
                        : item
                )
            );

            setMessage(`Order status updated for order #${id}.`);
        } catch (err) {
            setError(err.message || '	Failed to update order status.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
            <header className="rounded-3xl border border-[#DCC8A8]/20 bg-[#081126] p-7 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#DCC8A8]">
                    Order
                </p>

                <h1 className="mt-2 text-3xl font-bold">Order Management</h1>

                <p className="mt-2 text-sm text-slate-300">
                    Create an order with multiple items in a single submission.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={loadOrders}
                        disabled={loading || saving}
                        className="rounded-xl border border-white/30 px-4 py-2 text-sm font-bold hover:bg-white/10 disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : '↻ Refresh'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setShowCreateForm((value) => !value);
                            setError('');
                            setMessage('');
                        }}
                        className="rounded-xl bg-[#DCC8A8] px-4 py-2 text-sm font-bold text-[#081126] hover:bg-amber-200"
                    >
                        {showCreateForm ? '	Close Form' : '+ Create Order'}
                    </button>
                </div>
            </header>

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    {message}
                </div>
            )}

            {showCreateForm && (
                <form
                    onSubmit={handleCreateOrder}
                    className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Create New Order
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Select multiple items, adjust quantities, and submit once.
                            Prices are retrieved from the database.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Employee ID *
                            <input
                                required
                                min="1"
                                type="number"
                                value={form.employeeID}
                                onChange={(e) => updateForm('employeeID', e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-300 p-3"
                                placeholder="e.g. 1"
                            />
                        </label>

                        <label className="text-sm font-semibold text-slate-700">
                            Table IDs
                            <input
                                value={form.tableIDs}
                                onChange={(e) => updateForm('tableIDs', e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-300 p-3"
                                placeholder="e.g. 1,2"
                            />
                            <span className="mt-1 block text-xs font-normal text-slate-500">
                                Enter table IDs separated by commas.
                            </span>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-bold text-slate-900">
                                Order Items ({form.items.length})
                            </h3>

                            <button
                                type="button"
                                onClick={addItemRow}
                                disabled={menuLoading || menuItems.length === 0}
                                className="rounded-xl border border-[#081126] px-4 py-2 text-sm font-bold text-[#081126] hover:bg-slate-50 disabled:opacity-50"
                            >
                                + Add Item
                            </button>
                        </div>

                        {menuLoading ? (
                            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                Loading menu items...
                            </p>
                        ) : menuItems.length === 0 ? (
                            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                                No active menu items were loaded. Please check the menu API.
                            </p>
                        ) : (
                            form.items.map((item, index) => {
                                const selectedMenu = getSelectedMenuItem(item.menuItemID);

                                return (
                                    <div
                                        key={index}
                                        className="grid grid-cols-1 items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-12"
                                    >
                                        <div className="md:col-span-4">
                                            <label className="text-sm font-semibold text-slate-700">
                                                Item #{index + 1} *
                                                <select
                                                    required
                                                    value={item.menuItemID}
                                                    onChange={(e) =>
                                                        updateItem(index, 'menuItemID', e.target.value)
                                                    }
                                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
                                                >
                                                    <option value="">-- Select an item --</option>
                                                    {menuItems.map((menuItem) => {
                                                        const id = getMenuId(menuItem);
                                                        return (
                                                            <option key={id} value={id}>
                                                                {getMenuName(menuItem)} (ID: {id})
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            </label>
                                            {selectedMenu && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Unit Price: {formatMoney(getMenuPrice(selectedMenu))}
                                                </p>
                                            )}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="text-sm font-semibold text-slate-700">
                                                Quantity *
                                                <input
                                                    required
                                                    min="1"
                                                    max="1000"
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateItem(index, 'quantity', e.target.value)
                                                    }
                                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
                                                />
                                            </label>
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="text-sm font-semibold text-slate-700">
                                                Note
                                                <input
                                                    maxLength="255"
                                                    value={item.note}
                                                    onChange={(e) =>
                                                        updateItem(index, 'note', e.target.value)
                                                    }
                                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3"
                                                    placeholder="e.g. less ice, less spicy"
                                                />
                                            </label>
                                        </div>

                                        <div className="md:col-span-2">
                                            <p className="mb-2 text-xs text-slate-500">Subtotal</p>
                                            <p className="mb-3 font-bold text-slate-900">
                                                {formatMoney(
                                                    getMenuPrice(selectedMenu || {}) *
                                                    Number(item.quantity || 0)
                                                )}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => removeItemRow(index)}
                                                disabled={form.items.length === 1}
                                                className="w-full rounded-lg border border-rose-200 px-3 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                Remove Item
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#081126] p-5 text-white">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#DCC8A8]">
                                Estimated Total
                            </p>
                            <p className="mt-1 text-2xl font-black">
                                {formatMoney(estimatedTotal)}
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                                The backend retrieves prices directly from the database.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={saving || menuLoading || menuItems.length === 0}
                            className="rounded-xl bg-[#DCC8A8] px-6 py-3 text-sm font-bold text-[#081126] hover:bg-amber-200 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Create Order'}
                        </button>
                    </div>
                </form>
            )}

            <section className="flex flex-wrap gap-2">
                {['All', ...STATUSES].map((status) => (
                    <button
                        type="button"
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`rounded-xl border px-4 py-2 text-sm font-bold ${filterStatus === status
                                ? 'border-[#081126] bg-[#081126] text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b bg-slate-50 p-5">
                        <h2 className="font-bold text-slate-900">Order List</h2>
                        <span className="text-sm text-slate-500">
                            {filteredOrders.length} orders
                        </span>
                    </div>

                    {loading ? (
                        <p className="p-8 text-center text-slate-500">
                            Loading data...
                        </p>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-10 text-center">
                            <p className="font-bold text-slate-700">No orders available</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Click "Create Order" to add a new order.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredOrders.map((order) => {
                                const id = getOrderId(order);
                                const items = getOrderItems(order);
                                const tables = getOrderTables(order);
                                const total =
                                    order.total ??
                                    order.Total ??
                                    items.reduce(
                                        (sum, item) =>
                                            sum +
                                            Number(item.unitPrice ?? item.UnitPrice ?? 0) *
                                            Number(item.quantity ?? item.Quantity ?? 0),
                                        0
                                    );

                                return (
                                    <button
                                        type="button"
                                        key={id}
                                        onClick={() => setSelectedId(id)}
                                        className={`flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 ${selectedId === id
                                                ? 'border-l-4 border-[#081126] bg-amber-50/50'
                                                : ''
                                            }`}
                                    >
                                        <div>
                                            <p className="font-mono text-sm font-bold text-slate-900">
                                                Order #{id}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Tables: {tables.length ? tables.join(', ') : 'No tables assigned'}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Employee: {order.employeeID ?? order.EmployeeID}
                                                {' · '}
                                                {items.length} items
                                            </p>
                                            <span className="mt-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                                {getOrderStatus(order)}
                                            </span>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <p className="font-bold text-slate-900">
                                                {formatMoney(total)}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {order.orderTime || order.OrderTime
                                                    ? new Date(
                                                        order.orderTime ?? order.OrderTime
                                                    ).toLocaleString('en-US')
                                                    : ''}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    {!selectedOrder ? (
                        <div className="py-8 text-center">
                            <p className="font-bold text-slate-700">No Order Selected</p>
                            <p className="mt-1 text-sm text-slate-500">
                                Select an order from the list to view its details.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="border-b border-slate-100 pb-4">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Order Details
                                </p>
                                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                                    Order #{getOrderId(selectedOrder)}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Status: {getOrderStatus(selectedOrder)}
                                </p>
                            </div>

                            <div>
                                <h3 className="mb-3 text-sm font-bold text-slate-800">
                                    Order Items
                                </h3>

                                {getOrderItems(selectedOrder).length === 0 ? (
                                    <p className="text-sm text-slate-500">
                                        This order has no item details.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {getOrderItems(selectedOrder).map((item, index) => {
                                            const name =
                                                item.itemName ??
                                                item.ItemName ??
                                                `Item #${item.menuItemID ?? item.MenuItemID}`;

                                            const quantity =
                                                item.quantity ?? item.Quantity ?? 0;

                                            const price =
                                                item.unitPrice ?? item.UnitPrice ?? 0;

                                            return (
                                                <div
                                                    key={item.orderDetailID ?? item.OrderDetailID ?? index}
                                                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                                                >
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {name} × {quantity}
                                                    </p>
                                                    <p className="mt-1 text-sm text-slate-700">
                                                        {formatMoney(Number(price) * Number(quantity))}
                                                    </p>
                                                    {(item.note ?? item.Note) && (
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            Note: {item.note ?? item.Note}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl bg-[#081126] p-4 text-white">
                                <p className="text-xs font-bold uppercase text-[#DCC8A8]">
                                    Total Amount
                                </p>
                                <p className="mt-1 text-2xl font-black">
                                    {formatMoney(
                                        selectedOrder.total ??
                                        selectedOrder.Total ??
                                        getOrderItems(selectedOrder).reduce(
                                            (sum, item) =>
                                                sum +
                                                Number(item.unitPrice ?? item.UnitPrice ?? 0) *
                                                Number(item.quantity ?? item.Quantity ?? 0),
                                            0
                                        )
                                    )}
                                </p>
                            </div>

                            <label className="block text-sm font-bold text-slate-700">
                                Update Status
                                <select
                                    value={getOrderStatus(selectedOrder)}
                                    disabled={saving}
                                    onChange={(event) =>
                                        handleStatusChange(selectedOrder, event.target.value)
                                    }
                                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3"
                                >
                                    {STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
