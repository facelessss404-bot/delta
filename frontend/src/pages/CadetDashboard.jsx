import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CalendarDays, ClipboardCheck } from 'lucide-react';
import api from '../services/api';
import SubjectCard from '../components/SubjectCard';
import VideoUpload from '../components/VideoUpload';

export default function CadetDashboard() {
  const [data, setData] = useState({ summary: [], history: [] });
  const [error, setError] = useState('');
  useEffect(() => { api.get('/attendance/my').then(({ data: value }) => setData(value)).catch(() => setError('Unable to load your attendance. Please try again.')); }, []);
  const total = data.summary.reduce((sum, item) => sum + item.total_sessions, 0);
  const present = data.summary.reduce((sum, item) => sum + item.present_count, 0);
  const percentage = total ? Math.round((present / total) * 100) : 0;
  return <div className="mx-auto max-w-6xl space-y-7 pb-10"><section className="glass-panel rounded-3xl p-7"><p className="text-sm font-semibold uppercase tracking-wider text-gold">Cadet portal</p><h1 className="mt-2 text-3xl font-bold text-white">Your training progress</h1><div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric icon={Activity} label="Overall attendance" value={`${percentage}%`} /><Metric icon={ClipboardCheck} label="Sessions attended" value={`${present}/${total}`} /><Metric icon={CalendarDays} label="Recent records" value={data.history.length} /></div></section>{error && <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">{error}</p>}<section><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-white">Subject attendance</h2><Link className="text-sm text-gold hover:text-white" to="/attendance">View session history</Link></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data.summary.map((subject) => <SubjectCard key={subject.subject_id} subjectName={subject.subject_name} present={subject.present_count} absent={subject.absent_count} total={subject.total_sessions} />)}</div>{!data.summary.length && !error && <p className="glass-panel rounded-2xl p-8 text-center text-white/50">No attendance sessions have been recorded yet.</p>}</section><VideoUpload /></div>;
}
function Metric({ icon: Icon, label, value }) { return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><Icon className="text-gold" size={20} /><p className="mt-3 text-2xl font-bold text-white">{value}</p><p className="text-sm text-white/50">{label}</p></div>; }
