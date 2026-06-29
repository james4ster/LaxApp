import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * usePossession — manages possession state and running timers.
 *
 * Returns:
 *  possState   — 'us' | 'them' | 'none'
 *  usMs        — accumulated us possession milliseconds (live-updating)
 *  themMs      — accumulated them possession milliseconds (live-updating)
 *  setPoss(side) — tap handler; same side = toggle off
 */
export function usePossession() {
  const [possState, setPossState] = useState('none');
  const [usMs, setUsMs] = useState(0);
  const [themMs, setThemMs] = useState(0);

  // Refs hold the "committed" totals (not including live running session)
  const committedUs = useRef(0);
  const committedThem = useRef(0);
  const startTs = useRef(null);
  const currentSide = useRef('none');
  const rafId = useRef(null);

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

  const setPoss = useCallback(
    (side) => {
      const now = Date.now();

      // Commit elapsed time for whatever was running
      if (currentSide.current !== 'none' && startTs.current !== null) {
        const elapsed = now - startTs.current;
        if (currentSide.current === 'us') committedUs.current += elapsed;
        else committedThem.current += elapsed;
      }

      stopTick();

      // Toggle: tap same side = stop
      const newSide = currentSide.current === side ? 'none' : side;
      currentSide.current = newSide;
      startTs.current = newSide !== 'none' ? now : null;
      setPossState(newSide);

      // Snap state to committed totals immediately (clears running display)
      setUsMs(committedUs.current);
      setThemMs(committedThem.current);

      if (newSide !== 'none') {
        rafId.current = requestAnimationFrame(tick);
      }

      // TODO: log to Supabase possession_events
      // if (newSide !== 'none') {
      //   supabase.from('possession_events').insert({
      //     game_id: GAME_ID,
      //     team: newSide === 'us' ? 'home' : 'away',
      //     started_at: new Date(now).toISOString(),
      //   })
      // }
    },
    [tick, stopTick]
  );

  // Cleanup on unmount
  useEffect(() => () => stopTick(), [stopTick]);

  // Derived
  const totalMs = usMs + themMs;
  const usPct = totalMs > 0 ? Math.round((usMs / totalMs) * 100) : 50;
  const themPct = 100 - usPct;

  return {
    possState,
    usMs,
    themMs,
    usPct,
    themPct,
    totalMs,
    setPoss,
  };
}

