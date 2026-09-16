import { motion } from 'framer-motion';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SubjectCard = ({ subjectName, category, present, absent, total, percentage: recordedPercentage, onViewDetails }) => {
  const percentage = total === 0 ? 0 : Math.round((present / total) * 100);
  const exactPercentage = recordedPercentage ?? (total === 0 ? 0 : ((present / total) * 100).toFixed(1));

  /* — colour semantics — */
  const isGood = percentage >= 75;
  const isWarn = percentage >= 50 && percentage < 75;
  const isBad = percentage < 50;

  const ringColor = isGood ? '#34D399' : isWarn ? '#C9A84C' : '#F87171';
  const ringGlow = isGood ? 'rgba(52,211,153,.35)' : isWarn ? 'rgba(201,168,76,.35)' : 'rgba(248,113,113,.35)';
  const TrendIcon = isGood ? TrendingUp : isBad ? TrendingDown : Minus;

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: .22, ease: [.25,.1,.25,1] }}
      style={{
        background: 'linear-gradient(155deg, rgba(20,48,35,.93), rgba(10,26,18,.97))',
        border: '1px solid rgba(255,255,255,.07)',
        borderTop: '1px solid rgba(255,255,255,.13)',
        borderRadius: 22,
        padding: '24px 22px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(255,255,255,.06) inset, 0 4px 24px rgba(0,0,0,.35)',
        cursor: 'default',
      }}
    >
      {/* Background gradient tint based on status */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 22,
        background: isGood
          ? 'radial-gradient(ellipse at 80% 0%, rgba(52,211,153,.05) 0%, transparent 60%)'
          : isBad
          ? 'radial-gradient(ellipse at 80% 0%, rgba(248,113,113,.04) 0%, transparent 60%)'
          : 'radial-gradient(ellipse at 80% 0%, rgba(201,168,76,.04) 0%, transparent 60%)',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, position: 'relative' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#F0EFE8', letterSpacing: '-0.01em', lineHeight: 1.25 }}>{subjectName}</p>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: 'rgba(240,239,232,.4)', textTransform: 'capitalize', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendIcon size={12} style={{ color: ringColor }} />
            {category || 'Academic'}
          </p>
        </div>

        {/* Circular progress ring */}
        <div
          aria-label={`${percentage}% attendance`}
          style={{
            position: 'relative',
            width: 74, height: 74, flexShrink: 0,
            borderRadius: '50%',
            background: `conic-gradient(${ringColor} ${percentage * 3.6}deg, rgba(255,255,255,.07) 0)`,
            boxShadow: `0 0 20px ${ringGlow}, 0 2px 8px rgba(0,0,0,.4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(145deg, rgba(14,34,24,.98), rgba(8,22,16,1))',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: ringColor, letterSpacing: '-0.03em', lineHeight: 1 }}>{percentage}<span style={{ fontSize: 9, fontWeight: 600 }}>%</span></span>
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 20 }}>
        <div style={{ borderRadius: 11, padding: '10px 6px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F0EFE8', letterSpacing: '-0.02em' }}>{total}</p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(240,239,232,.4)', fontWeight: 500 }}>Total</p>
        </div>
        <div style={{ borderRadius: 11, padding: '10px 6px', background: 'rgba(52,211,153,.07)', border: '1px solid rgba(52,211,153,.15)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#34D399', letterSpacing: '-0.02em' }}>{present}</p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(52,211,153,.6)', fontWeight: 500 }}>Present</p>
        </div>
        <div style={{ borderRadius: 11, padding: '10px 6px', background: 'rgba(248,113,113,.06)', border: '1px solid rgba(248,113,113,.14)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F87171', letterSpacing: '-0.02em' }}>{absent}</p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(248,113,113,.6)', fontWeight: 500 }}>Absent</p>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(240,239,232,.38)', fontWeight: 500 }}>Recorded: {exactPercentage}%</p>
        {onViewDetails && (
          <button
            type="button" onClick={onViewDetails}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 12.5, fontWeight: 700, color: '#C9A84C',
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
              transition: 'color .15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#E8C86A'}
            onMouseLeave={e => e.currentTarget.style.color = '#C9A84C'}
          >
            View details <ChevronRight size={14} />
          </button>
        )}
      </div>
    </motion.article>
  );
};

export default SubjectCard;
