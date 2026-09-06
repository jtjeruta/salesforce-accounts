export type AuthStatus = {
  connected: boolean;
  instanceUrl: string | null;
};

export type Account = {
  id: string;
  name: string;
  phone?: string;
  website?: string;
};

export type AccountInput = {
  Name: string;
  Phone?: string;
  Website?: string;
};

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();
      message =
        errorBody[0]?.message ||
        errorBody?.error_description ||
        errorBody?.error ||
        message;
    } catch {
      // Ignore non-JSON error bodies.
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  getStatus: () => request<AuthStatus>('/auth/status'),
  logout: () =>
    request<{ success: boolean }>('/oauth/logout', { method: 'POST' }),
  listAccounts: ({ limit, offset }: { limit: number; offset: number }) =>
    request<Account[]>(`/api/accounts?limit=${limit}&offset=${offset}`),
  createAccount: (account: AccountInput) =>
    request<{ id: string; success: boolean; errors: string[] }>(
      '/api/accounts',
      {
        method: 'POST',
        body: JSON.stringify(account),
      },
    ),
  updateAccount: (id: string, account: AccountInput) =>
    request<{ id: string; updated: boolean }>(`/api/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(account),
    }),
  deleteAccount: (id: string) =>
    request<{ id: string; deleted: boolean }>(`/api/accounts/${id}`, {
      method: 'DELETE',
    }),
};
