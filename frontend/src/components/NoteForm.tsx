type Props = {
  title: string;
  setTitle: (value: string) => void;
  createNote: () => void;
};

export default function NoteForm({ title, setTitle, createNote }: Props) {
  return (
    <div className="mb-8 flex gap-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Enter note title"
        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-slate-100 outline-none focus:border-blue-500"
      />

      <button
        onClick={createNote}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
      >
        Create
      </button>
    </div>
  );
}