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
        throw new Error('Cannot connect to the API. Make sure the backend is running at http://localhost:5000.');
    }

    if (!response.ok) {
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

export const accountApi = {
    getAccounts: () => request('/accounts'),
    createAccount: (account) => request('/accounts', {
        method: 'POST',
        body: JSON.stringify(account),
    }),
    updateAccount: (accountType, accountId, account) => request(
        `/accounts/${encodeURIComponent(accountType)}/${encodeURIComponent(accountId)}`,
        { method: 'PUT', body: JSON.stringify(account) }
    ),
    setAccountStatus: (accountType, accountId, isActive) => request(
        `/accounts/${encodeURIComponent(accountType)}/${encodeURIComponent(accountId)}/status`,
        { method: 'PATCH', body: JSON.stringify({ isActive }) }
    ),
};
