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
    <div style={s.strip}>
      <div style={s.scoreBlock}>
        <span style={s.lbl}>Us</span>
        <span style={s.numUs}>{scoreUs}</span>
        <span style={s.dash}>–</span>
        <span style={s.numThem}>{scoreThem}</span>
        <span style={s.lbl}>Them</span>
      </div>

      <div style={s.qtabs}>
        {[1, 2, 3, 4].map((q) => (
          <button
            key={q}
            onClick={() => onQuarterChange(q)}
            style={{
              padding: '3px 8px',
              borderRadius: 5,
              border: 'none',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.2px',
              cursor: 'pointer',
              background: quarter === q ? 'var(--ta)' : 'rgba(255,255,255,.1)',
              color: quarter === q ? 'var(--tat)' : 'rgba(255,255,255,.3)',
              transition: 'background .12s, color .12s',
            }}
          >
            Q{q}
          </button>
        ))}
      </div>

      <div style={s.right}>
        <div className="live-pip" />
        <button
          style={s.darkBtn}
          onClick={onToggleDark}
          aria-label="Toggle dark mode"
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    </div>
  );
}
