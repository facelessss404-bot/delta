import { useCallback, useContext, useEffect, useState } from 'react';
import { BookOpen, Pencil, Trash2, X } from 'lucide-react';
import { AuthContext } from '../context/authStateContext';
import api from '../services/api';
import { invalidateSubjects } from '../services/subjectService';

const blankSubject = { name: '', code: '', category: 'academic', active: true };

export default function Subjects() {
  const { user } = useContext(AuthContext);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(blankSubject);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get('/subjects'); setSubjects(data); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to load subjects.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm(blankSubject); setEditingId(null); };
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setMessage('');
    try {
      const response = editingId ? await api.patch(`/subjects/${editingId}`, form) : await api.post('/subjects', form);
      invalidateSubjects();
      setSubjects((current) => editingId ? current.map((subject) => subject.id === editingId ? response.data : subject) : [...current, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      setMessage(editingId ? 'Subject updated.' : 'Subject created.');
      reset();
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to save subject.'); }
    finally { setSaving(false); }
  };
  const edit = (subject) => { setForm({ name: subject.name, code: subject.code || '', category: subject.category || 'academic', active: subject.active !== false }); setEditingId(subject.id); setMessage(''); };
  const remove = async (subject) => {
    if (!window.confirm(`Delete ${subject.name}?`)) return;
    try { await api.delete(`/subjects/${subject.id}`); invalidateSubjects(); setSubjects((current) => current.filter((item) => item.id !== subject.id)); setMessage('Subject deleted.'); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to delete subject.'); }
  };

  return <div className="mx-auto max-w-5xl space-y-6 pb-10">
    <section className="glass-panel rounded-3xl p-6"><div className="flex items-center gap-3"><BookOpen className="text-gold" /><div><h1 className="text-2xl font-bold text-white">Subject management</h1><p className="text-sm text-white/50">Create, update, activate, or remove training subjects.</p></div></div>
      <form onSubmit={save} className="mt-6 grid gap-3 md:grid-cols-4">
        <input data-testid="subject-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Subject name" className="field" />
        <input data-testid="subject-code" value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="Subject code" className="field" />
        <input data-testid="subject-category" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" className="field" />
        <div className="flex gap-2"><button data-testid="save-subject" disabled={saving} className="flex-1 rounded-xl bg-gold px-4 py-2 font-bold text-darkGreen disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Save subject' : 'Create subject'}</button>{editingId && <button type="button" onClick={reset} aria-label="Cancel subject edit" className="rounded-xl border border-white/15 px-3 text-white/70"><X size={16} /></button>}</div>
      </form>{editingId && <label className="mt-3 flex items-center gap-2 text-sm text-white/70"><input data-testid="subject-active" type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />Active subject</label>}
      {message && <p data-testid="subject-message" className="mt-3 text-sm text-white/80">{message}</p>}
    </section>
    <section className="glass-panel rounded-3xl p-4">{loading ? <p className="p-4 text-sm text-white/50">Loading subjects…</p> : <div className="space-y-2">{subjects.map((subject) => <article key={subject.id} data-testid={`subject-row-${subject.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 p-4"><div><p className="font-semibold text-white">{subject.name}</p><p className="text-sm text-white/50">{subject.code || 'No code'} · {subject.category} · {subject.active ? 'Active' : 'Inactive'}</p></div><div className="flex gap-2"><button data-testid={`edit-subject-${subject.id}`} onClick={() => edit(subject)} aria-label={`Edit ${subject.name}`} className="rounded-lg p-2 text-gold"><Pencil size={16} /></button>{user?.role === 'commander' && <button data-testid={`delete-subject-${subject.id}`} onClick={() => remove(subject)} aria-label={`Delete ${subject.name}`} className="rounded-lg p-2 text-red-300"><Trash2 size={16} /></button>}</div></article>)}{!subjects.length && <p className="p-4 text-sm text-white/50">No subjects found.</p>}</div>}</section>
  </div>;
}
