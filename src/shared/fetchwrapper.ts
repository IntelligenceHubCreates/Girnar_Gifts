import toast from 'react-hot-toast';

interface Config {
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
  data?: unknown;
  token?: string;
}

export const _get = (url: string, config?: Config) => {
  if (config?.params) {
    url = `${url}?` + new URLSearchParams(config.params as Record<string, string>);
  }
  const headers: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
if (config?.token) {
  headers['Authorization'] = `Bearer ${config.token}`;
}
  const opts: RequestInit = {
    method: 'GET',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (config?.signal) opts.signal = config.signal;
  return fetch(url, opts).then(handleResponse);
};

export const _post = (url: string, body: unknown, config?: Config) => {
  if (config?.params) {
    url = `${url}?` + new URLSearchParams(config.params as Record<string, string>);
  }
  const headers: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
if (config?.token) {
  headers['Authorization'] = `Bearer ${config.token}`;
}
  const opts: RequestInit = {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  };
  if (config?.signal) opts.signal = config.signal;
  return fetch(url, opts).then(handleResponse);
};

export const _put = (url: string, body: unknown, config?: Config) => {
  if (config?.params) {
    url = `${url}?` + new URLSearchParams(config.params as Record<string, string>);
  }
  const headers: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
if (config?.token) {
  headers['Authorization'] = `Bearer ${config.token}`;
}
  return fetch(url, {
    method: 'PUT',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  }).then(handleResponse);
};

export const _delete = (url: string, config?: Config) => {
  if (config?.params) {
    url = `${url}?` + new URLSearchParams(config.params as Record<string, string>);
  }
  const headers: Record<string, string> = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};
if (config?.token) {
  headers['Authorization'] = `Bearer ${config.token}`;
}
  const opts: RequestInit = {
    method: 'DELETE',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (config?.data) opts.body = JSON.stringify(config.data);
  return fetch(url, opts).then(handleResponse);
};

export const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject('Unauthorized');
    }
    if (response.status === 403) {
      toast.error('Permission denied');
      return Promise.reject('Forbidden');
    }
    const data = await response.json().catch(() => ({}));
    return Promise.reject(data?.message || response.statusText || 'Request failed');
  }
  if (response.status === 204) return {};
  return response.json().then((json: unknown) => {
    if (json && typeof json === 'object' && 'success' in json) {
      if ((json as { success: boolean }).success) return json;
      const msg = (json as { message?: string }).message || '';
      return Promise.reject(msg);
    }
    return json;
  });
};
