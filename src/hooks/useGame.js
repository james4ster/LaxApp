import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { NEEDS_PLAYER, STAT_LABELS } from '../lib/constants';

/**
 * useGame — central state for a live game session.
 *
 * Owns:
 *  - team-level counts (goal, ogoal, miss, oshot, etc.)
 *  - per-player stat accumulation
 *  - undo (last single event)
 *  - active goalie
 *  - current quarter
 *
 * TODO: replace mockGameId / mockTeamId with real values from game setup screen.
 * TODO: wire supabase INSERT/UPDATE calls once game_id is available.
 */

const MOCK_GAME_ID = null; // replace with real UUID from games table
const MOCK_TEAM_ID = null; // replace with real UUID from teams table

// Placeholder roster — replace with Supabase query in useEffect
export const DEMO_PLAYERS = [
  { id: 'p1', num: 1, name: 'Hayes', pos: 'G' },
  { id: 'p2', num: 3, name: 'Miller', pos: 'ATT' },
  { id: 'p3', num: 5, name: 'Osei', pos: 'MID' },
  { id: 'p4', num: 7, name: 'Chen', pos: 'ATT' },
  { id: 'p5', num: 9, name: 'Walsh', pos: 'DEF' },
  { id: 'p6', num: 11, name: 'Torres', pos: 'ATT' },
  { id: 'p7', num: 12, name: 'Grant', pos: 'MID' },
  { id: 'p8', num: 14, name: 'Park', pos: 'FOGO' },
  { id: 'p9', num: 17, name: 'Nguyen', pos: 'DEF' },
  { id: 'p10', num: 20, name: 'Scott', pos: 'MID' },
  { id: 'p11', num: 22, name: 'Davis', pos: 'DEF' },
  { id: 'p12', num: 27, name: 'Reed', pos: 'ATT' },
  { id: 'p13', num: 30, name: 'Reid', pos: 'G' },
  { id: 'p14', num: 44, name: 'Burke', pos: 'DEF' },
];

function initPlayerStats(players) {
  const map = {};
  players.forEach((p) => {
    map[p.id] = { g: 0, a: 0, gb: 0, to: 0, fo_w: 0, fo_l: 0 };
  });
  return map;
}

export function useGame(players = DEMO_PLAYERS) {
  const goalies = players.filter((p) => p.pos === 'G');
  const fieldPlayers = players.filter((p) => p.pos !== 'G');

  // ── Team counts ──────────────────────────────────────────────────────────
  const [counts, setCounts] = useState({
    goal: 0,
    ogoal: 0,
    miss: 0,
    oshot: 0,
    gb: 0,
    cto: 0,
    to: 0,
    interc: 0,
    fo_w: 0,
    fo_l: 0,
    assist: 0,
  });

  // ── Per-player stats ─────────────────────────────────────────────────────
  const [playerStats, setPlayerStats] = useState(() =>
    initPlayerStats(players)
  );

  // ── Game meta ────────────────────────────────────────────────────────────
  const [quarter, setQuarter] = useState(1);
  const [activeGoalie, setActiveGoalie] = useState(goalies[0] ?? null);

  // ── Undo ─────────────────────────────────────────────────────────────────
  const lastEvent = useRef(null); // { key, playerId }
  const [lastLabel, setLastLabel] = useState('–');

  // ── Derived helpers ──────────────────────────────────────────────────────
  const gc = useCallback((k) => counts[k] ?? 0, [counts]);
  const saves = useCallback(
    () => Math.max(0, (counts.oshot ?? 0) - (counts.ogoal ?? 0)),
    [counts]
  );
  const svPct = useCallback(() => {
    const s = counts.oshot ?? 0;
    return s > 0 ? Math.round((saves() / s) * 100) + '%' : '–';
  }, [counts, saves]);
  const sogUs = useCallback(
    () => (counts.goal ?? 0) + (counts.miss ?? 0),
    [counts]
  );

  // ── Record a stat ────────────────────────────────────────────────────────
  const recordStat = useCallback(
    async (key, player = null) => {
      // 1. Increment team count
      setCounts((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));

      // 2. Increment per-player count
      if (player) {
        setPlayerStats((prev) => {
          const ps = { ...prev[player.id] };
          if (key === 'goal') ps.g++;
          if (key === 'assist') ps.a++;
          if (key === 'gb') ps.gb++;
          if (key === 'to') ps.to++;
          if (key === 'fo_w') ps.fo_w++;
          if (key === 'fo_l') ps.fo_l++;
          return { ...prev, [player.id]: ps };
        });
      }

      // 3. Update undo ref + label
      lastEvent.current = { key, playerId: player?.id ?? null };
      const label = STAT_LABELS[key] ?? key;
      setLastLabel(label + (player ? ` — #${player.num} ${player.name}` : ''));

      // 4. Persist to Supabase
      // TODO: uncomment once MOCK_GAME_ID is real
      // await supabase.from('game_events').insert({
      //   game_id:         MOCK_GAME_ID,
      //   player_id:       player?.id ?? null,
      //   stat_type_id:    await resolveStatTypeId(key),
      //   period:          quarter,
      //   value:           1,
      //   input_method:    'tap',
      //   client_event_id: crypto.randomUUID(),
      // })
    },
    [quarter]
  );

  // ── Undo last event ──────────────────────────────────────────────────────
  const undoLast = useCallback(() => {
    const ev = lastEvent.current;
    if (!ev) return;

    setCounts((prev) => ({
      ...prev,
      [ev.key]: Math.max(0, (prev[ev.key] ?? 0) - 1),
    }));

    if (ev.playerId) {
      setPlayerStats((prev) => {
        const ps = { ...prev[ev.playerId] };
        if (ev.key === 'goal') ps.g = Math.max(0, ps.g - 1);
        if (ev.key === 'assist') ps.a = Math.max(0, ps.a - 1);
        if (ev.key === 'gb') ps.gb = Math.max(0, ps.gb - 1);
        if (ev.key === 'to') ps.to = Math.max(0, ps.to - 1);
        if (ev.key === 'fo_w') ps.fo_w = Math.max(0, ps.fo_w - 1);
        if (ev.key === 'fo_l') ps.fo_l = Math.max(0, ps.fo_l - 1);
        return { ...prev, [ev.playerId]: ps };
      });
    }

    // TODO: supabase.from('game_events').update({ voided: true }).eq('id', ev.supabaseId)

    lastEvent.current = null;
    setLastLabel('–');
  }, []);

  return {
    // state
    counts,
    playerStats,
    quarter,
    activeGoalie,
    lastLabel,
    goalies,
    fieldPlayers,
    // derived
    gc,
    saves,
    svPct,
    sogUs,
    // actions
    recordStat,
    undoLast,
    setQuarter,
    setActiveGoalie,
  };
}
