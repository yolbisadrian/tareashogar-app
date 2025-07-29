const API_BASE_URL = 'https://tareashogar-backend-xxxx.up.railway.app/api';
async function fetchAPI(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (response.status === 204) return null;
    let data;
    try { data = await response.json(); } catch (e) { data = { message: 'La respuesta del servidor no es un JSON válido.' }; }
    if (!response.ok) throw new Error(data.message || 'Ocurrió un error en la API');
    return data;
}
export const api = {
    register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    recoverStep1: (data) => fetchAPI('/auth/recover-step1', { method: 'POST', body: JSON.stringify(data) }),
    recoverStep2: (data) => fetchAPI('/auth/recover-step2', { method: 'POST', body: JSON.stringify(data) }),
    getTasks: () => fetchAPI('/tasks'),
    createTask: (data) => fetchAPI('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    createBatchTasks: (tasks) => fetchAPI('/tasks/batch', { method: 'POST', body: JSON.stringify({ tasks }) }),
    updateTask: (id, data) => fetchAPI(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteTask: (id) => fetchAPI(`/tasks/${id}`, { method: 'DELETE' }),
    clearAllTasks: () => fetchAPI('/tasks', { method: 'DELETE' }),
    getUsers: () => fetchAPI('/users'),
    getHistory: () => fetchAPI('/history'),
    logHistory: (logData) => fetchAPI('/history', { method: 'POST', body: JSON.stringify(logData) }),
};