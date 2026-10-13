import React from 'react';

const s = {
  strip: {
    background: 'var(--ts)',
    padding: '6px 12px',
    paddingTop: 'max(6px, env(safe-area-inset-top))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    gap: 8,
  },
  scoreBlock: { display: 'flex', alignItems: 'center', gap: 5 },
  lbl: {
    fontSize: 9,
    fontWeight: 700,
    color: 'rgba(255,255,255,.4)',
    letterSpacing: '.6px',
    textTransform: 'uppercase',
  },
  numUs: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1,
    color: 'var(--ta)',
    fontVariantNumeric: 'tabular-nums',
  },
  numThem: {
    fontSize: 20,
    fontWeight: 800,
    lineHeight: 1,
    color: '#fff',
    fontVariantNumeric: 'tabular-nums',
  },
  dash: { fontSize: 12, color: 'rgba(255,255,255,.2)' },
  qtabs: { display: 'flex', gap: 2 },
  right: { display: 'flex', alignItems: 'center', gap: 5 },
  darkBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,.5)',
    fontSize: 15,
    cursor: 'pointer',
    padding: '2px 4px',
    lineHeight: 1,
  },
};

export default function ScoreStrip({
  scoreUs,
  scoreThem,
  quarter,
  onQuarterChange,
  isDark,
  onToggleDark,
}) {
  return (
    <div
      style={{
        ...s.strip,
        background: isDark ? 'var(--ts)' : 'var(--surf)',
        color: isDark ? '#fff' : 'var(--txt)',
        borderBottom: '1px solid var(--bdr)',
      }}
    >
      <div style={s.scoreBlock}>
        <span style={{ ...s.lbl, color: isDark ? 'rgba(255,255,255,.65)' : 'var(--txt2)' }}>Us</span>
        <span style={s.numUs}>{scoreUs}</span>
        <span style={{ ...s.dash, color: isDark ? 'rgba(255,255,255,.5)' : 'var(--txt2)' }}>–</span>
        <span style={{ ...s.numThem, color: isDark ? '#fff' : 'var(--txt)' }}>{scoreThem}</span>
        <span style={{ ...s.lbl, color: isDark ? 'rgba(255,255,255,.65)' : 'var(--txt2)' }}>Them</span>
      </div>

      <div style={s.qtabs}>
      {[1, 2, 3, 4, 'OT'].map((q) => (
          <button
            key={q}
            onClick={() => onQuarterChange(q)}
            disabled={!onQuarterChange}
            style={{
              padding: '3px 8px',
              borderRadius: 5,
              border: 'none',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.2px',
              background: quarter === q ? 'var(--ta)' : isDark ? 'rgba(255,255,255,.14)' : 'var(--surf2)',
              color: quarter === q ? 'var(--tat)' : isDark ? 'rgba(255,255,255,.8)' : 'var(--txt2)',
              transition: 'background .12s, color .12s',
              opacity: onQuarterChange ? 1 : 0.55,
              cursor: onQuarterChange ? 'pointer' : 'default',
            }}
            aria-pressed={quarter === q}
          >
            {q === 'OT' ? 'OT' : `Q${q}`}
          </button>
        ))}
      </div>

      <div style={s.right}>
        <div className="live-pip" />
        <button
          style={{
            ...s.darkBtn,
            background: isDark ? 'rgba(255,255,255,.14)' : 'var(--surf2)',
            color: isDark ? '#fff' : 'var(--txt)',
          }}
          onClick={onToggleDark}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}
