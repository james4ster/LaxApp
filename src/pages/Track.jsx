import React, { useState } from 'react';
import PossessionWidget from '../components/PossessionWidget';
import GoalieBar from '../components/GoalieBar';
import StatSection from '../components/StatSection';
import PlayerModal from '../components/PlayerModal';
import { STAT_SECTIONS, ROLE_SECTIONS, NEEDS_PLAYER } from '../lib/constants';

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
}) {
  const [modalStat, setModalStat] = useState(null);

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
        <PossessionWidget
          possState={possState}
          usMs={usMs}
          themMs={themMs}
          usPct={usPct}
          themPct={themPct}
          totalMs={totalMs}
          onSetPoss={onSetPoss}
        />

        <GoalieBar
          goalies={goalies}
          activeGoalie={activeGoalie}
          onChangeGoalie={onChangeGoalie}
          saves={saves}
          ga={ga}
          svPct={svPct}
        />

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
        <button style={styles.undoBtn} onClick={onUndo}>
          ↩ Undo
        </button>
      </div>

      {/* Full-screen player modal */}
      <PlayerModal
        isOpen={modalStat !== null}
        pendingStat={modalStat}
        fieldPlayers={fieldPlayers}
        onRecord={handleRecord}
        onClose={() => setModalStat(null)}
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
