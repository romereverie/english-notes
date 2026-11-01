const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
export type Note = {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function getAccessToken() {
  return typeof window === "undefined"
    ? null
    : localStorage.getItem("accessToken");
}
export function saveAccessToken(token: string) {
  localStorage.setItem("accessToken", token);
}
export function removeAccessToken() {
  localStorage.removeItem("accessToken");
}
async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
  authenticated = true,
  signal?: AbortSignal,
): Promise<T> {
  const token = authenticated ? getAccessToken() : null;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const message = data?.message;
    throw new ApiError(
      Array.isArray(message)
        ? message.join("; ")
        : typeof message === "string"
          ? message
          : "Request failed. Please try again.",
      res.status,
    );
  }
  return res.json();
}
export const login = (nickname: string, password: string) =>
  request<{ accessToken: string }>(
    "/auth/login",
    "POST",
    { nickname, password },
    false,
  );
export const register = (nickname: string, password: string) =>
  request("/auth/register", "POST", { nickname, password }, false);
export const getNotes = (signal?: AbortSignal) =>
  request<Note[]>("/notes", "GET", undefined, true, signal);
export const createNote = (title: string, content: string) =>
  request<Note>("/notes", "POST", { title, content });
export const updateNote = (id: number, title: string, content: string) =>
  request<Note>(`/notes/${id}`, "PUT", { title, content });
export const deleteNote = (id: number) => request(`/notes/${id}`, "DELETE");
