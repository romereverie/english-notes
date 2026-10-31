import type { Note } from '../lib/api';

type Props = {
  note: Note;
  editingId: number | null;
  editingTitle: string;
  setEditingTitle: (value: string) => void;
  startEdit: (note: Note) => void;
  saveEdit: (id: number) => void;
  cancelEdit: () => void;
  deleteNote: (id: number) => void;
};

export default function NoteItem({
  note,
  editingId,
  editingTitle,
  setEditingTitle,
  startEdit,
  saveEdit,
  cancelEdit,
  deleteNote,
}: Props) {
  return (
    <li className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      {editingId === note.id ? (
        <div className="flex gap-3">
          <input
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-blue-500"
          />

          <button
            onClick={() => saveEdit(note.id)}
            className="rounded-lg bg-green-600 px-3 py-2 hover:bg-green-500"
          >
            Save
          </button>

          <button
            onClick={cancelEdit}
            className="rounded-lg bg-slate-700 px-3 py-2 hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <span>{note.title}</span>

          <div className="flex gap-2">
            <button
              onClick={() => startEdit(note)}
              className="rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
            >
              Edit
            </button>

            <button
              onClick={() => deleteNote(note.id)}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm hover:bg-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
} 