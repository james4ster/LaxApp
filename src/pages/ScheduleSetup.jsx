import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { useOpponents } from '../hooks/useTeam';

function fmt(dt) {
  if (!dt) return '–';
  return new Date(dt).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

// ── Opponent combobox: type to filter, click a match to select it, or
// "+ Add" if nothing matches. The actual "remember this opponent" write
// happens in handleAdd below (so it works even if someone types a full
// name and hits Add game without ever opening the dropdown) — this
// component is just the picking UI.
function OpponentCombo({ value, onChange, opponents }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const query = value.trim().toLowerCase();
  const matches = query
    ? opponents.filter(o => o.name.toLowerCase().includes(query))
    : opponents;
  const exactMatch = opponents.some(o => o.name.toLowerCase() === query);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        style={SC.input}
        placeholder="e.g. Riverside HS"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && (matches.length > 0 || (query && !exactMatch)) && (
        <div style={SC.comboList}>
          {matches.map(o => (
            <div
              key={o.id}
              style={SC.comboItem}
              onMouseDown={() => { onChange(o.name); setOpen(false); }}
            >
              {o.name}
            </div>
          ))}
          {query && !exactMatch && (
            <div
              style={{ ...SC.comboItem, color: 'var(--tp)', fontWeight: 700 }}
              onMouseDown={() => { onChange(value.trim()); setOpen(false); }}
            >
              + Add "{value.trim()}"
            </div>
          )}
        </div>
      )}
    </div>
  );
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
  const { opponents, addOpponent } = useOpponents(teamId);

  const [opponent,     setOpponent]     = useState('');
  const [scheduledAt,  setScheduledAt]  = useState(null);
  const [location,     setLocation]     = useState('');
  const [isHome,       setIsHome]       = useState(true);
  const [isExhibition, setIsExhibition] = useState(false);
  const [busy,         setBusy]         = useState(false);
  const [err,          setErr]          = useState(null);

  const handleAdd = async () => {
    if (!opponent.trim()) { setErr('Opponent name required'); return; }
    setBusy(true); setErr(null);
    try {
      // Remembers this opponent for next time, whether it was picked from
      // the dropdown or just typed fresh — addOpponent no-ops if it's
      // already a known name (case-insensitive).
      await addOpponent(opponent.trim());
      await addGame({
        opponent:      opponent.trim(),
        scheduled_at:  scheduledAt ? scheduledAt.toISOString() : null,
        location:      location.trim() || null,
        is_home:       isHome,
        season_year:   seasonYear ?? null,
        is_exhibition: isExhibition,
      });
      setOpponent(''); setScheduledAt(null); setLocation(''); setIsExhibition(false);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  return (
     <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <DatePickerTheme />

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
          <OpponentCombo value={opponent} onChange={setOpponent} opponents={opponents} />
        </div>

        <div style={SC.twoCol}>
           <div style={SC.field}>
            <label style={SC.lbl}>Date & time</label>
            <div style={SC.dateFieldWrap}>
              <DatePicker
                selected={scheduledAt}
                onChange={date => setScheduledAt(date)}
                showTimeSelect
                timeIntervals={15}
                dateFormat="EEE, MMM d, yyyy h:mm aa"
                placeholderText="Select date & time"
                className="lax-datepicker-input"
                wrapperClassName="lax-datepicker-wrapper"
                popperPlacement="bottom-start"
              />
              {/* Decorative — pointer-events none so clicks pass through
                  to the input underneath and still open the picker. */}
              <svg
                style={SC.dateIcon}
                width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
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

const DatePickerTheme = () => (
  <style>{`
    .lax-datepicker-wrapper { width: 100%; }
    .lax-datepicker-input {
      padding: 8px 32px 8px 9px; border-radius: 7px; border: 1px solid var(--bdr);
      background: var(--surf); color: var(--txt); font-size: 13px; outline: none;
      width: 100%; box-sizing: border-box; font-family: inherit;
    }
    .lax-datepicker-input:focus { border-color: var(--tp); }
    .react-datepicker {
      font-family: inherit; border: 1px solid var(--bdr); border-radius: 10px;
      overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.12);
    }
    .react-datepicker__header {
      background: var(--surf2); border-bottom: 1px solid var(--bdr);
    }
    .react-datepicker__current-month, .react-datepicker-time__header {
      color: var(--txt); font-size: 13px; font-weight: 700;
    }
    .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
      color: var(--txt); font-size: 12px;
    }
    .react-datepicker__day:hover, .react-datepicker__time-list-item:hover {
      background: var(--surf2) !important;
    }
    .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected,
    .react-datepicker__time-list-item--selected {
      background: var(--tp) !important; color: var(--tpt) !important; font-weight: 700;
    }
    .react-datepicker__day--outside-month { color: var(--txt2); opacity: .4; }
    .react-datepicker__triangle { display: none; }
    .react-datepicker__navigation-icon::before { border-color: var(--txt2); }
  `}</style>
);

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
    width: '100%',
  },
  dateFieldWrap: { position: 'relative' },
  dateIcon: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    color: 'var(--txt2)', pointerEvents: 'none',
  },
  comboList: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
    background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,.08)', zIndex: 10,
    maxHeight: 180, overflowY: 'auto',
  },
  comboItem: {
    padding: '8px 10px', fontSize: 13, color: 'var(--txt)', cursor: 'pointer',
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