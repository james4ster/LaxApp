import React, { useState, useCallback, useEffect } from 'react';
import ScoreStrip from './components/ScoreStrip';
import BottomNav  from './components/BottomNav';
import Track      from './pages/Track';
import LiveView   from './pages/LiveView';
import Setup      from './pages/Setup';
import { useGame }        from './hooks/useGame';
import { usePossession }  from './hooks/usePossession';
import { useGameContext } from './hooks/useGameContext';
import { useTheme }       from './hooks/useTheme';
import { useStrength }    from './hooks/useStrength';
import { supabase }       from './lib/supabase';
import './styles/globals.css';

// TODO: replace with real game-selection screen once GameSelect is wired up
const ACTIVE_GAME_ID = 'ac84353f-3354-4cbc-8bdf-cb86763edea1';

const LS_KEY = `game_ended_${ACTIVE_GAME_ID}`;

export default function App() {
  const [tab,  setTab]  = useState('track');
  const [role, setRole] = useState('solo');

  // ── gameEnded: initialise from localStorage, then verify against DB ───
  const [gameEnded, setGameEnded] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; }
    catch { return false; }
  });

  // Secondary check against DB status on mount — catches cases where
  // localStorage was cleared but the game is already final in Supabase.
  useEffect(() => {
    if (gameEnded) return; // already know it's over, skip the query
    supabase
      .from('games')
      .select('status')
      .eq('id', ACTIVE_GAME_ID)
      .single()
      .then(({ data }) => {
        if (data?.status === 'final') {
          setGameEnded(true);
          try { localStorage.setItem(LS_KEY, 'true'); } catch { /* non-fatal */ }
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  const gameId = ACTIVE_GAME_ID;

  // ── Game context (resolves home/away) ─────────────────────────────────
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

  // ── FIX: was usePossession(GAME_ID, ...) — GAME_ID was undefined ──────
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
      .eq('status', 'scheduled'); // no-op if already live/final
    if (error) console.error('markLive failed', error);
  }, [gameId]);

  // ── End game ──────────────────────────────────────────────────────────
  const handleEndGame = useCallback(async () => {
    // 1. Freeze possession clock and close open DB possession event
    stopPossession();

    // 2. Lock the UI immediately
    setGameEnded(true);
    try { localStorage.setItem(LS_KEY, 'true'); } catch { /* non-fatal */ }

    // 3. Write final score + status to Supabase
    const resolvedIsHome = isHome ?? true;
    const finalHome = resolvedIsHome ? counts.goal  : counts.ogoal;
    const finalAway = resolvedIsHome ? counts.ogoal : counts.goal;

    const { error } = await supabase
      .from('games')
      .update({
        status:           'final',
        final_score_home: finalHome,
        final_score_away: finalAway,
      })
      .eq('id', gameId);

    if (error) console.error('handleEndGame: failed to write final score', error);
    else       console.log(`Game ended. Home ${finalHome} – Away ${finalAway}`);
  }, [stopPossession, counts, isHome, gameId]);

  // ── Stat recording — threads current strength for PP/PK tagging ───────
  const handleRecordStat = useCallback((key, player, location) => {
    if (gameEnded) return;
    markLive();
    recordStat(key, player, location, strength);
  }, [gameEnded, markLive, recordStat, strength]);

  // ── Possession — guard against taps after game ends ───────────────────
  const handleSetPoss = useCallback((side) => {
    if (gameEnded) return;
    markLive();
    setPoss(side);
  }, [gameEnded, markLive, setPoss]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      <ScoreStrip
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        quarter={quarter}
        onQuarterChange={gameEnded ? undefined : setQuarter}
        isDark={isDark}
        onToggleDark={toggleDark}
        disableQuarterChange={tab === 'fan'}
      />

      {/* TRACK */}
      <div style={{ ...styles.page, display: tab === 'track' ? 'flex' : 'none' }}>
        <Track
          counts={counts}
          fieldPlayers={fieldPlayers}
          goalies={goalies}
          activeGoalie={activeGoalie}
          onChangeGoalie={gameEnded ? undefined : setActiveGoalie}
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

      {/* LIVE VIEW */}
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

      {/* SETUP */}
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
    maxWidth:      480,
    margin:        '0 auto',
    height:        '100dvh',
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