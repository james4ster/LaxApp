import { supabase } from './supabase';

function nowISO() {
  return new Date().toISOString();
}

// -----------------------------
// START / SWITCH POSSESSION
// -----------------------------
export async function setPossession(gameId, team, clientEventId) {
  const now = nowISO();

  // 1. Close any open possession
  await supabase
    .from('possession_events')
    .update({ ended_at: now })
    .eq('game_id', gameId)
    .is('ended_at', null);

  // 2. Start new possession
  const { data, error } = await supabase
    .from('possession_events')
    .insert({
      game_id: gameId,
      team,
      started_at: now,
      client_event_id: clientEventId,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

// -----------------------------
// END POSSESSION (NONE)
// -----------------------------
export async function endPossession(gameId) {
  const now = nowISO();

  await supabase
    .from('possession_events')
    .update({ ended_at: now })
    .eq('game_id', gameId)
    .is('ended_at', null);
}