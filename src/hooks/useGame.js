import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { NEEDS_PLAYER, STAT_LABELS } from '../lib/constants';

// hardcoded ids only used for testing
export const DEMO_PLAYERS = [
  { id: 'a4c77ea4-919a-4a7d-a611-3143fa673c0c', num: 1, name: 'Hayes', pos: 'G' },
  { id: '94e6b136-f307-4551-9c8d-251ea46dab97', num: 3, name: 'Miller', pos: 'ATT' },
  { id: 'e11c78ae-c658-4123-9eb0-10ddf7bb9a1e', num: 5, name: 'Osei', pos: 'MID' },
  { id: '517c6ec3-5265-49c2-a6e2-2830e68c09f4', num: 7, name: 'Chen', pos: 'ATT' },
  { id: 'e01652dd-2dba-4e8d-a65a-3197114323ee', num: 9, name: 'Walsh', pos: 'DEF' },
  { id: '549c2d05-57b6-4d1a-b7f7-2fbe40c6bc14', num: 11, name: 'Torres', pos: 'ATT' },
  { id: '335f6ac2-fdff-4870-9276-c917d4c56aea', num: 12, name: 'Grant', pos: 'MID' },
  { id: 'b45744bf-b539-470a-9943-5c2907932a84', num: 14, name: 'Park', pos: 'FOGO' },
  { id: '7061519b-e222-495b-98ca-36f6066efb4a', num: 17, name: 'Nguyen', pos: 'DEF' },
  { id: 'ea2dc427-43db-42df-96ca-05e3404d9165', num: 20, name: 'Scott', pos: 'MID' },
  { id: '09f47156-a7a5-47dd-90fd-6d43e7aaff07', num: 22, name: 'Davis', pos: 'DEF' },
  { id: '12ce85c0-af24-4a71-875a-20b93a7e1d1d', num: 27, name: 'Reed', pos: 'ATT' },
  { id: 'f7d2644a-019c-4baa-9d11-59095466c0ce', num: 30, name: 'Reid', pos: 'G' },
  { id: '060abdcf-dd32-4180-a533-7fd770ffdc66', num: 44, name: 'Burke', pos: 'DEF' },
];

const EMPTY_COUNTS = {
  goal: 0, ogoal: 0, sog: 0, miss: 0, oshot: 0, omiss: 0,
  gb: 0, gbt: 0, cto: 0, to: 0, interc: 0,
  fo_w: 0, fo_l: 0, assist: 0,
  pen_us: 0, pen_them: 0, pen_us_sec: 0, pen_them_sec: 0,
  goal_pp: 0, goal_pk: 0, ogoal_pp: 0, ogoal_pk: 0,
};

const periodToInt = (q) => {
  if (q === 'OT')  return 5;
  if (q === 'OT2') return 6;
  return Number(q);
};

function initPlayerStats(players) {
  const map = {};
  players.forEach(p => {
    map[p.id] = { 
      g: 0,
      a: 0,
      gb: 0,
      to: 0,
      fo_w: 0,
      fo_l: 0,
      pen: 0,
      sog: 0,
      shots: 0,
      saves: 0,
      ga: 0
    };
  });
  return map;
}

function emptyQuarterBucket() {
  return { goal: 0, ogoal: 0, sog: 0, oshot: 0 };
}

function applyEvent(state, ev) {
  const { stat_key: key, player_id, goalie_id, period, strength, value } = ev;
  const counts      = { ...state.counts };
  const playerStats = { ...state.playerStats };
  const quarterStats = { ...state.quarterStats };

  console.log(
    "GOALIE EVENT",
    key,
    goalie_id,
    playerStats[goalie_id]
  );
  

  if (key === 'pen_us' || key === 'pen_them') {
    counts[key] = (counts[key] ?? 0) + 1;
  
    const secKey = key === 'pen_us' ? 'pen_us_sec' : 'pen_them_sec';
    counts[secKey] = (counts[secKey] ?? 0) + (value ?? 0);
  
    // normal player penalty
    if (player_id && playerStats[player_id]) {
      const ps = { ...playerStats[player_id] };
      ps.pen = (ps.pen ?? 0) + 1;
      playerStats[player_id] = ps;
    }
  
    // goalie penalty
    if (goalie_id && playerStats[goalie_id]) {
      const gs = { ...playerStats[goalie_id] };
      gs.pen = (gs.pen ?? 0) + 1;
      playerStats[goalie_id] = gs;
    }
  
    return { counts, playerStats, quarterStats };
  }

  counts[key] = (counts[key] ?? 0) + 1;
  if (key === 'goal')  counts.sog   = (counts.sog   ?? 0) + 1;
  if (key === 'ogoal') counts.oshot = (counts.oshot ?? 0) + 1;

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

  if (period != null && ['goal', 'ogoal', 'sog', 'oshot'].includes(key)) {
    const qKey  = String(period);
    const bucket = { ...(quarterStats[qKey] ?? emptyQuarterBucket()) };
    bucket[key]  = (bucket[key] ?? 0) + 1;
    if (key === 'goal')  bucket.sog   = (bucket.sog   ?? 0) + 1;
    if (key === 'ogoal') bucket.oshot = (bucket.oshot ?? 0) + 1;
    quarterStats[qKey] = bucket;
  }

  if (player_id && playerStats[player_id]) {
    const ps = { ...playerStats[player_id] };
  
    if (key === 'goal') { ps.g++; ps.sog++; }
    if (key === 'sog') ps.sog++;
    if (key === 'assist') ps.a++;
    if (key === 'gb') ps.gb++;
    if (key === 'to') ps.to++;
    if (key === 'fo_w') ps.fo_w++;
    if (key === 'fo_l') ps.fo_l++;
  
    playerStats[player_id] = ps;
  }
  
  
  // goalie attribution
    if (goalie_id && playerStats[goalie_id]) {
      const gs = { ...playerStats[goalie_id] };

      if (key === 'oshot') {
        // saved shot against goalie
        gs.shots = (gs.shots ?? 0) + 1;
      }

      if (key === 'ogoal') {
        // goal against goalie counts as a shot faced too
        gs.shots = (gs.shots ?? 0) + 1;
        gs.ga = (gs.ga ?? 0) + 1;
      }

      playerStats[goalie_id] = gs;
    }

  return { counts, playerStats, quarterStats };
}

// Full rebuild from an event array — used for history load and undo
function rebuildFromEvents(events, players) {
  let state = {
    counts: { ...EMPTY_COUNTS },
    playerStats: initPlayerStats(players),
    quarterStats: {},
  };

  events.forEach(ev => {
    state = applyEvent(state, ev);
  });

  return state;
}

// goalie display helper
export const goalieSaves = (player) =>
  Math.max(0, (player.shots ?? 0) - (player.ga ?? 0));

export function useGame(gameId = null, players = DEMO_PLAYERS) {
  const goalies      = players.filter(p => p.pos === 'G');
  const fieldPlayers = players.filter(p => p.pos !== 'G');

  const [counts,       setCounts]       = useState({ ...EMPTY_COUNTS });
  const [playerStats,  setPlayerStats]  = useState(() => initPlayerStats(players));
  const [quarterStats, setQuarterStats] = useState({});
  const [quarter,      setQuarter]      = useState(1);
  const [activeGoalie, setActiveGoalie] = useState(goalies[0] ?? null);
  const lastEvent = useRef([]);
  const [lastLabel,    setLastLabel]    = useState('–');

  
  const localEventIds    = useRef(new Set());
  // Keep a full copy of all DB events so undo can rebuild cheaply
  const allEventsRef     = useRef([]);
  // Stable ref to players so channel effect doesn't need players as dep
  const playersRef       = useRef(players);
  useEffect(() => { playersRef.current = players; }, [players]);

  // ── Apply state from a rebuilt snapshot ────────────────────────────────
  const applyState = useCallback((state) => {
    setCounts(state.counts);
    setPlayerStats(state.playerStats);
    setQuarterStats(state.quarterStats);
  }, []);

  // ── Load history ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    supabase
      .from('game_events')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('useGame: load error', error); return; }
        allEventsRef.current = data || [];
        applyState(rebuildFromEvents(allEventsRef.current, playersRef.current));
      });

    return () => { cancelled = true; };
  }, [gameId, applyState]);

  // ── Realtime channel — single stable subscription ──────────────────────
 useEffect(() => {
  if (!gameId) return;

  const refreshEvents = async () => {
    const { data, error } = await supabase
      .from('game_events')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Realtime refresh failed:', error);
      return;
    }

    allEventsRef.current = data || [];

    applyState(
      rebuildFromEvents(
        allEventsRef.current,
        playersRef.current
      )
    );
  };

  const channel = supabase
    .channel(`game-events-${gameId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `game_id=eq.${gameId}`
      },
      (payload) => {
        console.log('REALTIME INSERT RECEIVED:', payload);

        const ev = payload.new;

        // Skip our own insert because optimistic update already happened
        if (localEventIds.current.has(ev.client_event_id)) {
          localEventIds.current.delete(ev.client_event_id);

          // Still add to local history for undo
          allEventsRef.current = [
            ...allEventsRef.current,
            ev
          ];

          return;
        }

        // Other devices need a rebuild
        allEventsRef.current = [
          ...allEventsRef.current,
          ev
        ];

        applyState(
          rebuildFromEvents(
            allEventsRef.current,
            playersRef.current
          )
        );
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'game_events',
        filter: `game_id=eq.${gameId}`
      },
      async (payload) => {
        console.log("DELETE PAYLOAD", payload.old);

        // Always reload from DB after deletes
        // because multiple events can be deleted together (goal + assist)
        await refreshEvents();
      }
    )
    .subscribe((status) => {
      console.log('GAME EVENT CHANNEL STATUS:', status);

      if (status === 'SUBSCRIBED') {
        refreshEvents();
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };

}, [gameId, applyState]);

  // ── Derived helpers ────────────────────────────────────────────────────
  const gc    = useCallback((k) => counts[k] ?? 0, [counts]);
  const saves = useCallback(() => Math.max(0, (counts.oshot ?? 0) - (counts.ogoal ?? 0)), [counts]);
  const svPct = useCallback(() => {
    const s = counts.oshot ?? 0;
    return s > 0 ? Math.round((saves() / s) * 100) + '%' : '–';
  }, [counts, saves]);
  const sogUs = useCallback(() => counts.sog ?? 0, [counts]);
  const qc    = useCallback((period, key) => quarterStats[String(period)]?.[key] ?? 0, [quarterStats]);

  // ── recordStat ─────────────────────────────────────────────────────────
  const recordStat = useCallback(async (
    key,
    player = null,
    shotLocation = null,
    strength = null
  ) => {
  
    const goalie = (key === 'oshot' || key === 'ogoal')
      ? activeGoalie
      : null;
  
    const periodInt = periodToInt(quarter);

    // Optimistic local update
    setCounts(prev => applyEvent({ counts: prev, playerStats: {}, quarterStats: {} }, { stat_key: key, player_id: null, goalie_id: goalie?.id ?? null, period: periodInt, strength, value: 1 }).counts);
    // update field player
if (player && !goalie) {
  setPlayerStats(prev =>
    applyEvent(
      {
        counts: {},
        playerStats: prev,
        quarterStats: {}
      },
      {
        stat_key:key,
        player_id:player.id,
        period:periodInt,
        strength,
        value:1
      }
    ).playerStats
  );
}

  // update goalie
  if (goalie) {
    setPlayerStats(prev =>
      applyEvent(
        {
          counts: {},
          playerStats: prev,
          quarterStats: {}
        },
        {
          stat_key: key,
          player_id: null,
          goalie_id: goalie.id,
          period: periodInt,
          strength,
          value: 1
        }
      ).playerStats
    );
  }
    if (['goal', 'ogoal', 'sog', 'oshot'].includes(key)) setQuarterStats(prev => applyEvent({ counts: {}, playerStats: {}, quarterStats: prev }, { stat_key: key, player_id: null, period: periodInt, strength, value: 1 }).quarterStats);

    const undoEvent = {
      key,
      playerId: player?.id ?? null,
      insertedId: null,
      clientEventId: null
    };
    
    lastEvent.current.push(undoEvent);

    setLastLabel((STAT_LABELS[key] ?? key) + (player ? ` — #${player.num} ${player.name}` : ''));

    if (!gameId) return;

    const clientEventId = crypto.randomUUID();
    undoEvent.clientEventId = clientEventId;
    localEventIds.current.add(clientEventId);

    console.log('PLAYER BEING SAVED:', player);
    
    const { data, error } = await supabase
      .from('game_events')
      .insert({
        game_id:         gameId,
        player_id:       player?.id ?? null,
        goalie_id:       goalie?.id ?? null,   // <-- ADD THIS
        stat_key:        key,
        period:          periodInt,
        value:           1,
        shot_x:          shotLocation?.x ?? null,
        shot_y:          shotLocation?.y ?? null,
        strength:        strength,
        input_method:    'tap',
        client_event_id: clientEventId,
      })
      .select()
      .single();

      if (error) {
        console.error('Failed to persist game_event', key, error);
        localEventIds.current.delete(clientEventId);
      
        lastEvent.current = lastEvent.current.filter(
          e => e.insertedId !== null
        );
      }
      else {
      // Add to our local log so undo works correctly
      allEventsRef.current = [...allEventsRef.current, data];
      const match = lastEvent.current.find(
        e => e.clientEventId === clientEventId
      );
      
      if (match) {
        match.insertedId = data.id;
      }
    }
  }, [quarter, gameId, activeGoalie]);

  // ── recordPenalty ──────────────────────────────────────────────────────
  const recordPenalty = useCallback(async (team, durationSec, player = null, goalie = activeGoalie) => {
    const key    = team === 'us' ? 'pen_us'     : 'pen_them';
    const secKey = team === 'us' ? 'pen_us_sec' : 'pen_them_sec';
    const periodInt = periodToInt(quarter);

    setCounts(prev => ({ ...prev, [key]: (prev[key] ?? 0) + 1, [secKey]: (prev[secKey] ?? 0) + durationSec }));
    if (player) setPlayerStats(prev => { const ps = { ...prev[player.id] }; ps.pen = (ps.pen ?? 0) + 1; return { ...prev, [player.id]: ps }; });

    const undoEvent = {
      key,
      playerId: player?.id ?? null,
      insertedId: null,
      clientEventId: null
    };
    
    lastEvent.current.push(undoEvent);

    const mins = Math.floor(durationSec / 60), secs = durationSec % 60;
    const durLabel = mins > 0 ? `${mins}:${secs < 10 ? '0' : ''}${secs}` : `${secs}s`;
    setLastLabel(`Penalty (${durLabel})${player ? ` — #${player.num} ${player.name}` : team === 'us' ? ' — Us' : ' — Them'}`);

    if (!gameId) return;

    const clientEventId = crypto.randomUUID();
    undoEvent.clientEventId = clientEventId;
    localEventIds.current.add(clientEventId);

    const { data, error } = await supabase
      .from('game_events')
      .insert({ game_id: gameId, player_id: player?.id ?? null, goalie_id: goalie?.id ?? null, stat_key: key, period: periodInt, value: durationSec, input_method: 'tap', client_event_id: clientEventId })
      .select().single();

    if (error) {
      console.error('Failed to persist penalty event', error);
      localEventIds.current.delete(clientEventId);
    } else {
      allEventsRef.current = [...allEventsRef.current, data];
      const match = lastEvent.current.find(
        e => e.clientEventId === clientEventId
      );
      
      if (match) {
        match.insertedId = data.id;
      }
    }
  }, [quarter, gameId, activeGoalie]);

  // ── undoLast ───────────────────────────────────────────────────────────
  const undoLast = useCallback(async () => {
    const events = lastEvent.current;
    console.log("=== UNDO START ===");
    console.log("LAST EVENT STACK:", lastEvent.current);
  
    if (!events.length) return;
  
    const ids = events
      .map(e => e.insertedId)
      .filter(Boolean);
  
    if (ids.length) {
      console.log("UNDO EVENTS", events);
      console.log("UNDO IDS", ids);
      // Remove locally first
      allEventsRef.current = allEventsRef.current.filter(
        e => !ids.includes(e.id)
      );
  
      applyState(
        rebuildFromEvents(
          allEventsRef.current,
          playersRef.current
        )
      );
  
      if (gameId) {
        const { error, count } = await supabase
          .from('game_events')
          .delete({ count: 'exact' })
          .in('id', ids);

        console.log("DELETE COUNT", count, error);

          console.log("DELETE RESULT", {
            ids,
            data,
            error,
          });
  
        if (error) {
          console.error('Failed to delete undone event', error);
          lastEvent.current = events;
          return;
        }
      }
  
    } else {
  
      // No DB ids yet, only reverse local pending events
      setCounts(prev => {
        const next = { ...prev };
  
        events.forEach(ev => {
          next[ev.key] = Math.max(0, (next[ev.key] ?? 0) - 1);
  
          if (ev.key === 'goal') {
            next.sog = Math.max(0, (next.sog ?? 0) - 1);
          }
  
          if (ev.key === 'ogoal') {
            next.oshot = Math.max(0, (next.oshot ?? 0) - 1);
          }
        });
  
        return next;
      });
    }
  
    // only clear after successful undo path
    lastEvent.current = [];
    setLastLabel('–');
  
  }, [gameId, applyState]);

  return {
    counts, playerStats, quarterStats,
    quarter, activeGoalie, lastLabel,
    goalies, fieldPlayers,
    gc, qc, saves, svPct, sogUs,
    recordStat, recordPenalty, undoLast,
    setQuarter, setActiveGoalie,
  };
}