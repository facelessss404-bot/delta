import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Megaphone, PenLine, Plus, RefreshCw, X } from 'lucide-react';
import { AuthContext } from '../context/authStateContext';
import NoticeCard from '../components/NoticeCard';
import noticeService from '../services/noticeService';

const emptyNotice = { title: '', content: '', priority: 'normal' };

const NoticeBoard = () => {
  const { user } = useContext(AuthContext);
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(emptyNotice);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canManage = ['admin', 'commander'].includes(user?.role);

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setNotices(await noticeService.getNotices());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load notices. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotices(); }, [loadNotices]);

  const closeForm = () => {
    setForm(emptyNotice);
    setEditingId(null);
    setShowForm(false);
  };

  const submitNotice = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await noticeService.updateNotice(editingId, form);
      else await noticeService.createNotice(form);
      closeForm();
      await loadNotices();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save the notice.');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (notice) => {
    setForm({ title: notice.title, content: notice.content, priority: notice.priority || 'normal' });
    setEditingId(notice.id);
    setShowForm(true);
  };

  const deleteNotice = async (id) => {
    if (!window.confirm('Delete this notice? This cannot be undone.')) return;
    try {
      await noticeService.deleteNotice(id);
      await loadNotices();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete the notice.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-gold/20 bg-gold/10 p-3 text-gold"><Megaphone size={24} /></div>
          <div><h1 className="text-2xl font-bold text-white">Notice Board</h1><p className="text-sm text-white/50">Training updates and operational announcements.</p></div>
        </div>
        {canManage && <button onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyNotice); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-darkGreen transition-colors hover:bg-white"><Plus size={17} />Post notice</button>}
      </div>

      <AnimatePresence>
        {showForm && <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={submitNotice} className="glass-panel overflow-hidden rounded-3xl border border-gold/20 p-6">
          <div className="mb-5 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-white"><PenLine size={18} className="text-gold" />{editingId ? 'Edit notice' : 'Post a notice'}</h2><button type="button" onClick={closeForm} className="text-white/50 hover:text-white"><X size={20} /></button></div>
          <div className="grid gap-4 md:grid-cols-[1fr_180px]"><input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Notice title" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold/50" /><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/50"><option value="low">Low priority</option><option value="normal">Normal priority</option><option value="high">High priority</option><option value="urgent">Urgent</option></select></div>
          <textarea required value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Write the announcement..." rows="5" className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition-colors placeholder:text-white/30 focus:border-gold/50" />
          <div className="mt-4 flex justify-end gap-3"><button type="button" onClick={closeForm} className="rounded-xl px-4 py-2 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white">Cancel</button><button disabled={saving} type="submit" className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-darkGreen transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish notice'}</button></div>
        </motion.form>}
      </AnimatePresence>

      {error && <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {loading ? <div className="glass-panel rounded-3xl p-10 text-center text-sm text-white/50">Loading notices…</div> : notices.length === 0 ? <div className="glass-panel rounded-3xl p-12 text-center"><Megaphone className="mx-auto mb-3 text-white/20" size={36} /><h2 className="text-lg font-bold text-white">No notices yet</h2><p className="mt-1 text-sm text-white/50">Updates from the training team will appear here.</p></div> : <div className="space-y-4">{notices.map((notice) => <NoticeCard key={notice.id} notice={notice} role={user?.role} onDelete={deleteNotice} onEdit={startEditing} />)}</div>}
      {!loading && <button onClick={loadNotices} className="mx-auto flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-gold"><RefreshCw size={14} />Refresh notices</button>}
    </div>
  );
};

export default NoticeBoard;
