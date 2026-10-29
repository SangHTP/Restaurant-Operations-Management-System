const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5249/api';

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        let message = `Lỗi API: ${response.status}`;

        try {
            const body = await response.json();
            message = body.message || body.title || message;

            if (body.detail) {
                message += ` - ${body.detail}`;
            }
        } catch {
            // Response không có JSON.
        }

        throw new Error(message);
    }

    if (response.status === 204) return null;
    return response.json();
}

export function getOrders({ status, date } = {}) {
    const params = new URLSearchParams();

    if (status) params.set('status', status);
    if (date) params.set('date', date);

    const query = params.toString();
    return request(`/orders${query ? `?${query}` : ''}`);
}

export function getOrder(id) {
    return request(`/orders/${id}`);
}

export function createOrder(payload) {
    return request('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
}

export function updateOrderStatus(id, status) {
    return request(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
}