
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMenuItems } from '../../api/menuApi';
import {
    createDailyInventory,
    getDailyInventories,
    updateDailyInventory
} from '../../api/dailyInventoryApi';

function getToday() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export default function DailyInventoryManagement() {
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [inventories, setInventories] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [form, setForm] = useState({
        menuItemID: '',
        initialQuantity: '0',
        remainingQuantity: '0'
    });

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({
        initialQuantity: '0',
        remainingQuantity: '0'
    });

    const availableMenuItems = useMemo(() => {
        const existingIds = new Set(
            inventories.map(item => Number(item.menuItemID ?? item.MenuItemID))
        );

        return menuItems.filter(item => {
            const id = Number(item.menuItemID ?? item.MenuItemID);
            return id > 0 && !existingIds.has(id);
        });
    }, [menuItems, inventories]);

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
            const data = await getDailyInventories(selectedDate);
            setInventories(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message || 'Không thể tải dữ liệu tồn kho.');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        loadMenuItems().catch(err => {
            setError(err.message || 'Không thể tải danh sách món ăn.');
        });
    }, [loadMenuItems]);

    useEffect(() => {
        loadInventories();
    }, [loadInventories]);

    const handleCreate = async event => {
        event.preventDefault();
        setError('');
        setMessage('');

        const menuItemID = Number(form.menuItemID);
        const initialQuantity = Number(form.initialQuantity);
        const remainingQuantity = Number(form.remainingQuantity);

        if (!menuItemID) {
            setError('Vui lòng chọn món ăn.');
            return;
        }

        if (
            !Number.isInteger(initialQuantity) ||
            !Number.isInteger(remainingQuantity) ||
            initialQuantity < 0 ||
            remainingQuantity < 0
        ) {
            setError('Số lượng phải là số nguyên không âm.');
            return;
        }

        if (remainingQuantity > initialQuantity) {
            setError('Số lượng còn lại không được lớn hơn số lượng ban đầu.');
            return;
        }

        setSaving(true);

        try {
            await createDailyInventory({
                menuItemID,
                date: selectedDate,
                initialQuantity,
                remainingQuantity
            });

            setMessage('Đã thêm số lượng món ăn thành công.');
            setForm({
                menuItemID: '',
                initialQuantity: '0',
                remainingQuantity: '0'
            });

            await loadInventories();
        } catch (err) {
            setError(err.message || 'Không thể thêm số lượng món ăn.');
        } finally {
            setSaving(false);
        }
    };

    const startEditing = item => {
        setEditingId(item.inventoryID ?? item.InventoryID);
        setEditForm({
            initialQuantity: String(
                item.initialQuantity ?? item.InitialQuantity ?? 0
            ),
            remainingQuantity: String(
                item.remainingQuantity ?? item.RemainingQuantity ?? 0
            )
        });
        setError('');
        setMessage('');
    };

    const handleUpdate = async id => {
        setError('');
        setMessage('');

        const initialQuantity = Number(editForm.initialQuantity);
        const remainingQuantity = Number(editForm.remainingQuantity);

        if (
            !Number.isInteger(initialQuantity) ||
            !Number.isInteger(remainingQuantity) ||
            initialQuantity < 0 ||
            remainingQuantity < 0
        ) {
            setError('Số lượng phải là số nguyên không âm.');
            return;
        }

        if (remainingQuantity > initialQuantity) {
            setError('Số lượng còn lại không được lớn hơn số lượng ban đầu.');
            return;
        }

        setSaving(true);

        try {
            await updateDailyInventory(id, {
                initialQuantity,
                remainingQuantity
            });

            setEditingId(null);
            setMessage('Đã cập nhật số lượng món ăn thành công.');
            await loadInventories();
        } catch (err) {
            setError(err.message || 'Không thể cập nhật số lượng món ăn.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Daily Food Quantity</h1>
            <p>Quản lý số lượng món ăn được chuẩn bị trong ngày.</p>

            <div style={{ marginBottom: '24px' }}>
                <label htmlFor="inventory-date">
                    <strong>Ngày quản lý: </strong>
                </label>
                <input
                    id="inventory-date"
                    type="date"
                    value={selectedDate}
                    onChange={event => {
                        setSelectedDate(event.target.value);
                        setEditingId(null);
                        setMessage('');
                        setError('');
                    }}
                />
                <button
                    type="button"
                    onClick={loadInventories}
                    disabled={loading}
                    style={{ marginLeft: '8px' }}
                >
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {error && (
                <div
                    role="alert"
                    style={{
                        padding: '12px',
                        marginBottom: '16px',
                        color: '#991b1b',
                        background: '#fee2e2',
                        borderRadius: '6px'
                    }}
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    role="status"
                    style={{
                        padding: '12px',
                        marginBottom: '16px',
                        color: '#166534',
                        background: '#dcfce7',
                        borderRadius: '6px'
                    }}
                >
                    {message}
                </div>
            )}

            <section
                style={{
                    padding: '20px',
                    marginBottom: '24px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                }}
            >
                <h2>Thêm số lượng món ăn</h2>

                <form
                    onSubmit={handleCreate}
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'end'
                    }}
                >
                    <div>
                        <label htmlFor="menu-item">
                            <strong>Món ăn</strong>
                        </label>
                        <br />
                        <select
                            id="menu-item"
                            value={form.menuItemID}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    menuItemID: event.target.value
                                })
                            }
                            required
                        >
                            <option value="">-- Chọn món ăn --</option>
                            {availableMenuItems.map(item => (
                                <option
                                    key={item.menuItemID ?? item.MenuItemID}
                                    value={item.menuItemID ?? item.MenuItemID}
                                >
                                    {item.itemName ?? item.ItemName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="initial-quantity">
                            <strong>Số lượng ban đầu</strong>
                        </label>
                        <br />
                        <input
                            id="initial-quantity"
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={form.initialQuantity}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    initialQuantity: event.target.value
                                })
                            }
                        />
                    </div>

                    <div>
                        <label htmlFor="remaining-quantity">
                            <strong>Số lượng còn lại</strong>
                        </label>
                        <br />
                        <input
                            id="remaining-quantity"
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={form.remainingQuantity}
                            onChange={event =>
                                setForm({
                                    ...form,
                                    remainingQuantity: event.target.value
                                })
                            }
                        />
                    </div>

                    <button type="submit" disabled={saving || !selectedDate}>
                        {saving ? 'Đang lưu...' : 'Thêm món'}
                    </button>
                </form>

                {availableMenuItems.length === 0 && !loading && (
                    <p>
                        Không còn món ăn nào chưa được khai báo số lượng cho
                        ngày này, hoặc danh sách món ăn chưa tải được.
                    </p>
                )}
            </section>

            <section>
                <h2>Danh sách số lượng món ăn</h2>

                {loading ? (
                    <p>Đang tải dữ liệu...</p>
                ) : inventories.length === 0 ? (
                    <p>Chưa có dữ liệu số lượng món ăn cho ngày này.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table
                            style={{
                                width: '100%',
                                borderCollapse: 'collapse'
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={cellStyle}>Mã</th>
                                    <th style={cellStyle}>Tên món ăn</th>
                                    <th style={cellStyle}>Ngày</th>
                                    <th style={cellStyle}>Ban đầu</th>
                                    <th style={cellStyle}>Còn lại</th>
                                    <th style={cellStyle}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventories.map(item => {
                                    const id =
                                        item.inventoryID ?? item.InventoryID;
                                    const isEditing = editingId === id;

                                    return (
                                        <tr key={id}>
                                            <td style={cellStyle}>{id}</td>
                                            <td style={cellStyle}>
                                                {item.itemName ?? item.ItemName}
                                            </td>
                                            <td style={cellStyle}>
                                                {String(
                                                    item.date ?? item.Date ?? ''
                                                ).slice(0, 10)}
                                            </td>
                                            <td style={cellStyle}>
                                                {isEditing ? (
                                                    <input
                                                        aria-label="Số lượng ban đầu"
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={editForm.initialQuantity}
                                                        onChange={event =>
                                                            setEditForm({
                                                                ...editForm,
                                                                initialQuantity:
                                                                    event.target.value
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    item.initialQuantity ??
                                                    item.InitialQuantity
                                                )}
                                            </td>
                                            <td style={cellStyle}>
                                                {isEditing ? (
                                                    <input
                                                        aria-label="Số lượng còn lại"
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={editForm.remainingQuantity}
                                                        onChange={event =>
                                                            setEditForm({
                                                                ...editForm,
                                                                remainingQuantity:
                                                                    event.target.value
                                                            })
                                                        }
                                                    />
                                                ) : (
                                                    item.remainingQuantity ??
                                                    item.RemainingQuantity
                                                )}
                                            </td>
                                            <td style={cellStyle}>
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() =>
                                                                handleUpdate(id)
                                                            }
                                                        >
                                                            Lưu
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() =>
                                                                setEditingId(null)
                                                            }
                                                            style={{
                                                                marginLeft: '6px'
                                                            }}
                                                        >
                                                            Hủy
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            startEditing(item)
                                                        }
                                                    >
                                                        Chỉnh sửa
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

const cellStyle = {
    padding: '10px',
    border: '1px solid #ddd',
    textAlign: 'left'
};
