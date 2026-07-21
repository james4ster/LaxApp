import React, { useState } from 'react';
import ScoreStrip from './components/ScoreStrip';
import BottomNav from './components/BottomNav';
import Track from './pages/Track';
import LiveView from './pages/LiveView';
import Setup from './pages/Setup';
import { useGame } from './hooks/useGame';
import { usePossession } from './hooks/usePossession';
import { useGameContext } from './hooks/useGameContext';
import { useTheme } from './hooks/useTheme';
import { useStrength } from './hooks/useStrength';
import './styles/globals.css';

// TODO: replace with real game-selection screen once GameSelect is wired up
const ACTIVE_GAME_ID = 'ac84353f-3354-4cbc-8bdf-cb86763edea1';

export default function App() {
  const [tab,       setTab]       = useState('track');
  const [role,      setRole]      = useState('solo');
  
  const [gameEnded, setGameEnded] = useState(() => {
    // Restore ended state across refreshes, keyed by gameId so it's game-specific
    try { return localStorage.getItem(`game_ended_${ACTIVE_GAME_ID}`) === 'true'; }
    catch { return false; }
  });

  const gameId = ACTIVE_GAME_ID;

  // ── Game context (resolves home/away for this specific game) ─────────
  const { isHome } = useGameContext(gameId);

  // ── Core hooks ────────────────────────────────────────────────────────
  const {
    counts, playerStats, quarterStats,
    quarter, activeGoalie, lastLabel,
    goalies, fieldPlayers,
    gc, qc, saves, svPct, sogUs,
    recordStat, recordPenalty, undoLast,
    setQuarter, setActiveGoalie,
  } = useGame(gameId);

  const {
    possState, usMs, themMs, usPct, themPct, totalMs, setPoss,
  } = usePossession(gameId, isHome); // null until useGameContext resolves — intentional

  const { strength, setStrength } = useStrength();

  const {
    isDark, themeMode, activePreset,
    toggleDark, setTheme, applyPreset, applyCustom,
  } = useTheme();

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleEndGame = () => {
    setGameEnded(true);
    setPoss('none');
    try { localStorage.setItem(`game_ended_${ACTIVE_GAME_ID}`, 'true'); }
    catch { /* storage unavailable — non-fatal */ }
    // TODO: write final score to games table once fully wired
  };

  // Thread current strength into stat recording so goals get tagged PP/PK
  const handleRecordStat = (key, player, location) => {
    recordStat(key, player, location, strength);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      <ScoreStrip
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        quarter={quarter}
        onQuarterChange={setQuarter}
        isDark={isDark}
        onToggleDark={toggleDark}
        disableQuarterChange={tab === 'fan'}
      />

      <div style={{ ...styles.page, display: tab === 'track' ? 'flex' : 'none' }}>
        <Track
          counts={counts}
          fieldPlayers={fieldPlayers}
          goalies={goalies}
          activeGoalie={activeGoalie}
          onChangeGoalie={setActiveGoalie}
          onRecordStat={handleRecordStat}
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
          onEndGame={handleEndGame}
          onRecordPenalty={recordPenalty}
          strength={strength}
          onSetStrength={setStrength}
          gameEnded={gameEnded}
        />
      </div>

      <div style={{ ...styles.page, display: tab === 'fan' ? 'flex' : 'none' }}>
        <LiveView
          scoreUs={counts.goal}
          scoreThem={counts.ogoal}
          quarter={quarter}
          counts={counts}
          gc={gc}
          qc={qc}
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
          quarterStats={quarterStats}
          gameEnded={gameEnded}
        />
      </div>

      <div style={{ ...styles.page, display: tab === 'setup' ? 'flex' : 'none' }}>
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
    maxWidth:  480,
    margin:    '0 auto',
    height:    '100dvh',
    display:   'flex',
    flexDirection: 'column',
    overflow:  'hidden',
    position:  'relative',
  },
  page: {
    flex:      1,
    flexDirection: 'column',
    overflow:  'hidden',
    minHeight: 0,
  },
};