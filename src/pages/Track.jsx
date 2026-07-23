/* redeploy */
import React, { useState, useCallback, useMemo } from 'react';
import PlayerModal    from '../components/PlayerModal';
import EndGameButton  from '../components/EndGameButton';
import FinalScoreModal from '../components/FinalScoreModal';
import PenaltyDrawer  from '../components/PenaltyDrawer';
import {
  STAT_SECTIONS,
  ROLE_SECTIONS,
  ROLE_SHOWS_GOALIE,
  ROLE_SHOWS_POSSESSION,
  ROLE_SHOWS_STRENGTH,
  ROLE_SHOWS_PENALTIES,
  NEEDS_PLAYER,
} from '../lib/constants';

// ── Styles first (TDZ fix for production builds) ──────────────────────────────
const S = {
  shell:    { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative', overflow: 'hidden' },

  // Possession bar
  possBar:  { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 4, padding: '5px 8px', borderBottom: '1px solid var(--bdr)', flexShrink: 0 },
  possBtn:  { border: 'none', borderRadius: 8, padding: '6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, cursor: 'pointer', transition: 'background .1s, box-shadow .1s' },
  possNone: { border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 9, fontWeight: 800, letterSpacing: '.5px', cursor: 'pointer', alignSelf: 'center', transition: 'background .1s, color .1s' },
  possLbl:  { fontSize: 8, fontWeight: 800, letterSpacing: '.8px', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' },
  possTime: { fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 },

  // Meta row
  metaRow:     { display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--bdr)', flexShrink: 0 },
  goalieChip:  { display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', cursor: 'pointer', flex: 1, borderRight: '1px solid var(--bdr)' },
  goalieBadge: { width: 24, height: 24, borderRadius: '50%', background: 'var(--tp)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: 'var(--tpt)', flexShrink: 0 },
  goalieInfo:  { display: 'flex', flexDirection: 'column', gap: 1 },
  goalieName:  { fontSize: 11, fontWeight: 700, color: 'var(--txt)' },
  goalieStats: { fontSize: 9, color: 'var(--txt2)' },
  goalieDD:    { flexShrink: 0, borderBottom: '1px solid var(--bdr)', padding: '6px 10px', display: 'flex', gap: 6, background: 'var(--surf)' },
  goalieDDBtn: { border: '1px solid var(--bdr)', borderRadius: 8, background: 'var(--surf2)', padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'var(--txt)', flexShrink: 0 },
  strengthSeg: { display: 'flex', padding: '5px 8px', gap: 3, alignItems: 'center' },
  strBtn:      { border: 'none', borderRadius: 6, padding: '4px 7px', fontSize: 9, fontWeight: 700, letterSpacing: '.2px', cursor: 'pointer', transition: 'background .1s, color .1s' },

  // Column headers
  colHdrs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, padding: '4px 8px 2px', flexShrink: 0 },
  colHdr:  { textAlign: 'center', fontSize: 9, fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', padding: '3px 0', borderRadius: 6 },

  // Stat grid
  gridWrap:   { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 5, padding: '0 8px 5px', overflow: 'hidden' },
  sectionLbl: { flexShrink: 0, fontSize: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--txt2)', paddingLeft: 2, paddingTop: 2 },
  btnRow:     { flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 },
  sbt: {
    border: 'none', borderRadius: 12, cursor: 'pointer',
    position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', justifyContent: 'flex-end',
    padding: '7px 10px 8px',
    width: '100%', height: '100%',
    transition: 'transform .07s',
  },
  sbtLbl: { fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.6)', lineHeight: 1.2, pointerEvents: 'none' },
  sbtN:   { fontSize: 'clamp(24px, 5vw, 34px)', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' },

  // Bottom bar
  bar:      { display: 'flex', alignItems: 'center', padding: '5px 8px', borderTop: '1px solid var(--bdr)', flexShrink: 0, gap: 6, minHeight: 40, background: 'var(--surf)' },
  undoArea: { display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 },
  undoBtn:  { border: 'none', background: 'none', color: 'var(--tp)', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: '4px 6px', flexShrink: 0 },
  lastEvt:  { fontSize: 11, color: 'var(--txt2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  penBtn:   { border: '1.5px solid var(--bdr)', borderRadius: 8, background: 'none', color: 'var(--txt2)', fontSize: 11, fontWeight: 700, padding: '5px 10px', cursor: 'pointer', flexShrink: 0 },

  // End overlay
  endOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(3px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 50 },
  endTitle:   { fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: 2 },
  endScore:   { fontSize: 36, fontWeight: 800, color: 'var(--ta)', fontVariantNumeric: 'tabular-nums', letterSpacing: 3 },
  endSub:     { fontSize: 11, color: 'rgba(255,255,255,.45)', fontWeight: 600, marginTop: 4 },
};

// ── Stat button ───────────────────────────────────────────────────────────────
function StatBtn({ statKey, label, side, count, onTap, disabled }) {
  const [pressed, setPressed] = useState(false);
  const [flash,   setFlash]   = useState(false);

  const isUs  = side === 'us';
  const bg    = isUs ? 'var(--tp)'      : 'var(--opp)';
  const shade = isUs ? 'rgba(0,0,0,.35)' : 'rgba(0,0,0,.35)';
  const acc   = isUs ? 'var(--ta)'      : 'var(--opp-acc)';

  const handleClick = () => {
    if (disabled) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    onTap(statKey);
  };

  return (
    <button
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={handleClick}
      style={{
        ...S.sbt,
        background: bg,
        boxShadow: pressed ? 'none' : `0 4px 0 ${shade}`,
        transform:  pressed ? 'translateY(3px)' : 'translateY(0)',
        opacity:    disabled ? 0.4 : 1,
        cursor:     disabled ? 'default' : 'pointer',
      }}
    >
      <div style={S.sbtLbl}>{label}</div>
      <div style={{ ...S.sbtN, color: acc }}>{count ?? 0}</div>
      {flash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,.25)',
          animation: 'lax-flash .3s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}
    </button>
  );
}

function fmtMs(ms) {
  const t = Math.floor(ms / 1000);
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Track({
  counts,
  fieldPlayers,
  goalies,
  activeGoalie,
  onChangeGoalie,
  onRecordStat,
  lastLabel,
  onUndo,
  saves,
  ga,
  svPct,
  possState,
  usMs,
  themMs,
  onSetPoss,
  role,
  onEndGame,
  onRecordPenalty,
  strength,
  onSetStrength,
  gameEnded,
  /**
   * customSections — extensibility hook for team-defined stats.
   * Same shape as STAT_SECTIONS entries: { id, label, rows: [{ us, them }] }
   * Injected from Supabase team config once that layer is built.
   * Passed from App.jsx → Track. Default empty = no custom stats.
   */
  customSections = [],
}) {
  const [modalStat,     setModalStat]     = useState(null);
  const [showEndModal,  setShowEndModal]  = useState(false);
  const [showPenDrawer, setShowPenDrawer] = useState(false);
  const [pendingPenalty, setPendingPenalty] = useState(null);
  const [goalieOpen,    setGoalieOpen]    = useState(false);

  const visibleSectionIds = ROLE_SECTIONS[role] ?? ROLE_SECTIONS.solo;

  // Build flat render list: { type: 'label'|'row', ... }
  // Flat structure means custom stats inject cleanly — just more rows.
  const renderItems = useMemo(() => {
    const base   = STAT_SECTIONS.filter(s => visibleSectionIds.includes(s.id));
    const all    = [...base, ...customSections];
    const items  = [];
    for (const sec of all) {
      items.push({ type: 'label', text: sec.label });
      for (const row of sec.rows) {
        items.push({ type: 'row', us: row.us ?? null, them: row.them ?? null });
      }
    }
    return items;
  }, [visibleSectionIds, customSections]);

  const tap = (key) => {
    if (gameEnded) return;
    if (NEEDS_PLAYER.has(key)) setModalStat(key);
    else onRecordStat(key, null);
  };

  const handleRecord = useCallback((key, player, location, assistPlayer) => {
    if (key === 'pen' && pendingPenalty) {
      onRecordPenalty?.(pendingPenalty.team, pendingPenalty.sec, player);
      setPendingPenalty(null);
    } else {
      onRecordStat(key, player, location, assistPlayer);  // ← forwarded
    }
  }, [pendingPenalty, onRecordStat, onRecordPenalty]);

  const handlePenaltyPick = (team, sec) => {
    if (gameEnded) return;
    setShowPenDrawer(false);
    if (team === 'us') {
      setPendingPenalty({ team, sec });
      setModalStat('pen');
    } else {
      onRecordPenalty?.(team, sec);
    }
  };

  const svp    = typeof svPct === 'function' ? svPct() : svPct;
  const activeG = activeGoalie ?? goalies[0];

  return (
    <div style={S.shell}>

      {/* ── Possession bar ─────────────────────────────────── */}
      {ROLE_SHOWS_POSSESSION[role] && (
        <div style={S.possBar}>
          <button
            onClick={() => !gameEnded && onSetPoss?.('us')}
            style={{
              ...S.possBtn,
              background:  possState === 'us' ? 'rgba(26,107,58,.65)' : 'rgba(26,107,58,.22)',
              boxShadow:   possState === 'us' ? '0 0 0 2px var(--tp)'  : 'none',
            }}
          >
            <div style={S.possLbl}>US</div>
            <div style={{ ...S.possTime, color: possState === 'us' ? 'var(--ta)' : 'rgba(255,255,255,.35)' }}>
              {fmtMs(usMs)}
            </div>
          </button>

          <button
            onClick={() => !gameEnded && onSetPoss?.('none')}
            style={{
              ...S.possNone,
              background: possState === 'none' ? 'var(--surf3)'  : 'var(--surf2)',
              color:      possState === 'none' ? 'var(--txt)'    : 'var(--txt2)',
            }}
          >
            NONE
          </button>

          <button
            onClick={() => !gameEnded && onSetPoss?.('them')}
            style={{
              ...S.possBtn,
              background:  possState === 'them' ? 'rgba(155,28,28,.65)' : 'rgba(155,28,28,.22)',
              boxShadow:   possState === 'them' ? '0 0 0 2px var(--opp)' : 'none',
            }}
          >
            <div style={S.possLbl}>THEM</div>
            <div style={{ ...S.possTime, color: possState === 'them' ? 'var(--opp-acc)' : 'rgba(255,255,255,.35)' }}>
              {fmtMs(themMs)}
            </div>
          </button>
        </div>
      )}

      {/* ── Meta row: goalie chip + strength toggle ─────────── */}
      <div style={S.metaRow}>
        {ROLE_SHOWS_GOALIE[role] && (
          <div
            style={S.goalieChip}
            onClick={() => !gameEnded && setGoalieOpen(o => !o)}
          >
            <div style={S.goalieBadge}>{activeG?.num ?? '?'}</div>
            <div style={S.goalieInfo}>
              <div style={S.goalieName}>#{activeG?.num} {activeG?.name}</div>
              <div style={S.goalieStats}>{saves} sv · {ga} GA · {svp}</div>
            </div>
          </div>
        )}

        {ROLE_SHOWS_STRENGTH[role] && (
          <div style={S.strengthSeg}>
            {[
              { key: 'man_down', lbl: '↓MD' },
              { key: 'even',     lbl: 'EVN' },
              { key: 'man_up',   lbl: 'MU↑' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => !gameEnded && onSetStrength?.(opt.key)}
                style={{
                  ...S.strBtn,
                  background: strength === opt.key ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.05)',
                  color:      strength === opt.key ? '#fff'                   : 'rgba(255,255,255,.3)',
                }}
              >
                {opt.lbl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Goalie picker dropdown (inline, compact) */}
      {goalieOpen && ROLE_SHOWS_GOALIE[role] && (
        <div style={S.goalieDD}>
          {goalies.map(g => (
            <button
              key={g.id}
              onClick={() => { onChangeGoalie?.(g); setGoalieOpen(false); }}
              style={{
                ...S.goalieDDBtn,
                borderColor: g.id === activeGoalie?.id ? 'var(--tp)' : 'var(--bdr)',
                color: g.id === activeGoalie?.id ? 'var(--tp)' : 'var(--txt)',
              }}
            >
              #{g.num} {g.name}
              {g.id === activeGoalie?.id && ' ✓'}
            </button>
          ))}
        </div>
      )}

      {/* ── Column headers ──────────────────────────────────── */}
      <div style={S.colHdrs}>
        <div style={{ ...S.colHdr, color: 'var(--ta)',      background: 'rgba(26,107,58,.18)' }}>← Us</div>
        <div style={{ ...S.colHdr, color: 'var(--opp-acc)', background: 'rgba(155,28,28,.18)' }}>Them →</div>
      </div>

      {/* ── Stat grid — flat render list ────────────────────── */}
      <div style={S.gridWrap}>
        {renderItems.map((item, i) =>
          item.type === 'label'
            ? <div key={`lbl-${i}`} style={S.sectionLbl}>{item.text}</div>
            : (
              <div key={`row-${i}`} style={S.btnRow}>
                {item.us ? (
                  <StatBtn
                    statKey={item.us.key}
                    label={item.us.label}
                    side="us"
                    count={counts[item.us.key] ?? 0}
                    onTap={tap}
                    disabled={gameEnded}
                  />
                ) : <div />}
                {item.them ? (
                  <StatBtn
                    statKey={item.them.key}
                    label={item.them.label}
                    side="them"
                    count={counts[item.them.key] ?? 0}
                    onTap={tap}
                    disabled={gameEnded}
                  />
                ) : <div />}
              </div>
            )
        )}
      </div>

      {/* ── Bottom bar ──────────────────────────────────────── */}
      <div style={S.bar}>
        <div style={S.undoArea}>
          <button
            style={S.undoBtn}
            onClick={!gameEnded ? onUndo : undefined}
            disabled={gameEnded}
          >
            ↩
          </button>
          <div style={S.lastEvt}>
            Last: <strong style={{ color: 'var(--txt)', fontWeight: 600 }}>{lastLabel}</strong>
          </div>
        </div>
        {ROLE_SHOWS_PENALTIES[role] && (
          <button
            style={S.penBtn}
            onClick={() => !gameEnded && setShowPenDrawer(true)}
            disabled={gameEnded}
          >
            ⚑ Penalty
          </button>
        )}
        <EndGameButton
          onConfirmed={() => setShowEndModal(true)}
          disabled={gameEnded}
        />
      </div>

      {/* ── Penalty drawer ──────────────────────────────────── */}
      <PenaltyDrawer
        isOpen={showPenDrawer}
        onPenaltyPick={handlePenaltyPick}
        onClose={() => setShowPenDrawer(false)}
      />

      {/* ── Player modal ───────────────────────────────────── */}
      <PlayerModal
        isOpen={modalStat !== null}
        pendingStat={modalStat}
        fieldPlayers={fieldPlayers}
        onRecord={handleRecord}
        onClose={() => { setModalStat(null); setPendingPenalty(null); }}
      />

      {/* ── End game confirmation ──────────────────────────── */}
      <FinalScoreModal
        isOpen={showEndModal}
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        onCancel={() => setShowEndModal(false)}
        onConfirm={() => { setShowEndModal(false); onEndGame?.(); }}
      />

      {/* ── Game ended overlay ─────────────────────────────── */}
      {gameEnded && (
        <div style={S.endOverlay}>
          <div style={{ fontSize: 38 }}>🏁</div>
          <div style={S.endTitle}>GAME FINAL</div>
          <div style={S.endScore}>{counts.goal ?? 0} – {counts.ogoal ?? 0}</div>
          <div style={S.endSub}>Stats saved · check Live View</div>
        </div>
      )}
    </div>
  );
}

// Inject flash keyframe once
if (typeof document !== 'undefined' && !document.getElementById('lax-track-styles')) {
  const tag = document.createElement('style');
  tag.id = 'lax-track-styles';
  tag.textContent = '@keyframes lax-flash { 0% { opacity: 1; } 100% { opacity: 0; } }';
  document.head.appendChild(tag);
}