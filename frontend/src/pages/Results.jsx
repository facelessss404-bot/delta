import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Award, Plus } from 'lucide-react';
import { AuthContext } from '../context/authStateContext';
import api from '../services/api';
import examService from '../services/examService';
import ResultEntryGrid from '../components/ResultEntryGrid';

const blankExam = { name: '', exam_type: 'written', subject_id: '', max_marks: '', exam_date: '' };

const Results = () => {
  const { user } = useContext(AuthContext);
  const staff = ['admin', 'commander'].includes(user?.role);
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [cadets, setCadets] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [form, setForm] = useState(blankExam);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const values = await Promise.all(staff ? [examService.getExams(), examService.getCadets(), api.get('/subjects')] : [examService.getMyResults(), api.get('/subjects')]);
      if (staff) { setExams(values[0]); setCadets(values[1]); setSubjects(values[2].data); }
      else { setResults(values[0]); setSubjects(values[1].data); }
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load results.'); }
    finally { setLoading(false); }
  }, [staff]);

  useEffect(() => { load(); }, [load]);
  const createExam = async (event) => {
    event.preventDefault();
    try {
      const created = await examService.createExam({ ...form, max_marks: Number(form.max_marks) });
      setExams((current) => [created, ...current]); setForm(blankExam); setShowForm(false); setSelectedExam(created);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to create assessment.'); }
  };

  if (loading) return <div className="glass-panel rounded-3xl p-10 text-center text-sm text-white/50">Loading results…</div>;
  return <div className="mx-auto max-w-6xl space-y-6 pb-10">
    <div className="glass-panel flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="rounded-2xl border border-gold/20 bg-gold/10 p-3 text-gold"><Award size={24} /></div><div><h1 className="text-2xl font-bold text-white">{staff ? 'Exams & Results' : 'My Results'}</h1><p className="text-sm text-white/50">{staff ? 'Create assessments and record cadet performance.' : 'Your official assessment history.'}</p></div></div>{staff && <button data-testid="create-exam" onClick={() => setShowForm(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-darkGreen hover:bg-white"><Plus size={17} />Create assessment</button>}</div>
    {error && <div data-testid="results-error" className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">{error}</div>}
    {staff ? <><div className="grid gap-3 md:grid-cols-3">{exams.map((exam) => <button key={exam.id} data-testid={`exam-${exam.id}`} onClick={() => setSelectedExam(exam)} className={`rounded-2xl border p-4 text-left transition-colors ${selectedExam?.id === exam.id ? 'border-gold/40 bg-gold/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'}`}><p className="font-bold text-white">{exam.name}</p><p className="mt-1 text-sm text-white/50">{exam.subject_name || 'General'} · Max {exam.max_marks}</p></button>)}</div>{exams.length === 0 && <div className="glass-panel rounded-3xl p-10 text-center text-white/50">Create an assessment to begin entering results.</div>}{selectedExam && <ResultEntryGrid exam={selectedExam} cadets={cadets} canDelete={user?.role === 'admin'} />}{showForm && <form onSubmit={createExam} className="glass-panel grid gap-4 rounded-3xl border border-gold/20 p-6 md:grid-cols-2"><input data-testid="exam-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Assessment name" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/50" /><select data-testid="exam-subject" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"><option value="">General assessment</option>{subjects.map((subject) => <option key={subject.id || subject._id} value={subject.id || subject._id}>{subject.name}</option>)}</select><select data-testid="exam-type" value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white"><option value="written">Written</option><option value="gto">GTO</option><option value="psych">Psych</option><option value="interview">Interview</option><option value="mock_ssb">Mock SSB</option></select><input data-testid="exam-max-marks" required type="number" min="1" value={form.max_marks} onChange={(e) => setForm({ ...form, max_marks: e.target.value })} placeholder="Maximum marks" className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-gold/50" /><input data-testid="exam-date" type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white [color-scheme:dark]" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setShowForm(false)} className="px-4 text-sm text-white/60">Cancel</button><button data-testid="save-exam" className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-darkGreen">Create</button></div></form>}</> : <div className="space-y-3">{results.length === 0 ? <div className="glass-panel rounded-3xl p-10 text-center text-white/50">No results have been published yet.</div> : results.map((result) => <article key={result.id} data-testid={`my-result-${result.id}`} className="glass-panel flex items-center justify-between rounded-2xl p-5"><div><h2 className="font-bold text-white">{result.exam_name}</h2><p className="mt-1 text-sm text-white/50">{new Date(result.exam_date).toLocaleDateString()} · {result.exam_type}</p>{result.remarks && <p className="mt-2 text-sm text-white/70">{result.remarks}</p>}</div><div className="text-right"><p className="text-2xl font-bold text-gold">{result.marks_obtained}<span className="text-sm text-white/40">/{result.max_marks}</span></p></div></article>)}</div>}
  </div>;
};

export default Results;
