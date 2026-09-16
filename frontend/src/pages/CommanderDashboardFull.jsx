import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Dumbbell, UserPlus } from 'lucide-react';
import api from '../services/api';
import AttendancePanel from '../components/AttendancePanel';
import StaffDashboardSummary from '../components/StaffDashboardSummary';

export default function CommanderDashboardFull() {
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await api.get('/dashboard/commander'); setData(response.data); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load the command dashboard.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  return <div className="mx-auto max-w-7xl space-y-6 pb-10"><section className="glass-panel flex flex-wrap items-start justify-between gap-5 rounded-3xl p-6"><div><p className="text-sm font-semibold uppercase tracking-wider text-gold">Training Commander</p><h1 className="mt-1 text-3xl font-bold text-white">Command operations</h1><p className="mt-1 text-sm text-white/50">Live operational, attendance, academic, and physical-training data.</p></div><div className="flex flex-wrap gap-2"><Link to="/admins" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/5"><UserPlus size={16} />Manage admins</Link><Link to="/physical" className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-darkGreen"><Dumbbell size={16} />Review physicals</Link></div></section><StaffDashboardSummary data={data} loading={loading} error={error} /><section><div className="mb-3 flex items-center gap-2"><ClipboardCheck size={19} className="text-gold" /><h2 className="font-bold text-white">Attendance actions</h2></div><AttendancePanel /></section></div>;
}
