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

// GET: Lấy danh sách khu vực
export async function getAreas() {
    const data = await readResponse(
        await fetch(`${API_BASE_URL}/areas`)
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;
    if (Array.isArray(data?.data)) return data.data;

    return [];
}

// GET: Lấy chi tiết khu vực theo ID
export async function getAreaById(id) {
    return await readResponse(
        await fetch(`${API_BASE_URL}/areas/${id}`)
    );
}

// POST: Tạo khu vực mới
export async function createArea(areaData) {
    return await readResponse(
        await fetch(`${API_BASE_URL}/areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                areaName: areaData.name || areaData.areaName,
                description: areaData.description || ''
            })
        })
    );
}

// PUT: Cập nhật khu vực
export async function updateArea(id, areaData) {
    return await readResponse(
        await fetch(`${API_BASE_URL}/areas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                areaName: areaData.name || areaData.areaName,
                description: areaData.description || ''
            })
        })
    );
}

// DELETE: Xóa khu vực (Cứng hoặc Mềm tùy thuộc liên kết bàn)
export async function deleteArea(id) {
    return await readResponse(
        await fetch(`${API_BASE_URL}/areas/${id}`, {
            method: 'DELETE'
        })
    );
}
