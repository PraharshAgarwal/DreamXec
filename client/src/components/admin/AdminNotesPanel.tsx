import React, { useEffect, useState } from 'react';
import { getEntityNotes, createEntityNote } from '../../services/adminService';
import { MessageSquare, Plus } from 'lucide-react';

interface AdminNotesPanelProps {
  entityType: 'user' | 'club' | 'project' | 'donor' | 'donor_project';
  entityId: string;
}

export default function AdminNotesPanel({ entityType, entityId }: AdminNotesPanelProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [entityId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const res = await getEntityNotes(entityType, entityId);
      setNotes(res.data?.notes || []);
    } catch (error) {
      console.error('Failed to load notes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const res = await createEntityNote(entityType, entityId, newNote);
      setNotes([res.data.note, ...notes]);
      setNewNote('');
    } catch (error) {
      alert('Failed to add note');
    }
  };

  return (
    <div className="bg-[#FCFBF7] p-4 border-3 border-[#121316] shadow-[4px_4px_0_#121316] h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-headline font-black text-[#0F534A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4 text-[#FE4E1A]" /> Internal Admin Notes
        </h3>

        {/* List */}
        <div className="overflow-y-auto max-h-52 space-y-2 mb-3 pr-1">
          {loading ? (
            <p className="text-xs text-gray-500 font-bold text-center py-2">Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-3">No internal notes yet.</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white p-3 border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs space-y-1.5"
              >
                <p className="text-[#121316] font-medium whitespace-pre-wrap">{note.content}</p>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono pt-1 border-t border-gray-100">
                  <span className="font-bold text-[#0F534A]">{note.author?.name || 'Admin'}</span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleAddNote} className="mt-2 space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add private governance note..."
          className="w-full p-2.5 text-xs font-medium border-2 border-[#121316] bg-white focus:outline-none resize-none h-16"
        />
        <button
          type="submit"
          disabled={!newNote.trim()}
          className="w-full py-1.5 bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] transition-all disabled:opacity-50 cursor-pointer"
        >
          Add Internal Note
        </button>
      </form>
    </div>
  );
}