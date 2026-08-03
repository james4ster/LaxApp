import React, { useRef } from 'react';

/**
 * TeamSetup — step 1 of onboarding wizard.
 *
 * Props:
 *   team          — teamData object from useTeamSetup
 *   logoPreview   — string URL (blob or public) from useTeamSetup
 *   onFieldChange — (field, value) => void
 *   onLogoUpload  — (file) => void
 *   onCreate      — () => void (save new team)
 *   onUpdate      — () => void (save existing team)
 *   saving        — bool
 *   saved         — bool
 *   uploading     — bool
 *   error         — string | null
 *   teamId        — string | null (null = new team)
 */
export default function TeamSetup({
  team,
  logoPreview,
  onFieldChange,
  onLogoUpload,
  onCreate,
  onUpdate,
  saving,
  saved,
  uploading,
  error,
  teamId,
}) {
  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (teamId) onUpdate?.();
    else        onCreate?.();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onLogoUpload(file);
    // Reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) onLogoUpload(file);
  };

  const handleDragOver = (e) => e.preventDefault();

  return (
    <div style={S.wrap}>
      <div style={S.grid}>

        {/* ── Left: Logo upload ── */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Team Logo</div>

          {/* Logo preview — shows as soon as upload starts */}
          <div
            style={S.logoArea}
            onClick={handleDropZoneClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {uploading ? (
              <div style={S.logoPlaceholder}>
                <div style={S.spinner} />
                <div style={S.logoHint}>Uploading…</div>
              </div>
            ) : logoPreview ? (
              <img
                src={logoPreview}
                alt="Team logo"
                style={S.logoImg}
                // Fallback if URL is somehow broken
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div style={S.logoPlaceholder}>
                <div style={S.logoIcon}>🏒</div>
                <div style={S.logoHint}>Click or drag to upload</div>
                <div style={S.logoSub}>PNG, JPG, SVG · max 2MB</div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {logoPreview && !uploading && (
            <button
              style={S.changeLogoBtn}
              onClick={handleDropZoneClick}
            >
              Change logo
            </button>
          )}
        </div>

        {/* ── Right: Team details ── */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Team Details</div>

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
            <label style={S.label}>Gender</label>
            <div style={S.segmented}>
              {['Boys', 'Girls', 'Co-ed'].map(g => (
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
              style={{ ...S.input, width: 120 }}
              type="number"
              value={team.season_year}
              onChange={e => onFieldChange('season_year', Number(e.target.value))}
              min={2020}
              max={2035}
            />
          </div>
        </div>

        {/* ── Colors (full width) ── */}
        <div style={{ ...S.section, gridColumn: '1 / -1' }}>
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
              <div style={{
                ...S.previewBar,
                background: team.secondary_color,
              }}>
                <div style={{ ...S.previewScore, color: team.accent_color }}>7</div>
                <div style={S.previewDash}>–</div>
                <div style={{ ...S.previewScore, color: '#fff' }}>5</div>
              </div>
              <div style={{
                ...S.previewBtn,
                background: team.primary_color,
              }}>
                <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>Goal For</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Save bar ── */}
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
    gap:           20,
    height:        '100%',
  },
  grid: {
    display:             'grid',
    gridTemplateColumns: '220px 1fr',
    gap:                 20,
    flex:                1,
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

  /* Logo */
  logoArea: {
    width:         '100%',
    aspectRatio:   '1',
    borderRadius:  12,
    border:        '2px dashed var(--bdr)',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    cursor:        'pointer',
    overflow:      'hidden',
    background:    'var(--surf2)',
    transition:    'border-color .15s',
  },
  logoImg: {
    width:      '100%',
    height:     '100%',
    objectFit:  'contain',
    padding:    8,
  },
  logoPlaceholder: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           6,
    padding:       16,
    textAlign:     'center',
  },
  logoIcon: { fontSize: 32 },
  logoHint: { fontSize: 12, fontWeight: 600, color: 'var(--txt2)' },
  logoSub:  { fontSize: 10, color: 'var(--txt2)', opacity: .6 },
  changeLogoBtn: {
    background:   'none',
    border:       '1px solid var(--bdr)',
    borderRadius: 8,
    padding:      '6px 12px',
    fontSize:     11,
    fontWeight:   600,
    color:        'var(--txt2)',
    cursor:       'pointer',
    alignSelf:    'center',
  },
  spinner: {
    width:        28,
    height:       28,
    border:       '3px solid var(--bdr)',
    borderTop:    '3px solid var(--tp)',
    borderRadius: '50%',
    animation:    'spin .7s linear infinite',
  },

  /* Fields */
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
};