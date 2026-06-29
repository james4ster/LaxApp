import React from 'react';

export default function FinalScoreModal({ isOpen, scoreUs, scoreThem, onConfirm, onCancel }) {
  if (!isOpen) return null;

  const result = scoreUs > scoreThem ? 'WIN' : scoreUs < scoreThem ? 'LOSS' : 'TIE';

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.resultTag}>{result}</div>
        <div style={styles.title}>End Game?</div>
        <div style={styles.scoreRow}>
          <div style={styles.scoreBlock}>
            <div style={styles.scoreLbl}>US</div>
            <div style={styles.scoreNum}>{scoreUs}</div>
          </div>
          <div style={styles.dash}>–</div>
          <div style={styles.scoreBlock}>
            <div style={styles.scoreLbl}>THEM</div>
            <div style={styles.scoreNum}>{scoreThem}</div>
          </div>
        </div>
        <div style={styles.warn}>This will lock in the final score. This cannot be undone.</div>
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>End Game</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: 20,
  },
  card: { background: 'var(--surf)', borderRadius: 14, padding: '20px 18px', width: '100%', maxWidth: 320, textAlign: 'center' },
  resultTag: {
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
    color: 'var(--txt2)',
    border: '1px solid var(--bdr)',
    borderRadius: 6,
    padding: '2px 8px',
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: 800, color: 'var(--txt)', marginBottom: 14 },
  scoreRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 14 },
  scoreBlock: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  scoreLbl: { fontSize: 9, fontWeight: 700, color: 'var(--txt2)', letterSpacing: '.5px' },
  scoreNum: { fontSize: 32, fontWeight: 800, color: 'var(--txt)' },
  dash: { fontSize: 18, color: 'var(--txt2)' },
  warn: { fontSize: 11, color: 'var(--txt2)', marginBottom: 16, lineHeight: 1.4 },
  actions: { display: 'flex', gap: 8 },
  cancelBtn: { flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--bdr)', background: 'none', color: 'var(--txt)', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  confirmBtn: { flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#e53e3e', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
};