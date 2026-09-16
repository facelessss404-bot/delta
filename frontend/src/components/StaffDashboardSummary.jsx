import { AlertTriangle, BookOpen, ClipboardCheck, Dumbbell, TrendingUp, Users, Activity } from 'lucide-react';

/* ── Metric card — premium glass tile ─────────────────────────── */
const Metric = ({ icon: Icon, label, value, accent = false }) => (
  <div style={{
    background: accent
      ? 'linear-gradient(155deg, rgba(30,58,40,.95), rgba(18,42,30,.98))'
      : 'linear-gradient(155deg, rgba(20,46,34,.92), rgba(11,28,20,.96))',
    border: `1px solid ${accent ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.08)'}`,
    borderTop: `1px solid ${accent ? 'rgba(201,168,76,.3)' : 'rgba(255,255,255,.13)'}`,
    borderRadius: 18,
    padding: '20px 22px',
    boxShadow: accent
      ? '0 1px 0 rgba(201,168,76,.15) inset, 0 6px 24px rgba(0,0,0,.4), 0 0 0 1px rgba(201,168,76,.07)'
      : '0 1px 0 rgba(255,255,255,.06) inset, 0 4px 20px rgba(0,0,0,.35)',
    transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
  }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(201,168,76,.22)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,.08) inset, 0 10px 36px rgba(0,0,0,.45), 0 0 0 1px rgba(201,168,76,.1)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = accent ? 'rgba(201,168,76,.2)' : 'rgba(255,255,255,.08)'; e.currentTarget.style.boxShadow = accent ? '0 1px 0 rgba(201,168,76,.15) inset, 0 6px 24px rgba(0,0,0,.4)' : '0 1px 0 rgba(255,255,255,.06) inset, 0 4px 20px rgba(0,0,0,.35)'; }}
  >
    {/* background glow orb */}
    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(201,168,76,.05)', filter: 'blur(20px)', pointerEvents: 'none' }} />
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(201,168,76,.1)', border: '1px solid rgba(201,168,76,.15)',
        boxShadow: '0 2px 8px rgba(0,0,0,.3), 0 0 12px rgba(201,168,76,.1)',
      }}>
        <Icon size={18} style={{ color: '#C9A84C', filter: 'drop-shadow(0 0 4px rgba(201,168,76,.4))' }} />
      </div>
    </div>
    <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#F0EFE8', letterSpacing: '-0.03em', lineHeight: 1 }}>
      {value}
    </p>
    <p style={{ margin: '6px 0 0', fontSize: 12.5, color: 'rgba(240,239,232,.45)', fontWeight: 500, letterSpacing: '0.01em' }}>
      {label}
    </p>
  </div>
);

/* ── Attendance progress row ───────────────────────────────────── */
const SubjectRow = ({ subject }) => {
  const pct = Math.min(Number(subject.percentage) || 0, 100);
  const color = pct >= 75 ? '#34D399' : pct >= 50 ? '#C9A84C' : '#F87171';
  return (
    <div style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{ fontSize: 13.5, color: '#F0EFE8', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{subject.name}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '-0.01em', flexShrink: 0 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          width: `${pct}%`,
          background: pct >= 75
            ? 'linear-gradient(90deg, #1a9e62, #34D399)'
            : pct >= 50
            ? 'linear-gradient(90deg, #9D7A2A, #C9A84C, #E8C86A)'
            : 'linear-gradient(90deg, #c0392b, #F87171)',
          boxShadow: `0 0 8px ${color}55`,
          transition: 'width .6s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>
    </div>
  );
};

/* ── Mark / update row ─────────────────────────────────────────── */
const MarkRow = ({ mark }) => {
  const pct = mark.max_marks ? Math.round((mark.marks / mark.max_marks) * 100) : 0;
  return (
    <div style={{
      borderRadius: 12, padding: '12px 14px',
      background: 'linear-gradient(145deg, rgba(18,42,30,.85), rgba(10,26,18,.9))',
      border: '1px solid rgba(255,255,255,.06)',
      borderTop: '1px solid rgba(255,255,255,.1)',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#F0EFE8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mark.cadet_name}</p>
          <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'rgba(240,239,232,.4)' }}>{mark.assessment_title} · {mark.subject_name || 'General'}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#C9A84C', letterSpacing: '-0.02em' }}>{mark.marks}<span style={{ fontSize: 11, color: 'rgba(201,168,76,.5)', fontWeight: 500 }}>/{mark.max_marks}</span></p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: pct >= 75 ? '#34D399' : pct >= 50 ? '#C9A84C' : '#F87171', fontWeight: 600 }}>{pct}%</p>
        </div>
      </div>
    </div>
  );
};

/* ── Alert row ─────────────────────────────────────────────────── */
const AlertRow = ({ alert, index }) => (
  <div style={{
    borderRadius: 10, padding: '10px 14px',
    background: 'linear-gradient(135deg, rgba(201,168,76,.07), rgba(201,168,76,.03))',
    border: '1px solid rgba(201,168,76,.18)',
    marginBottom: 8,
    display: 'flex', alignItems: 'flex-start', gap: 10,
  }}>
    <AlertTriangle size={14} style={{ color: '#C9A84C', flexShrink: 0, marginTop: 1, filter: 'drop-shadow(0 0 4px rgba(201,168,76,.4))' }} />
    <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,239,232,.75)', lineHeight: 1.5 }}>{alert.message}</p>
  </div>
);

/* ── Section card wrapper ──────────────────────────────────────── */
const Card = ({ title, icon: Icon, children, style = {} }) => (
  <section style={{
    background: 'linear-gradient(155deg, rgba(20,46,34,.9), rgba(11,28,20,.95))',
    border: '1px solid rgba(255,255,255,.07)',
    borderTop: '1px solid rgba(255,255,255,.12)',
    borderRadius: 20,
    padding: '22px 24px',
    boxShadow: '0 1px 0 rgba(255,255,255,.06) inset, 0 4px 24px rgba(0,0,0,.3)',
    ...style,
  }}>
    <h2 style={{ margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.5, fontWeight: 700, color: '#F0EFE8', letterSpacing: '-0.01em' }}>
      {Icon && <Icon size={16} style={{ color: '#C9A84C', filter: 'drop-shadow(0 0 4px rgba(201,168,76,.35))' }} />}
      {title}
    </h2>
    {children}
  </section>
);

/* ── Main export ───────────────────────────────────────────────── */
export default function StaffDashboardSummary({ data, loading, error }) {
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{ height: 120, borderRadius: 18, background: 'rgba(255,255,255,.025)', animation: 'shimmer 2s ease-in-out infinite', backgroundSize: '400% 100%' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} style={{ height: 200, borderRadius: 20, background: 'rgba(255,255,255,.02)', animation: 'shimmer 2s ease-in-out infinite' }} />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ borderRadius: 14, padding: '14px 18px', background: 'linear-gradient(135deg, rgba(248,113,113,.08), rgba(248,113,113,.04))', border: '1px solid rgba(248,113,113,.2)', color: '#F87171', fontSize: 14 }}>
      {error}
    </div>
  );

  const stats = data?.stats || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        <Metric icon={Users} label="Total cadets" value={stats.total_cadets ?? 0} />
        <Metric icon={Users} label="Active admins" value={stats.active_admins ?? 0} />
        <Metric icon={ClipboardCheck} label="Overall attendance" value={`${stats.overall_attendance_percentage ?? 0}%`} accent />
        <Metric icon={Dumbbell} label="Pending reviews" value={stats.pending_physical_reviews ?? 0} />
      </div>

      {/* Detail panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
        <Card title="Subject attendance" icon={BookOpen}>
          {data?.subjectWiseAttendance?.length
            ? data.subjectWiseAttendance.map(s => <SubjectRow key={s.subject_id} subject={s} />)
            : <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,239,232,.35)' }}>No attendance data yet.</p>
          }
        </Card>

        <Card title="Recent academic updates" icon={Activity}>
          {data?.recentAcademicUpdates?.length
            ? data.recentAcademicUpdates.map(m => <MarkRow key={m.id} mark={m} />)
            : <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,239,232,.35)' }}>No marks recorded yet.</p>
          }
        </Card>

        <Card title="Alerts & exceptions" icon={AlertTriangle}>
          {data?.alerts?.length
            ? data.alerts.map((a, i) => <AlertRow key={`${a.type}-${i}`} alert={a} index={i} />)
            : <p style={{ margin: 0, fontSize: 13, color: 'rgba(240,239,232,.35)' }}>No current exceptions.</p>
          }
        </Card>
      </div>
    </div>
  );
}
