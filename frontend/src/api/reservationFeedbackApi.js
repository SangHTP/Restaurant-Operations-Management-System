const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5249/api').replace(/\/$/, '');

async function request(path, options) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const responseText = await response.text();
        let message = responseText;
        try {
            const body = JSON.parse(responseText);
            message = body.message || body.title || JSON.stringify(body);
        } catch {
            // Keep plain-text API errors readable.
        }
        throw new Error(message || `Request failed (${response.status})`);
    }

    if (response.status === 204) return null;
    return response.json();
}

export const customerReservationsApi = {
    list: (email) => request(`/customer-reservations?${new URLSearchParams({ email })}`),
    cancel: (id, email) => request(`/customer-reservations/${id}/cancel?${new URLSearchParams({ email })}`, {
        method: 'PATCH',
    }),
};

export const reservationFeedbackApi = {
    list: () => request('/reservation-feedback'),
    submit: (data) => request('/reservation-feedback', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    update: (id, data) => request(`/reservation-feedback/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
};
