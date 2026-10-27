
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
