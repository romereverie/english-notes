"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ApiError,
  createNote,
  deleteNote,
  getAccessToken,
  getNotes,
  login,
  register,
  removeAccessToken,
  saveAccessToken,
  updateNote,
  type Note,
} from "../lib/api";

const input = "w-full rounded-lg border border-slate-600 bg-slate-900 p-3";
const button =
  "rounded-lg bg-blue-600 px-4 py-2 disabled:opacity-50 hover:bg-blue-500";
export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [session, setSession] = useState<"loading" | "guest" | "signedIn">(
    "loading",
  );
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function restore() {
      if (!getAccessToken()) {
        setSession("guest");
        return;
      }
      try {
        const data = await getNotes(controller.signal);
        setNotes(data);
        setSession("signedIn");
      } catch (e) {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          removeAccessToken();
          setSession("guest");
          setError("Your session expired. Please log in again.");
        } else {
          setSession("signedIn");
          setError("Could not load notes. Please retry.");
        }
      }
    }
    void restore();
    return () => controller.abort();
  }, []);

  function resetEditor() {
    setTitle("");
    setContent("");
    setEditing(null);
  }
  function logout() {
    removeAccessToken();
    setSession("guest");
    setNotes([]);
    setPassword("");
    setError("");
    resetEditor();
  }
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401 && getAccessToken()) {
        logout();
        setError("Your session expired. Please log in again.");
      } else
        setError(
          e instanceof ApiError
            ? e.message
            : "Cannot reach the server. Please try again.",
        );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function authenticate(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      if (registering) {
        await register(nickname.trim(), password);
        setRegistering(false);
      }
      const data = await login(nickname.trim(), password);
      saveAccessToken(data.accessToken);
      setSession("signedIn");
      setPassword("");
      setNotes(await getNotes());
    });
  }
  function save(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const note =
        editing === null
          ? await createNote(title.trim(), content)
          : await updateNote(editing, title.trim(), content);
      setNotes((current) => [
        note,
        ...current.filter((item) => item.id !== note.id),
      ]);
      resetEditor();
    });
  }
  if (session === "loading")
    return (
      <main className="p-8" role="status">
        Loading...
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">English Notes</h1>
          {session === "signedIn" && (
            <button className={button} disabled={busy} onClick={logout}>
              Log out
            </button>
          )}
        </header>
        {error && (
          <p
            role="alert"
            className="rounded border border-red-400 p-3 text-red-200"
          >
            {error}
          </p>
        )}
        {session === "guest" ? (
          <form onSubmit={authenticate} className="space-y-4">
            <h2 className="text-xl">
              {registering ? "Create an account" : "Log in"}
            </h2>
            <label className="block">
              Nickname
              <input
                className={input}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoComplete="username"
                pattern="[a-zA-Z0-9_-]{3,40}"
                minLength={3}
                maxLength={40}
                required
                disabled={busy}
              />
            </label>
            <p className="text-sm text-slate-400">
              3–40 letters, numbers, underscores or hyphens.
            </p>
            <label className="block">
              Password
              <input
                className={input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={registering ? "new-password" : "current-password"}
                minLength={6}
                maxLength={72}
                required
                disabled={busy}
              />
            </label>
            <button className={button} disabled={busy}>
              {busy
                ? "Please wait…"
                : registering
                  ? "Register and log in"
                  : "Log in"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="ml-4 underline"
              onClick={() => {
                setRegistering(!registering);
                setError("");
              }}
            >
              {registering ? "Already have an account?" : "Create an account"}
            </button>
          </form>
        ) : (
          <>
            <form
              onSubmit={save}
              className="space-y-3 rounded-xl border border-slate-700 p-4"
            >
              <h2 className="text-xl">
                {editing === null ? "New note" : "Edit note"}
              </h2>
              <label className="block">
                Title
                <input
                  className={input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                  disabled={busy}
                />
              </label>
              <label className="block">
                Content
                <textarea
                  className={input}
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={20000}
                  disabled={busy}
                />
              </label>
              <button className={button} disabled={busy || !title.trim()}>
                {busy
                  ? "Please wait…"
                  : editing === null
                    ? "Create note"
                    : "Save changes"}
              </button>
              {editing !== null && (
                <button
                  className="ml-4 underline"
                  type="button"
                  disabled={busy}
                  onClick={resetEditor}
                >
                  Cancel
                </button>
              )}
            </form>
            <div className="flex justify-between">
              <h2 className="text-xl">Your notes</h2>
              <button
                className="underline"
                disabled={busy}
                onClick={() => void run(async () => setNotes(await getNotes()))}
              >
                Refresh
              </button>
            </div>
            {notes.length === 0 && (
              <p>No notes to display. Create a note or refresh the list.</p>
            )}
            <ul className="space-y-4">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-slate-700 p-4"
                >
                  <h3 className="break-words text-xl font-semibold">
                    {note.title}
                  </h3>
                  <p className="my-3 whitespace-pre-wrap break-words">
                    {note.content}
                  </p>
                  <div className="flex gap-3">
                    <button
                      className={button}
                      disabled={busy}
                      onClick={() => {
                        setEditing(note.id);
                        setTitle(note.title);
                        setContent(note.content);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="rounded bg-red-700 px-4 py-2 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("Delete this note?"))
                          void run(async () => {
                            await deleteNote(note.id);
                            setNotes((current) =>
                              current.filter((item) => item.id !== note.id),
                            );
                            if (editing === note.id) resetEditor();
                          });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
