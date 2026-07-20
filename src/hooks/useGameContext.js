import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MY_TEAM_ID } from '../lib/constants';

/**
 * useGameContext — resolves whether "us" is the home or away team for a
 * given game, by looking up the games row and comparing against MY_TEAM_ID.
 *
 * Returns { isHome, loading, homeTeamId, awayTeamId }.
 * isHome is null while loading or if gameId is not provided.
 */
export function useGameContext(gameId) {
  const [state, setState] = useState({
    isHome: null,
    loading: !!gameId,
    homeTeamId: null,
    awayTeamId: null,
  });

  useEffect(() => {
    if (!gameId) {
      setState({ isHome: null, loading: false, homeTeamId: null, awayTeamId: null });
      return;
    }
    let cancelled = false;

    supabase
      .from('games')
      .select('home_team_id, away_team_id')
      .eq('id', gameId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          console.error('useGameContext: failed to load game', JSON.stringify(error, null, 2));
          setState({ isHome: null, loading: false, homeTeamId: null, awayTeamId: null });
          return;
        }
        setState({
          isHome: data.home_team_id === MY_TEAM_ID,
          loading: false,
          homeTeamId: data.home_team_id,
          awayTeamId: data.away_team_id,
        });
      });

    return () => { cancelled = true; };
  }, [gameId]);

  return state;
}