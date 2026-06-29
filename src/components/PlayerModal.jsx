import React, { useState, useEffect } from 'react';
import { NEEDS_PLAYER, STAT_PROMPTS } from '../lib/constants';

/**
 * PlayerModal
 *
 * Flow for goals:
 *   1. Slide up — show roster, prompt "Who scored?"
 *   2. Player tapped — highlight them, show assist footer
 *   3a. Yes assist → swap to "Who assisted?" picker
 *   3b. No assist  → record goal only, close
 *
 * Flow for all other player-attributed stats:
 *   1. Slide up — show roster
 *   2. Player tapped → record immediately, close
 */
export default function PlayerModal({
  isOpen,
  pendingStat,
  fieldPlayers,
  onRecord,
  onClose,
}) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [phase, setPhase] = useState('pick'); // 'pick' | 'assist'

  // Reset state whenever the modal opens with a new stat
  useEffect(() => {
    if (isOpen) {
      setSelectedPlayer(null);
      setPhase('pick');
    }
  }, [isOpen, pendingStat]);

  if (!isOpen) return null;

  const isGoal = pendingStat === 'goal';
  const isFO = pendingStat === 'fo_w' || pendingStat === 'fo_l';
  const title =
    phase === 'assist'
      ? 'Who assisted?'
      : selectedPlayer && isGoal
      ? `#${selectedPlayer.num} ${selectedPlayer.name} scored`
      : STAT_PROMPTS[pendingStat] ?? 'Select player';

  const showAssistFooter = isGoal && selectedPlayer && phase === 'pick';

  const handlePlayerTap = (player) => {
    if (isGoal) {
      setSelectedPlayer(player);
      // Don't record yet — wait for assist answer
    } else if (phase === 'assist') {
      // Recording the assist
      onRecord('assist', player);
      onClose();
    } else {
      // Non-goal stat — record and close immediately
      onRecord(pendingStat, player);
      onClose();
    }
  };

  const handleAssist = (yes) => {
    // Record the goal for the selected scorer
    onRecord('goal', selectedPlayer);
    if (yes) {
      // Switch to assist picker
      setPhase('assist');
      setSelectedPlayer(null);
    } else {
      onClose();
    }
  };

  return (
    <div style={styles.overlay}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onClose}>
          ← Cancel
        </button>
        <div style={styles.title}>{title}</div>
        <div style={{ width: 72 }} />
      </div>

      <div style={styles.sub}>
        {phase === 'assist'
          ? 'Tap assisting player'
          : isGoal && selectedPlayer
          ? 'Confirm scorer below'
          : 'Tap a player'}
      </div>

      {/* Player grid */}
      <div style={styles.grid}>
        {fieldPlayers.map((p) => {
          const isSelected = selectedPlayer?.id === p.id;
          const isFogo = isFO && p.pos === 'FOGO';
          return (
            <button
              key={p.id}
              onClick={() => handlePlayerTap(p)}
              style={{
                ...styles.card,
                background: isSelected ? 'var(--tp)' : 'var(--surf)',
                borderColor: isSelected
                  ? 'var(--tp)'
                  : isFogo
                  ? 'var(--ta)'
                  : 'var(--bdr)',
              }}
            >
              <div
                style={{
                  ...styles.cardNum,
                  color: isSelected ? 'var(--tpt)' : 'var(--txt)',
                }}
              >
                #{p.num}
              </div>
              <div
                style={{
                  ...styles.cardName,
                  color: isSelected ? 'var(--tpt)' : 'var(--txt2)',
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  ...styles.cardPos,
                  color: isSelected
                    ? 'var(--tpt)'
                    : p.pos === 'FOGO'
                    ? 'var(--ta)'
                    : 'var(--txt2)',
                }}
              >
                {p.pos}
              </div>
            </button>
          );
        })}
      </div>

      {/* Assist footer — only for goals after scorer selected */}
      {showAssistFooter && (
        <div style={styles.assistFooter}>
          <div style={styles.assistQ}>Assisted?</div>
          <div style={styles.assistBtns}>
            <button
              style={{
                ...styles.assistBtn,
                background: 'var(--tp)',
                color: 'var(--tpt)',
              }}
              onClick={() => handleAssist(true)}
            >
              ✓ Yes — pick assister
            </button>
            <button
              style={{
                ...styles.assistBtn,
                background: 'var(--surf2)',
                color: 'var(--txt)',
              }}
              onClick={() => handleAssist(false)}
            >
              No assist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 480,
    margin: '0 auto',
    animation: 'slideUp .22s cubic-bezier(.32,.72,0,1)',
  },
  header: {
    background: 'var(--ts)',
    padding: 'max(10px, env(safe-area-inset-top)) 12px 10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
  },
  backBtn: {
    background: 'rgba(255,255,255,.12)',
    border: 'none',
    color: '#fff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    padding: '5px 11px',
    borderRadius: 7,
  },
  title: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sub: {
    padding: '7px 10px 2px',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '.7px',
    color: 'var(--txt2)',
    flexShrink: 0,
  },
  grid: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    padding: '6px 8px 8px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 7,
    alignContent: 'start',
  },
  card: {
    border: '2px solid',
    borderRadius: 12,
    padding: '10px 5px 9px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    cursor: 'pointer',
    transition: 'transform .1s, border-color .1s, background .1s',
  },
  cardNum: { fontSize: 17, fontWeight: 800 },
  cardName: {
    fontSize: 9,
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: 1.2,
  },
  cardPos: { fontSize: 8, fontWeight: 700, textTransform: 'uppercase' },
  assistFooter: {
    background: 'var(--surf)',
    borderTop: '1px solid var(--bdr)',
    padding: '10px 11px 14px',
    flexShrink: 0,
  },
  assistQ: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--txt)',
    textAlign: 'center',
    marginBottom: 8,
  },
  assistBtns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 },
  assistBtn: {
    padding: 12,
    borderRadius: 11,
    border: 'none',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  },
};

// Inject slide-up keyframe once
if (
  typeof document !== 'undefined' &&
  !document.getElementById('player-modal-styles')
) {
  const tag = document.createElement('style');
  tag.id = 'player-modal-styles';
  tag.textContent = `@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`;
  document.head.appendChild(tag);
}
