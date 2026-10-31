const API_URL = 'http://localhost:3000';

export type Note = {
  id: number;
  title: string;
};

type LoginResponse = {
  accessToken: string;
};

function getAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem('accessToken');
}

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();

  return {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };
}

export async function login(
  nickname: string,
  password: string,
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nickname,
      password,
    }),
  });

  if (!res.ok) {
    throw new Error('Invalid nickname or password');
  }

  return res.json();
}

export function saveAccessToken(token: string) {
  localStorage.setItem('accessToken', token);
}

export function removeAccessToken() {
  localStorage.removeItem('accessToken');
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

export async function getNotes(): Promise<Note[]> {
  const res = await fetch(`${API_URL}/notes`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to load notes');
  }

  return res.json();
}

export async function createNote(title: string): Promise<Note> {
  const res = await fetch(`${API_URL}/notes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error('Failed to create note');
  }

  return res.json();
}

export async function updateNote(
  id: number,
  title: string,
): Promise<Note> {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new Error('Failed to update note');
  }

  return res.json();
}

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/notes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    throw new Error('Failed to delete note');
  }
}