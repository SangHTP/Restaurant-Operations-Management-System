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
            // Keep the response text for plain-text API errors.
        }
        throw new Error(message || `Request failed (${response.status})`);
    }

    if (response.status === 204) return null;
    return response.json();
}

export const bannerApi = {
    list: ({ isActive } = {}) => {
        const params = new URLSearchParams();
        if (isActive !== undefined) params.set('isActive', isActive);
        const query = params.toString();
        return request(`/Banner${query ? `?${query}` : ''}`);
    },
    create: (data) => request('/Banner', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/Banner/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/Banner/${id}`, { method: 'DELETE' }),
};

export const newsApi = {
    list: ({ page = 1, pageSize = 20, search = '', isPublished, isFeatured, category } = {}) => {
        const params = new URLSearchParams({ page, pageSize });
        if (search.trim()) params.set('search', search.trim());
        if (isPublished !== undefined) params.set('isPublished', isPublished);
        if (isFeatured !== undefined) params.set('isFeatured', isFeatured);
        if (category) params.set('category', category);
        return request(`/News?${params.toString()}`);
    },
    categories: () => request('/News/categories'),
    get: (id) => request(`/News/${id}`),
    create: (data) => request('/News', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/News/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/News/${id}`, { method: 'DELETE' }),
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/News/upload-image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const responseText = await response.text();
            let message = responseText;

            try {
                const body = JSON.parse(responseText);
                message = body.message || body.title || JSON.stringify(body);
            } catch {
                // Keep the plain-text API error.
            }

            throw new Error(message || `Image upload failed (${response.status})`);
        }

        return response.json();
    },
};
