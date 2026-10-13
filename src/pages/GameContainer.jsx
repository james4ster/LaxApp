import React, { useState, useCallback, useEffect, useRef } from 'react';
import Track    from './Track';
import LiveView from './LiveView';
import ScoreStrip from '../components/ScoreStrip';
import BottomNav  from '../components/BottomNav';
import { useGame }        from '../hooks/useGame';
import { usePossession }  from '../hooks/usePossession';
import { useGameContext } from '../hooks/useGameContext';
import { useStrength }    from '../hooks/useStrength';
import { useTheme }       from '../hooks/useTheme';
import { useFanPresence } from '../hooks/useFanPresence';
import { supabase }       from '../lib/supabase';
import Setup              from './Setup';

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
  const [fanTeam,      setFanTeam]      = useState(null);
  const fanVisitRecorded = useRef(false);

  // ── Resolve token → gameId ───────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function resolveGame() {
      if (!token) {
        setTokenError('No game token in URL.');
        return;
      }

      try {
        if (mode === 'live') {
          const { data: team, error: teamError } = await supabase
            .from('teams')
            .select('id, slug, season_year')
            .eq('slug', token)
            .maybeSingle();

          if (teamError) throw teamError;

          if (!team) {
            const { data: game, error: gameError } = await supabase
              .from('games')
              .select('id, status')
              .or(`share_token.eq.${token},fan_token.eq.${token}`)
              .maybeSingle();

            if (gameError) throw gameError;
            if (!game) {
              if (!cancelled) setTokenError('Team or game not found. Check your fan link.');
              return;
            }
            if (!cancelled) {
              setGameId(game.id);
              setGameStatus(game.status);
            }
            return;
          }

          const { data: games, error: gamesError } = await supabase
            .from('games')
            .select('id, status, scheduled_at, started_at')
            .or(`home_team_id.eq.${team.id},away_team_id.eq.${team.id}`)
            .in('status', ['live', 'scheduled', 'final']);

          if (gamesError) throw gamesError;
          if (!games?.length) {
            if (!cancelled) setTokenError('No games found for this team yet.');
            return;
          }

          const live = games.find((game) => game.status === 'live');
          const nextScheduled = games
            .filter((game) => game.status === 'scheduled')
            .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];
          const lastFinal = games
            .filter((game) => game.status === 'final')
            .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))[0];
          const best = live ?? nextScheduled ?? lastFinal;

          if (!best) {
            if (!cancelled) setTokenError('No games found for this team yet.');
            return;
          }

          if (!cancelled) {
            setFanTeam(team);
            setGameId(best.id);
            setGameStatus(best.status);
          }
          return;
        }

        const { data: game, error: gameError } = await supabase
          .from('games')
          .select('id, status')
          .or(`share_token.eq.${token},tracker_token.eq.${token}`)
          .maybeSingle();

        if (gameError) throw gameError;
        if (!game) {
          if (!cancelled) setTokenError('Game not found. Check your tracker link.');
          return;
        }
        if (!cancelled) {
          setGameId(game.id);
          setGameStatus(game.status);
        }
      } catch (error) {
        console.error('Failed to resolve game link', error);
        if (!cancelled) setTokenError(error instanceof Error ? error.message : 'Unable to load this game.');
      }
    }

    resolveGame();
    return () => { cancelled = true; };
  }, [token, mode]);

  useEffect(() => {
    if (mode !== 'live' || !fanTeam || fanVisitRecorded.current) return;
    fanVisitRecorded.current = true;

    let visitorId;
    try {
      const storageKey = `laxlive-fan-${fanTeam.slug}-${fanTeam.season_year}`;
      visitorId = localStorage.getItem(storageKey);
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(storageKey, visitorId);
      }
    } catch (error) {
      console.error('Unable to persist anonymous fan visitor ID', error);
      visitorId = crypto.randomUUID();
    }

    supabase
      .rpc('record_fan_view', {
        p_team_slug: fanTeam.slug,
        p_visitor_id: visitorId,
      })
      .then(({ error }) => {
        if (error) console.error('Unable to record fan link visit', error);
      });
  }, [mode, fanTeam]);

  // ── Loading / error states ───────────────────────────────────────────
  if (tokenError) return <ErrorScreen message={tokenError} />;
  if (!gameId)    return <LoadingScreen />;

  // Game found but not started yet — both trackers and fans see a
  // waiting screen rather than trackers-only, so a parent who taps the
  // link before warmups don't hit a bare error page.
  if (gameStatus === 'scheduled') {
    return <WaitingScreen mode={mode} gameId={gameId} onStarted={() => setGameStatus('live')} />;
  }

  return <GameShell gameId={gameId} mode={mode} tab={tab} setTab={setTab} fanTeam={fanTeam} />;
}

// ── GameShell — all hooks, mounted only once gameId is known ─────────────
function GameShell({ gameId, mode, tab, setTab, fanTeam }) {
  const lsKey = `game_ended_${gameId}`;

  const [gameEnded, setGameEnded] = useState(() => {
    try { return localStorage.getItem(lsKey) === 'true'; } catch { return false; }
  });
  const [role, setRole] = useState('solo');
  const [players, setPlayers] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState('');

  const { isHome, homeTeamId, awayTeamId, loading: gameContextLoading } = useGameContext(gameId);
  const teamId = mode === 'live' && fanTeam
    ? fanTeam.id
    : isHome === null ? null : isHome ? homeTeamId : awayTeamId;

  useEffect(() => {
    if (!teamId) {
      if (!gameContextLoading) {
        setRosterError('Unable to determine which team roster belongs to this game.');
        setRosterLoading(false);
      }
      return;
    }
    let cancelled = false;
    setRosterLoading(true);
    setRosterError('');

    supabase
      .from('players')
      .select('id, jersey_number, full_name, position')
      .eq('team_id', teamId)
      .eq('active', true)
      .order('jersey_number', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load game roster', error);
          setRosterError(error.message);
          setRosterLoading(false);
          return;
        }
        const roster = (data ?? []).map((player) => ({
          id: player.id,
          num: player.jersey_number ?? '–',
          name: player.full_name,
          pos: player.position ?? '',
        }));
        setPlayers(roster);
        setRosterError(roster.length ? '' : 'No active players were found for this team.');
        setRosterLoading(false);
      });

    return () => { cancelled = true; };
  }, [teamId, gameContextLoading]);

  const {
    counts, playerStats, quarterStats,
    quarter, activeGoalie, lastLabel, eventSaveError,
    goalies, fieldPlayers,
    gc, qc, saves, svPct, sogUs,
    recordStat, recordPenalty, undoLast,
    setQuarter, setActiveGoalie,
  } = useGame(gameId, players);

  const {
    possState, usMs, themMs, usPct, themPct, totalMs,
    setPoss, stop: stopPossession,
  } = usePossession(gameId, isHome ?? true);

  const { strength, setStrength } = useStrength();

  const {
    isDark, themeMode, activePreset, toggleDark, setTheme, applyPreset, applyCustom,
  } = useTheme();
  const currentFanViewers = useFanPresence(gameId, mode === 'live' ? 'fan' : null);

  // ── Mark live on first interaction ───────────────────────────────────
  const markLive = useCallback(async () => {
    await supabase
      .from('games')
      .update({
        status: 'live',
        started_at: new Date().toISOString(),
        share_token: crypto.randomUUID().replace(/-/g, '').slice(0, 16),
      })
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

  if (rosterLoading) return <LoadingScreen />;

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
        isDark={isDark}
        onToggleDark={toggleDark}
        rosterError={rosterError}
        currentFanViewers={currentFanViewers}
      />
    );
  }

  // Tracker mode — full shell with nav
  return (
    <div style={S.app}>
      {eventSaveError && (
        <div role="alert" style={S.saveError}>
          Stat not saved to the database: {eventSaveError}
        </div>
      )}
      {rosterError && (
        <div role="alert" style={S.saveError}>
          Player roster unavailable: {rosterError}
        </div>
      )}
      <ScoreStrip
        scoreUs={counts.goal}
        scoreThem={counts.ogoal}
        quarter={quarter}
        onQuarterChange={gameEnded || tab !== 'track' ? undefined : setQuarter}
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
          isDark={isDark}
          onToggleDark={toggleDark}
          rosterError={rosterError}
        />
      </div>

      <div style={{ ...S.page, display: tab === 'setup' ? 'flex' : 'none' }}>
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
      .update({
        status: 'live',
        started_at: new Date().toISOString(),
        share_token: crypto.randomUUID().replace(/-/g, '').slice(0, 16),
      })
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
  saveError: { padding: '8px 12px', background: '#7f1d1d', color: '#fff', fontSize: 13 },
};

const W = {
  wrap:  { height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: 'var(--bg)', textAlign: 'center' },
  icon:  { fontSize: 48 },
  title: { fontSize: 20, fontWeight: 700, color: 'var(--txt)' },
  sub:   { fontSize: 14, color: 'var(--txt2)', maxWidth: 280, lineHeight: 1.6 },
  pulse: { width: 8, height: 8, borderRadius: '50%', background: '#8fd14f', animation: 'spin .8s linear infinite', marginTop: 8 },
  startBtn: {
    background: '#8fd14f', color: '#0b2e16', border: 'none',
    borderRadius: 10, padding: '13px 28px', fontSize: 15, fontWeight: 800,
    cursor: 'pointer', marginTop: 4,
  },
};