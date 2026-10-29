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
        let message = `Employee request failed (${response.status}).`;
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

export const employeeApi = {
    getEmployees: (filters = {}) => {
        const query = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'All') query.set(key, value);
        });
        const suffix = query.size ? `?${query.toString()}` : '';
        return request(`/employees${suffix}`);
    },
    getEmployee: (id) => request(`/employees/${encodeURIComponent(id)}`),
    createEmployee: (employee) => request('/employees', {
        method: 'POST',
        body: JSON.stringify(employee),
    }),
    updateEmployee: (id, employee) => request(`/employees/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(employee),
    }),
    deleteEmployee: (id) => request(`/employees/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    }),
    assignRole: (id, roleName) => request(`/employees/${encodeURIComponent(id)}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleName }),
    }),
    getRoles: () => request('/employee-roles'),
    getDepartments: () => request('/departments'),
};
