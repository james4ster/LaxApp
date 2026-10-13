import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useFanPresence(gameId, role) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!gameId || !role) {
      setViewerCount(0);
      return;
    }

    let active = true;
    const channel = supabase.channel(`fan-presence:${gameId}`, {
      config: { presence: { key: `${role}:${crypto.randomUUID()}` } },
    });

    const updateCount = () => {
      if (!active) return;
      const presence = channel.presenceState();
      setViewerCount(
        Object.values(presence)
          .flat()
          .filter((session) => session.role === 'fan').length
      );
    };

    channel
      .on('presence', { event: 'sync' }, updateCount)
      .on('presence', { event: 'join' }, updateCount)
      .on('presence', { event: 'leave' }, updateCount)
      .subscribe(async (status, error) => {
        if (status === 'SUBSCRIBED') {
          const { error: trackError } = await channel.track({ role });
          if (trackError) {
            console.error('Unable to publish fan-view presence', trackError);
          }
          updateCount();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Fan-view presence channel failed', error);
        }
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [gameId, role]);

  return viewerCount;
}
