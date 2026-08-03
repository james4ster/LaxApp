import React, { useState, useEffect } from 'react';
import { COLOR_PRESETS } from '../lib/constants';

const POSITIONS = ['ATT', 'MID', 'DEF', 'FOGO', 'LSM', 'GK'];

export default function TeamSetup({ team, onCreate, onUpdate, saving }) {
  const [name,        setName]        = useState(team?.name         ?? '');
  const [gender,      setGender]      = useState(team?.gender       ?? 'boys');
  const [seasonYear,  setSeasonYear]  = useState(team?.season_year  ?? new Date().getFullYear());
  const [primaryColor,setPrimaryColor]= useState(team?.primary_color ?? COLOR_PRESETS[0].p);
  const [accentColor, setAccentColor] = useState(team?.accent_color  ?? COLOR_PRESETS[0].a);
  const [dirty, setDirty] = useState(false);
  const [err,   setErr]   = useState(null);

  // Sync if team changes externally
  useEffect(() => {
    if (team) {
      setName(team.name ?? '');
      setGender(team.gender ?? 'boys');
      setSeasonYear(team.season_year ?? new Date().getFullYear());
      setPrimaryColor(team.primary_color ?? COLOR_PRESETS[0].p);
      setAccentColor(team.accent_color  ?? COLOR_PRESETS[0].a);
    }
  }, [team?.id]);

  const handleSubmit = async () => {
    setErr(null);
    if (!name.trim()) { setErr('Team name is required'); return; }
    const fields = {
      name: name.trim(),
      gender,
      season_year:   seasonYear,
      primary_color: primaryColor,
      accent_color:  accentColor,
    };
    try {
      if (team) await onUpdate(fields);
      else      await onCreate(fields);
      setDirty(false);
    } catch (e) {
      setErr(e.message);
    }
  };

  const mark = () => setDirty(true);

  return (
    <div style={S.form}>

      {/* Team name */}
      <div style={S.field}>
        <label style={S.lbl}>Team name</label>
        <input
          style={S.input}
          value={name}
          placeholder="e.g. Westfield HS Varsity"
          onChange={e => { setName(e.target.value); mark(); }}
        />
      </div>

      {/* Gender */}
      <div style={S.field}>
        <label style={S.lbl}>Program</label>
        <div style={S.segRow}>
          {['boys', 'girls'].map(g => (
            <button
              key={g}
              style={{
                ...S.seg,
                background: gender === g ? 'var(--tp)' : 'var(--surf2)',
                color:      gender === g ? 'var(--tpt)' : 'var(--txt)',
              }}
              onClick={() => { setGender(g); mark(); }}
            >
              {g === 'boys' ? '♂ Boys' : '♀ Girls'}
            </button>
          ))}
        </div>
      </div>

      {/* Season year */}
      <div style={S.field}>
        <label style={S.lbl}>Season year</label>
        <input
          style={{ ...S.input, maxWidth: 120 }}
          type="number"
          value={seasonYear}
          min={2020}
          max={2035}
          onChange={e => { setSeasonYear(Number(e.target.value)); mark(); }}
        />
      </div>

      {/* Color presets */}
      <div style={S.field}>
        <label style={S.lbl}>Team colors</label>
        <div style={S.swatches}>
          {COLOR_PRESETS.map((c, i) => (
            <button
              key={i}
              onClick={() => { setPrimaryColor(c.p); setAccentColor(c.a); mark(); }}
              style={{
                ...S.swatch,
                background: `linear-gradient(135deg, ${c.p} 50%, ${c.a} 50%)`,
                boxShadow: primaryColor === c.p ? `0 0 0 2px var(--txt)` : 'none',
              }}
            />
          ))}
        </div>
        <div style={S.colorPickers}>
          <div style={S.cpGroup}>
            <label style={S.cpLbl}>Primary</label>
            <input type="color" value={primaryColor} onChange={e => { setPrimaryColor(e.target.value); mark(); }} style={S.colorInput} />
          </div>
          <div style={S.cpGroup}>
            <label style={S.cpLbl}>Accent</label>
            <input type="color" value={accentColor} onChange={e => { setAccentColor(e.target.value); mark(); }} style={S.colorInput} />
          </div>
          {/* Preview */}
          <div style={{ ...S.colorPreview, background: primaryColor, color: accentColor }}>
            Preview
          </div>
        </div>
      </div>

      {err && <div style={S.err}>{err}</div>}

      <button
        style={{
          ...S.submit,
          opacity: saving || (!dirty && team) ? 0.5 : 1,
        }}
        onClick={handleSubmit}
        disabled={saving || (!dirty && !!team)}
      >
        {saving ? 'Saving…' : team ? 'Save changes' : 'Create team →'}
      </button>
    </div>
  );
}

const S = {
  form:  { display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  lbl:   { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--txt2)' },
  input: {
    padding: '9px 10px', borderRadius: 8, border: '1px solid var(--bdr)',
    background: 'var(--surf2)', color: 'var(--txt)', fontSize: 14,
    outline: 'none', width: '100%',
  },
  segRow: { display: 'flex', gap: 6 },
  seg: {
    flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background .12s',
  },
  swatches:     { display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 },
  swatch:       { width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'box-shadow .12s' },
  colorPickers: { display: 'flex', gap: 10, alignItems: 'center' },
  cpGroup:      { display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' },
  cpLbl:        { fontSize: 9, color: 'var(--txt2)' },
  colorInput:   { width: 42, height: 32, borderRadius: 6, border: '1px solid var(--bdr)', cursor: 'pointer', padding: 2, background: 'var(--surf2)' },
  colorPreview: { flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, textAlign: 'center' },
  err:    { fontSize: 11, color: 'var(--danger)', padding: '4px 0' },
  submit: {
    background: 'var(--tp)', color: 'var(--tpt)',
    border: 'none', borderRadius: 9, padding: '12px 0',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4,
  },
};