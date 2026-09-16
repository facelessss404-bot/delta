import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CalendarDays, LoaderCircle, RefreshCw, X } from 'lucide-react';
import { AuthContext } from '../context/authStateContext';
import AttendancePanel from '../components/AttendancePanel';
import SubjectCard from '../components/SubjectCard';
import api from '../services/api';

export default function Attendance() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ summary: [], history: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [subjectId, setSubjectId] = useState('');
  const [batch, setBatch] = useState('');
  const [sessionType, setSessionType] = useState('');
  const isStaff = ['admin', 'commander'].includes(user?.role);

  const load = useCallback(() => {
    if (isStaff) return;
    setLoading(true); setError('');
    api.get('/attendance/my').then(({ data: value }) => setData(value))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load attendance history.'))
      .finally(() => setLoading(false));
  }, [isStaff]);

  useEffect(() => { load(); }, [load]);

  const batches = useMemo(() => [...new Set(data.history.map((item) => item.batch).filter(Boolean))], [data.history]);
  const types = useMemo(() => [...new Set(data.history.map((item) => item.session_type).filter(Boolean))], [data.history]);
  const history = useMemo(() => data.history.filter((item) => (
    (!subjectId || String(item.subject_id) === subjectId)
    && (!batch || item.batch === batch)
    && (!sessionType || item.session_type === sessionType)
  )), [data.history, subjectId, batch, sessionType]);
  const viewSubject = (id) => {
    setSubjectId(String(id));
    document.getElementById('attendance-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isStaff) return <div className="mx-auto max-w-6xl pb-10"><h1 className="mb-5 text-2xl font-bold text-white">Session attendance</h1><AttendancePanel /></div>;

  return <div className="mx-auto max-w-5xl space-y-6 pb-10">
    <section className="glass-panel rounded-3xl p-6"><div className="flex items-center justify-between gap-4"><div><h1 className="text-2xl font-bold text-white">Attendance history</h1><p className="mt-1 text-sm text-white/50">Your official, session-based attendance records.</p></div><button disabled={loading} onClick={load} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/15 p-2 text-white/70 hover:text-gold disabled:opacity-60" aria-label="Refresh attendance">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <RefreshCw size={18} />}</button></div></section>
    {error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">{error}</p>}
    {loading ? <section className="glass-panel rounded-3xl p-8 text-center text-white/50">Loading attendance...</section> : <>
      <section className="grid gap-4 md:grid-cols-2">{data.summary.map((item) => <SubjectCard key={item.subject_id} subjectName={item.subject_name} category={item.category} present={item.present_count} absent={item.absent_count} total={item.total_sessions} percentage={item.percentage} onViewDetails={() => viewSubject(item.subject_id)} />)}</section>
      <section id="attendance-history" className="glass-panel overflow-hidden rounded-3xl"><div className="border-b border-white/10 p-5"><h2 className="font-bold text-white">Chronological sessions</h2><div className="mt-4 grid gap-2 sm:grid-cols-3"><select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="field"><option value="">All subjects</option>{data.summary.map((item) => <option key={item.subject_id} value={item.subject_id}>{item.subject_name}</option>)}</select><select value={batch} onChange={(event) => setBatch(event.target.value)} className="field"><option value="">All batches</option>{batches.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={sessionType} onChange={(event) => setSessionType(event.target.value)} className="field"><option value="">All session types</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>{(subjectId || batch || sessionType) && <button type="button" onClick={() => { setSubjectId(''); setBatch(''); setSessionType(''); }} className="mt-3 inline-flex items-center gap-1 text-sm text-gold hover:text-white"><X size={15} />Clear filters</button>}</div>{history.length ? <div className="divide-y divide-white/10">{history.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><CalendarDays className="text-gold" size={18} /><div><p className="font-semibold text-white">{item.subject_name}</p><p className="text-sm text-white/50">{new Date(`${item.session_date}T00:00:00`).toLocaleDateString()} · {item.session_type}{item.batch ? ` · ${item.batch}` : ''}{item.start_time ? ` · ${item.start_time.slice(0, 5)}` : ''}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${item.status === 'present' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>{item.status === 'present' ? 'P · Present' : 'A · Absent'}</span></div>)}</div> : !error && <p className="p-8 text-center text-white/50">No sessions match these filters.</p>}</section>
    </>}
  </div>;
}
