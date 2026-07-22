import React, { useState } from 'react';
import PossessionWidget from '../components/PossessionWidget';
import GoalieBar from '../components/GoalieBar';
import PlayerModal from '../components/PlayerModal';
import EndGameButton from '../components/EndGameButton';
import FinalScoreModal from '../components/FinalScoreModal';
import PenaltyPad from '../components/PenaltyPad';
import StrengthToggle from '../components/StrengthToggle';
import {
  STAT_SECTIONS,
  ROLE_SECTIONS,
  ROLE_SHOWS_GOALIE,
  ROLE_SHOWS_POSSESSION,
  ROLE_SHOWS_STRENGTH,
  ROLE_SHOWS_PENALTIES,
  NEEDS_PLAYER,
} from '../lib/constants';

// ── Color map: side → CSS vars ───────────────────────────────────────────────
const US_STYLE   = { bg: 'var(--tp)',      txt: 'var(--tpt)',  shadow: 'rgba(0,0,0,.22)' };
const THEM_STYLE = { bg: 'var(--opp)',     txt: 'var(--oppt)', shadow: 'rgba(0,0,0,.22)' };
const NEUT_STYLE = { bg: 'var(--surf2)',   txt: 'var(--txt)',  shadow: 'rgba(0,0,0,.12)' };

function sideStyle(side) {
  if (side === 'us')   return US_STYLE;
  if (side === 'them') return THEM_STYLE;
  return NEUT_STYLE;
}

// ── Compact stat button — label on top, count large, no sub-label ────────────
function Btn({ statKey, label, side = 'us', count, onTap, disabled }) {
  const [pressed, setPressed] = useState(false);
  const [flash,   setFlash]   = useState(false);
  const { bg, txt, shadow } = sideStyle(side);

  const handleClick = () => {
    if (disabled) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 280);
    onTap(statKey);
  };

  return (
    <button
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={handleClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: 'none',
        borderRadius: 10,
        padding: '8px 6px 7px',
        background: bg,
        boxShadow: pressed ? 'none' : `0 3px 0 ${shadow}`,
        transform: pressed ? 'translateY(3px)' : 'translateY(0)',
        transition: 'transform .07s, box-shadow .07s',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        width: '100%',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: txt, lineHeight: 1.2, textAlign: 'center' }}>
        {label}
      </span>
      <span style={{ fontSize: 22, fontWeight: 800, color: txt, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
        {count ?? 0}
      </span>
      {flash && (
        <span style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,.38)',
          animation: 'lax-flash .28s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}
    </button>
  );
}

// ── Section wrapper — minimal header ─────────────────────────────────────────
function Sec({ label, children, cols = 2 }) {
  return (
    <div style={S.sec}>
      <div style={S.secHead}>
        <span style={S.secLbl}>{label}</span>
        <div style={S.secRule} />
      </div>
      <div style={{ ...S.secBody, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {children}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Track({
  counts,
  fieldPlayers,
  goalies,
  activeGoalie,
  onChangeGoalie,
  playerStats,
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
}) {
  const [modalStat, setModalStat]           = useState(null);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [pendingPenalty, setPendingPenalty] = useState(null);

  const visibleSectionIds = ROLE_SECTIONS[role] ?? ROLE_SECTIONS.solo;

  const tap = (key) => {
    if (gameEnded) return;
    if (NEEDS_PLAYER.has(key)) {
      setModalStat(key);
    } else {
      onRecordStat(key, null);
    }
  };

  const handleRecord = (key, player, location, assistPlayer) => {
    console.log("TRACK HANDLE RECORD:", {
      key,
      player,
      assistPlayer
    });
  
    console.log("USEGAME RECORD STAT ARGS", {
      key,
      player,
      shotLocation,
      strength,
      assistPlayer
    });
    
    if (key === 'pen' && pendingPenalty) {
      onRecordPenalty?.(pendingPenalty.team, pendingPenalty.sec, player);
      setPendingPenalty(null);
    } else {
      onRecordStat(
        key,
        player,
        location,
        assistPlayer
      );
    }
  };

  const handlePenaltyPick = (team, sec) => {
    if (!onRecordPenalty || gameEnded) return;
    if (team === 'us') {
      setPendingPenalty({ team, sec });
      setModalStat('pen');
    } else {
      onRecordPenalty(team, sec);
    }
  };

  const show = (id) => visibleSectionIds.includes(id);


  console.log("TRACK PROPS", {
    onUndo,
    type: typeof onUndo,
  });

  return (
    <div style={S.shell}>

      {/* ── Scrollable content ─────────────────────────────── */}
      <div style={S.scroll}>

        {/* Strength: Man Down / Even / Man Up */}
        {ROLE_SHOWS_STRENGTH[role] && (
          <StrengthToggle strength={strength} onChange={gameEnded ? undefined : onSetStrength} />
        )}

        {/* Possession */}
        {ROLE_SHOWS_POSSESSION[role] && (
          <PossessionWidget
            possState={possState}
            usMs={usMs}
            themMs={themMs}
            onSetPoss={gameEnded ? undefined : onSetPoss}
            compact
          />
        )}

        {/* Goalie */}
        {ROLE_SHOWS_GOALIE[role] && (
         <GoalieBar
          goalies={goalies}
          activeGoalie={activeGoalie}
          onChangeGoalie={onChangeGoalie}
          playerStats={playerStats}
        />
        )
        }


        {/* ── SCORING ── */}
        {show('scoring') && (
          <Sec label="Scoring">
            <Btn statKey="goal"  label="Goal For"     side="us"   count={counts.goal}  onTap={tap} disabled={gameEnded} />
            <Btn statKey="ogoal" label="Goal Against" side="them" count={counts.ogoal} onTap={tap} disabled={gameEnded} />
          </Sec>
        )}

        {/* ── SHOTS ── */}
        {show('shots') && (
          <Sec label="Shots">
            <Btn statKey="sog"   label="Shot On Goal"   side="us"   count={counts.sog}   onTap={tap} disabled={gameEnded} />
            <Btn statKey="miss"  label="Shot Missed"    side="us"   count={counts.miss}  onTap={tap} disabled={gameEnded} />
            <Btn statKey="oshot" label="Shot Against"   side="them" count={counts.oshot} onTap={tap} disabled={gameEnded} />
            <Btn statKey="omiss" label="Miss — Them"    side="them" count={counts.omiss ?? 0} onTap={tap} disabled={gameEnded} />
          </Sec>
        )}

        {/* ── FIELD ── */}
        {show('field') && (
          <Sec label="Field">
            <Btn statKey="gb"      label="Ground Ball"  side="us"   count={counts.gb}    onTap={tap} disabled={gameEnded} />
            <Btn statKey="gb_them" label="GB — Them"    side="them" count={counts.gb_them ?? 0} onTap={tap} disabled={gameEnded} />
            <Btn statKey="cto"     label="Caused TO"    side="us"   count={counts.cto}   onTap={tap} disabled={gameEnded} />
            <Btn statKey="to"      label="Turnover"     side="them" count={counts.to}    onTap={tap} disabled={gameEnded} />
          </Sec>
        )}

        {/* ── FACEOFFS ── */}
        {show('faceoffs') && (
          <Sec label="Faceoffs">
            <Btn statKey="fo_w" label="FO Win"  side="us"   count={counts.fo_w} onTap={tap} disabled={gameEnded} />
            <Btn statKey="fo_l" label="FO Loss" side="them" count={counts.fo_l} onTap={tap} disabled={gameEnded} />
          </Sec>
        )}

        {/* ── PENALTIES — always last ── */}
        {ROLE_SHOWS_PENALTIES[role] && (
          <PenaltyPad
            onPenaltyPick={gameEnded ? undefined : handlePenaltyPick}
            disabled={gameEnded}
          />
        )}

      </div>

      {/* ── Undo / End Game bar ────────────────────────────── */}
      <div style={S.bar}>
        <div style={S.lastLabel}>
          Last: <strong style={{ color: 'var(--txt)', fontWeight: 600 }}>{lastLabel}</strong>
        </div>
        <div style={S.barRight}>
        <button
  style={{
    position: 'relative',
    zIndex: 9999,
    background: 'red',
    color: 'white',
    padding: '20px',
    border: '3px solid yellow',
  }}
  onPointerDown={() => console.log("UNDO POINTER")}
  onClick={() => {
    console.log("UNDO CLICK");
    onUndo?.();
  }}
>
  TEST UNDO BUTTON
</button>
          <EndGameButton
            onConfirmed={() => setShowEndGameModal(true)}
            disabled={gameEnded}
          />
        </div>
      </div>

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
        isOpen={showEndGameModal}
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        onCancel={() => setShowEndGameModal(false)}
        onConfirm={() => { setShowEndGameModal(false); onEndGame?.(); }}
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

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  shell: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: 'clamp(4px, 1vh, 8px) 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(4px, 1vh, 7px)',
  
    position: 'relative',
    zIndex: 1,
  },
  // Section
  sec: {
    background: 'var(--surf)',
    borderRadius: 11,
    border: '1px solid var(--bdr)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  secHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '4px 9px 3px',
  },
  secLbl: {
    fontSize: 9,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--txt2)',
    flexShrink: 0,
  },
  secRule: {
    flex: 1,
    height: 1,
    background: 'var(--bdr)',
  },
  secBody: {
    display: 'grid',
    gap: 5,
    padding: '0 5px 5px',
  },
  // Bottom bar
  bar: {
    padding: '4px 9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--bdr)',
    background: 'var(--surf)',
    flexShrink: 0,
    gap: 8,
    minHeight: 36,
  
    position: 'relative',
    zIndex: 100,
  },
  barRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  lastLabel: {
    fontSize: 11,
    color: 'var(--txt2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  },
  undoBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--tp)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px 10px',
    flexShrink: 0,
    opacity: 1,
  
    position: 'relative',
    zIndex: 30,
    touchAction: 'manipulation',
  },
  // Game ended overlay
  endOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,.75)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 50,
  },
  endTitle: {
    fontSize: 20,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: 2,
  },
  endScore: {
    fontSize: 36,
    fontWeight: 800,
    color: 'var(--ta)',
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: 3,
  },
  endSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,.45)',
    fontWeight: 600,
    marginTop: 4,
  },
};

// Inject flash keyframe once
if (typeof document !== 'undefined' && !document.getElementById('lax-track-styles')) {
  const tag = document.createElement('style');
  tag.id = 'lax-track-styles';
  tag.textContent = `
    @keyframes lax-flash {
      0%   { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(tag);
}