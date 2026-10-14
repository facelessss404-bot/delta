import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock3,
  Dumbbell,
  GraduationCap,
  Sparkles,
  Search,
  BookOpen,
  Coffee,
  ShieldAlert,
  Flame,
  UserCheck,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertTriangle,
  ClipboardCheck,
  RefreshCw,
  CalendarCheck,
  Download
} from 'lucide-react';
import { AuthContext } from '../context/authStateContext';
import { getSchedules, getTimetableSlots, getMyTimetable } from '../services/timetableService';
import { downloadApiExport } from '../utils/exportUtils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CATEGORY_STYLES = {
  academic: {
    label: 'Academic Lecture',
    bg: 'bg-amber-400/10 border-amber-400/25 text-amber-300',
    icon: BookOpen,
    dot: 'bg-amber-400'
  },
  physical: {
    label: 'Physical Training',
    bg: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-300',
    icon: Dumbbell,
    dot: 'bg-emerald-400'
  },
  games: {
    label: 'Games & Sports',
    bg: 'bg-cyan-400/10 border-cyan-400/25 text-cyan-300',
    icon: Flame,
    dot: 'bg-cyan-400'
  },
  study: {
    label: 'Study Hours',
    bg: 'bg-purple-400/10 border-purple-400/25 text-purple-300',
    icon: GraduationCap,
    dot: 'bg-purple-400'
  },
  routine: {
    label: 'Academy Routine',
    bg: 'bg-white/5 border-white/10 text-white/60',
    icon: Coffee,
    dot: 'bg-white/30'
  }
};

export default function Timetable() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isCadet = user?.role === 'cadet';
  const isStaff = ['admin', 'commander'].includes(user?.role);

  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('nda');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLeaveToday, setActiveLeaveToday] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'

  // Determine current day of week (1=Mon ... 6=Sat)
  const currentDayIndex = new Date().getDay();
  const todayDayName = currentDayIndex >= 1 && currentDayIndex <= 6 ? DAYS[currentDayIndex - 1] : 'Monday';
  const [selectedDay, setSelectedDay] = useState(todayDayName);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const scheduleList = await getSchedules();
      setSchedules(scheduleList);

      if (isCadet) {
        const myData = await getMyTimetable();
        if (myData.schedule?.key) {
          setSelectedSchedule(myData.schedule.key);
        }
        setSlots(myData.slots || []);
        setActiveLeaveToday(myData.activeLeaveToday);
      } else {
        const fetchedSlots = await getTimetableSlots({ scheduleKey: selectedSchedule });
        setSlots(fetchedSlots);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load timetable schedule.');
    } finally {
      setLoading(false);
    }
  }, [isCadet, selectedSchedule]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle schedule switch for non-cadet or when cadet explicitly explores
  const handleScheduleChange = async (key) => {
    setSelectedSchedule(key);
    setLoading(true);
    try {
      const fetchedSlots = await getTimetableSlots({ scheduleKey: key });
      setSlots(fetchedSlots);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load slots for this schedule.');
    } finally {
      setLoading(false);
    }
  };

  // Current live time comparison
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMins = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMins}`;

  const isCurrentSlot = (slot) => {
    if (selectedDay !== todayDayName) return false;
    if (!slot.start_time || !slot.end_time) return false;
    return currentTimeStr >= slot.start_time && currentTimeStr < slot.end_time;
  };

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (viewMode === 'day' && slot.day_of_week !== selectedDay) return false;
      if (categoryFilter !== 'all' && slot.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textMatch = slot.activity?.toLowerCase().includes(q)
          || slot.instructor?.toLowerCase().includes(q)
          || slot.time_display?.toLowerCase().includes(q)
          || slot.subject_name?.toLowerCase().includes(q);
        if (!textMatch) return false;
      }
      return true;
    });
  }, [slots, selectedDay, viewMode, categoryFilter, searchQuery]);

  const activeScheduleMeta = schedules.find((s) => s.key === selectedSchedule) || schedules[0];

  const jumpToAttendance = (slot) => {
    const todayIso = new Date().toISOString().slice(0, 10);
    navigate(`/attendance?date=${todayIso}&scheduleKey=${selectedSchedule}&slotId=${slot.id}&subjectId=${slot.subject_id || ''}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-14 text-white">
      {/* Header Banner */}
      <section className="glass-panel relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-gold shadow-lg shadow-gold/5">
              <CalendarDays size={28} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Cadet Timetable & Master Schedule
                </h1>
                <span className="rounded-full border border-gold/30 bg-gold/15 px-3 py-0.5 text-xs font-bold text-gold uppercase tracking-wider">
                  Preset Official Routine
                </span>
              </div>
              <p className="mt-1 text-sm text-white/60">
                Fixed academy schedule preset across morning physicals, academic lectures, study hours, and games.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isStaff && (
              <button
                type="button"
                onClick={() => downloadApiExport('/reports/export/timetable', 'delta_squad_timetable_schedule.csv')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-gold/20 hover:text-gold hover:border-gold/30 cursor-pointer"
              >
                <Download size={16} />
                Export Timetable CSV
              </button>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            {isStaff && (
              <button
                onClick={() => navigate('/attendance')}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-darkGreen shadow-md shadow-gold/20 transition hover:bg-white cursor-pointer"
              >
                <ClipboardCheck size={17} />
                Open Attendance Roster
              </button>
            )}
          </div>
        </div>

        {/* Cadet Leave Alert Banner */}
        {activeLeaveToday && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-cyan-200">
            <CalendarCheck className="shrink-0 text-cyan-300" size={20} />
            <div>
              <p className="font-bold text-cyan-100">Official Full-Day Leave Approved for Today</p>
              <p className="mt-0.5 text-xs text-cyan-200/80">
                Leave span: {new Date(activeLeaveToday.start_date).toLocaleDateString()} — {new Date(activeLeaveToday.end_date).toLocaleDateString()}.
                Reason: "{activeLeaveToday.reason}". You are officially excused from today's scheduled sessions.
              </p>
            </div>
          </div>
        )}

        {/* Schedule Preset Selectors */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
            Select Training Division / Grade Preset:
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {schedules.map((s) => {
              const active = selectedSchedule === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => handleScheduleChange(s.key)}
                  className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-gold bg-gold/15 text-white shadow-md shadow-gold/10'
                      : 'border-white/10 bg-black/20 text-white/70 hover:border-white/25 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="font-bold text-white text-base">{s.title}</span>
                    {active && <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />}
                  </div>
                  <p className="mt-1 text-xs text-white/50 line-clamp-1">{s.description}</p>
                  <span className="mt-2 text-[11px] font-semibold text-gold/80">
                    {s.slotCount || 114} preset periods / week
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Control Bar: Day Switcher, View Mode & Filters */}
      <section className="glass-panel rounded-3xl p-5 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Day Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day && viewMode === 'day';
              const isToday = day === todayDayName;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day);
                    setViewMode('day');
                  }}
                  className={`relative flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                    isSelected
                      ? 'bg-gold text-darkGreen shadow-md shadow-gold/20'
                      : 'border border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {day.slice(0, 3)}
                  {isToday && (
                    <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-black ${
                      isSelected ? 'bg-darkGreen text-gold' : 'bg-gold/20 text-gold'
                    }`}>
                      TODAY
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'week' ? 'day' : 'week')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition border ${
                viewMode === 'week'
                  ? 'border-gold bg-gold/20 text-gold'
                  : 'border-white/10 bg-white/5 text-white/70 hover:text-white'
              }`}
            >
              Full Week Matrix
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-2.5 text-white/40" size={15} />
              <input
                type="text"
                placeholder="Search subject or teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field pl-9 pr-3 py-1.5 text-xs w-full"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="field py-1.5 text-xs"
            >
              <option value="all">All Categories</option>
              <option value="academic">Academic Lectures</option>
              <option value="physical">Physical Training</option>
              <option value="games">Games & Sports</option>
              <option value="study">Study Hours</option>
              <option value="routine">Routine & Meals</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Schedule Content */}
      {error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel flex min-h-[300px] items-center justify-center rounded-3xl p-10 text-white/50">
          <RefreshCw className="animate-spin text-gold mr-3" size={24} />
          Loading scheduled timetable...
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="glass-panel flex min-h-[250px] flex-col items-center justify-center rounded-3xl p-10 text-center">
          <CalendarDays className="text-white/20 mb-3" size={42} />
          <h3 className="text-lg font-bold text-white">No sessions matched</h3>
          <p className="mt-1 text-sm text-white/50">Try clearing filters or search query.</p>
        </div>
      ) : viewMode === 'day' ? (
        /* Day Timeline View */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gold flex items-center gap-2">
              <Clock3 size={15} />
              {selectedDay}'s Daily Timeline · {filteredSlots.length} periods
            </h2>
            <span className="text-xs text-white/40">
              {activeScheduleMeta?.title}
            </span>
          </div>

          <div className="grid gap-3">
            {filteredSlots.map((slot) => {
              const activeNow = isCurrentSlot(slot);
              const catConfig = CATEGORY_STYLES[slot.category] || CATEGORY_STYLES.academic;
              const IconComp = catConfig.icon;

              return (
                <div
                  key={slot.id}
                  className={`group relative flex flex-col justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center transition ${
                    activeNow
                      ? 'border-gold bg-gold/[0.12] shadow-lg shadow-gold/10 ring-1 ring-gold/40'
                      : 'border-white/10 bg-black/25 hover:border-white/20 hover:bg-black/35'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Time Column */}
                    <div className="min-w-[130px]">
                      <div className="flex items-center gap-1.5 text-sm font-extrabold text-white">
                        <Clock3 size={14} className="text-gold" />
                        <span>{slot.time_display}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-white/45">
                        Period #{slot.slot_order}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="hidden sm:block h-10 w-px bg-white/10" />

                    {/* Slot Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-white tracking-wide">
                          {slot.activity}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${catConfig.bg}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${catConfig.dot}`} />
                          {catConfig.label}
                        </span>
                        {activeNow && (
                          <span className="rounded-full bg-emerald-400/20 border border-emerald-400/40 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-300 animate-pulse">
                            ACTIVE NOW
                          </span>
                        )}
                      </div>

                      {/* Instructor / Details */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                        {slot.instructor ? (
                          <span className="flex items-center gap-1 text-gold/90 font-medium">
                            <UserCheck size={13} />
                            Faculty: {slot.instructor}
                          </span>
                        ) : (
                          <span className="text-white/40 italic">Academy Routine</span>
                        )}
                        {slot.subject_name && slot.subject_name !== slot.activity && (
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/50">
                            Course: {slot.subject_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Staff */}
                  {isStaff && slot.trackable && (
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                      <button
                        type="button"
                        onClick={() => jumpToAttendance(slot)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gold/30 bg-gold/15 px-3 py-1.5 text-xs font-bold text-gold transition hover:bg-gold hover:text-darkGreen"
                      >
                        <ClipboardCheck size={14} />
                        Take Attendance
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Week Matrix View */
        <div className="glass-panel overflow-x-auto rounded-3xl p-5">
          <div className="min-w-[800px] space-y-6">
            <div className="border-b border-white/10 pb-3 flex items-center justify-between">
              <h2 className="font-bold text-white text-base">
                Weekly Timetable Matrix · {activeScheduleMeta?.title}
              </h2>
              <span className="text-xs text-gold">6 Days / 19 Daily Periods</span>
            </div>

            <div className="space-y-6 divide-y divide-white/10">
              {DAYS.map((day) => {
                const daySlots = slots.filter((s) => s.day_of_week === day);
                const isToday = day === todayDayName;
                return (
                  <div key={day} className="pt-5 first:pt-0">
                    <div className="mb-3 flex items-center gap-2">
                      <h3 className="font-extrabold text-sm uppercase tracking-wider text-white">
                        {day}
                      </h3>
                      {isToday && (
                        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {daySlots.map((s) => {
                        const cat = CATEGORY_STYLES[s.category] || CATEGORY_STYLES.academic;
                        return (
                          <div
                            key={s.id}
                            className={`rounded-xl border p-2.5 text-left text-xs transition ${
                              isCurrentSlot(s)
                                ? 'border-gold bg-gold/20 text-white ring-1 ring-gold'
                                : 'border-white/10 bg-black/20 text-white/70 hover:bg-white/5'
                            }`}
                          >
                            <span className="text-[10px] font-semibold text-white/40 block">
                              {s.time_display}
                            </span>
                            <span className="font-bold text-white block mt-0.5 truncate" title={s.activity}>
                              {s.activity}
                            </span>
                            {s.instructor && (
                              <span className="text-[10px] text-gold/80 block mt-0.5 truncate">
                                {s.instructor}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
