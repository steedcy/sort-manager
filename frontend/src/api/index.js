import api, { rawApi } from './axios'

const unwrapAuthResponse = (response) => response.data?.data ?? response.data

export const authApi = {
  login: (credentials) => rawApi.post('/auth/login', credentials, { skipAuth: true, silent: true })
    .then(unwrapAuthResponse),
  refresh: (refreshToken) => rawApi.post('/auth/refresh', { refreshToken }, { skipAuth: true, silent: true })
    .then(unwrapAuthResponse),
  logout: (refreshToken, accessToken) => rawApi.post('/auth/logout', { refreshToken }, {
    headers: { Authorization: `Bearer ${accessToken}` },
    silent: true,
  }),
  me: () => api.get('/auth/me'),
}

export const memberApi = {
  getAll: () => api.get('/members'),
  create: (data) => api.post('/members', data),
  updateStatus: (id, enabled) => api.patch(`/members/${id}/enabled`, { enabled }),
  revokeSessions: (id) => api.post(`/members/${id}/revoke-sessions`),
}

export const operationsApi = {
  getSummary: () => api.get('/operations/summary', { silent: true }),
  getActivity: (params) => api.get('/operations/activity', { params, silent: true }),
  getRecycleBin: (params) => api.get('/operations/recycle-bin', { params, silent: true }),
  restoreItem: (id) => api.post(`/operations/recycle-bin/${id}/restore`, null, { silent: true }),
  permanentlyDeleteItem: (id) => api.delete(`/operations/recycle-bin/${id}`, { silent: true }),
}

export const categoryApi = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

export const locationApi = {
  getAll: () => api.get('/locations'),
  getTree: () => api.get('/locations/tree'),
  getById: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
}

export const itemApi = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  getByIsbn: (isbn, signal) => api.get(`/books/isbn/${encodeURIComponent(isbn)}`, { signal, silent: true }),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  move: (id, locationId) => api.put(`/items/${id}/move`, { locationId }),
  delete: (id) => api.delete(`/items/${id}`),
  batch: (data) => api.post('/items/batch', data),
}

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
}

export const uploadApi = {
  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

export const fileApi = {
  getBlob: (url) => {
    let path = url
    if (path.startsWith('/api/v1/')) path = path.slice('/api/v1'.length)
    if (path.startsWith('/uploads/')) path = `/files/${path.slice('/uploads/'.length)}`
    return api.get(path, { responseType: 'blob', silent: true })
  },
}
