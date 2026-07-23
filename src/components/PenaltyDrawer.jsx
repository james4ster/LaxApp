import React from 'react';

const DURATIONS = [
  { label: '0:30', sec: 30,  sub: 'personal'  },
  { label: '1:00', sec: 60,  sub: 'technical'  },
  { label: '2:00', sec: 120, sub: '2 min'      },
  { label: '3:00', sec: 180, sub: '3 min'      },
];

const DS = {
  overlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,.55)',
    zIndex: 30,
  },
  drawer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'var(--surf)',
    borderRadius: '18px 18px 0 0',
    borderTop: '1px solid var(--bdr)',
    padding: '10px 12px 22px',
    zIndex: 31,
  },
  handle: {
    width: 36, height: 3, borderRadius: 2,
    background: 'var(--bdr)', margin: '0 auto 12px',
  },
  title: {
    fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '.8px', color: 'var(--txt2)', marginBottom: 14,
  },
  teamHdr: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: 8, marginBottom: 6,
  },
  teamLbl: {
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '.8px', textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 6,
    marginBottom: 10,
  },
  durBtn: {
    border: 'none', borderRadius: 10,
    padding: '11px 4px 10px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 3,
  },
  durSec: { fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1 },
  durSub: { fontSize: 8,  fontWeight: 600, color: 'rgba(255,255,255,.55)' },
  divider: {
    height: 1, background: 'var(--bdr)', margin: '10px 0',
  },
  cancel: {
    width: '100%', border: 'none', borderRadius: 10,
    padding: 12, background: 'var(--surf2)',
    color: 'var(--txt2)', fontSize: 12, fontWeight: 700,
    cursor: 'pointer',
  },
};

export default function PenaltyDrawer({ isOpen, onPenaltyPick, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div style={DS.overlay} onClick={onClose} />
      <div style={DS.drawer}>
        <div style={DS.handle} />
        <div style={DS.title}>Record Penalty</div>

        {/* Column headers */}
        <div style={DS.teamHdr}>
          <div style={{ ...DS.teamLbl, color: 'var(--tp)' }}>← Us</div>
          <div style={{ ...DS.teamLbl, color: 'var(--opp-acc)' }}>Them →</div>
        </div>

        {/*
          4-column grid: [Us dur1] [Them dur1] [Us dur2] [Them dur2]
          Laid out as pairs per row — each row = one duration, both teams
        */}
        {DURATIONS.map(d => (
          <div key={d.sec} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
            <button
              style={{ ...DS.durBtn, background: 'var(--tp)' }}
              onClick={() => onPenaltyPick('us', d.sec)}
            >
              <span style={DS.durSec}>{d.label}</span>
              <span style={DS.durSub}>{d.sub}</span>
            </button>
            <button
              style={{ ...DS.durBtn, background: 'var(--opp)' }}
              onClick={() => onPenaltyPick('them', d.sec)}
            >
              <span style={DS.durSec}>{d.label}</span>
              <span style={DS.durSub}>{d.sub}</span>
            </button>
          </div>
        ))}

        <div style={DS.divider} />
        <button style={DS.cancel} onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}