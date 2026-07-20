import React, { useState } from 'react';

const DURATIONS = [
  { label: '0:30', sec: 30 },
  { label: '1:00', sec: 60 },
  { label: '2:00', sec: 120 },
  { label: '3:00', sec: 180 },
];

export default function PenaltyPad({ onPenaltyPick, disabled }) {
  const [pendingTeam, setPendingTeam] = useState(null); // 'us' | 'them' | null

  const handleTeam = (team) => {
    if (disabled) return;
    setPendingTeam(pendingTeam === team ? null : team);
  };

  const handleDur = (sec) => {
    if (!pendingTeam || disabled) return;
    onPenaltyPick?.(pendingTeam, sec);
    setPendingTeam(null);
  };

  return (
    <div style={S.widget}>
      {/* Header */}
      <div style={S.head}>
        <span style={S.lbl}>Penalties</span>
        <div style={S.rule} />
        {pendingTeam && (
          <span style={S.hint}>pick duration</span>
        )}
      </div>

      {/* Team buttons */}
      <div style={S.teamRow}>
        <button
          style={{
            ...S.teamBtn,
            background: pendingTeam === 'us' ? 'var(--tp)' : 'var(--pen-us, #7c3f00)',
            opacity: disabled ? 0.45 : 1,
            boxShadow: pendingTeam === 'us'
              ? '0 0 0 2px var(--ta)'
              : '0 2px 0 rgba(0,0,0,.25)',
          }}
          onClick={() => handleTeam('us')}
        >
          <span style={{ ...S.teamLbl, color: '#fff' }}>Penalty — Us</span>
        </button>
        <button
          style={{
            ...S.teamBtn,
            background: pendingTeam === 'them' ? '#c0392b' : 'var(--opp, #8B1C1C)',
            opacity: disabled ? 0.45 : 1,
            boxShadow: pendingTeam === 'them'
              ? '0 0 0 2px #ff8080'
              : '0 2px 0 rgba(0,0,0,.25)',
          }}
          onClick={() => handleTeam('them')}
        >
          <span style={{ ...S.teamLbl, color: '#fff' }}>Penalty — Them</span>
        </button>
      </div>

      {/* Duration row — slides in when team is picked */}
      {pendingTeam && (
        <div style={S.durRow}>
          {DURATIONS.map((d) => (
            <button
              key={d.sec}
              style={S.durBtn}
              onClick={() => handleDur(d.sec)}
            >
              {d.label}
            </button>
          ))}
          <button
            style={{ ...S.durBtn, color: 'var(--txt2)', fontSize: 10 }}
            onClick={() => setPendingTeam(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

const S = {
  widget: {
    background: 'var(--surf)',
    borderRadius: 11,
    border: '1px solid var(--bdr)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '4px 9px 3px',
  },
  lbl: {
    fontSize: 9,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--txt2)',
    flexShrink: 0,
  },
  rule: {
    flex: 1,
    height: 1,
    background: 'var(--bdr)',
  },
  hint: {
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--ta)',
    flexShrink: 0,
    animation: 'lax-flash 1.2s ease-in-out infinite alternate',
  },
  teamRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    padding: '0 5px 5px',
  },
  teamBtn: {
    border: 'none',
    borderRadius: 9,
    padding: '9px 6px',
    cursor: 'pointer',
    transition: 'box-shadow .12s, transform .07s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLbl: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1,
  },
  durRow: {
    display: 'flex',
    gap: 5,
    padding: '0 5px 5px',
  },
  durBtn: {
    flex: 1,
    border: '1px solid var(--bdr)',
    background: 'var(--surf2)',
    color: 'var(--txt)',
    borderRadius: 8,
    padding: '7px 0',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background .1s',
  },
};