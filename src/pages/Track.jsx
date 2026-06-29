import React, { useState } from 'react';
import PossessionWidget from '../components/PossessionWidget';
import GoalieBar from '../components/GoalieBar';
import StatSection from '../components/StatSection';
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
  usPct,
  themPct,
  totalMs,
  onSetPoss,
  role,
  onEndGame,
  onRecordPenalty,
  strength,
  onSetStrength,
}) {
  const [modalStat, setModalStat] = useState(null);
  const [showEndGameModal, setShowEndGameModal] = useState(false);

  const visibleSectionIds = ROLE_SECTIONS[role] ?? ROLE_SECTIONS.solo;
  const visibleSections = STAT_SECTIONS.filter((s) =>
    visibleSectionIds.includes(s.id)
  );

  const handleStatTap = (key) => {
    if (NEEDS_PLAYER.has(key)) {
      setModalStat(key);
    } else {
      onRecordStat(key, null);
    }
  };

  const handleRecord = (key, player) => {
    onRecordStat(key, player);
  };

  return (
    <>
      {/* Scrollable content */}
      <div style={styles.scroll} className="scroll-y">
      {ROLE_SHOWS_STRENGTH[role] && (
          <StrengthToggle strength={strength} onChange={onSetStrength} />
        )}
        {ROLE_SHOWS_POSSESSION[role] && (
          <PossessionWidget
            possState={possState}
            usMs={usMs}
            themMs={themMs}
            onSetPoss={onSetPoss}
          />
        )}
        {ROLE_SHOWS_PENALTIES[role] && (
          <PenaltyPad onRecordPenalty={onRecordPenalty} />
        )}
        {ROLE_SHOWS_GOALIE[role] && (
          <GoalieBar
            goalies={goalies}
            activeGoalie={activeGoalie}
            onChangeGoalie={onChangeGoalie}
            saves={saves}
            ga={ga}
            svPct={svPct}
          />
        )}

        {visibleSections.map((sec) => (
          <StatSection
            key={sec.id}
            id={sec.id}
            label={sec.label}
            stats={sec.stats}
            counts={counts}
            onTap={handleStatTap}
          />
        ))}
      </div>

      {/* Undo bar — sticky at bottom */}
      <div style={styles.undoBar}>
        <div style={styles.undoText}>
          Last:{' '}
          <strong style={{ color: 'var(--txt)', fontWeight: 600 }}>
            {lastLabel}
          </strong>
        </div>
        <div style={styles.undoRight}>
          <button style={styles.undoBtn} onClick={onUndo}>
            ↩ Undo
          </button>
          <EndGameButton onConfirmed={() => setShowEndGameModal(true)} />
        </div>
      </div>

      {/* Full-screen player modal */}
      <PlayerModal
        isOpen={modalStat !== null}
        pendingStat={modalStat}
        fieldPlayers={fieldPlayers}
        onRecord={handleRecord}
        onClose={() => setModalStat(null)}
      />

      {/* Final score / end game confirmation */}
      <FinalScoreModal
        isOpen={showEndGameModal}
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        onCancel={() => setShowEndGameModal(false)}
        onConfirm={() => {
          setShowEndGameModal(false);
          onEndGame?.();
        }}
      />
    </>
  );
}

const styles = {
  scroll: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 9px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  undoBar: {
    padding: '5px 9px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--bdr)',
    flexShrink: 0,
    background: 'var(--surf)',
    gap: 8,
  },
  undoRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  undoText: {
    fontSize: 11,
    color: 'var(--txt2)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 230,
  },
  undoBtn: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--tp)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '3px 8px',
    flexShrink: 0,
  },
};
