import toast from 'react-hot-toast';

interface Config {
  params?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
  data?: unknown;
  token?: string;
}

function buildHeaders(config?: Config): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (config?.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }
  return headers;
}

function withParams(url: string, config?: Config): string {
  if (config?.params) {
    url = `${url}?` + new URLSearchParams(config.params as Record<string, string>);
  }
  return url;
}

export const _get = (url: string, config?: Config) => {
  url = withParams(url, config);
  const opts: RequestInit = {
    method: 'GET',
    headers: buildHeaders(config), // FIX: previously used a separate literal that dropped Authorization
    credentials: 'include',
  };
  if (config?.signal) opts.signal = config.signal;
  return fetch(url, opts).then(handleResponse);
};

export const _post = (url: string, body: unknown, config?: Config) => {
  url = withParams(url, config);
  const opts: RequestInit = {
    method: 'POST',
    headers: buildHeaders(config),
    body: JSON.stringify(body),
    credentials: 'include',
  };
  if (config?.signal) opts.signal = config.signal;
  return fetch(url, opts).then(handleResponse);
};

export const _put = (url: string, body: unknown, config?: Config) => {
  url = withParams(url, config);
  return fetch(url, {
    method: 'PUT',
    headers: buildHeaders(config),
    body: JSON.stringify(body),
    credentials: 'include',
  }).then(handleResponse);
};

export const _delete = (url: string, config?: Config) => {
  url = withParams(url, config);
  const opts: RequestInit = {
    method: 'DELETE',
    headers: buildHeaders(config),
    credentials: 'include',
  };
  if (config?.data) opts.body = JSON.stringify(config.data);
  return fetch(url, opts).then(handleResponse);
};

export const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      // Do NOT navigate or signOut here. Several contexts (cart, wishlist) fetch
      // protected endpoints on mount; if the user is logged out those 401 legitimately.
      // Navigating from here caused an infinite /login ⇄ signout loop. Callers that
      // care about auth (or the middleware on the next protected navigation) handle it.
      return Promise.reject(Object.assign(new Error('Unauthorized'), { status: 401 }));
    }
    if (response.status === 403) {
      toast.error('Permission denied');
      return Promise.reject(Object.assign(new Error('Forbidden'), { status: 403 }));
    }
    const data = await response.json().catch(() => ({}));
    return Promise.reject(data?.detail || data?.message || response.statusText || 'Request failed');
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