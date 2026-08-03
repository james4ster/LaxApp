import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { setPossession, endPossession } from '../lib/possessionService';

/**
 * usePossession — manages possession state and running timers.
 *
 * If gameId is omitted, runs entirely in local React state (no DB calls) —
 * matches the original local-only behavior.
 *
 * If gameId is provided, the local clock still updates instantly on tap
 * (optimistic, so trackers never wait on network), while writes happen in
 * the background and a realtime subscription keeps all viewers in sync.
 */
export function usePossession(gameId = null, isHome = true) {
  const [possState, setPossState] = useState('none');
  const [usMs, setUsMs] = useState(0);
  const [themMs, setThemMs] = useState(0);

  const committedUs = useRef(0);
  const committedThem = useRef(0);
  const startTs = useRef(null);
  const currentSide = useRef('none');
  const rafId = useRef(null);
  const eventsRef = useRef([]);

  const tick = useCallback(() => {
    if (currentSide.current === 'none' || startTs.current === null) return;
    const elapsed = Date.now() - startTs.current;
    if (currentSide.current === 'us') {
      setUsMs(committedUs.current + elapsed);
    } else {
      setThemMs(committedThem.current + elapsed);
    }
    rafId.current = requestAnimationFrame(tick);
  }, []);

  const stopTick = useCallback(() => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  // ── Rebuild local clock state from a server event log ──────────────────
  const applyEvents = useCallback(
    (events) => {
      const now = Date.now();
      let us = 0;
      let them = 0;
      let current = null;

      for (const e of events) {
        const start = new Date(e.started_at).getTime();
        const end = e.ended_at ? new Date(e.ended_at).getTime() : now;
        const duration = Math.max(0, end - start);
        const usTeam = isHome ? 'home' : 'away';
        const themTeam = isHome ? 'away' : 'home';
        if (e.team === usTeam) us += duration;
        if (e.team === themTeam) them += duration;
        if (!e.ended_at) current = e;
      }

      committedUs.current = us;
      committedThem.current = them;
      currentSide.current = current?.team ?? 'none';
      startTs.current = current ? new Date(current.started_at).getTime() : null;

      setPossState(currentSide.current);
      setUsMs(us);
      setThemMs(them);

      stopTick();
      if (currentSide.current !== 'none') {
        rafId.current = requestAnimationFrame(tick);
      }
    },
    [tick, stopTick, isHome]
  );

  // ── Load + realtime sync (only when a real game is wired up) ───────────
  useEffect(() => {
    if (!gameId) return;
    let cancelled = false;

    supabase
      .from('possession_events')
      .select('*')
      .eq('game_id', gameId)
      .order('started_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return;
        eventsRef.current = data || [];
        applyEvents(eventsRef.current);
      });

    const channel = supabase
      .channel(`possession-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'possession_events', filter: `game_id=eq.${gameId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            eventsRef.current = [...eventsRef.current, payload.new];
          } else if (payload.eventType === 'UPDATE') {
            eventsRef.current = eventsRef.current.map((e) =>
              e.id === payload.new.id ? payload.new : e
            );
          } else if (payload.eventType === 'DELETE') {
            eventsRef.current = eventsRef.current.filter((e) => e.id !== payload.old.id);
          }
          applyEvents(eventsRef.current);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [gameId, applyEvents]);

  const setPoss = useCallback(
    (side) => {
      const now = Date.now();

      if (currentSide.current !== 'none' && startTs.current !== null) {
        const elapsed = now - startTs.current;
        if (currentSide.current === 'us') committedUs.current += elapsed;
        else committedThem.current += elapsed;
      }

      stopTick();

      const newSide = currentSide.current === side ? 'none' : side;
      currentSide.current = newSide;
      startTs.current = newSide !== 'none' ? now : null;
      setPossState(newSide);

      // Snap local display to committed totals immediately — instant feedback
      // for the tracker, regardless of DB round-trip time below.
      setUsMs(committedUs.current);
      setThemMs(committedThem.current);

      if (newSide !== 'none') {
        rafId.current = requestAnimationFrame(tick);
      }

      if (gameId) {
        if (newSide === 'none') {
          endPossession(gameId).catch((err) => console.error('endPossession failed', err));
        } else {
          const dbTeam =
            newSide === 'us'
              ? (isHome ? 'home' : 'away')
              : (isHome ? 'away' : 'home');
          setPossession(gameId, dbTeam, `${gameId}-${now}`).catch((err) =>
            console.error('setPossession failed', err)
          );
        }
      }
    },
    [tick, stopTick, gameId, isHome]
  );

  useEffect(() => () => stopTick(), [stopTick]);

  const totalMs = usMs + themMs;
  const usPct = totalMs > 0 ? Math.round((usMs / totalMs) * 100) : 50;
  const themPct = 100 - usPct;

  return { possState, usMs, themMs, usPct, themPct, totalMs, setPoss };
}