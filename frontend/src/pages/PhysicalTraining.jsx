import { useCallback, useContext, useEffect, useState } from 'react';
import { Check, Eye, RefreshCw, X } from 'lucide-react';
import { AuthContext } from '../context/authStateContext';
import VideoUpload from '../components/VideoUpload';
import api from '../services/api';

const displayDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';

export default function PhysicalTraining() {
  const { user } = useContext(AuthContext);
  const isCadet = user?.role === 'cadet';
  const [submissions, setSubmissions] = useState([]);
  const [comments, setComments] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [viewer, setViewer] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const { data } = await api.get(isCadet ? '/physical/my' : '/physical'); setSubmissions(data); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load physical-training submissions.'); }
    finally { setLoading(false); }
  }, [isCadet]);

  useEffect(() => { load(); }, [load]);

  const view = async (submission) => {
    try {
      const { data } = await api.get(`/physical/${submission.id}/view-url`);
      setViewer({ ...data, title: `${submission.cadet_name ? `${submission.cadet_name} — ` : ''}${submission.activity_type}` });
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to prepare the secure video link.'); }
  };

  const review = async (id, reviewStatus) => {
    setReviewing(id); setError('');
    try {
      await api.patch(`/physical/${id}/review`, { reviewStatus, comment: comments[id] || '' });
      await load();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save the review.'); }
    finally { setReviewing(null); }
  };

  return <div className="mx-auto max-w-6xl space-y-6 pb-10">
    <section className="glass-panel rounded-3xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-gold">Physical training</p><h1 className="mt-1 text-3xl font-bold text-white">{isCadet ? 'Your training evidence' : 'Physical submission review'}</h1><p className="mt-1 text-sm text-white/50">Videos stay in the private Supabase Storage bucket and open only through a short-lived secure link.</p></div><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/75 hover:bg-white/5"><RefreshCw size={16} />Refresh</button></div>
    </section>
    {isCadet && <VideoUpload onUploaded={load} />}
    {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">{error}</p>}
    <section className="glass-panel rounded-3xl p-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white">{isCadet ? 'Submission history' : 'All submissions'}</h2><span className="text-sm text-white/50">{submissions.length} total</span></div>{loading ? <p className="text-sm text-white/50">Loading submissions…</p> : !submissions.length ? <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/50">No physical-training submissions yet.</p> : <div className="space-y-3">{submissions.map((submission) => <article key={submission.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-white">{submission.activity_type}</p><p className="mt-1 text-sm text-white/50">{!isCadet && `${submission.cadet_name} · `}{displayDate(submission.activity_date)} · {Math.ceil(Number(submission.file_size) / 1024 / 1024)} MB</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${submission.review_status === 'accepted' ? 'bg-emerald-400/10 text-emerald-300' : submission.review_status === 'rejected' ? 'bg-red-400/10 text-red-300' : 'bg-gold/10 text-gold'}`}>{submission.review_status}</span></div><div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={() => view(submission)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/5"><Eye size={16} />View securely</button>{!isCadet && <><input aria-label={`Review comment for ${submission.activity_type}`} value={comments[submission.id] || ''} onChange={(event) => setComments({ ...comments, [submission.id]: event.target.value })} maxLength="1000" placeholder="Review comment (optional)" className="min-w-52 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-gold/60" /><button type="button" disabled={reviewing === submission.id} onClick={() => review(submission.id, 'accepted')} className="inline-flex items-center gap-1 rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-bold text-emerald-300 disabled:opacity-60"><Check size={16} />Accept</button><button type="button" disabled={reviewing === submission.id} onClick={() => review(submission.id, 'rejected')} className="inline-flex items-center gap-1 rounded-xl bg-red-400/15 px-3 py-2 text-sm font-bold text-red-300 disabled:opacity-60"><X size={16} />Reject</button></>}{submission.reviewer_comment && <p className="w-full text-sm text-white/60"><span className="font-semibold text-white/80">Review:</span> {submission.reviewer_comment}</p>}</div></article>)}</div>}</section>
    {viewer && <div role="dialog" aria-modal="true" aria-label="Secure video viewer" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0f2119] p-4 shadow-2xl"><div className="mb-3 flex items-center justify-between gap-4"><h2 className="truncate font-semibold text-white">{viewer.title}</h2><button type="button" onClick={() => setViewer(null)} className="rounded-lg p-2 text-white/70 hover:bg-white/10" aria-label="Close video"><X size={18} /></button></div><video src={viewer.viewUrl} controls autoPlay className="max-h-[75vh] w-full rounded-xl bg-black" /></div></div>}
  </div>;
}
