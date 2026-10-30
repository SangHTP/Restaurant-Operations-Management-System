export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5249/api';

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
        throw new Error('Cannot connect to the API. Make sure the backend is running at http://localhost:5249.');
    }

    if (!response.ok) {
        if (response.status === 401 && path === '/auth/me') return null;
        let message = `Request failed (${response.status}).`;
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

export const authApi = {
    login: (username, password) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    }),
    currentUser: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }),
};
