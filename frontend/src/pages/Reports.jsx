import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../services/api';

export default function Reports() {
  const [report, setReport] = useState(null); const [error, setError] = useState('');
  useEffect(() => { api.get('/reports/overview').then(({ data }) => setReport(data)).catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load reports.')); }, []);
  if (error) return <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">{error}</p>;
  if (!report) return <p className="glass-panel rounded-3xl p-8 text-center text-white/50">Loading reports…</p>;
  const metrics = [['Cadets', report.stats.total_cadets], ['Active admins', report.stats.active_admins], ['Attendance', `${report.stats.overall_attendance_percentage}%`], ['Assessments', report.stats.total_assessments]];
  return <div className="mx-auto max-w-6xl space-y-6 pb-10"><section className="glass-panel rounded-3xl p-6"><div className="flex items-center gap-3"><BarChart3 className="text-gold" /><div><h1 className="text-2xl font-bold text-white">Operational reports</h1><p className="text-sm text-white/50">Live totals calculated from PostgreSQL records.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-2xl font-bold text-white">{value}</p><p className="text-sm text-white/50">{label}</p></div>)}</div></section><section className="glass-panel rounded-3xl p-6"><h2 className="font-bold text-white">Subject attendance</h2><div className="mt-4 space-y-3">{report.subjectWiseAttendance.map((item) => <div key={item.subject_id}><div className="flex justify-between text-sm"><span className="text-white">{item.name}</span><span className="text-gold">{item.percentage}%</span></div><div className="mt-1 h-2 rounded-full bg-white/10"><div className="h-2 rounded-full bg-gold" style={{ width: `${item.percentage}%` }} /></div></div>)}</div></section></div>;
}
