import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { setPossession, endPossession } from '../lib/possessionService';

/**
 * usePossession — possession timers with real-time sync.
 *
 * Key fixes vs previous version:
 * 1. applyEvents stored in a ref (applyEventsRef) so the realtime channel
 *    useEffect never needs it as a dependency — eliminates channel thrash
 *    when isHome resolves from null → true.
 * 2. suppressRealtimeUntil removed entirely. The correct dedup strategy is:
 *    optimistic local update fires immediately; realtime echo is ignored via
 *    a pending-write Set keyed on client_event_id (same pattern as useGame).
 *    For possession we use a simpler approach: after a local tap we just
 *    re-apply the full event list when the echo arrives — idempotent, safe.
 * 3. Channel is created once per gameId, not per applyEvents identity.
 */
export function usePossession(gameId = null, isHome = null) {
  const [possState, setPossState] = useState('none');
  const [usMs,      setUsMs]      = useState(0);
  const [themMs,    setThemMs]    = useState(0);

  const committedUs   = useRef(0);
  const committedThem = useRef(0);
  const startTs       = useRef(null);
  const currentSide   = useRef('none');
  const rafId         = useRef(null);
  const eventsRef     = useRef([]);
  const isHomeRef     = useRef(isHome);   // stable ref so applyEvents never needs isHome as dep

  // Keep isHomeRef current without recreating anything downstream
  useEffect(() => { isHomeRef.current = isHome; }, [isHome]);

  // ── rAF tick ─────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (currentSide.current === 'none' || startTs.current === null) return;
    const elapsed = Date.now() - startTs.current;
    if (currentSide.current === 'us') {
      setUsMs(committedUs.current + elapsed);
    } else {
      setThemMs(committedThem.current + elapsed);
    }
    rafId.current = requestAnimationFrame(tick);
  }, []); // stable — no deps

  const stopTick = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []); // stable

  // ── applyEvents stored as ref so channel useEffect needs no deps on it ──
  const applyEventsRef = useRef(null);
  applyEventsRef.current = (events) => {
    // isHomeRef.current is always current — no closure staleness
    if (isHomeRef.current === null) return;
    const now     = Date.now();
    const usTeam   = isHomeRef.current ? 'home' : 'away';
    const themTeam = isHomeRef.current ? 'away' : 'home';

    let us      = 0;
    let them    = 0;
    let current = null;

    for (const e of events) {
      const start    = new Date(e.started_at).getTime();
      const end      = e.ended_at ? new Date(e.ended_at).getTime() : now;
      const duration = Math.max(0, end - start);

      if (e.team === usTeam)   us   += duration;
      if (e.team === themTeam) them += duration;
      if (!e.ended_at) current = e;
    }

    committedUs.current   = us;
    committedThem.current = them;

    const side =
      current?.team === usTeam   ? 'us'   :
      current?.team === themTeam ? 'them' : 'none';

    currentSide.current = side;
    startTs.current     = current ? new Date(current.started_at).getTime() : null;

    setPossState(side);
    setUsMs(us);
    setThemMs(them);

    stopTick();
    if (side !== 'none') {
      rafId.current = requestAnimationFrame(tick);
    }
  };

  // ── Load history on mount ─────────────────────────────────────────────────
  // Separate effect so it re-runs if gameId changes but NOT if isHome changes.
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    supabase
      .from('possession_events')
      .select('*')
      .eq('game_id', gameId)
      .order('started_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error('possession load error', error); return; }
        eventsRef.current = data || [];
        applyEventsRef.current(eventsRef.current);
      });

    return () => { cancelled = true; };
  }, [gameId]); // only gameId — isHome changes handled via isHomeRef

  // ── Realtime channel — created once per gameId ────────────────────────────
  // No applyEvents in deps — uses applyEventsRef.current() instead.
  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`possession-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'possession_events', filter: `game_id=eq.${gameId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Avoid duplicate if we already have this row (optimistic insert)
            const exists = eventsRef.current.some(e => e.id === payload.new.id);
            if (!exists) eventsRef.current = [...eventsRef.current, payload.new];
          } else if (payload.eventType === 'UPDATE') {
            eventsRef.current = eventsRef.current.map(e =>
              e.id === payload.new.id ? payload.new : e
            );
          } else if (payload.eventType === 'DELETE') {
            eventsRef.current = eventsRef.current.filter(e => e.id !== payload.old.id);
          }
          // Always re-apply — idempotent, correct
          applyEventsRef.current(eventsRef.current);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Re-fetch on reconnect to catch any events missed during disconnect
          supabase
            .from('possession_events')
            .select('*')
            .eq('game_id', gameId)
            .order('started_at', { ascending: true })
            .then(({ data }) => {
              if (!data) return;
              eventsRef.current = data;
              applyEventsRef.current(data);
            });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [gameId]); // stable — no function deps

  // ── setPoss — tap handler ─────────────────────────────────────────────────
  const setPoss = useCallback((side) => {
    const now = Date.now();

    // Commit running time
    if (currentSide.current !== 'none' && startTs.current !== null) {
      const elapsed = now - startTs.current;
      if (currentSide.current === 'us') committedUs.current   += elapsed;
      else                               committedThem.current += elapsed;
    }

    stopTick();

    const newSide       = currentSide.current === side ? 'none' : side;
    currentSide.current = newSide;
    startTs.current     = newSide !== 'none' ? now : null;
    setPossState(newSide);
    setUsMs(committedUs.current);
    setThemMs(committedThem.current);

    if (newSide !== 'none') {
      rafId.current = requestAnimationFrame(tick);
    }

    if (gameId) {
      if (newSide === 'none') {
        endPossession(gameId).catch(err => console.error('endPossession failed', err));
      } else {
        const dbTeam = newSide === 'us'
          ? (isHomeRef.current ? 'home' : 'away')
          : (isHomeRef.current ? 'away' : 'home');
        setPossession(gameId, dbTeam, `${gameId}-${now}`)
          .catch(err => console.error('setPossession failed', err));
      }
    }
  }, [tick, stopTick, gameId]); // isHome via ref — not needed as dep

  // ── stop() — called on game end ───────────────────────────────────────────
  const stop = useCallback(() => {
    const now = Date.now();
    if (currentSide.current !== 'none' && startTs.current !== null) {
      const elapsed = now - startTs.current;
      if (currentSide.current === 'us') committedUs.current   += elapsed;
      else                               committedThem.current += elapsed;
    }
    setUsMs(committedUs.current);
    setThemMs(committedThem.current);
    stopTick();
    currentSide.current = 'none';
    startTs.current     = null;
    setPossState('none');
    if (gameId) {
      endPossession(gameId).catch(err => console.error('stop: endPossession failed', err));
    }
  }, [stopTick, gameId]);

  useEffect(() => () => stopTick(), [stopTick]);

  const totalMs = usMs + themMs;
  const usPct   = totalMs > 0 ? Math.round((usMs / totalMs) * 100) : 50;
  const themPct = 100 - usPct;

  return { possState, usMs, themMs, usPct, themPct, totalMs, setPoss, stop };
}