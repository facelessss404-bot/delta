import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CalendarOff,
  ClipboardCheck,
  Download,
  Dumbbell,
  GraduationCap,
  LoaderCircle,
  Table,
  UserCheck,
  UserRound,
  Users
} from 'lucide-react';
import api from '../services/api';
import { downloadApiExport } from '../utils/exportUtils';

const Metric = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="mt-1 text-sm text-white/50">{label}</p>
  </div>
);

export default function ReportsFull() {
  const [report, setReport] = useState(null);
  const [cadets, setCadets] = useState([]);
  const [selectedCadet, setSelectedCadet] = useState('');
  const [cadetReport, setCadetReport] = useState(null);
  const [error, setError] = useState('');
  const [loadingCadet, setLoadingCadet] = useState(false);
  const [exportingEntity, setExportingEntity] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const [overview, cadetList] = await Promise.all([
        api.get('/reports/overview'),
        api.get('/cadets')
      ]);
      setReport(overview.data);
      setCadets(cadetList.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load reports.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadCadetReport = async (id) => {
    setSelectedCadet(id);
    setCadetReport(null);
    if (!id) return;
    setLoadingCadet(true);
    try {
      setCadetReport((await api.get(`/reports/cadet/${id}`)).data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load the cadet report.');
    } finally {
      setLoadingCadet(false);
    }
  };

  const handleExport = async (entity, defaultFilename) => {
    setExportingEntity(entity);
    try {
      await downloadApiExport(`/reports/export/${entity}`, defaultFilename);
    } catch (err) {
      alert(`Export failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setExportingEntity(null);
    }
  };

  if (error && !report) {
    return <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">{error}</p>;
  }
  if (!report) {
    return <p className="glass-panel rounded-3xl p-8 text-center text-white/50">Loading reports...</p>;
  }

  const stats = report.stats;

  const exportServices = [
    {
      id: 'attendance',
      name: 'Attendance & Routine Records',
      desc: 'All daily sessions, marked statuses (Present, Absent, Leave), faculty, timestamps.',
      icon: ClipboardCheck,
      filename: 'delta_squad_attendance.csv'
    },
    {
      id: 'cadets',
      name: 'Cadets Master Roster',
      desc: 'Enrolled cadets, roll numbers, training division (JLP/SLP/YLP/SSLP), attendance %.',
      icon: Users,
      filename: 'delta_squad_cadet_roster.csv'
    },
    {
      id: 'academics',
      name: 'Academic Marks & Assessments',
      desc: 'Course exam marks, assessment types, percentages, max marks, and remarks.',
      icon: GraduationCap,
      filename: 'delta_squad_academic_marks.csv'
    },
    {
      id: 'physical',
      name: 'Physical Training Submissions',
      desc: 'Cadet drill/PT video submissions, review decisions, review dates and notes.',
      icon: Dumbbell,
      filename: 'delta_squad_physical_training.csv'
    },
    {
      id: 'leaves',
      name: 'Cadet Leaves & Excused Absences',
      desc: 'Official leave dates, cadet reasons, approval status, command reviewer remarks.',
      icon: CalendarOff,
      filename: 'delta_squad_leaves.csv'
    },
    {
      id: 'timetable',
      name: 'Weekly Master Timetable',
      desc: 'All 342 preset schedule slots across JLP, Senior, and NDA divisions.',
      icon: CalendarDays,
      filename: 'delta_squad_weekly_timetable.csv'
    },
    {
      id: 'registrations',
      name: 'Counselling Applicant Leads',
      desc: 'Lead capture records, student contact numbers, program choices, and dates.',
      icon: Table,
      filename: 'delta_squad_counselling_leads.csv'
    }
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-14 text-white">
      {/* Overview Stats */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold shadow-md">
              <BarChart3 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white">Operational Reports & Analytics</h1>
              <p className="text-xs text-white/50">Live institutional metrics from Delta Squad database.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Enrolled Cadets" value={stats.total_cadets} />
          <Metric label="Active Officers & Admins" value={stats.active_admins} />
          <Metric label="Overall Attendance" value={`${stats.overall_attendance_percentage}%`} />
          <Metric label="Pending PT Reviews" value={stats.pending_physical_reviews} />
          <Metric label="Total Assessments" value={stats.total_assessments} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          COMMAND DATA EXPORT CENTER (NEW)
          ══════════════════════════════════════════════════════════ */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 border border-gold/25 bg-gold/[0.03]">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Download className="text-gold" size={20} />
              <h2 className="text-lg font-bold text-white">Command Data Export Center</h2>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Download clean Excel / CSV reports formatted with UTF-8 BOM for official office and administrative use.
            </p>
          </div>
          <span className="rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-xs font-bold text-gold">
            7 Functions Available
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exportServices.map((service) => {
            const Icon = service.icon;
            const isExporting = exportingEntity === service.id;
            return (
              <div
                key={service.id}
                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:border-gold/30 hover:bg-black/35"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="rounded-xl bg-gold/15 p-2 text-gold">
                      <Icon size={18} />
                    </div>
                    <h3 className="font-bold text-sm text-white">{service.name}</h3>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed mb-4">{service.desc}</p>
                </div>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleExport(service.id, service.filename)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold/15 border border-gold/30 px-3 py-2 text-xs font-bold text-gold transition hover:bg-gold hover:text-darkGreen disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      Generating CSV…
                    </>
                  ) : (
                    <>
                      <Download size={14} />
                      Export to Excel / CSV
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Individual Cadet Report */}
      <section className="glass-panel rounded-3xl p-6">
        <div className="flex items-center gap-2">
          <UserRound size={18} className="text-gold" />
          <h2 className="font-bold text-white">Individual Cadet Dossier Report</h2>
        </div>
        <select
          value={selectedCadet}
          onChange={(event) => loadCadetReport(event.target.value)}
          className="field mt-4 max-w-md"
        >
          <option value="">Select a cadet</option>
          {cadets.map((cadet) => (
            <option key={cadet.id} value={cadet.id}>
              {cadet.name} · {cadet.email} {cadet.batch ? `(${cadet.batch})` : ''}
            </option>
          ))}
        </select>

        {loadingCadet && <p className="mt-4 text-sm text-white/50">Loading cadet dossier…</p>}
        {cadetReport && (
          <div className="mt-5 space-y-3">
            <p className="font-semibold text-white text-base">
              {cadetReport.cadet.name} ({cadetReport.cadet.email})
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Attendance" value={`${cadetReport.attendance.percentage}%`} />
              <Metric label="Present / Sessions" value={`${cadetReport.attendance.present}/${cadetReport.attendance.total}`} />
              <Metric label="Assessments Logged" value={cadetReport.marks.total} />
              <Metric label="Physicals Accepted" value={`${cadetReport.physicals.accepted}/${cadetReport.physicals.total}`} />
            </div>
          </div>
        )}
      </section>

      {/* Subject Wise Attendance */}
      <section className="glass-panel rounded-3xl p-6">
        <h2 className="font-bold text-white text-base mb-4">Subject Attendance Breakdown</h2>
        <div className="space-y-3">
          {report.subjectWiseAttendance.map((item) => (
            <div key={item.subject_id}>
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-white">{item.name}</span>
                <span className="text-gold">{item.percentage}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-gold transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
