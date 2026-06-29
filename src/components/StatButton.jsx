import React, { useState } from 'react';

const COLOR_MAP = {
  'c-lime': { background: 'var(--ta)', color: 'var(--tat)' },
  'c-green': { background: 'var(--tp)', color: 'var(--tpt)' },
  'c-slate': { background: 'var(--surf2)', color: 'var(--txt)' },
  'c-gray': { background: 'var(--surf3)', color: 'var(--txt)' },
  'c-red': { background: 'var(--danger)', color: '#fff' },
  'c-orange': { background: 'var(--warn)', color: '#fff' },
};

export default function StatButton({
  statKey,
  label,
  sub,
  color = 'c-slate',
  count,
  onTap,
}) {
  const [pressed, setPressed] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const { background, color: textColor } =
    COLOR_MAP[color] ?? COLOR_MAP['c-slate'];

  const handleTap = () => {
    setFlashing(true);
    setTimeout(() => setFlashing(false), 320);
    onTap(statKey);
  };

  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={handleTap}
      style={{
        border: 'none',
        borderRadius: 10,
        cursor: 'pointer',
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: pressed
          ? '0 0 0 rgba(0,0,0,.12)'
          : '0 3px 0 rgba(0,0,0,.20)',
        transform: pressed ? 'translateY(3px)' : 'translateY(0)',
        transition: 'transform .07s, box-shadow .07s',
      }}
    >
      {/* Inner face */}
      <div
        style={{
          width: '100%',
          padding: '10px 9px 8px',
          background,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.2,
            color: textColor,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            lineHeight: 1,
            color: textColor,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </div>
        <div
          style={{
            fontSize: 8,
            fontWeight: 600,
            opacity: 0.6,
            textTransform: 'uppercase',
            letterSpacing: '.3px',
            color: textColor,
          }}
        >
          {sub}
        </div>
      </div>

      {/* Flash overlay */}
      {flashing && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,.45)',
            animation: 'flash-fade .32s ease-out forwards',
            pointerEvents: 'none',
          }}
        />
      )}

      <style>{`@keyframes flash-fade { 0% { opacity: 1; } 100% { opacity: 0; } }`}</style>
    </button>
  );
}
