import React from 'react';

const DURATIONS = [
  { label: '30s',  sec: 30,  sub: 'personal'  },
  { label: '1:00', sec: 60,  sub: 'technical'  },
  { label: '2:00', sec: 120, sub: '2 min'      },
  { label: '3:00', sec: 180, sub: '3 min'      },
];

// ── Styles first (TDZ fix) ────────────────────────────────────────────────────
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
    transition: 'transform .25s cubic-bezier(.32,.72,0,1)',
  },
  handle: {
    width: 36, height: 3, borderRadius: 2,
    background: 'var(--bdr)', margin: '0 auto 12px',
  },
  title: {
    fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '.8px', color: 'var(--txt2)', marginBottom: 12,
  },
  teamLbl: {
    fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '.8px', marginBottom: 6,
  },
  durGrid: { display: 'flex', gap: 5 },
  durBtn: {
    flex: 1, border: 'none', borderRadius: 10,
    padding: '11px 4px 9px', cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  durSec: { fontSize: 14, fontWeight: 800, color: '#fff' },
  durSub: { fontSize: 8,  fontWeight: 600, color: 'rgba(255,255,255,.5)' },
  cancel: {
    width: '100%', border: 'none', borderRadius: 10,
    padding: 12, background: 'var(--surf2)',
    color: 'var(--txt2)', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', marginTop: 10,
  },
};

export default function PenaltyDrawer({ isOpen, onPenaltyPick, onClose }) {
  if (!isOpen) return null;

  return (
    <>
      <div style={DS.overlay} onClick={onClose} />
      <div style={{ ...DS.drawer, transform: 'translateY(0)' }}>
        <div style={DS.handle} />
        <div style={DS.title}>Record Penalty</div>

        {/* Two-column team layout for 30s + 1:00 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
          {['us', 'them'].map(team => {
            const isUs = team === 'us';
            return (
              <div key={team}>
                <div style={{ ...DS.teamLbl, color: isUs ? 'var(--tp)' : 'var(--opp)' }}>
                  {isUs ? 'Us' : 'Them'}
                </div>
                <div style={DS.durGrid}>
                  {DURATIONS.slice(0, 2).map(d => (
                    <button
                      key={d.sec}
                      style={{ ...DS.durBtn, background: isUs ? 'var(--tp)' : 'var(--opp)' }}
                      onClick={() => onPenaltyPick(team, d.sec)}
                    >
                      <span style={DS.durSec}>{d.label}</span>
                      <span style={DS.durSub}>{d.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4-column layout for 2:00 + 3:00 (us/them interleaved) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 5, marginBottom: 4 }}>
          {DURATIONS.slice(2).flatMap(d =>
            ['us', 'them'].map(team => {
              const isUs = team === 'us';
              return (
                <button
                  key={`${d.sec}-${team}`}
                  style={{ ...DS.durBtn, background: isUs ? 'var(--tp)' : 'var(--opp)' }}
                  onClick={() => onPenaltyPick(team, d.sec)}
                >
                  <span style={DS.durSec}>{d.label}</span>
                  <span style={DS.durSub}>{isUs ? 'us' : 'them'}</span>
                </button>
              );
            })
          )}
        </div>

        <button style={DS.cancel} onClick={onClose}>Cancel</button>
      </div>
    </>
  );
}