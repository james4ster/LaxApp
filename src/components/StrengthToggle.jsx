import React from 'react';

const OPTIONS = [
  { key: 'man_down', label: 'Man Down', color: '#e53e3e' },
  { key: 'even', label: 'Even', color: 'var(--txt2)' },
  { key: 'man_up', label: 'Man Up', color: 'var(--tp)' },
];

export default function StrengthToggle({ strength, onChange }) {
  return (
    <div style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = strength === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              ...styles.btn,
              background: active ? opt.color : 'var(--surf2)',
              color: active ? '#fff' : 'var(--txt2)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  row: { display: 'flex', gap: 5, padding: '6px 6px 0' },
  btn: {
    flex: 1,
    border: 'none',
    borderRadius: 7,
    padding: '7px 0',
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background .12s, color .12s',
  },
};