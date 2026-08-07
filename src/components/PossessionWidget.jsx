import React from 'react';

function fmtMs(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

export default function PossessionWidget({ possState, usMs, themMs, onSetPoss }) {
  const isLive = possState !== 'none';

  return (
    <div style={styles.widget}>
      <div style={styles.header}>
        <span style={styles.headerLbl}>Possession</span>
        <div style={styles.headerLine} />
        {isLive && (
          <span>
            <span className="live-dot-sm" />
          </span>
        )}
      </div>

      <div style={styles.body}>
        <PossBtn
          label="US"
          active={possState === 'us'}
          totalMs={usMs}
          onTap={() => onSetPoss('us')}
          colorClass="us"
        />
        <div style={styles.mid}>
          <button
            onClick={() => onSetPoss('none')}
            style={{
              ...styles.noneBtn,
              background: possState === 'none' ? 'var(--surf3)' : 'var(--surf2)',
              color: possState === 'none' ? 'var(--txt)' : 'var(--txt2)',
            }}
          >
            NONE
          </button>
        </div>
        <PossBtn
          label="THEM"
          active={possState === 'them'}
          totalMs={themMs}
          onTap={() => onSetPoss('them')}
          colorClass="them"
        />
      </div>
    </div>
  );
}

function PossBtn({ label, active, totalMs, onTap, colorClass }) {
  const isUs = colorClass === 'us';

  return (
    <button
      onClick={onTap}
      style={{
        ...styles.possBtn,
        background: isUs ? 'var(--tp)' : 'var(--surf3)',
        boxShadow: active
          ? `0 0 0 2.5px ${isUs ? 'var(--ta)' : '#e53e3e'}, 0 3px 0 rgba(0,0,0,.18)`
          : '0 3px 0 rgba(0,0,0,.18)',
      }}
    >
      <div style={{ ...styles.possBtnLbl, color: isUs ? 'var(--tpt)' : 'var(--txt)' }}>
        {label}
      </div>
      <div style={{ ...styles.possTime, color: isUs ? 'var(--ta)' : 'var(--txt)' }}>
        {fmtMs(totalMs)}
      </div>
    </button>
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
  body: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: 5,
    padding: '6px 6px 8px',
    alignItems: 'center',
  },
  possBtn: {
    border: 'none',
    borderRadius: 10,
    cursor: 'pointer',
    padding: '10px 6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    transition: 'transform .07s, box-shadow .07s',
  },
  possBtnLbl: { fontSize: 10, fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase' },
  possTime: { fontSize: 22, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
  mid: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 },
  noneBtn: {
    border: 'none',
    borderRadius: 8,
    fontSize: 9,
    fontWeight: 700,
    padding: '5px 7px',
    cursor: 'pointer',
    letterSpacing: '.3px',
  },
};