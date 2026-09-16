import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock3, LoaderCircle, Pencil, Plus, RefreshCw, XCircle } from 'lucide-react';
import api from '../services/api';
import { getSubjects } from '../services/subjectService';

const today = () => new Date().toISOString().slice(0, 10);
const sessionTypes = ['class', 'drill', 'physical training', 'assessment', 'other'];

export default function AttendancePanel() {
  const [subjects, setSubjects] = useState([]); const [cadets, setCadets] = useState([]); const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState(null); const [records, setRecords] = useState({}); const [originalRecords, setOriginalRecords] = useState({});
  const [date, setDate] = useState(today()); const [subjectId, setSubjectId] = useState(''); const [batch, setBatch] = useState(''); const [startTime, setStartTime] = useState(''); const [endTime, setEndTime] = useState(''); const [sessionType, setSessionType] = useState('class');
  const [message, setMessage] = useState(''); const [creating, setCreating] = useState(false); const [saving, setSaving] = useState(false); const [loadingCadets, setLoadingCadets] = useState(false); const [loadingSessions, setLoadingSessions] = useState(false);
  const existingSession = Boolean(session?.existing);
  const idOf = (cadet) => cadet.id || cadet._id;

  const loadSessions = useCallback(async () => {
    if (!subjectId) return;
    setLoadingSessions(true);
    try { const { data } = await api.get('/attendance/sessions', { params: { subjectId, batch: batch || undefined } }); setSessions(data); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to load previous sessions.'); }
    finally { setLoadingSessions(false); }
  }, [subjectId, batch]);

  const loadRoster = useCallback(async () => {
    if (!subjectId) return;
    setLoadingCadets(true);
    try { const { data } = await api.get('/attendance/cadets', { params: { subjectId, batch: batch || undefined } }); setCadets(data); setRecords({}); setOriginalRecords({}); }
    catch (error) { setMessage(error.response?.data?.message || 'Unable to load cadets assigned to this subject.'); }
    finally { setLoadingCadets(false); }
  }, [subjectId, batch]);

  useEffect(() => { getSubjects().then((data) => { const active = data.filter((subject) => subject.active !== false); setSubjects(active); setSubjectId(active[0]?.id || active[0]?._id || ''); }).catch(() => setMessage('Unable to load subjects.')); }, []);
  useEffect(() => { loadSessions(); }, [loadSessions]);
  useEffect(() => { if (!existingSession) loadRoster(); }, [loadRoster, existingSession]);

  const resetNewSession = () => { setSession(null); setRecords({}); setOriginalRecords({}); setDate(today()); setStartTime(''); setEndTime(''); setSessionType('class'); loadRoster(); };
  const createSession = async () => {
    if (creating || !subjectId) return;
    setCreating(true); setMessage('Creating session…');
    try {
      const { data } = await api.post('/attendance/sessions', { subjectId, batch: batch || null, date, startTime: startTime || null, endTime: endTime || null, sessionType });
      setSession({ ...data, existing: false }); setRecords({}); setOriginalRecords({}); setMessage(cadets.length ? 'Session created. Mark every assigned cadet, then save.' : 'Session created, but no active cadets are assigned to this subject and batch.'); await loadSessions();
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to create the session.'); }
    finally { setCreating(false); }
  };
  const openSession = async (selected) => {
    setMessage('Loading previous attendance…'); setSaving(true);
    try {
      const { data } = await api.get(`/attendance/sessions/${selected.id}/records`);
      const savedRecords = Object.fromEntries(data.map((record) => [record.cadet_id, record.status]));
      setSubjectId(String(selected.subject_id)); setBatch(selected.batch || ''); setDate(selected.session_date); setStartTime(selected.start_time?.slice(0, 5) || ''); setEndTime(selected.end_time?.slice(0, 5) || ''); setSessionType(selected.session_type || 'class');
      setCadets(data.map((record) => ({ id: record.cadet_id, _id: record.cadet_id, attendanceRecordId: record.id, name: record.name, email: record.email, roll_no: record.roll_no, batch: record.batch })));
      setRecords(savedRecords); setOriginalRecords(savedRecords); setSession({ ...selected, existing: true }); setMessage('Editing a previous session. Only changed records will be saved and audited.');
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to load previous attendance.'); }
    finally { setSaving(false); }
  };
  const setAll = (status) => setRecords(Object.fromEntries(cadets.map((cadet) => [idOf(cadet), status])));
  const save = async () => {
    if (!cadets.length || saving || !session) return;
    setSaving(true); setMessage(existingSession ? 'Saving corrections…' : 'Saving attendance…');
    try {
      if (existingSession) {
        const changes = cadets.filter((cadet) => records[idOf(cadet)] !== originalRecords[idOf(cadet)]);
        await Promise.all(changes.map((cadet) => api.patch(`/attendance/records/${cadet.attendanceRecordId}`, { status: records[idOf(cadet)] })));
      } else {
        await api.post('/attendance/records/bulk', { sessionId: session.id, records: cadets.map((cadet) => ({ cadetId: idOf(cadet), status: records[idOf(cadet)] || 'absent' })) });
      }
      setMessage(existingSession ? 'Attendance corrections saved with an audit trail.' : 'Attendance saved with an audit trail.'); setOriginalRecords(records); await loadSessions();
    } catch (error) { setMessage(error.response?.data?.message || 'Unable to save attendance.'); }
    finally { setSaving(false); }
  };
  const changeSubject = (value) => { setSubjectId(value); setSession(null); setRecords({}); setOriginalRecords({}); };

  return <div className="glass-panel flex h-full flex-col rounded-3xl p-6"><div className="mb-5 grid gap-3 border-b border-white/10 pb-5 md:grid-cols-3"><select data-testid="attendance-subject" value={subjectId} disabled={creating || saving} onChange={(event) => changeSubject(event.target.value)} className="field">{subjects.map((subject) => <option key={subject.id || subject._id} value={subject.id || subject._id}>{subject.name}</option>)}</select><input value={batch} disabled={creating || saving} onChange={(event) => { setBatch(event.target.value); setSession(null); }} placeholder="Batch / class (optional)" className="field" /><select value={sessionType} disabled={creating || saving || existingSession} onChange={(event) => setSessionType(event.target.value)} className="field">{sessionTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><input type="date" value={date} disabled={creating || saving || existingSession} onChange={(event) => setDate(event.target.value)} className="field [color-scheme:dark]" /><input type="time" value={startTime} disabled={creating || saving || existingSession} onChange={(event) => setStartTime(event.target.value)} aria-label="Session start time" className="field [color-scheme:dark]" /><input type="time" value={endTime} disabled={creating || saving || existingSession} onChange={(event) => setEndTime(event.target.value)} aria-label="Session end time" className="field [color-scheme:dark]" /></div><div className="mb-4 flex flex-wrap gap-2"><button data-testid="create-attendance-session" onClick={createSession} disabled={!subjectId || creating || saving || existingSession} className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-darkGreen disabled:opacity-60">{creating ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}{creating ? 'Creating…' : 'New session'}</button><button type="button" onClick={resetNewSession} disabled={creating || saving} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/5"><RefreshCw size={16} />New attendance</button>{session && <><button disabled={saving} onClick={() => setAll('present')} className="rounded-lg border border-emerald-400/30 px-3 py-1.5 text-sm text-emerald-300 disabled:opacity-50">Mark all present</button><button disabled={saving} onClick={() => setAll('absent')} className="rounded-lg border border-red-400/30 px-3 py-1.5 text-sm text-red-300 disabled:opacity-50">Mark all absent</button><button data-testid="save-attendance" disabled={saving || !cadets.length} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-darkGreen disabled:opacity-50">{saving && <LoaderCircle className="animate-spin" size={15} />}{saving ? 'Saving…' : existingSession ? 'Save corrections' : 'Save attendance'}</button></>}</div>{message && <p data-testid="attendance-message" className="mb-3 text-sm text-white/70">{message}</p>}<div className="grid gap-5 xl:grid-cols-[1fr_17rem]"><div className="max-h-[34rem] space-y-2 overflow-y-auto">{loadingCadets && <p className="p-3 text-sm text-white/50">Loading assigned cadets…</p>}{cadets.map((cadet) => <div key={idOf(cadet)} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3"><div><p className="font-semibold text-white">{cadet.name}</p><p className="text-xs text-white/50">{cadet.email}</p></div>{session && <div className="flex gap-2"><button disabled={saving} onClick={() => setRecords({ ...records, [idOf(cadet)]: 'present' })} className={records[idOf(cadet)] === 'present' ? 'rounded-lg bg-emerald-500/20 p-2 text-emerald-300' : 'rounded-lg p-2 text-white/40'} aria-label={`Mark ${cadet.name} present`}><CheckCircle size={19} /></button><button disabled={saving} onClick={() => setRecords({ ...records, [idOf(cadet)]: 'absent' })} className={records[idOf(cadet)] === 'absent' ? 'rounded-lg bg-red-500/20 p-2 text-red-300' : 'rounded-lg p-2 text-white/40'} aria-label={`Mark ${cadet.name} absent`}><XCircle size={19} /></button></div>}</div>)}</div><aside className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="flex items-center gap-2 font-semibold text-white"><Clock3 size={16} className="text-gold" />Previous sessions</p>{loadingSessions ? <p className="mt-3 text-sm text-white/50">Loading…</p> : <div className="mt-3 space-y-2">{sessions.slice(0, 15).map((item) => <button key={item.id} type="button" disabled={saving} onClick={() => openSession(item)} className={`w-full rounded-xl border p-3 text-left text-sm ${session?.id === item.id && existingSession ? 'border-gold/40 bg-gold/10 text-white' : 'border-white/10 text-white/70 hover:bg-white/5'}`}><p className="font-semibold">{item.subject_name}</p><p className="mt-1 text-xs text-white/50">{item.session_date} · {item.session_type}</p><p className="mt-1 text-xs text-white/40">{item.record_count} records · Edit</p></button>)}{!sessions.length && <p className="text-sm text-white/50">No previous sessions for this subject.</p>}</div>}</aside></div></div>;
}
