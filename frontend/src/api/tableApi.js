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

// GET: Lấy danh sách bàn
export async function getTables(areaId = null) {
    let url = `${API_BASE_URL}/tables`;
    if (areaId) {
        url += `?areaId=${areaId}`;
    }
    const data = await readResponse(await fetch(url));

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.value)) return data.value;
    if (Array.isArray(data?.data)) return data.data;

    return [];
}

// POST: Tạo bàn mới
export async function createTable(tableData) {
    return await readResponse(
        await fetch(`${API_BASE_URL}/tables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                areaID: Number(tableData.areaId || tableData.areaID),
                tableName: tableData.name || tableData.tableName,
                capacity: Number(tableData.seats || tableData.capacity || 4),
                status: tableData.status || 'Available'
            })
        })
    );
}

// PUT: Cập nhật bàn
export async function updateTable(id, tableData) {
    return await readResponse(
        await fetch(`${API_BASE_URL}/tables/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                areaID: Number(tableData.areaId || tableData.areaID),
                tableName: tableData.name || tableData.tableName,
                capacity: Number(tableData.seats || tableData.capacity || 4),
                status: tableData.status || 'Available'
            })
        })
    );
}

// DELETE: Xóa bàn (Cứng hoặc Mềm tùy thuộc liên kết)
export async function deleteTable(id) {
    return await readResponse(
        await fetch(`${API_BASE_URL}/tables/${id}`, {
            method: 'DELETE'
        })
    );
}
