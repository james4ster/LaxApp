import React, { useState } from 'react';

const DURATIONS = [
  { label: '0:30', sec: 30 },
  { label: '1:00', sec: 60 },
  { label: '2:00', sec: 120 },
  { label: '3:00', sec: 180 },
];

export default function PenaltyPad({ onRecordPenalty }) {
  const [pendingTeam, setPendingTeam] = useState(null); // 'us' | 'them' | null

  const handlePick = (sec) => {
    if (pendingTeam) onRecordPenalty(pendingTeam, sec);
    setPendingTeam(null);
  };

  return (
    <div style={styles.widget}>
      <div style={styles.header}>
        <span style={styles.headerLbl}>Penalties</span>
        <div style={styles.headerLine} />
      </div>

      <div style={styles.body}>
        <button
          style={{ ...styles.bigBtn, background: '#7C3F00' }}
          onClick={() => setPendingTeam(pendingTeam === 'us' ? null : 'us')}
        >
          Penalty — Us
        </button>
        <button
          style={{ ...styles.bigBtn, background: '#B22222' }}
          onClick={() => setPendingTeam(pendingTeam === 'them' ? null : 'them')}
        >
          Penalty — Them
        </button>
      </div>

      {pendingTeam && (
        <div style={styles.durRow}>
          {DURATIONS.map((d) => (
            <button key={d.sec} style={styles.durBtn} onClick={() => handlePick(d.sec)}>
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  widget: {
    background: 'var(--surf)',
    borderRadius: 'var(--r)',
    border: '1px solid var(--bdr)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  header: { padding: '5px 10px 3px', display: 'flex', alignItems: 'center', gap: 6 },
  headerLbl: {
    fontSize: 9,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'var(--txt2)',
  },
  headerLine: { flex: 1, height: 1, background: 'var(--bdr)' },
  body: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: 6 },
  bigBtn: {
    border: 'none',
    borderRadius: 9,
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    padding: '12px 0',
    cursor: 'pointer',
  },
  durRow: { display: 'flex', gap: 6, padding: '0 6px 8px' },
  durBtn: {
    flex: 1,
    border: '1px solid var(--bdr)',
    background: 'var(--surf2)',
    color: 'var(--txt)',
    borderRadius: 7,
    padding: '7px 0',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  },
};