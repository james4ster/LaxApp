import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { STAT_LABELS } from '../lib/constants';

export const DEMO_PLAYERS = [
  { id: 'p1',  num: 1,  name: 'Hayes',  pos: 'G'    },
  { id: 'p2',  num: 3,  name: 'Miller', pos: 'ATT'  },
  { id: 'p3',  num: 5,  name: 'Osei',   pos: 'MID'  },
  { id: 'p4',  num: 7,  name: 'Chen',   pos: 'ATT'  },
  { id: 'p5',  num: 9,  name: 'Walsh',  pos: 'DEF'  },
  { id: 'p6',  num: 11, name: 'Torres', pos: 'ATT'  },
  { id: 'p7',  num: 12, name: 'Grant',  pos: 'MID'  },
  { id: 'p8',  num: 14, name: 'Park',   pos: 'FOGO' },
  { id: 'p9',  num: 17, name: 'Nguyen', pos: 'DEF'  },
  { id: 'p10', num: 20, name: 'Scott',  pos: 'MID'  },
  { id: 'p11', num: 22, name: 'Davis',  pos: 'DEF'  },
  { id: 'p12', num: 27, name: 'Reed',   pos: 'ATT'  },
  { id: 'p13', num: 30, name: 'Reid',   pos: 'G'    },
  { id: 'p14', num: 44, name: 'Burke',  pos: 'DEF'  },
];

const EMPTY_COUNTS = {
  goal: 0, ogoal: 0, sog: 0, miss: 0, oshot: 0, omiss: 0,
  gb: 0, gb_them: 0, cto: 0, to: 0,
  fo_w: 0, fo_l: 0, assist: 0,
  pen_us: 0, pen_them: 0, pen_us_sec: 0, pen_them_sec: 0,
  goal_pp: 0, goal_pk: 0, ogoal_pp: 0, ogoal_pk: 0,
};

function initPlayerStats(players) {
  const map = {};
  players.forEach((p) => {
    map[p.id] = { g: 0, a: 0, gb: 0, to: 0, fo_w: 0, fo_l: 0, pen: 0, sog: 0 };
  });
  return map;
}

function emptyQuarterBucket() {
  return { goal: 0, ogoal: 0, sog: 0, oshot: 0 };
}

/**
 * applyEvent — pure reducer shared by both live recording and DB history
 * rebuild so the two paths can never silently drift apart.
 */
function applyEvent(state, ev) {
  const { stat_key: key, player_id, period, strength, value } = ev;
  const counts      = { ...state.counts };
  const playerStats = { ...state.playerStats };
  const quarterStats = { ...state.quarterStats };

  // ── Penalties ─────────────────────────────────────────────────────────
  if (key === 'pen_us' || key === 'pen_them') {
    counts[key] = (counts[key] ?? 0) + 1;
    const secKey = key === 'pen_us' ? 'pen_us_sec' : 'pen_them_sec';
    counts[secKey] = (counts[secKey] ?? 0) + (value ?? 0);
    if (player_id && playerStats[player_id]) {
      const ps = { ...playerStats[player_id] };
      ps.pen = (ps.pen ?? 0) + 1;
      playerStats[player_id] = ps;
    }
    return { counts, playerStats, quarterStats };
  }

  // ── Team counts ────────────────────────────────────────────────────────
  counts[key] = (counts[key] ?? 0) + 1;
  // Auto-bump shot counters alongside goals
  if (key === 'goal')  counts.sog   = (counts.sog   ?? 0) + 1;
  if (key === 'ogoal') counts.oshot = (counts.oshot ?? 0) + 1;

  // ── Strength-tagged scoring ────────────────────────────────────────────
  if (strength && strength !== 'even') {
    if (key === 'goal') {
      const k = strength === 'man_up' ? 'goal_pp' : 'goal_pk';
      counts[k] = (counts[k] ?? 0) + 1;
    }
    if (key === 'ogoal') {
      const k = strength === 'man_down' ? 'ogoal_pp' : 'ogoal_pk';
      counts[k] = (counts[k] ?? 0) + 1;
    }
  }

  // ── Quarter buckets (goals + shots only) ──────────────────────────────
  if (period != null && ['goal','ogoal','sog','oshot'].includes(key)) {
    const qKey = String(period);
    const bucket = { ...(quarterStats[qKey] ?? emptyQuarterBucket()) };
    bucket[key] = (bucket[key] ?? 0) + 1;
    if (key === 'goal')  bucket.sog   = (bucket.sog   ?? 0) + 1;
    if (key === 'ogoal') bucket.oshot = (bucket.oshot ?? 0) + 1;
    quarterStats[qKey] = bucket;
  }

  // ── Per-player ────────────────────────────────────────────────────────
  if (player_id && playerStats[player_id]) {
    const ps = { ...playerStats[player_id] };
    if (key === 'goal')   { ps.g++;  ps.sog++; }
    if (key === 'sog')      ps.sog++;
    if (key === 'assist')   ps.a++;
    if (key === 'gb')       ps.gb++;
    if (key === 'to')       ps.to++;
    if (key === 'fo_w')     ps.fo_w++;
    if (key === 'fo_l')     ps.fo_l++;
    playerStats[player_id] = ps;
  }

  return { counts, playerStats, quarterStats };
}

export function useGame(gameId = null, players = DEMO_PLAYERS) {
  const goalies      = players.filter((p) => p.pos === 'G');
  const fieldPlayers = players.filter((p) => p.pos !== 'G');

  const [counts,       setCounts]       = useState({ ...EMPTY_COUNTS });
  const [playerStats,  setPlayerStats]  = useState(() => initPlayerStats(players));
  const [quarterStats, setQuarterStats] = useState({});
  const [quarter,      setQuarter]      = useState(1);
  const [activeGoalie, setActiveGoalie] = useState(goalies[0] ?? null);

  const lastEvent = useRef(null); // { key, playerId, insertedId }
  const [lastLabel, setLastLabel] = useState('–');

  // ── Rebuild from DB on mount / when gameId changes ────────────────────
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    supabase
      .from('game_events')
      .select('*')
      .eq('game_id', gameId)
      .eq('voided', false)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('useGame: failed to load history', error);
          return;
        }
        let state = {
          counts:       { ...EMPTY_COUNTS },
          playerStats:  initPlayerStats(players),
          quarterStats: {},
        };
        for (const ev of data ?? []) {
          state = applyEvent(state, ev);
        }
        setCounts(state.counts);
        setPlayerStats(state.playerStats);
        setQuarterStats(state.quarterStats);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  // ── Derived helpers ───────────────────────────────────────────────────
  const gc = useCallback((k) => counts[k] ?? 0, [counts]);

  const saves = useCallback(
    () => Math.max(0, (counts.oshot ?? 0) - (counts.ogoal ?? 0)),
    [counts]
  );

  const svPct = useCallback(() => {
    const s = counts.oshot ?? 0;
    return s > 0 ? Math.round((saves() / s) * 100) + '%' : '–';
  }, [counts, saves]);

  const sogUs = useCallback(() => counts.sog ?? 0, [counts]);

  const qc = useCallback(
    (period, key) => quarterStats[String(period)]?.[key] ?? 0,
    [quarterStats]
  );

  // ── Record a stat ─────────────────────────────────────────────────────
  const recordStat = useCallback(
    async (key, player = null, shotLocation = null, currentStrength = null) => {
      const evShape = { stat_key: key, player_id: player?.id ?? null, period: quarter, strength: currentStrength, value: 1 };

      setCounts((prev) => applyEvent({ counts: prev, playerStats: {}, quarterStats: {} }, evShape).counts);

      if (player) {
        setPlayerStats((prev) => applyEvent({ counts: {}, playerStats: prev, quarterStats: {} }, evShape).playerStats);
      }

      if (['goal','ogoal','sog','oshot'].includes(key)) {
        setQuarterStats((prev) => applyEvent({ counts: {}, playerStats: {}, quarterStats: prev }, evShape).quarterStats);
      }

      lastEvent.current = { key, playerId: player?.id ?? null, insertedId: null };
      const label = STAT_LABELS[key] ?? key;
      setLastLabel(label + (player ? ` — #${player.num} ${player.name}` : ''));

      if (gameId) {
        const { data, error } = await supabase
          .from('game_events')
          .insert({
            game_id:         gameId,
            player_id:       player?.id ?? null,
            stat_key:        key,
            period:          quarter,
            value:           1,
            shot_x:          shotLocation?.x ?? null,
            shot_y:          shotLocation?.y ?? null,
            strength:        currentStrength,
            input_method:    'tap',
            client_event_id: crypto.randomUUID(),
          })
          .select()
          .single();
        if (error) {
          console.error('Failed to persist game_event', key, error);
        } else if (lastEvent.current?.key === key) {
          lastEvent.current.insertedId = data.id;
        }
      }
    },
    [quarter, gameId]
  );

  // ── Record a penalty ──────────────────────────────────────────────────
  const recordPenalty = useCallback(
    async (team, durationSec, player = null) => {
      const key    = team === 'us' ? 'pen_us' : 'pen_them';
      const secKey = team === 'us' ? 'pen_us_sec' : 'pen_them_sec';

      setCounts((prev) => ({
        ...prev,
        [key]:    (prev[key]    ?? 0) + 1,
        [secKey]: (prev[secKey] ?? 0) + durationSec,
      }));

      if (player) {
        setPlayerStats((prev) => {
          const ps = { ...prev[player.id] };
          ps.pen = (ps.pen ?? 0) + 1;
          return { ...prev, [player.id]: ps };
        });
      }

      lastEvent.current = { key, playerId: player?.id ?? null, insertedId: null };
      const mins     = Math.floor(durationSec / 60);
      const secs     = durationSec % 60;
      const durLabel = mins > 0 ? `${mins}:${secs < 10 ? '0' : ''}${secs}` : `${secs}s`;
      const who      = player ? ` — #${player.num} ${player.name}` : team === 'us' ? ' — Us' : ' — Them';
      setLastLabel(`Penalty (${durLabel})${who}`);

      if (gameId) {
        const { data, error } = await supabase
          .from('game_events')
          .insert({
            game_id:         gameId,
            player_id:       player?.id ?? null,
            stat_key:        key,
            period:          quarter,
            value:           durationSec,
            input_method:    'tap',
            client_event_id: crypto.randomUUID(),
          })
          .select()
          .single();
        if (error) {
          console.error('Failed to persist penalty', error);
        } else if (lastEvent.current?.key === key) {
          lastEvent.current.insertedId = data.id;
        }
      }
    },
    [quarter, gameId]
  );

  // ── Undo last event ───────────────────────────────────────────────────
  const undoLast = useCallback(() => {
    const ev = lastEvent.current;
    if (!ev) return;

    if (ev.key === 'pen_us' || ev.key === 'pen_them') {
      setCounts((prev) => ({
        ...prev,
        [ev.key]: Math.max(0, (prev[ev.key] ?? 0) - 1),
      }));
    } else {
      setCounts((prev) => {
        const next = { ...prev, [ev.key]: Math.max(0, (prev[ev.key] ?? 0) - 1) };
        if (ev.key === 'goal')  next.sog   = Math.max(0, (prev.sog   ?? 0) - 1);
        if (ev.key === 'ogoal') next.oshot = Math.max(0, (prev.oshot ?? 0) - 1);
        return next;
      });
    }

    if (ev.playerId) {
      setPlayerStats((prev) => {
        const ps = { ...prev[ev.playerId] };
        if (ev.key === 'goal')   { ps.g   = Math.max(0, ps.g   - 1); ps.sog = Math.max(0, ps.sog - 1); }
        if (ev.key === 'sog')      ps.sog  = Math.max(0, ps.sog  - 1);
        if (ev.key === 'assist')   ps.a    = Math.max(0, ps.a    - 1);
        if (ev.key === 'gb')       ps.gb   = Math.max(0, ps.gb   - 1);
        if (ev.key === 'to')       ps.to   = Math.max(0, ps.to   - 1);
        if (ev.key === 'fo_w')     ps.fo_w = Math.max(0, ps.fo_w - 1);
        if (ev.key === 'fo_l')     ps.fo_l = Math.max(0, ps.fo_l - 1);
        if (ev.key === 'pen_us' || ev.key === 'pen_them') ps.pen = Math.max(0, ps.pen - 1);
        return { ...prev, [ev.playerId]: ps };
      });
    }

    // Void the row in Supabase rather than deleting, so audit trail is preserved
    if (gameId && ev.insertedId) {
      supabase
        .from('game_events')
        .update({ voided: true, voided_at: new Date().toISOString() })
        .eq('id', ev.insertedId)
        .then(({ error }) => {
          if (error) console.error('Failed to void event', error);
        });
    }

    lastEvent.current = null;
    setLastLabel('–');
  }, [gameId]);

  return {
    counts, playerStats, quarterStats,
    quarter, activeGoalie, lastLabel,
    goalies, fieldPlayers,
    gc, qc, saves, svPct, sogUs,
    recordStat, recordPenalty, undoLast,
    setQuarter, setActiveGoalie,
  };
}