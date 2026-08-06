import React from 'react';

/**
 * TeamSetup — step 1 of onboarding wizard.
 *
 * Logo upload now lives entirely in the "Team logo" step on the Dashboard
 * (it needs a real team.id to attach to, so it never worked well here
 * anyway). This component is just name / gender / season / colors.
 *
 * Props:
 *   team          — teamData object from useTeamSetup
 *   onFieldChange — (field, value) => void
 *   onCreate      — () => void (save new team)
 *   onUpdate      — () => void (save existing team)
 *   saving        — bool
 *   saved         — bool
 *   error         — string | null
 *   teamId        — string | null (null = new team)
 */

// Only used to tidy up on blur if the coach hand-types something messy
// (mixed case, spaces, punctuation). Live auto-fill from name happens
// in useTeamSetup itself.
const slugify = (str) =>
  (str ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export default function TeamSetup({
  team,
  onFieldChange,
  onCreate,
  onUpdate,
  saving,
  saved,
  error,
  teamId,
}) {
  const handleSave = () => {
    if (teamId) onUpdate?.();
    else        onCreate?.();
  };

  return (
    <div style={S.wrap}>

      <div style={S.section}>
        <div style={S.field}>
          <label style={S.label}>Team name *</label>
                    <input
            style={S.input}
            value={team.name}
            onChange={e => onFieldChange('name', e.target.value)}
            placeholder="e.g. Lakewood Lax"
          />
        </div>

        <div style={S.field}>
          <label style={S.label}>URL slug</label>
          <input
            style={S.input}
            value={team.slug || ''}
            onChange={e => onFieldChange('slug', e.target.value)}
            onBlur={e => onFieldChange('slug', slugify(e.target.value))}
            placeholder="lakewood-lax"
          />
          <div style={S.slugHint}>
            laxtrack.app/t/{team.slug || '…'}
          </div>
        </div>

        <div style={S.row}>
          <div style={{ ...S.field, flex: 1 }}>
            <label style={S.label}>Gender</label>
            <div style={S.segmented}>
              {['Boys', 'Girls'].map(g => (
                <button
                  key={g}
                  onClick={() => onFieldChange('gender', g.toLowerCase())}
                  style={{
                    ...S.segBtn,
                    background: team.gender === g.toLowerCase()
                      ? 'var(--tp)' : 'var(--surf2)',
                    color: team.gender === g.toLowerCase()
                      ? 'var(--tpt)' : 'var(--txt2)',
                    borderColor: team.gender === g.toLowerCase()
                      ? 'var(--tp)' : 'var(--bdr)',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Season year</label>
            <input
              style={{ ...S.input, width: 100 }}
              type="number"
              value={team.season_year}
              onChange={e => onFieldChange('season_year', Number(e.target.value))}
              min={2020}
              max={2035}
            />
          </div>
        </div>
      </div>

      <div style={S.section}>
        <div style={S.sectionTitle}>Team Colors</div>
        <div style={S.colorRow}>
          {[
            { field: 'primary_color',   label: 'Primary'  },
            { field: 'secondary_color', label: 'Dark bg'  },
            { field: 'accent_color',    label: 'Accent'   },
          ].map(({ field, label }) => (
            <div key={field} style={S.colorGroup}>
              <label style={S.label}>{label}</label>
              <input
                type="color"
                value={team[field]}
                onChange={e => onFieldChange(field, e.target.value)}
                style={S.colorInput}
              />
            </div>
          ))}

          {/* Live mini-preview */}
          <div style={S.colorPreview}>
            <div style={{ ...S.previewBar, background: team.secondary_color }}>
              <div style={{ ...S.previewScore, color: team.accent_color }}>7</div>
              <div style={S.previewDash}>–</div>
              <div style={{ ...S.previewScore, color: '#fff' }}>5</div>
            </div>
            <div style={{ ...S.previewBtn, background: team.primary_color }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Goal For</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div style={S.errorMsg}>{error}</div>}

      <div style={S.saveBar}>
        <div style={S.saveHint}>
          {saved ? '✓ Saved' : teamId ? 'Unsaved changes' : 'Fill in your team details to continue'}
        </div>
        <button
          style={{
            ...S.saveBtn,
            opacity: saving || !team.name ? 0.5 : 1,
          }}
          onClick={handleSave}
          disabled={saving || !team.name}
        >
          {saving ? 'Saving…' : teamId ? 'Save changes' : 'Create team →'}
        </button>
      </div>
    </div>
  );
}

/* ── Styles ── */
const S = {
  wrap: {
    display:       'flex',
    flexDirection: 'column',
    gap:           16,
  },
  section: {
    background:   'var(--surf)',
    borderRadius: 14,
    border:       '1px solid var(--bdr)',
    padding:      '16px 18px',
    display:      'flex',
    flexDirection:'column',
    gap:          14,
  },
  sectionTitle: {
    fontSize:      11,
    fontWeight:    800,
    textTransform: 'uppercase',
    letterSpacing: '.8px',
    color:         'var(--txt2)',
    marginBottom:  2,
  },

  /* Fields */
  row:   { display: 'flex', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 11, fontWeight: 600, color: 'var(--txt2)' },
  input: {
    background:   'var(--surf2)',
    border:       '1px solid var(--bdr)',
    borderRadius: 8,
    padding:      '8px 10px',
    fontSize:     13,
    color:        'var(--txt)',
    outline:      'none',
    width:        '100%',
  },
  segmented: { display: 'flex', gap: 5 },
  segBtn: {
    flex:         1,
    border:       '1.5px solid',
    borderRadius: 8,
    padding:      '7px 4px',
    fontSize:     12,
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'all .12s',
  },

  /* Colors */
  colorRow: {
    display:    'flex',
    gap:        16,
    alignItems: 'flex-end',
    flexWrap:   'wrap',
  },
  colorGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  colorInput: {
    width:        52,
    height:       38,
    borderRadius: 8,
    border:       '1px solid var(--bdr)',
    cursor:       'pointer',
    padding:      2,
    background:   'var(--surf2)',
  },
  colorPreview: {
    marginLeft:   'auto',
    display:      'flex',
    flexDirection:'column',
    gap:          4,
    alignItems:   'center',
  },
  previewBar: {
    display:        'flex',
    alignItems:     'center',
    gap:            8,
    padding:        '6px 14px',
    borderRadius:   8,
  },
  previewScore: { fontSize: 22, fontWeight: 900, lineHeight: 1 },
  previewDash:  { fontSize: 14, color: 'rgba(255,255,255,.3)' },
  previewBtn: {
    padding:      '6px 16px',
    borderRadius: 8,
    display:      'flex',
    alignItems:   'center',
    justifyContent:'center',
  },

  /* Save bar */
  saveBar: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '12px 0 0',
    borderTop:      '1px solid var(--bdr)',
  },
  saveHint: { fontSize: 12, color: 'var(--txt2)' },
  saveBtn: {
    background:   'var(--tp)',
    color:        'var(--tpt)',
    border:       'none',
    borderRadius: 9,
    padding:      '10px 22px',
    fontSize:     13,
    fontWeight:   700,
    cursor:       'pointer',
  },
    errorMsg: {
    background:   'rgba(185,28,28,.1)',
    border:       '1px solid rgba(185,28,28,.3)',
    borderRadius: 8,
    padding:      '8px 12px',
    fontSize:     12,
    color:        '#e53e3e',
  },
  slugHint: {
    fontSize:   11,
    color:      'var(--txt2)',
    fontFamily: 'monospace',
  },
};