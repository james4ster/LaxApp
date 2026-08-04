import React, { useState } from 'react';

function fmt(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

/**
 * ScheduleSetup
 *
 * games/loading/addGame/removeGame now come from Dashboard's single
 * useSchedule instance as props (same fix as RosterSetup) — this used
 * to call its own useSchedule(teamId), disconnected from the copy
 * Dashboard used for the schedule checkmark/count.
 */
export default function ScheduleSetup({ teamId, seasonYear, games, loading, addGame, removeGame }) {
  const [opponent,     setOpponent]     = useState('');
  const [scheduledAt,  setScheduledAt]  = useState('');
  const [location,     setLocation]     = useState('');
  const [isHome,       setIsHome]       = useState(true);
  const [isExhibition, setIsExhibition] = useState(false);
  const [busy,         setBusy]         = useState(false);
  const [err,          setErr]          = useState(null);

  const handleAdd = async () => {
    if (!opponent.trim()) { setErr('Opponent name required'); return; }
    setBusy(true); setErr(null);
    try {
      await addGame({
        opponent:      opponent.trim(),
        scheduled_at:  scheduledAt || null,
        location:      location.trim() || null,
        is_home:       isHome,
        season_year:   seasonYear ?? null,
        is_exhibition: isExhibition,
      });
      setOpponent(''); setScheduledAt(''); setLocation(''); setIsExhibition(false);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
    <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Game list */}
      {loading && <div style={{ fontSize: 12, color: 'var(--txt2)' }}>Loading…</div>}

      {games.length > 0 && (
        <div style={SC.list}>
          {games.map(g => (
            <div key={g.id} style={SC.gameRow}>
              <div style={SC.gameInfo}>
                <div style={SC.gameName}>
                  {g.home_team_id === teamId ? 'vs' : '@'} {g.opponent_name ?? 'Opponent'}
                  {g.is_exhibition && <span style={SC.exhibitionTag}>Exhibition</span>}
                </div>
                <div style={SC.gameMeta}>
                  {fmt(g.scheduled_at)}{g.location ? ` · ${g.location}` : ''}
                </div>
              </div>
              <div style={{
                ...SC.statusBadge,
                background: g.status === 'final' ? 'rgba(26,107,58,.1)' : 'rgba(0,0,0,.05)',
                color:      g.status === 'final' ? 'var(--tp)'          : 'var(--txt2)',
              }}>
                {g.status === 'final' ? `${g.final_score_home}–${g.final_score_away}` : g.status}
              </div>
              {g.status === 'scheduled' && (
                <button style={SC.removeBtn} onClick={() => removeGame(g.id)}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {games.length === 0 && !loading && (
        <div style={{ fontSize: 12, color: 'var(--txt2)', textAlign: 'center', padding: '4px 0 8px' }}>
          No games yet — add your first game below.
        </div>
      )}

      {/* Add game form */}
      <div style={SC.form}>
        <div style={SC.formTitle}>Add game</div>

        <div style={SC.field}>
          <label style={SC.lbl}>Opponent</label>
          <input
            style={SC.input}
            placeholder="e.g. Riverside HS"
            value={opponent}
            onChange={e => setOpponent(e.target.value)}
          />
        </div>

        <div style={SC.twoCol}>
          <div style={SC.field}>
            <label style={SC.lbl}>Date & time</label>
            <input
              style={SC.input}
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
            />
          </div>
          <div style={SC.field}>
            <label style={SC.lbl}>Home / Away</label>
            <div style={SC.segRow}>
              {[true, false].map(h => (
                <button
                  key={String(h)}
                  style={{
                    ...SC.seg,
                    background: isHome === h ? 'var(--tp)' : 'var(--surf2)',
                    color:      isHome === h ? 'var(--tpt)' : 'var(--txt)',
                  }}
                  onClick={() => setIsHome(h)}
                >
                  {h ? 'Home' : 'Away'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={SC.field}>
          <label style={SC.lbl}>Location (optional)</label>
          <input
            style={SC.input}
            placeholder="e.g. Memorial Field"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
        </div>

        <label style={SC.checkboxRow}>
          <input
            type="checkbox"
            checked={isExhibition}
            onChange={e => setIsExhibition(e.target.checked)}
          />
          Exhibition / scrimmage (won't count toward record)
        </label>

        {err && <div style={{ fontSize: 11, color: 'var(--danger)' }}>{err}</div>}

        <button
          style={{ ...SC.addBtn, opacity: busy ? 0.6 : 1 }}
          onClick={handleAdd}
          disabled={busy}
        >
          {busy ? 'Adding…' : '+ Add game'}
        </button>
      </div>
    </div>
  );
}

const SC = {
  list: { border: '1px solid var(--bdr)', borderRadius: 9, overflow: 'hidden', marginBottom: 4 },
  gameRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
    borderBottom: '1px solid var(--bdr)', background: 'var(--surf)',
  },
  gameInfo:   { flex: 1, minWidth: 0 },
  gameName:   { fontSize: 13, fontWeight: 600, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: 6 },
  gameMeta:   { fontSize: 11, color: 'var(--txt2)', marginTop: 1 },
  exhibitionTag: {
    fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
    color: 'var(--txt2)', background: 'var(--surf2)', borderRadius: 5, padding: '2px 6px',
  },
  statusBadge:{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5 },
  removeBtn:  { background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12, padding: '2px 4px' },
  form:       { background: 'var(--surf2)', borderRadius: 9, padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 10 },
  formTitle:  { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--txt2)' },
  field:      { display: 'flex', flexDirection: 'column', gap: 4 },
  lbl:        { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: 'var(--txt2)' },
  input: {
    padding: '8px 9px', borderRadius: 7, border: '1px solid var(--bdr)',
    background: 'var(--surf)', color: 'var(--txt)', fontSize: 13, outline: 'none',
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  segRow: { display: 'flex', gap: 5 },
  seg: {
    flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
    fontSize: 12, fontWeight: 700, cursor: 'pointer',
  },
  checkboxRow: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontSize: 12, color: 'var(--txt2)', cursor: 'pointer',
  },
  addBtn: {
    background: 'var(--tp)', color: 'var(--tpt)', border: 'none',
    borderRadius: 8, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
};