'use client';

import { useEffect, useState } from 'react';
import {
  createNote,
  deleteNote,
  getNotes,
  hasAccessToken,
  login,
  removeAccessToken,
  saveAccessToken,
  type Note,
  updateNote,
} from '../lib/api';

import NoteForm from '../components/NoteForm';
import NoteItem from '../components/NoteItem';

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  async function fetchNotes() {
    try {
      setIsLoading(true);
      setError('');

      const data = await getNotes();
      setNotes(data);
    } catch (error) {
      console.error(error);
      setError('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (hasAccessToken()) {
      setIsAuthenticated(true);
      fetchNotes();
    } else {
      setIsLoading(false);
    }
  }, []);

  async function handleLogin() {
    try {
      setAuthError('');

      const data = await login(nickname, password);

      saveAccessToken(data.accessToken);
      setIsAuthenticated(true);
      setPassword('');

      await fetchNotes();
    } catch (error) {
      console.error(error);
      setAuthError('Invalid nickname or password');
    }
  }

  function handleLogout() {
    removeAccessToken();
    setIsAuthenticated(false);
    setNotes([]);
    setTitle('');
    setEditingId(null);
    setEditingTitle('');
    setError('');
  }

  async function handleCreateNote() {
    if (!title.trim()) {
      return;
    }

    try {
      setError('');

      await createNote(title.trim());

      setTitle('');
      await fetchNotes();
    } catch (error) {
      console.error(error);
      setError('Failed to create note');
    }
  }

  async function handleDeleteNote(id: number) {
    try {
      setError('');

      await deleteNote(id);
      await fetchNotes();
    } catch (error) {
      console.error(error);
      setError('Failed to delete note');
    }
  }

  function startEdit(note: Note) {
    setEditingId(note.id);
    setEditingTitle(note.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingTitle('');
  }

  async function saveEdit(id: number) {
    if (!editingTitle.trim()) {
      return;
    }

    try {
      setError('');

      await updateNote(id, editingTitle.trim());

      cancelEdit();
      await fetchNotes();
    } catch (error) {
      console.error(error);
      setError('Failed to update note');
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <h1 className="mb-2 text-center text-2xl font-bold">
            English Notes
          </h1>

          <p className="mb-6 text-center text-sm text-slate-400">
            Log in to access your notes
          </p>

          <div className="space-y-4">
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Nickname"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleLogin();
                }
              }}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />

            {authError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {authError}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium hover:bg-blue-500"
            >
              Log in
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">English Notes</h1>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Log out
          </button>
        </div>

        <NoteForm
          title={title}
          setTitle={setTitle}
          createNote={handleCreateNote}
        />

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-slate-400">Loading notes...</p>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-6 text-center text-slate-400">
            No notes yet. Create your first note.
          </div>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                editingId={editingId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                startEdit={startEdit}
                saveEdit={saveEdit}
                cancelEdit={cancelEdit}
                deleteNote={handleDeleteNote}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}