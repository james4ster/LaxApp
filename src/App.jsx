import React, { useState, useCallback, useEffect } from 'react';
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
import { supabase } from './lib/supabase';
import './styles/globals.css';
import InstallPrompt from './components/InstallPrompt';

const ACTIVE_GAME_ID = 'ac84353f-3354-4cbc-8bdf-cb86763edea1';
const LS_KEY = `game_ended_${ACTIVE_GAME_ID}`;

export default function App() {
  const [tab,       setTab]       = useState('track');
  const [role,      setRole]      = useState('solo');

  const [gameEnded, setGameEnded] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; }
    catch { return false; }
  });

  // Secondary check against DB on mount
  useEffect(() => {
    if (gameEnded) return;
    supabase
      .from('games')
      .select('status')
      .eq('id', ACTIVE_GAME_ID)
      .single()
      .then(({ data }) => {
        if (data?.status === 'final') {
          setGameEnded(true);
          try { localStorage.setItem(LS_KEY, 'true'); } catch { /**/ }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gameId = ACTIVE_GAME_ID;
  const { isHome } = useGameContext(gameId);

  const {
    counts, playerStats, quarterStats,
    quarter, activeGoalie, lastLabel,
    goalies, fieldPlayers,
    gc, qc, saves, svPct, sogUs,
    recordStat, recordPenalty, undoLast,
    setQuarter, setActiveGoalie,
  } = useGame(gameId);

  const {
    possState, usMs, themMs, usPct, themPct, totalMs,
    setPoss, stop: stopPossession,
  } = usePossession(gameId, isHome ?? true);

  const { strength, setStrength } = useStrength();

  const {
    isDark, themeMode, activePreset,
    toggleDark, setTheme, applyPreset, applyCustom,
  } = useTheme();

  // ── Mark game live on first interaction ───────────────────────────────
  const markLive = useCallback(async () => {
    const { error } = await supabase
      .from('games')
      .update({ status: 'live' })
      .eq('id', gameId)
      .eq('status', 'scheduled');
    if (error) console.error('markLive failed', error);
  }, [gameId]);

  // ── End game ──────────────────────────────────────────────────────────
  const handleEndGame = useCallback(async () => {
    stopPossession?.();
    setGameEnded(true);
    try { localStorage.setItem(LS_KEY, 'true'); } catch { /**/ }

    const resolvedIsHome = isHome ?? true;
    const finalHome = resolvedIsHome ? counts.goal  : counts.ogoal;
    const finalAway = resolvedIsHome ? counts.ogoal : counts.goal;

    const { error } = await supabase
      .from('games')
      .update({ status: 'final', final_score_home: finalHome, final_score_away: finalAway })
      .eq('id', gameId);

    if (error) console.error('handleEndGame: failed to write final score', error);
  }, [stopPossession, counts, isHome, gameId]);

  // ── Stat recording ────────────────────────────────────────────────────
  // IMPORTANT: Track calls onRecordStat(key, player, location, assistPlayer)
  // — 4 args. We must inject `strength` in the correct position for
  // recordStat(key, player, location, strength, assistPlayer) — 5 args.
  const handleRecordStat = useCallback((key, player, location, assistPlayer) => {
    if (gameEnded) return;
    markLive();
    recordStat(key, player, location, strength, assistPlayer);
  }, [gameEnded, markLive, recordStat, strength]);

  const handleSetPoss = useCallback((side) => {
    if (gameEnded) return;
    markLive();
    setPoss(side);
  }, [gameEnded, markLive, setPoss]);

  return (
  <>
  <div className="landscape-warning">
      ↻ Rotate your phone back to portrait mode to use LaxLive
    </div>

    <div className="app-shell" style={styles.app}>
      <ScoreStrip
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        quarter={quarter}
        onQuarterChange={gameEnded || tab === 'fan' ? undefined : setQuarter}
        isDark={isDark}
        onToggleDark={toggleDark}
      />

      <div style={{ ...styles.page, display: tab === 'track' ? 'flex' : 'none' }}>
        <Track
          counts={counts}
          fieldPlayers={fieldPlayers}
          goalies={goalies}
          activeGoalie={activeGoalie}
          onChangeGoalie={gameEnded ? undefined : setActiveGoalie}
          playerStats={playerStats}
          onRecordStat={handleRecordStat}
          lastLabel={lastLabel}
          onUndo={gameEnded ? undefined : undoLast}
          saves={saves()}
          ga={counts.ogoal}
          svPct={svPct()}
          possState={possState}
          usMs={usMs}
          themMs={themMs}
          usPct={usPct}
          themPct={themPct}
          totalMs={totalMs}
          onSetPoss={handleSetPoss}
          role={role}
          onEndGame={handleEndGame}
          onRecordPenalty={gameEnded ? undefined : recordPenalty}
          strength={strength}
          onSetStrength={gameEnded ? undefined : setStrength}
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
      <InstallPrompt />
    </div>
  </>
  );
}

const styles = {
  app: {
    maxWidth:      480,
    margin:        '0 auto',
    height:        'calc(var(--vh, 1dvh) * 100)',
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    position:      'relative',
  },
  page: {
    flex:          1,
    flexDirection: 'column',
    overflow:      'hidden',
    minHeight:     0,
  },
};