import React from 'react';
import StatButton from './StatButton';

export default function StatSection({ id, label, stats, counts, onTap }) {
  return (
    <div style={styles.sec}>
      <div style={styles.header}>
        <span style={styles.headerLbl}>{label}</span>
        <div style={styles.headerLine} />
      </div>
      <div style={styles.body}>
        {stats.map((st) => (
          <StatButton
            key={st.key}
            statKey={st.key}
            label={st.label}
            sub={st.sub}
            color={st.color}
            count={counts[st.key] ?? 0}
            onTap={onTap}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  sec: {
    background: 'var(--surf)',
    borderRadius: 'var(--r)',
    border: '1px solid var(--bdr)',
    overflow: 'hidden',
  },
  header: {
    padding: '5px 10px 4px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  headerLbl: {
    fontSize: 9,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'var(--txt2)',
    whiteSpace: 'nowrap',
  },
  headerLine: { flex: 1, height: 1, background: 'var(--bdr)' },
  body: {
    padding: 6,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
  },
};
