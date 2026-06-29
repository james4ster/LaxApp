import React, { useState } from 'react';
import ScoreStrip from './components/ScoreStrip';
import BottomNav from './components/BottomNav';
import Track from './pages/Track';
import LiveView from './pages/LiveView';
import Setup from './pages/Setup';
import { useGame } from './hooks/useGame';
import { usePossession } from './hooks/usePossession';
import { useTheme } from './hooks/useTheme';
import './styles/globals.css';

export default function App() {
  const [tab, setTab] = useState('track');
  const [role, setRole] = useState('solo');

  // ── Hooks ────────────────────────────────────────────────────────────────
  const {
    counts,
    playerStats,
    quarter,
    activeGoalie,
    lastLabel,
    goalies,
    fieldPlayers,
    gc,
    saves,
    svPct,
    sogUs,
    recordStat,
    undoLast,
    setQuarter,
    setActiveGoalie,
  } = useGame();

  const { possState, usMs, themMs, usPct, themPct, totalMs, setPoss } =
    usePossession();

  const {
    isDark,
    themeMode,
    activePreset,
    toggleDark,
    setTheme,
    applyPreset,
    applyCustom,
  } = useTheme();

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      <ScoreStrip
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        quarter={quarter}
        onQuarterChange={setQuarter}
        isDark={isDark}
        onToggleDark={toggleDark}
      />

      {/* Pages — all mounted, visibility toggled via display */}
      <div
        style={{ ...styles.page, display: tab === 'track' ? 'flex' : 'none' }}
      >
        <Track
          counts={counts}
          fieldPlayers={fieldPlayers}
          goalies={goalies}
          activeGoalie={activeGoalie}
          onChangeGoalie={setActiveGoalie}
          onRecordStat={recordStat}
          lastLabel={lastLabel}
          onUndo={undoLast}
          saves={saves()}
          ga={counts.ogoal}
          svPct={svPct()}
          possState={possState}
          usMs={usMs}
          themMs={themMs}
          usPct={usPct}
          themPct={themPct}
          totalMs={totalMs}
          onSetPoss={setPoss}
          role={role}
        />
      </div>

      <div style={{ ...styles.page, display: tab === 'fan' ? 'flex' : 'none' }}>
        <LiveView
          scoreUs={counts.goal}
          scoreThem={counts.ogoal}
          quarter={quarter}
          counts={counts}
          gc={gc}
          sogUs={sogUs}
          svPct={svPct}
          usMs={usMs}
          themMs={themMs}
          possState={possState}
          fieldPlayers={fieldPlayers}
          goalies={goalies}
          playerStats={playerStats}
          activeGoalie={activeGoalie}
          saves={saves()}
          ga={counts.ogoal}
        />
      </div>

      <div
        style={{ ...styles.page, display: tab === 'setup' ? 'flex' : 'none' }}
      >
        <Setup
          role={role}
          onRoleChange={setRole}
          themeMode={themeMode}
          onThemeChange={setTheme}
          activePreset={activePreset}
          onPresetChange={applyPreset}
          onCustomColors={applyCustom}
        />
      </div>

      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  );
}

const styles = {
  app: {
    maxWidth: 480,
    margin: '0 auto',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  page: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: 0,
  },
};
