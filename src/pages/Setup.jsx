import React from 'react';
import { COLOR_PRESETS, ROLE_LABELS } from '../lib/constants';

export default function Setup({
  role,
  onRoleChange,
  themeMode,
  onThemeChange,
  activePreset,
  onPresetChange,
  onCustomColors,
}) {
  return (
    <div style={styles.scroll} className="scroll-y">
      {/* ── Keeper Role ── */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Keeper Role</div>
        <div style={styles.roleGrid}>
          {Object.entries(ROLE_LABELS).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => onRoleChange(key)}
              style={{
                ...styles.roleBtn,
                borderColor: role === key ? 'var(--tp)' : 'var(--bdr)',
                background:
                  role === key ? 'rgba(26,107,58,.09)' : 'var(--surf2)',
              }}
            >
              <div style={styles.roleIcon}>{meta.icon}</div>
              <div style={styles.roleLabel}>{meta.label}</div>
              <div style={styles.roleSub}>{meta.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Team Colors ── */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Team Colors</div>
        <div style={styles.swatchRow}>
          {COLOR_PRESETS.map((pr, i) => (
            <div
              key={i}
              onClick={() => onPresetChange(i)}
              style={{
                ...styles.swatch,
                background: `linear-gradient(135deg, ${pr.p} 50%, ${pr.a} 50%)`,
                borderColor: activePreset === i ? 'var(--txt)' : 'transparent',
              }}
            />
          ))}
        </div>
        <div style={styles.pickerRow}>
          {[
            { id: 'primary', label: 'Primary' },
            { id: 'secondary', label: 'Dark bg' },
            { id: 'accent', label: 'Accent' },
          ].map(({ id, label }) => (
            <div key={id} style={styles.pickerGroup}>
              <div style={styles.pickerLabel}>{label}</div>
              <input
                type="color"
                id={`cp-${id}`}
                defaultValue={
                  id === 'primary'
                    ? '#1A6B3A'
                    : id === 'secondary'
                    ? '#0b2e16'
                    : '#8FD14F'
                }
                onInput={() => {
                  const p = document.getElementById('cp-primary').value;
                  const s = document.getElementById('cp-secondary').value;
                  const a = document.getElementById('cp-accent').value;
                  onCustomColors(p, s, a);
                }}
                style={styles.colorInput}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Theme ── */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Theme</div>
        <div style={styles.themeRow}>
          {[
            { id: 'light', icon: '☀️', label: 'Light' },
            { id: 'dark', icon: '🌙', label: 'Dark' },
            { id: 'system', icon: '📱', label: 'Auto' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => onThemeChange(t.id)}
              style={{
                ...styles.themeBtn,
                borderColor: themeMode === t.id ? 'var(--tp)' : 'var(--bdr)',
              }}
            >
              <div style={{ fontSize: 16 }}>{t.icon}</div>
              <div style={styles.themeBtnLabel}>{t.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Version ── */}
      <div
        style={{
          textAlign: 'center',
          fontSize: 10,
          color: 'var(--txt2)',
          paddingBottom: 8,
        }}
      >
        LaxTrack v1.0 — connect Supabase to go live
      </div>
    </div>
  );
}

const styles = {
  scroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '8px 9px 16px',
  },
  card: {
    background: 'var(--surf)',
    borderRadius: 13,
    border: '1px solid var(--bdr)',
    padding: '12px 12px 14px',
    marginBottom: 9,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '.8px',
    color: 'var(--txt2)',
    marginBottom: 10,
  },
  roleGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 },
  roleBtn: {
    border: '2px solid',
    borderRadius: 10,
    padding: '9px 7px',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    transition: 'all .12s',
  },
  roleIcon: { fontSize: 17 },
  roleLabel: { fontSize: 12, fontWeight: 700, color: 'var(--txt)' },
  roleSub: { fontSize: 10, color: 'var(--txt2)', lineHeight: 1.3 },
  swatchRow: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 8,
    cursor: 'pointer',
    border: '3px solid',
    transition: 'border-color .12s',
    flexShrink: 0,
  },
  pickerRow: { display: 'flex', gap: 8 },
  pickerGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    alignItems: 'center',
  },
  pickerLabel: { fontSize: 9, color: 'var(--txt2)', fontWeight: 500 },
  colorInput: {
    width: 42,
    height: 32,
    borderRadius: 6,
    border: '1px solid var(--bdr)',
    cursor: 'pointer',
    padding: 2,
    background: 'var(--surf2)',
  },
  themeRow: { display: 'flex', gap: 6 },
  themeBtn: {
    flex: 1,
    border: '2px solid',
    borderRadius: 9,
    padding: '8px 4px',
    cursor: 'pointer',
    background: 'var(--surf2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    transition: 'border-color .12s',
  },
  themeBtnLabel: { fontSize: 10, fontWeight: 600, color: 'var(--txt)' },
};
