
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

// GET: Lấy danh sách danh mục
export async function getCategories() {
    const data = await readResponse(
        await fetch(`${API_BASE_URL}/categories`)
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;
    if (Array.isArray(data?.data)) return data.data;

    return [];
}

// POST: Tạo danh mục
export async function createCategory(categoryName) {
    return readResponse(
        await fetch(`${API_BASE_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                categoryName: categoryName.trim(),
            }),
        })
    );
}

// PUT: Cập nhật danh mục
export async function updateCategory(categoryId, categoryName) {
    return readResponse(
        await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                categoryName: categoryName.trim(),
            }),
        })
    );
}

// DELETE: Xóa danh mục
export async function deleteCategory(categoryId) {
    return readResponse(
        await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
            method: 'DELETE',
        })
    );
}

// GET: Lấy danh sách món ăn từ Backend API
export async function getMenuItems() {
    const data = await readResponse(
        await fetch(`${API_BASE_URL}/menu-items`)
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;
    if (Array.isArray(data?.data)) return data.data;

    return [];
}

/**
 * Các hàm API món ăn.
 * Những route POST/PUT/DELETE bên dưới cần khớp với controller backend.
 */

// GET: Xem chi tiết món ăn
export async function getMenuItemById(menuItemId) {
    return readResponse(
        await fetch(`${API_BASE_URL}/menu-items/${menuItemId}`)
    );
}

// POST: Tạo món ăn
export async function createMenuItem(food) {
    const categoryID = Number(food.categoryID);
    const price = Number(food.price);

    if (!Number.isInteger(categoryID) || categoryID <= 0) {
        throw new Error('Please select a valid food category.');
    }

    if (!Number.isFinite(price) || price < 0) {
        throw new Error('Please enter a valid price.');
    }

    const payload = {
        categoryID,
        itemName: String(food.name ?? '').trim(),
        price,
        description: food.description?.trim() || null,
        imageUrl: food.image?.trim() || null,
        isActive: Boolean(food.active),
    };

    console.log('Create menu item payload:', payload);

    return readResponse(
        await fetch(`${API_BASE_URL}/menu-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        })
    );
}

// PUT: Cập nhật món ăn
export async function updateMenuItem(menuItemId, food) {
    return readResponse(
        await fetch(`${API_BASE_URL}/menu-items/${menuItemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({
                menuItemID: Number(menuItemId),
                categoryID: Number(food.categoryId),
                itemName: food.name.trim(),
                price: Number(food.price),
                description: food.description?.trim() || null,
                imageUrl: food.image?.trim() || null,
                isActive: Boolean(food.active),
            }),
        })
    );
}

// PATCH: Kích hoạt / ngừng kinh doanh món ăn
export async function setMenuItemActive(menuItemId, isActive) {
    return readResponse(
        await fetch(`${API_BASE_URL}/menu-items/${menuItemId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify({ isActive }),
        })
    );
}

// DELETE: Xóa món ăn
export async function deleteMenuItem(menuItemId) {
    return readResponse(
        await fetch(`${API_BASE_URL}/menu-items/${menuItemId}`, {
            method: 'DELETE',
        })
    );
}
