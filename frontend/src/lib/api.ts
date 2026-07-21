// ─── API Client ───────────────────────────────────────────────────
// Centralized fetch wrapper for all backend API calls.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  token?: string;
}

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, token } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  } else if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('accessToken');
    if (stored) finalHeaders['Authorization'] = `Bearer ${stored}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, data.message || 'Request failed');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ─── Auth ───
export const api = {
  auth: {
    register: (data: { email: string; password: string; name?: string }) =>
      request('/api/v1/auth/register', { method: 'POST', body: data }),
    login: (data: { email: string; password: string }) =>
      request('/api/v1/auth/login', { method: 'POST', body: data }),
    refresh: (refreshToken: string) =>
      request('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken } }),
    me: () => request('/api/v1/auth/me'),
  },

  // ─── Workspaces ───
  workspaces: {
    list: () => request('/api/v1/workspaces'),
    get: (id: string) => request(`/api/v1/workspaces/${id}`),
    create: (data: any) => request('/api/v1/workspaces', { method: 'POST', body: data }),
    members: (id: string) => request(`/api/v1/workspaces/${id}/members`),
    invite: (id: string, data: any) =>
      request(`/api/v1/workspaces/${id}/invites`, { method: 'POST', body: data }),
  },

  // ─── Links ───
  links: {
    list: (wsId: string, params?: { page?: number; limit?: number; search?: string }) => {
      const qs = new URLSearchParams();
      if (params?.page) qs.set('page', String(params.page));
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.search) qs.set('search', params.search);
      return request(`/api/v1/workspaces/${wsId}/links?${qs}`);
    },
    get: (wsId: string, linkId: string) =>
      request(`/api/v1/workspaces/${wsId}/links/${linkId}`),
    create: (wsId: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/links`, { method: 'POST', body: data }),
    update: (wsId: string, linkId: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/links/${linkId}`, { method: 'PATCH', body: data }),
    delete: (wsId: string, linkId: string) =>
      request(`/api/v1/workspaces/${wsId}/links/${linkId}`, { method: 'DELETE' }),
    duplicate: (wsId: string, linkId: string) =>
      request(`/api/v1/workspaces/${wsId}/links/${linkId}/duplicate`, { method: 'POST' }),
    addRule: (wsId: string, linkId: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/links/${linkId}/rules`, { method: 'POST', body: data }),
    deleteRule: (wsId: string, linkId: string, ruleId: string) =>
      request(`/api/v1/workspaces/${wsId}/links/${linkId}/rules/${ruleId}`, { method: 'DELETE' }),
  },

  // ─── Analytics ───
  analytics: {
    dashboard: (wsId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/dashboard?days=${days || 30}`),
    timeseries: (wsId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/timeseries?days=${days || 30}`),
    link: (wsId: string, linkId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/links/${linkId}?days=${days || 30}`),
    linkTimeseries: (wsId: string, linkId: string, hours?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/links/${linkId}/timeseries?hours=${hours || 24}`),
    countries: (wsId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/countries?days=${days || 30}`),
    devices: (wsId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/devices?days=${days || 30}`),
    browsers: (wsId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/browsers?days=${days || 30}`),
    os: (wsId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/os?days=${days || 30}`),
    referrers: (wsId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/referrers?days=${days || 30}`),
    utm: (wsId: string, field: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/utm/${field}?days=${days || 30}`),
    trafficQuality: (wsId: string, days?: number) =>
      request(`/api/v1/workspaces/${wsId}/analytics/traffic-quality?days=${days || 30}`),
    live: (wsId: string) =>
      request(`/api/v1/workspaces/${wsId}/analytics/live`),
  },

  // ─── Campaigns ───
  campaigns: {
    list: (wsId: string) => request(`/api/v1/workspaces/${wsId}/campaigns`),
    get: (wsId: string, id: string) => request(`/api/v1/workspaces/${wsId}/campaigns/${id}`),
    create: (wsId: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/campaigns`, { method: 'POST', body: data }),
    update: (wsId: string, id: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/campaigns/${id}`, { method: 'PATCH', body: data }),
    delete: (wsId: string, id: string) =>
      request(`/api/v1/workspaces/${wsId}/campaigns/${id}`, { method: 'DELETE' }),
  },

  // ─── QR Codes ───
  qr: {
    generate: (wsId: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/qr`, { method: 'POST', body: data }),
    byLink: (wsId: string, linkId: string) =>
      request(`/api/v1/workspaces/${wsId}/qr/link/${linkId}`),
  },

  // ─── Domains ───
  domains: {
    list: (wsId: string) => request(`/api/v1/workspaces/${wsId}/domains`),
    create: (wsId: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/domains`, { method: 'POST', body: data }),
    verify: (wsId: string, id: string) =>
      request(`/api/v1/workspaces/${wsId}/domains/${id}/verify`, { method: 'POST' }),
    delete: (wsId: string, id: string) =>
      request(`/api/v1/workspaces/${wsId}/domains/${id}`, { method: 'DELETE' }),
  },

  // ─── Webhooks ───
  webhooks: {
    list: (wsId: string) => request(`/api/v1/workspaces/${wsId}/webhooks`),
    create: (wsId: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/webhooks`, { method: 'POST', body: data }),
    update: (wsId: string, id: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/webhooks/${id}`, { method: 'PATCH', body: data }),
    delete: (wsId: string, id: string) =>
      request(`/api/v1/workspaces/${wsId}/webhooks/${id}`, { method: 'DELETE' }),
    logs: (wsId: string, id: string) =>
      request(`/api/v1/workspaces/${wsId}/webhooks/${id}/logs`),
  },

  // ─── API Keys ───
  apiKeys: {
    list: (wsId: string) => request(`/api/v1/workspaces/${wsId}/api-keys`),
    create: (wsId: string, data: any) =>
      request(`/api/v1/workspaces/${wsId}/api-keys`, { method: 'POST', body: data }),
    delete: (wsId: string, id: string) =>
      request(`/api/v1/workspaces/${wsId}/api-keys/${id}`, { method: 'DELETE' }),
    rotate: (wsId: string, id: string) =>
      request(`/api/v1/workspaces/${wsId}/api-keys/${id}/rotate`, { method: 'POST' }),
  },
};
