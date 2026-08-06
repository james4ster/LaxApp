import React, { useState, useCallback, useEffect } from 'react';
import Track    from './Track';
import LiveView from './LiveView';
import ScoreStrip from '../components/ScoreStrip';
import BottomNav  from '../components/BottomNav';
import { useGame }        from '../hooks/useGame';
import { usePossession }  from '../hooks/usePossession';
import { useGameContext } from '../hooks/useGameContext';
import { useStrength }    from '../hooks/useStrength';
import { useTheme }       from '../hooks/useTheme';
import { supabase }       from '../lib/supabase';

/**
 * GameContainer
 *
 * Resolves share_token → game_id from Supabase, then mounts all game hooks.
 * Used by both /track/:token (keeper) and /live/:token (fan).
 */
export default function GameContainer({ mode = 'track' }) {
  const token = window.location.pathname.split('/')[2];

  const [gameId,       setGameId]       = useState(null);
  const [tokenError,   setTokenError]   = useState(null);
  const [gameStatus,   setGameStatus]   = useState(null);
  const [tab,          setTab]          = useState(mode === 'live' ? 'fan' : 'track');

  // ── Resolve token → gameId ───────────────────────────────────────────
  useEffect(() => {
  if (!token) { setTokenError('No game token in URL.'); return; }

  const isLive = mode === 'live';

  if (isLive) {
    // Fan URL — look up by team slug → find active game
    supabase
      .from('teams')
      .select('id')
      .eq('slug', token)
      .maybeSingle()
      .then(({ data: team }) => {
        if (!team) {
          // Fallback: try fan_token lookup
          return supabase
            .from('games')
            .select('id, status')
            .eq('fan_token', token)
            .maybeSingle();
        }
        // Found team by slug — get their active game
       // Found team by slug — get every game that could be "the" game
        // right now, then pick the best one in JS (see below). A plain
        // SQL order-by can't express "live beats scheduled beats final"
        // in one pass, especially since scheduled games have a null
        // started_at, which Postgres sorts *first* on DESC — that would
        // wrongly surface next week's scheduled game over today's live one.
        return supabase
          .from('games')
          .select('id, status, scheduled_at, started_at')
          .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
          .in('status', ['live', 'scheduled', 'final']);
      })
      .then(({ data: games, error }) => {
        if (error || !games || games.length === 0) {
          setTokenError('Game not found. Check your link.');
          return;
        }

        // Priority: live game right now > soonest upcoming scheduled game
        // > most recent final. This is what a parent checking the link
        // actually wants to land on at any given moment in the season.
        const live = games.find(g => g.status === 'live');

        const nextScheduled = games
          .filter(g => g.status === 'scheduled')
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];

        const lastFinal = games
          .filter(g => g.status === 'final')
          .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];

        const best = live ?? nextScheduled ?? lastFinal;

        if (!best) {
          setTokenError('Game not found. Check your link.');
          return;
        }

        setGameId(best.id);
        setGameStatus(best.status);
      });
  } else {
    // Tracker URL — look up by tracker_token
    supabase
      .from('games')
      .select('id, status')
      .eq('tracker_token', token)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setTokenError('Game not found. Check your link.');
          return;
        }
        setGameId(data.id);
        setGameStatus(data.status);
      });
  }
}, [token, mode]);

  // ── Loading / error states ───────────────────────────────────────────
  if (tokenError) return <ErrorScreen message={tokenError} />;
  if (!gameId)    return <LoadingScreen />;

  // Game found but not started yet — both trackers and fans see a
  // waiting screen rather than trackers-only, so a parent who taps the
  // link before warmups don't hit a bare error page.
  if (gameStatus === 'scheduled') {
    return <WaitingScreen mode={mode} gameId={gameId} onStarted={() => setGameStatus('live')} />;
  }

  return <GameShell gameId={gameId} mode={mode} tab={tab} setTab={setTab} />;
}

// ── GameShell — all hooks, mounted only once gameId is known ─────────────
function GameShell({ gameId, mode, tab, setTab }) {
  const lsKey = `game_ended_${gameId}`;

  const [gameEnded, setGameEnded] = useState(() => {
    try { return localStorage.getItem(lsKey) === 'true'; } catch { return false; }
  });
  const [role, setRole] = useState('solo');

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

  const { isDark, toggleDark } = useTheme();

  // ── Mark live on first interaction ───────────────────────────────────
  const markLive = useCallback(async () => {
    await supabase
      .from('games')
      .update({ status: 'live' })
      .eq('id', gameId)
      .eq('status', 'scheduled');
  }, [gameId]);

  // ── End game ─────────────────────────────────────────────────────────
  const handleEndGame = useCallback(async () => {
    stopPossession?.();
    setGameEnded(true);
    try { localStorage.setItem(lsKey, 'true'); } catch { /**/ }

    const resolvedIsHome = isHome ?? true;
    const finalHome = resolvedIsHome ? counts.goal  : counts.ogoal;
    const finalAway = resolvedIsHome ? counts.ogoal : counts.goal;

    await supabase
      .from('games')
      .update({ status: 'final', final_score_home: finalHome, final_score_away: finalAway })
      .eq('id', gameId);
  }, [stopPossession, counts, isHome, gameId, lsKey]);

  // ── Stat recording ────────────────────────────────────────────────────
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

  // Fan-only mode — no nav, just LiveView
  if (mode === 'live') {
    return (
      <LiveView
        scoreUs={counts.goal}   scoreThem={counts.ogoal}
        quarter={quarter}       counts={counts}
        gc={gc}                 qc={qc}
        sogUs={sogUs}           svPct={svPct}
        usMs={usMs}             themMs={themMs}
        possState={possState}   fieldPlayers={fieldPlayers}
        goalies={goalies}       playerStats={playerStats}
        activeGoalie={activeGoalie}
        saves={saves()}         ga={counts.ogoal}
        quarterStats={quarterStats}
        gameEnded={gameEnded}
      />
    );
  }

  // Tracker mode — full shell with nav
  return (
    <div style={S.app}>
      <ScoreStrip
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        quarter={quarter}
        onQuarterChange={gameEnded || tab === 'fan' ? undefined : setQuarter}
        isDark={isDark}
        onToggleDark={toggleDark}
      />

      <div style={{ ...S.page, display: tab === 'track' ? 'flex' : 'none' }}>
        <Track
          counts={counts}             fieldPlayers={fieldPlayers}
          goalies={goalies}           activeGoalie={activeGoalie}
          onChangeGoalie={gameEnded ? undefined : setActiveGoalie}
          playerStats={playerStats}   onRecordStat={handleRecordStat}
          lastLabel={lastLabel}       onUndo={gameEnded ? undefined : undoLast}
          saves={saves()}             ga={counts.ogoal}
          svPct={svPct()}             possState={possState}
          usMs={usMs}                 themMs={themMs}
          usPct={usPct}               themPct={themPct}
          totalMs={totalMs}           onSetPoss={handleSetPoss}
          role={role}                 onEndGame={handleEndGame}
          onRecordPenalty={gameEnded ? undefined : recordPenalty}
          strength={strength}         onSetStrength={gameEnded ? undefined : setStrength}
          gameEnded={gameEnded}
        />
      </div>

      <div style={{ ...S.page, display: tab === 'fan' ? 'flex' : 'none' }}>
        <LiveView
          scoreUs={counts.goal}   scoreThem={counts.ogoal}
          quarter={quarter}       counts={counts}
          gc={gc}                 qc={qc}
          sogUs={sogUs}           svPct={svPct}
          usMs={usMs}             themMs={themMs}
          possState={possState}   fieldPlayers={fieldPlayers}
          goalies={goalies}       playerStats={playerStats}
          activeGoalie={activeGoalie}
          saves={saves()}         ga={counts.ogoal}
          quarterStats={quarterStats}
          gameEnded={gameEnded}
        />
      </div>

      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  );
}

// ── WaitingScreen — shown to trackers before manager starts the game ──────
function WaitingScreen({ gameId, onStarted, mode }) {
  const [starting, setStarting] = useState(false);

  // Poll every 5 seconds to see if the game has gone live — covers the
  // fan side (waiting on the tracker) and also catches the tracker's own
  // button below without needing extra local state juggling.
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('games')
        .select('status')
        .eq('id', gameId)
        .single();
      if (data?.status === 'live') {
        clearInterval(interval);
        onStarted();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [gameId, onStarted]);

  // Only the tracker can break out of this screen manually — a fan has
  // no business flipping game state. This was previously a dead end:
  // markLive() only fires from inside the tracker UI, which is exactly
  // what's gated behind this screen, so nothing could ever set it live.
  const handleStart = async () => {
    setStarting(true);
    const { error } = await supabase
      .from('games')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', gameId)
      .eq('status', 'scheduled'); // no-op if it's already live elsewhere
    setStarting(false);
    if (!error) onStarted();
  };

  return (
    <div style={W.wrap}>
      <div style={W.icon}>🥍</div>
      <div style={W.title}>Waiting for game to start</div>
      <div style={W.sub}>
        {mode === 'live'
          ? "The game hasn't started yet. This page will update automatically once tracking begins."
          : "Tap below once you're ready to start recording stats."}
      </div>

      {mode === 'track' ? (
        <button style={W.startBtn} onClick={handleStart} disabled={starting}>
          {starting ? 'Starting…' : 'Start tracking →'}
        </button>
      ) : (
        <div style={W.pulse} />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={W.wrap}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(143,209,79,.3)', borderTop: '3px solid #8fd14f', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorScreen({ message }) {
  return (
    <div style={W.wrap}>
      <div style={W.icon}>⚠️</div>
      <div style={W.title}>Can't load game</div>
      <div style={W.sub}>{message}</div>
    </div>
  );
}

const S = {
  app:  { maxWidth: 480, margin: '0 auto', height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  page: { flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 },
};

const W = {
  wrap:  { height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: 'var(--bg)', textAlign: 'center' },
  icon:  { fontSize: 48 },
  title: { fontSize: 20, fontWeight: 700, color: 'var(--txt)' },
  sub:   { fontSize: 14, color: 'var(--txt2)', maxWidth: 280, lineHeight: 1.6 },
  pulse: { width: 8, height: 8, borderRadius: '50%', background: '#8fd14f', animation: 'spin .8s linear infinite', marginTop: 8 },
};