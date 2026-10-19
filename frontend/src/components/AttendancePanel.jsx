import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CalendarOff,
  CheckCircle,
  Clock3,
  Dumbbell,
  GraduationCap,
  Info,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  X,
  XCircle,
  UserX
} from 'lucide-react';
import api from '../services/api';
import { getSubjects } from '../services/subjectService';
import { getSchedules, getTimetableSlots } from '../services/timetableService';
import leaveService from '../services/leaveService';

const today = () => new Date().toISOString().slice(0, 10);
const sessionTypes = ['class', 'drill', 'physical training', 'assessment', 'other'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AttendancePanel() {
  const [searchParams] = useSearchParams();
  const paramDate = searchParams.get('date');
  const paramScheduleKey = searchParams.get('scheduleKey');
  const paramSlotId = searchParams.get('slotId');
  const paramSubjectId = searchParams.get('subjectId');

  // Mode: 'preset' (College Timetable) or 'custom' (Manual Session)
  const [mode, setMode] = useState('preset');

  // Timetable preset state
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleKey, setSelectedScheduleKey] = useState(paramScheduleKey || 'jlp_8_10');
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  // General Attendance State
  const [subjects, setSubjects] = useState([]);
  const [cadets, setCadets] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState({});
  const [originalRecords, setOriginalRecords] = useState({});
  const [date, setDate] = useState(paramDate || today());
  const [subjectId, setSubjectId] = useState(paramSubjectId || '');
  const [batch, setBatch] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sessionType, setSessionType] = useState('class');

  // Quick Direct Leave Modal for Commander/Admin
  const [leaveModalCadet, setLeaveModalCadet] = useState(null);
  const [directLeaveReason, setDirectLeaveReason] = useState('Official full-day excused leave');
  const [grantingLeave, setGrantingLeave] = useState(false);

  const [message, setMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const existingSession = Boolean(session?.existing);
  const idOf = (cadet) => cadet.id || cadet._id;

  // Compute day of week for current date
  const dayOfWeekName = useMemo(() => {
    if (!date) return 'Monday';
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long' });
  }, [date]);

  // Load schedules and subjects on mount
  useEffect(() => {
    getSchedules()
      .then((list) => {
        setSchedules(list);
        if (!paramScheduleKey && list.length > 0) {
          setSelectedScheduleKey(list[0].key);
        }
      })
      .catch(() => {});
    getSubjects()
      .then((data) => {
        const active = data.filter((subject) => subject.active !== false);
        setSubjects(active);
        if (!paramSubjectId && active[0]) {
          setSubjectId(active[0].id || active[0]._id || '');
        }
      })
      .catch(() => setMessage('Unable to load subjects.'));
  }, [paramSubjectId]);

  // Load timetable slots for the selected schedule and day of week
  const loadTimetableForDay = useCallback(async () => {
    if (mode !== 'preset') return;
    setLoadingSlots(true);
    try {
      const data = await getTimetableSlots({
        scheduleKey: selectedScheduleKey,
        dayOfWeek: dayOfWeekName
      });
      setTimetableSlots(data);

      // If URL param specified slotId, auto-select it
      if (paramSlotId && !selectedSlot) {
        const target = data.find((s) => String(s.id) === String(paramSlotId));
        if (target) {
          selectTimetablePeriod(target);
        }
      }
    } catch (err) {
      console.warn('Unable to load timetable slots', err);
    } finally {
      setLoadingSlots(false);
    }
  }, [mode, selectedScheduleKey, dayOfWeekName, paramSlotId]);

  useEffect(() => {
    loadTimetableForDay();
  }, [loadTimetableForDay]);

  // Load previous sessions
  const loadSessions = useCallback(async () => {
    if (!subjectId) return;
    setLoadingSessions(true);
    try {
      const { data } = await api.get('/attendance/sessions', {
        params: { subjectId, batch: batch || undefined, date: date || undefined }
      });
      setSessions(data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load previous sessions.');
    } finally {
      setLoadingSessions(false);
    }
  }, [subjectId, batch, date]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load eligible cadet roster with approved leave status check
  const loadRoster = useCallback(async () => {
    if (!subjectId) return;
    setLoadingCadets(true);
    try {
      const { data } = await api.get('/attendance/cadets', {
        params: { subjectId, batch: batch || undefined, date }
      });
      setCadets(data);

      // Pre-populate records: cadets on approved leave default to 'leave', others to 'present'
      const initial = {};
      data.forEach((c) => {
        const cId = idOf(c);
        if (c.is_on_leave) {
          initial[cId] = 'leave';
        } else {
          initial[cId] = 'present';
        }
      });
      setRecords(initial);
      setOriginalRecords({});
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load cadets assigned to this schedule.');
    } finally {
      setLoadingCadets(false);
    }
  }, [subjectId, batch, date]);

  useEffect(() => {
    if (!existingSession) {
      loadRoster();
    }
  }, [loadRoster, existingSession]);

  // Handle selecting a timetable period
  const selectTimetablePeriod = (slot) => {
    setSelectedSlot(slot);

    // Map slot to subject
    let matchedSubId = slot.subject_id;
    if (!matchedSubId && subjects.length) {
      const act = slot.activity?.toLowerCase() || '';
      const found = subjects.find(
        (s) => s.name.toLowerCase().includes(act) || act.includes(s.name.toLowerCase())
      );
      if (found) matchedSubId = found.id;
      else matchedSubId = subjects[0]?.id;
    }

    if (matchedSubId) {
      setSubjectId(String(matchedSubId));
    }

    // Set batch from schedule
    const schedMeta = schedules.find((s) => s.key === selectedScheduleKey);
    const targetBatch = schedMeta?.programme || '';
    setBatch(targetBatch);

    setStartTime(slot.start_time?.slice(0, 5) || '');
    setEndTime(slot.end_time?.slice(0, 5) || '');

    const type = slot.category === 'physical' ? 'physical training' : slot.category === 'routine' ? 'other' : 'class';
    setSessionType(type);

    setSession(null);
    setRecords({});
    setOriginalRecords({});
    setMessage(`Selected period #${slot.slot_order}: ${slot.activity} (${slot.time_display}). Ready to record attendance.`);
  };

  const resetNewSession = () => {
    setSession(null);
    setSelectedSlot(null);
    setRecords({});
    setOriginalRecords({});
    setDate(today());
    setStartTime('');
    setEndTime('');
    setSessionType('class');
    loadRoster();
  };

  const createSession = async () => {
    if (creating || !subjectId) return;
    setCreating(true);
    setMessage('Creating session…');
    try {
      const { data } = await api.post('/attendance/sessions', {
        subjectId,
        batch: batch || null,
        date,
        startTime: startTime || null,
        endTime: endTime || null,
        sessionType
      });
      setSession({ ...data, existing: false });

      // Re-populate records with approved leaves preserved
      const initial = {};
      cadets.forEach((c) => {
        const cId = idOf(c);
        initial[cId] = c.is_on_leave ? 'leave' : 'present';
      });
      setRecords(initial);
      setOriginalRecords({});
      setMessage(
        cadets.length
          ? 'Session created. Review roster and click "Save attendance". Cadets on approved leave are pre-marked as Leave.'
          : 'Session created, but no active cadets found for this division.'
      );
      await loadSessions();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to create the session.');
    } finally {
      setCreating(false);
    }
  };

  const openSession = async (selected) => {
    setMessage('Loading previous attendance…');
    setSaving(true);
    try {
      const { data } = await api.get(`/attendance/sessions/${selected.id}/records`);
      const savedRecords = Object.fromEntries(data.map((record) => [record.cadet_id, record.status]));
      setSubjectId(String(selected.subject_id));
      setBatch(selected.batch || '');
      setDate(selected.session_date ? String(selected.session_date).slice(0, 10) : today());
      setStartTime(selected.start_time?.slice(0, 5) || '');
      setEndTime(selected.end_time?.slice(0, 5) || '');
      setSessionType(selected.session_type || 'class');
      setCadets(
        data.map((record) => ({
          id: record.cadet_id,
          _id: record.cadet_id,
          attendanceRecordId: record.id,
          name: record.name,
          email: record.email,
          roll_no: record.roll_no,
          batch: record.batch,
          is_on_leave: record.status === 'leave' || record.is_on_leave,
          leave_reason: record.leave_reason
        }))
      );
      setRecords(savedRecords);
      setOriginalRecords(savedRecords);
      setSession({ ...selected, existing: true });
      setMessage('Editing a previous session. Only changed records will be saved and audited.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to load previous attendance.');
    } finally {
      setSaving(false);
    }
  };

  const setAllExceptLeave = (status) => {
    const updated = { ...records };
    cadets.forEach((cadet) => {
      const cId = idOf(cadet);
      if (!cadet.is_on_leave) {
        updated[cId] = status;
      }
    });
    setRecords(updated);
  };

  const save = async () => {
    if (!cadets.length || saving || !session) return;
    setSaving(true);
    setMessage(existingSession ? 'Saving corrections…' : 'Saving attendance…');
    try {
      if (existingSession) {
        const changes = cadets.filter((cadet) => records[idOf(cadet)] !== originalRecords[idOf(cadet)]);
        await Promise.all(
          changes.map((cadet) =>
            api.patch(`/attendance/records/${cadet.attendanceRecordId}`, {
              status: records[idOf(cadet)]
            })
          )
        );
      } else {
        await api.post('/attendance/records/bulk', {
          sessionId: session.id,
          records: cadets.map((cadet) => ({
            cadetId: idOf(cadet),
            status: records[idOf(cadet)] || (cadet.is_on_leave ? 'leave' : 'absent')
          }))
        });
      }
      setMessage(
        existingSession
          ? 'Attendance corrections saved with an audit trail.'
          : 'Attendance saved successfully with full audit trail!'
      );
      setOriginalRecords(records);
      await loadSessions();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const changeSubject = (value) => {
    setSubjectId(value);
    setSession(null);
    setRecords({});
    setOriginalRecords({});
  };

  // Quick Direct Leave Grant by Staff
  const handleGrantDirectLeave = async () => {
    if (!leaveModalCadet || grantingLeave) return;
    setGrantingLeave(true);
    try {
      await leaveService.createLeave({
        cadet_id: idOf(leaveModalCadet),
        start_date: date,
        end_date: date,
        reason: directLeaveReason || 'Official full-day excused leave',
        reviewer_remarks: 'Approved directly by command staff during attendance call'
      });
      // Mark cadet as leave locally
      setRecords((prev) => ({ ...prev, [idOf(leaveModalCadet)]: 'leave' }));
      setLeaveModalCadet(null);
      setMessage(`Full-day leave approved for ${leaveModalCadet.name}. Attendance set to Leave.`);
      await loadRoster();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to grant leave.');
    } finally {
      setGrantingLeave(false);
    }
  };

  // Filter timetable slots
  const filteredTimetableSlots = useMemo(() => {
    return timetableSlots.filter((slot) => {
      if (categoryFilter !== 'all' && slot.category !== categoryFilter) return false;
      return true;
    });
  }, [timetableSlots, categoryFilter]);

  return (
    <div className="glass-panel flex h-full flex-col rounded-3xl p-6 text-white space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 p-1">
          <button
            type="button"
            onClick={() => setMode('preset')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              mode === 'preset'
                ? 'bg-gold text-darkGreen shadow-md shadow-gold/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <CalendarDays size={16} />
            Timetable Schedule Preset (College Routine)
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              mode === 'custom'
                ? 'bg-gold text-darkGreen shadow-md shadow-gold/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Clock3 size={16} />
            Manual / Custom Session
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Session Date:</span>
          <input
            type="date"
            value={date}
            disabled={creating || saving || existingSession}
            onChange={(e) => {
              setDate(e.target.value);
              setSession(null);
            }}
            className="field py-1 px-3 text-xs [color-scheme:dark]"
          />
          <span className="rounded-lg bg-gold/15 border border-gold/30 px-2.5 py-1 text-xs font-bold uppercase text-gold">
            {dayOfWeekName}
          </span>
        </div>
      </div>

      {/* Preset Timetable Mode: Schedule & Period Selector */}
      {mode === 'preset' ? (
        <div className="space-y-4 rounded-2xl border border-gold/20 bg-gold/[0.04] p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Schedule:</span>
              {schedules.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setSelectedScheduleKey(s.key);
                    setSelectedSlot(null);
                    setSession(null);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    selectedScheduleKey === s.key
                      ? 'bg-gold text-darkGreen shadow-md shadow-gold/20'
                      : 'border border-white/10 bg-black/20 text-white/70 hover:text-white'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="field py-1 px-2 text-xs"
              >
                <option value="all">All Slots</option>
                <option value="academic">Academic Lectures</option>
                <option value="physical">Physical Training</option>
                <option value="games">Games & Sports</option>
                <option value="study">Study Hours</option>
              </select>
            </div>
          </div>

          {/* Periods Carousel / Grid */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">
              Click a scheduled period to load session & cadets for {dayOfWeekName}:
            </p>
            {loadingSlots ? (
              <p className="text-xs text-white/50">Loading scheduled periods…</p>
            ) : filteredTimetableSlots.length === 0 ? (
              <p className="text-xs text-white/50">No periods match for this day and category.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1">
                {filteredTimetableSlots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => selectTimetablePeriod(slot)}
                      className={`relative flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                        isSelected
                          ? 'border-gold bg-gold/25 text-white ring-1 ring-gold shadow-md shadow-gold/20'
                          : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-gold">
                        #{slot.slot_order} · {slot.time_display}
                      </span>
                      <span className="font-extrabold text-xs text-white mt-1 line-clamp-1" title={slot.activity}>
                        {slot.activity}
                      </span>
                      {slot.instructor && (
                        <span className="text-[10px] text-white/50 truncate w-full mt-0.5">
                          {slot.instructor}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Custom Session Manual Inputs */
        <div className="grid gap-3 border-b border-white/10 pb-5 md:grid-cols-3">
          <select
            data-testid="attendance-subject"
            value={subjectId}
            disabled={creating || saving}
            onChange={(event) => changeSubject(event.target.value)}
            className="field"
          >
            {subjects.map((subject) => (
              <option key={subject.id || subject._id} value={subject.id || subject._id}>
                {subject.name}
              </option>
            ))}
          </select>

          <input
            value={batch}
            disabled={creating || saving}
            onChange={(event) => {
              setBatch(event.target.value);
              setSession(null);
            }}
            placeholder="Batch / class (optional)"
            className="field"
          />

          <select
            value={sessionType}
            disabled={creating || saving || existingSession}
            onChange={(event) => setSessionType(event.target.value)}
            className="field"
          >
            {sessionTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <input
            type="time"
            value={startTime}
            disabled={creating || saving || existingSession}
            onChange={(event) => setStartTime(event.target.value)}
            aria-label="Session start time"
            className="field [color-scheme:dark]"
          />

          <input
            type="time"
            value={endTime}
            disabled={creating || saving || existingSession}
            onChange={(event) => setEndTime(event.target.value)}
            aria-label="Session end time"
            className="field [color-scheme:dark]"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          data-testid="create-attendance-session"
          onClick={createSession}
          disabled={!subjectId || creating || saving || existingSession}
          className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-sm font-bold text-darkGreen shadow-md shadow-gold/15 transition hover:bg-white disabled:opacity-50"
        >
          {creating ? <LoaderCircle className="animate-spin" size={16} /> : <Plus size={16} />}
          {creating ? 'Creating…' : 'Start Attendance Call'}
        </button>

        <button
          type="button"
          onClick={resetNewSession}
          disabled={creating || saving}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/5"
        >
          <RefreshCw size={16} />
          Reset / New
        </button>

        {session && (
          <>
            <button
              disabled={saving}
              onClick={() => setAllExceptLeave('present')}
              className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20 disabled:opacity-50"
            >
              Mark all present (except leave)
            </button>
            <button
              disabled={saving}
              onClick={() => setAllExceptLeave('absent')}
              className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-400/20 disabled:opacity-50"
            >
              Mark all absent (except leave)
            </button>
            <button
              data-testid="save-attendance"
              disabled={saving || !cadets.length}
              onClick={save}
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-1.5 text-sm font-bold text-darkGreen shadow-md shadow-gold/20 hover:bg-white disabled:opacity-50"
            >
              {saving && <LoaderCircle className="animate-spin" size={15} />}
              {saving ? 'Saving…' : existingSession ? 'Save Corrections' : 'Commit Attendance'}
            </button>
          </>
        )}
      </div>

      {message && (
        <p data-testid="attendance-message" className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/80">
          {message}
        </p>
      )}

      {/* Cadet Roster & Session History Grid */}
      <div className="grid gap-5 xl:grid-cols-[1fr_18rem]">
        {/* Cadet List */}
        <div className="max-h-[36rem] space-y-2.5 overflow-y-auto pr-1">
          {loadingCadets && (
            <p className="p-4 text-center text-sm text-white/50">Loading assigned cadets…</p>
          )}

          {!loadingCadets && cadets.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-white/50">
              No cadets assigned to this division or subject.
            </div>
          )}

          {cadets.map((cadet) => {
            const cId = idOf(cadet);
            const status = records[cId];
            const isOnLeave = cadet.is_on_leave;

            return (
              <div
                key={cId}
                className={`flex flex-col gap-3 rounded-2xl border p-3.5 transition sm:flex-row sm:items-center sm:justify-between ${
                  isOnLeave
                    ? 'border-cyan-400/30 bg-cyan-950/20'
                    : status === 'present'
                    ? 'border-emerald-500/20 bg-emerald-950/10'
                    : status === 'absent'
                    ? 'border-red-500/20 bg-red-950/10'
                    : 'border-white/10 bg-black/25'
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-white text-sm">{cadet.name}</p>
                    {cadet.roll_no && (
                      <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/60">
                        {cadet.roll_no}
                      </span>
                    )}
                    {isOnLeave && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-cyan-300">
                        <CalendarOff size={11} />
                        On Approved Leave (Full Day)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">
                    {cadet.email} {cadet.batch ? `· ${cadet.batch}` : ''}
                  </p>
                  {isOnLeave && (cadet.active_leave?.reason || cadet.leave_reason) && (
                    <p className="text-[11px] text-cyan-300/80 mt-1 italic">
                      Leave reason: "{cadet.active_leave?.reason || cadet.leave_reason}"
                    </p>
                  )}
                </div>

                {/* Status Marking Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {session && (
                    <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 p-1">
                      {/* Present */}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setRecords({ ...records, [cId]: 'present' })}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          status === 'present'
                            ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400'
                            : 'text-white/40 hover:text-white'
                        }`}
                        title="Mark Present"
                      >
                        <CheckCircle size={15} />
                        Present
                      </button>

                      {/* Absent */}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setRecords({ ...records, [cId]: 'absent' })}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          status === 'absent'
                            ? 'bg-red-500/30 text-red-300 ring-1 ring-red-400'
                            : 'text-white/40 hover:text-white'
                        }`}
                        title="Mark Absent"
                      >
                        <XCircle size={15} />
                        Absent
                      </button>

                      {/* Leave */}
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setRecords({ ...records, [cId]: 'leave' })}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          status === 'leave'
                            ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-400'
                            : 'text-white/40 hover:text-white'
                        }`}
                        title="Mark Excused Leave"
                      >
                        <CalendarOff size={14} />
                        Leave
                      </button>
                    </div>
                  )}

                  {/* Quick button to grant full day leave if not already on leave */}
                  {!isOnLeave && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => setLeaveModalCadet(cadet)}
                      className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-semibold text-white/50 hover:border-cyan-400/40 hover:text-cyan-300"
                      title="Grant official full-day leave for today"
                    >
                      Grant Day Leave
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Previous Sessions Sidebar */}
        <aside className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="flex items-center gap-2 font-semibold text-white text-sm">
            <Clock3 size={16} className="text-gold" />
            Previous Sessions
          </p>
          {loadingSessions ? (
            <p className="mt-3 text-xs text-white/50">Loading sessions…</p>
          ) : (
            <div className="mt-3 space-y-2 max-h-[30rem] overflow-y-auto pr-1">
              {sessions.slice(0, 15).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={saving}
                  onClick={() => openSession(item)}
                  className={`w-full rounded-xl border p-3 text-left text-xs transition ${
                    session?.id === item.id && existingSession
                      ? 'border-gold bg-gold/15 text-white'
                      : 'border-white/10 text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <p className="font-bold text-white truncate">{item.subject_name}</p>
                  <p className="mt-1 text-[11px] text-white/50">
                    {new Date(String(item.session_date).split('T')[0] + 'T00:00:00').toLocaleDateString()} ·{' '}
                    {item.session_type}
                    {item.start_time ? ` · ${item.start_time.slice(0, 5)}` : ''}
                  </p>
                  <p className="mt-1 text-[10px] text-gold font-semibold">
                    {item.record_count} records · Click to edit
                  </p>
                </button>
              ))}
              {!sessions.length && (
                <p className="text-xs text-white/50">No previous sessions found for this filter.</p>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* Direct Leave Grant Modal */}
      {leaveModalCadet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-white/20 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CalendarOff className="text-gold" size={18} />
                Grant Official Full-Day Leave
              </h3>
              <button
                type="button"
                onClick={() => setLeaveModalCadet(null)}
                className="rounded-lg p-1 text-white/50 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-white/70">
              Granting leave will excuse <strong className="text-white">{leaveModalCadet.name}</strong> for all scheduled sessions on{' '}
              <strong className="text-gold">{date}</strong> ({dayOfWeekName}).
            </p>

            <div className="space-y-2">
              <label className="text-xs text-white/50 block font-semibold">Leave Reason / Remarks:</label>
              <textarea
                value={directLeaveReason}
                onChange={(e) => setDirectLeaveReason(e.target.value)}
                placeholder="Reason for official leave approval..."
                className="field w-full text-xs min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLeaveModalCadet(null)}
                disabled={grantingLeave}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGrantDirectLeave}
                disabled={grantingLeave}
                className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2 text-xs font-bold text-darkGreen hover:bg-white disabled:opacity-60"
              >
                {grantingLeave && <LoaderCircle size={14} className="animate-spin" />}
                Confirm Full-Day Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
