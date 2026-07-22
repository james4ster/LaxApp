import React, { useState } from 'react';

export default function GoalieBar({
  goalies,
  activeGoalie,
  onChangeGoalie,
  saves,
  ga,
  svPct,
  playerStats,
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (g) => {
    onChangeGoalie(g);
    setOpen(false);
  };

  return (
    <div style={styles.bar}>
      {/* Main row */}
      <div style={styles.main}>
        <div style={styles.left}>
          <div>
            <div style={styles.lbl}>Active Goalie</div>
            <div style={styles.name}>
              {activeGoalie ? `#${activeGoalie.num} ${activeGoalie.name}` : '–'}
            </div>
          </div>
          <div style={styles.stats}>
            {saves} sv · {ga} GA · {svPct}
          </div>
        </div>
        <button onClick={() => setOpen((o) => !o)} style={styles.changeBtn}>
          {open ? 'Done ↑' : 'Change ↕'}
        </button>
      </div>

      {/* Inline dropdown */}
      {open && (
        <div style={styles.dropdown}>
          {goalies.map((g) => {
            const isActive = g.id === activeGoalie?.id;
            return (
              <div
                key={g.id}
                onClick={() => handleSelect(g)}
                style={{
                  ...styles.ddItem,
                  borderColor: isActive ? 'var(--tp)' : 'var(--bdr)',
                  background: isActive ? 'rgba(26,107,58,.08)' : 'var(--surf2)',
                }}
              >
                <div style={styles.ddNum}>#{g.num}</div>
                <div style={styles.ddName}>{g.name}</div>
                <div style={styles.ddStats}>
                  {(() => {
                    const gs = playerStats[g.id] ?? {};
                    const played = (gs.shots ?? 0) > 0 || (gs.ga ?? 0) > 0;

                    if (!played) return 'Not yet played';

                    const goalieSaves = Math.max(
                      0,
                      (gs.shots ?? 0) - (gs.ga ?? 0)
                    );

                    return `${goalieSaves} sv · ${gs.ga ?? 0} GA`;
                  })()}
                </div>
                {isActive && <div style={styles.ddCheck}>✓</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  bar: {
    background: 'var(--surf)',
    borderRadius: 'var(--r)',
    border: '1px solid var(--bdr)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  main: {
    padding: '7px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { display: 'flex', alignItems: 'center', gap: 8 },
  lbl: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.8px',
    color: 'var(--txt2)',
  },
  name: { fontSize: 13, fontWeight: 700, color: 'var(--txt)' },
  stats: { fontSize: 10, color: 'var(--txt2)' },
  changeBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--tp)',
    background: 'none',
    border: '1px solid var(--tp)',
    borderRadius: 7,
    padding: '4px 9px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  dropdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    padding: '6px 8px 7px',
    borderTop: '1px solid var(--bdr)',
  },
  ddItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '8px 9px',
    borderRadius: 9,
    border: '1.5px solid',
    cursor: 'pointer',
    transition: 'border-color .12s, background .12s',
  },
  ddNum: { fontSize: 13, fontWeight: 800, color: 'var(--txt)', minWidth: 28 },
  ddName: { fontSize: 12, fontWeight: 600, color: 'var(--txt)', flex: 1 },
  ddStats: { fontSize: 10, color: 'var(--txt2)' },
  ddCheck: { color: 'var(--tp)', fontSize: 13, fontWeight: 700 },
};
