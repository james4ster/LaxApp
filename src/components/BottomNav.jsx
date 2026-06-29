import React from 'react';

const TABS = [
  { id: 'track', icon: '📋', label: 'Track' },
  { id: 'fan', icon: '📊', label: 'Live View' },
  { id: 'setup', icon: '⚙️', label: 'Setup' },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={styles.nav}>
      {TABS.map((t) => {
        const isOn = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={styles.btn}
          >
            <div style={styles.icon}>{t.icon}</div>
            <div
              style={{
                ...styles.label,
                color: isOn ? 'var(--tp)' : 'var(--txt2)',
              }}
            >
              {t.label}
            </div>
            <div style={{ ...styles.bar, display: isOn ? 'block' : 'none' }} />
          </button>
        );
      })}
    </nav>
  );
}

const styles = {
  nav: {
    background: 'var(--surf)',
    borderTop: '1px solid var(--bdr)',
    display: 'flex',
    flexShrink: 0,
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
  btn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px 4px 8px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    gap: 2,
  },
  icon: { fontSize: 19, lineHeight: 1 },
  label: { fontSize: 10, fontWeight: 600 },
  bar: {
    width: 18,
    height: 2,
    borderRadius: 2,
    background: 'var(--tp)',
    marginTop: 2,
  },
};
