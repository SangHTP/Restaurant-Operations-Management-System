
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5249/api';

async function readResponse(response) {
    const text = await response.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: text };
        }
    }

    if (!response.ok) {
        throw new Error(
            data?.message ||
            data?.title ||
            `Request failed (HTTP ${response.status})`
        );
    }

    return data;
}

// Lấy danh sách số lượng món ăn theo ngày
export async function getDailyInventories(date) {
    const query = date
        ? `?date=${encodeURIComponent(date)}`
        : '';

    const data = await readResponse(
        await fetch(`${API_BASE_URL}/daily-inventories${query}`)
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;

    return [];
}

// Thêm số lượng món ăn trong ngày
export async function createDailyInventory(inventory) {
    return readResponse(
        await fetch(`${API_BASE_URL}/daily-inventories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                menuItemID: Number(inventory.menuItemID),
                date: inventory.date,
                initialQuantity: Number(inventory.initialQuantity),
                remainingQuantity: Number(inventory.remainingQuantity)
            })
        })
    );
}

// Cập nhật số lượng món ăn
export async function updateDailyInventory(id, inventory) {
    return readResponse(
        await fetch(`${API_BASE_URL}/daily-inventories/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                initialQuantity: Number(inventory.initialQuantity),
                remainingQuantity: Number(inventory.remainingQuantity)
            })
        })
    );
}
