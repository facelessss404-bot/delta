import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Award, CalendarDays, CalendarOff, ClipboardCheck, Clock3, Dumbbell, UserCheck, ArrowRight } from 'lucide-react';
import api from '../services/api';
import SubjectCard from '../components/SubjectCard';
import VideoUpload from '../components/VideoUpload';
import { getMyTimetable, getTodaySchedule } from '../services/timetableService';

const Metric = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
    <Icon size={20} className="text-gold" />
    <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    <p className="text-sm text-white/50">{label}</p>
  </div>
);

export default function CadetDashboardFull() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [activeLeaveToday, setActiveLeaveToday] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, myTimetableRes] = await Promise.all([
        api.get('/dashboard/cadet'),
        getMyTimetable().catch(() => null)
      ]);
      setData(dashRes.data);

      if (myTimetableRes) {
        setActiveLeaveToday(myTimetableRes.activeLeaveToday);
        const dayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todaySlots = (myTimetableRes.slots || []).filter((s) => s.day_of_week === dayStr);
        setTodaySchedule({
          dayName: dayStr,
          scheduleTitle: myTimetableRes.schedule?.title,
          isOnline: myTimetableRes.isOnline,
          message: myTimetableRes.message,
          slots: todaySlots
        });
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = data?.stats || {};

  // Current live time comparison
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMins}`;

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 pb-10">
        <div className="glass-panel h-44 animate-pulse rounded-3xl bg-white/[0.02]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="glass-panel h-28 animate-pulse rounded-2xl bg-white/[0.02]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-10 text-white">
      {/* Top Banner & Metrics */}
      <section className="glass-panel rounded-3xl p-7">
        <p className="text-sm font-semibold uppercase tracking-wider text-gold">Cadet portal</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Your Training Progress</h1>

        {activeLeaveToday && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3.5 text-xs text-cyan-200">
            <CalendarOff className="shrink-0 text-cyan-300" size={18} />
            <div>
              <span className="font-bold">Official Full-Day Leave Active Today:</span> {activeLeaveToday.reason}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Activity} label="Overall attendance" value={`${stats.attendance_percentage ?? 0}%`} />
          <Metric icon={ClipboardCheck} label="Sessions attended" value={`${stats.present_sessions ?? 0}/${stats.total_sessions ?? 0}`} />
          <Metric icon={Award} label="Academic average" value={`${stats.average_mark_percentage ?? 0}%`} />
          <Metric icon={Dumbbell} label="Physicals accepted" value={`${stats.accepted_submissions ?? 0}/${stats.total_submissions ?? 0}`} />
        </div>
      </section>

      {/* Today's Timetable Preset Schedule Widget */}
      {todaySchedule && (
        todaySchedule.isOnline ? (
          <section className="glass-panel rounded-3xl p-6 border border-cyan-400/25 bg-cyan-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400">
                  <Clock3 size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">Online Attendee Division (SSLP)</h2>
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase">Virtual Cohort</span>
                  </div>
                  <p className="text-xs text-cyan-200/80 mt-1 max-w-xl leading-relaxed">
                    {todaySchedule.message || 'No routine timetable is required for SSLP cadets. Sessions and interactive coaching are conducted virtually.'}
                  </p>
                </div>
              </div>
              <Link
                to="/timetable"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-gold/20 hover:text-gold hover:border-gold/30 transition shrink-0"
              >
                Programme Details
                <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        ) : (
          <section className="glass-panel rounded-3xl p-6 border border-gold/20 bg-gold/[0.03]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock3 className="text-gold" size={18} />
                  <h2 className="text-lg font-bold text-white">
                    Today's Schedule & Routine ({todaySchedule.dayName})
                  </h2>
                </div>
                <p className="text-xs text-white/50 mt-0.5">
                  Division Preset: {todaySchedule.scheduleTitle} · {todaySchedule.slots.length} periods scheduled
                </p>
              </div>
              <Link
                to="/timetable"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:text-white transition"
              >
                View Full Weekly Timetable
                <ArrowRight size={14} />
              </Link>
            </div>

            {todaySchedule.slots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                <p className="text-sm font-semibold text-white/70">
                  {todaySchedule.dayName === 'Sunday'
                    ? 'Sunday is an official Academy Rest Day. No academic lectures or drill periods are scheduled today.'
                    : `No periods scheduled for ${todaySchedule.dayName}.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {todaySchedule.slots.slice(0, 8).map((slot) => {
                  const isNow = slot.start_time && slot.end_time && currentTimeStr >= slot.start_time && currentTimeStr < slot.end_time;
                  return (
                    <div
                      key={slot.id}
                      className={`rounded-2xl border p-3.5 transition ${
                        isNow
                          ? 'border-gold bg-gold/20 shadow-lg shadow-gold/15 ring-1 ring-gold text-white'
                          : 'border-white/10 bg-black/25 text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gold">
                          {slot.time_display}
                        </span>
                        {isNow && (
                          <span className="rounded-full bg-emerald-400/20 px-2 py-0.2 text-[9px] font-black uppercase text-emerald-300 animate-pulse">
                            NOW
                          </span>
                        )}
                      </div>
                      <p className="font-extrabold text-sm text-white mt-1 line-clamp-1" title={slot.activity}>
                        {slot.activity}
                      </p>
                      {slot.instructor ? (
                        <p className="text-[11px] text-white/50 mt-0.5 flex items-center gap-1">
                          <UserCheck size={11} className="text-gold" />
                          {slot.instructor}
                        </p>
                      ) : (
                        <p className="text-[11px] text-white/40 mt-0.5 italic">Academy Routine</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )
      )}

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">
          <span>{error}</span>
          <button type="button" onClick={load} className="rounded-lg border border-red-300/30 px-3 py-1.5 text-sm font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* Subject Attendance Section */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Course Attendance Summary</h2>
          <div className="flex gap-4 text-sm font-semibold">
            <Link className="text-gold hover:text-white" to="/attendance">
              View History
            </Link>
            <Link className="text-gold hover:text-white" to="/academics">
              Academic Marks
            </Link>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data?.subjectAttendance?.map((subject) => (
            <SubjectCard
              key={subject.subject_id}
              subjectName={subject.name}
              present={subject.present_count}
              absent={subject.absent_count}
              total={subject.total_sessions}
            />
          ))}
        </div>
        {data && !data.subjectAttendance.length && (
          <p className="glass-panel rounded-2xl p-8 text-center text-white/50">
            No subjects are assigned yet.
          </p>
        )}
      </section>

      {/* Physical Training Status */}
      <section className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
        <div>
          <h2 className="font-bold text-white">Physical-Training Status</h2>
          <p className="mt-1 text-sm text-white/50">
            {stats.pending_submissions ?? 0} submission(s) awaiting review.
          </p>
        </div>
        <Link
          to="/physical"
          className="inline-flex items-center gap-2 rounded-xl border border-gold/30 px-4 py-2 text-sm font-bold text-gold hover:bg-gold/10"
        >
          <CalendarDays size={16} />
          View Submission History
        </Link>
      </section>

      <VideoUpload onUploaded={load} />
    </div>
  );
}
