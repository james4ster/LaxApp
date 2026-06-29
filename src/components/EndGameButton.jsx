import React, { useRef, useState, useCallback } from 'react';

const HOLD_MS = 1400;

export default function EndGameButton({ onConfirmed }) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  const cancel = useCallback(() => {
    setHolding(false);
    setProgress(0);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const tick = useCallback(() => {
    const elapsed = Date.now() - startRef.current;
    const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
    setProgress(pct);
    if (pct >= 100) {
      setHolding(false);
      setProgress(0);
      onConfirmed();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onConfirmed]);

  const start = useCallback(() => {
    setHolding(true);
    startRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  return (
    <button
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      style={styles.btn}
    >
      <div style={{ ...styles.fill, width: `${progress}%` }} />
      <span style={styles.lbl}>{holding ? 'Hold to end…' : 'End Game'}</span>
    </button>
  );
}

const styles = {
  btn: {
    position: 'relative',
    overflow: 'hidden',
    border: '1.5px solid #e53e3e',
    background: 'var(--surf)',
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
    flexShrink: 0,
    userSelect: 'none',
    touchAction: 'none',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    background: 'rgba(229,62,62,.25)',
    transition: 'width .05s linear',
    zIndex: 0,
  },
  lbl: { position: 'relative', zIndex: 1, fontSize: 11, fontWeight: 700, color: '#e53e3e' },
};