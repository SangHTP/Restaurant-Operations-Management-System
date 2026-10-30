import { API_BASE_URL } from './authApi';

async function request(path, options = {}) {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            credentials: 'include',
            headers: {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...options.headers,
            },
        });
    } catch {
        throw new Error('Unable to connect to the employee service. Check that the API is running.');
    }

    if (!response.ok) {
        let message = `Kitchen request failed (${response.status}).`;
        try {
            const body = await response.json();
            const validationMessages = Object.values(body.errors ?? {}).flat().filter(Boolean).join(' ');
            message = body.message || validationMessages || body.title || message;
        } catch {
            // Keep the HTTP status message when the response is not JSON.
        }
        throw new Error(message);
    }

    if (response.status === 204) return null;
    return response.json();
}

export const kitchenApi = {
    getTickets: () => request('/kitchen/tickets'),
    updateItemStatus: (id, status) => request(`/kitchen/items/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    }),
};
