import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';

/**
 * useTeamSetup
 *
 * Fixes vs previous version:
 * 1. teamDataRef mirrors teamData state so saveTeam never reads stale closure.
 * 2. uploadLogo sets logoPreview to the permanent publicUrl (not just the
 *    temporary createObjectURL) so it survives remounts and tab switches.
 * 3. loadTeam sets logoPreview from team.logo_url so returning to the tab
 *    after the initial load still shows the logo.
 * 4. saveTeam reads logo_url from the ref, not from a closure over old state.
 * 5. uploadLogo is a single, complete useCallback (previously the try/catch
 *    body had been split from the function signature, which was a syntax
 *    error) and now updates local state via setTeamData/setLogoPreview
 *    instead of a nonexistent setTeams.
 */
export function useTeamSetup() {
  const { user } = useAuth();

  const [teamData, _setTeamData] = useState({
    name:            '',
    gender:          '',
    season_year:     new Date().getFullYear(),
    primary_color:   '#1A6B3A',
    secondary_color: '#0b2e16',
    accent_color:    '#8FD14F',
    logo_url:        null,
    organization_id: null,
  });

  // ── Ref mirrors teamData so async callbacks always see current values ──
  const teamDataRef = useRef(teamData);
  const setTeamData = useCallback((updater) => {
    _setTeamData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      teamDataRef.current = next;
      return next;
    });
  }, []);

  const [teamId,       setTeamId]       = useState(null);
  const [logoPreview,  setLogoPreview]  = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [uploading,    setUploading]    = useState(false);
  const [error,        setError]        = useState(null);
  const [saved,        setSaved]        = useState(false);

  // ── Load existing team for this user ──────────────────────────────────
  const loadTeam = useCallback(async () => {
    if (!user) return;
    const { data, error: loadErr } = await supabase
      .from('teams')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (loadErr) { setError(loadErr.message); return; }
    if (!data)   return;

    setTeamId(data.id);
    setTeamData({
      name:            data.name            ?? '',
      gender:          data.gender          ?? '',
      season_year:     data.season_year     ?? new Date().getFullYear(),
      primary_color:   data.primary_color   ?? '#1A6B3A',
      secondary_color: data.secondary_color ?? '#0b2e16',
      accent_color:    data.accent_color    ?? '#8FD14F',
      logo_url:        data.logo_url        ?? null,
      organization_id: data.organization_id ?? null,
    });

    // ── FIX 3: set logoPreview from DB value so tab-switch shows the logo ──
    if (data.logo_url) {
      setLogoPreview(data.logo_url);
    }
  }, [user, setTeamData]);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  // ── Upload logo ───────────────────────────────────────────────────────
  const uploadLogo = useCallback(async (targetTeamId, file) => {
    if (!file) return null;
    const idToUse = targetTeamId ?? teamId;

    setUploading(true);
    setError(null);

    try {
      const ext  = file.name.split('.').pop();
      const path = `logos/${idToUse}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('team-assets')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage
        .from('team-assets')
        .getPublicUrl(path);

      // Persist to teams table if we already have a saved team row
      if (idToUse) {
        const { error: updateErr } = await supabase
          .from('teams')
          .update({ logo_url: publicUrl })
          .eq('id', idToUse);
        if (updateErr) throw updateErr;
      }

      // ── FIX 2: replace temp blob URL with permanent public URL ──────
      // Now logoPreview survives remounts and tab switches
      setLogoPreview(publicUrl);

      // ── FIX 1: use setTeamData so ref is also updated ───────────────
      setTeamData(prev => ({ ...prev, logo_url: publicUrl }));

      return publicUrl;
    } catch (err) {
      setError(err.message ?? 'Logo upload failed');
      // Revert preview to previous logo_url if upload failed
      setLogoPreview(teamDataRef.current.logo_url ?? null);
      return null;
    } finally {
      setUploading(false);
    }
  }, [teamId, setTeamData]);

  // ── Save / upsert team ────────────────────────────────────────────────
  const saveTeam = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    // ── FIX 1: read from ref — always current, never stale closure ──────
    const data = teamDataRef.current;

    const payload = {
      name:            data.name,
      gender:          data.gender,
      season_year:     data.season_year,
      primary_color:   data.primary_color,
      secondary_color: data.secondary_color,
      accent_color:    data.accent_color,
      logo_url:        data.logo_url,       // ← now correctly populated
      organization_id: data.organization_id,
      coach_id:        user.id,
      updated_at:      new Date().toISOString(),
    };

    let result;
    if (teamId) {
      result = await supabase
        .from('teams')
        .update(payload)
        .eq('id', teamId)
        .select()
        .single();
    } else {
      result = await supabase
        .from('teams')
        .insert({ ...payload, created_at: new Date().toISOString() })
        .select()
        .single();
    }

    const { data: saved_team, error: saveErr } = result;
    setSaving(false);

    if (saveErr) {
      setError(saveErr.message ?? 'Failed to save team');
      return null;
    }

    if (!teamId && saved_team?.id) {
      setTeamId(saved_team.id);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    return saved_team;
  }, [user, teamId]);

  // ── Field updater helper ──────────────────────────────────────────────
  const updateField = useCallback((field, value) => {
    setTeamData(prev => ({ ...prev, [field]: value }));
  }, [setTeamData]);

  return {
    teamData,
    teamId,
    logoPreview,
    saving,
    uploading,
    error,
    saved,
    updateField,
    uploadLogo,
    saveTeam,
    reload: loadTeam,
  };
}

/**
 * useTeams
 *
 * Lists every team the current user has created (for the Dashboard's
 * team switcher), and exposes create/update/uploadLogo for an arbitrary
 * team id. This is distinct from useTeamSetup, which tracks the single
 * "team being actively edited" form and always loads the user's most
 * recent team — useTeams is a plain list + CRUD hook.
 */
export function useTeams() {
  const { user } = useAuth();
  const [teams,   setTeams]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('teams')
      .select('*')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setTeams(data ?? []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const createTeam = useCallback(async (fields) => {
    if (!user) throw new Error('Not signed in');
    const { data, error: err } = await supabase
      .from('teams')
      .insert({ ...fields, coach_id: user.id, created_at: new Date().toISOString() })
      .select()
      .single();
    if (err) throw err;
    setTeams(prev => [data, ...prev]);
    return data;
  }, [user]);

  const updateTeam = useCallback(async (teamId, fields) => {
    const { data, error: err } = await supabase
      .from('teams')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', teamId)
      .select()
      .single();
    if (err) throw err;
    setTeams(prev => prev.map(t => t.id === teamId ? data : t));
    return data;
  }, []);

  const uploadLogo = useCallback(async (teamId, file) => {
    if (!teamId) throw new Error('uploadLogo requires a team id');
    if (!file)   throw new Error('uploadLogo requires a file');

    const ext  = file.name.split('.').pop();
    const path = `logos/${teamId}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('team-assets')
      .upload(path, file, { upsert: true });
    if (upErr) throw upErr;

    const { data: { publicUrl } } = supabase.storage
      .from('team-assets')
      .getPublicUrl(path);

    const { error: updateErr } = await supabase
      .from('teams')
      .update({ logo_url: publicUrl })
      .eq('id', teamId);
    if (updateErr) throw updateErr;

    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, logo_url: publicUrl } : t));
    return publicUrl;
  }, []);

  return { teams, loading, error, createTeam, updateTeam, uploadLogo, reload: load };
}

export function usePlayers(teamId) {
  const [players,  setPlayers]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const loadPlayers = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .eq('active', true)
      .order('jersey_number', { ascending: true });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setPlayers(data || []);
  }, [teamId]);

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  const addPlayer = useCallback(async (playerData) => {
    const { data, error: err } = await supabase
      .from('players')
      .insert({ ...playerData, team_id: teamId })
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    setPlayers(prev => [...prev, data].sort((a,b) => a.jersey_number - b.jersey_number));
    return data;
  }, [teamId]);

  const updatePlayer = useCallback(async (id, updates) => {
    const { data, error: err } = await supabase
      .from('players')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    setPlayers(prev => prev.map(p => p.id === id ? data : p));
    return data;
  }, []);

  // Soft delete: game_events references players with no ON DELETE cascade,
  // so a hard delete on any player with logged stats would fail with a raw
  // FK-violation error. Deactivate instead — historical stats/games stay
  // intact and correctly attributed, the player just drops off the active
  // roster view (loadPlayers above filters on active = true).
  const removePlayer = useCallback(async (id) => {
    const { error: err } = await supabase
      .from('players')
      .update({ active: false })
      .eq('id', id);
    if (err) { setError(err.message); return; }
    setPlayers(prev => prev.filter(p => p.id !== id));
  }, []);

  // ── Bulk insert (paste-from-spreadsheet / CSV import) ──────────────────
  const bulkAddPlayers = useCallback(async (rows) => {
    if (!teamId || !rows?.length) return [];
    const payload = rows.map(r => ({ ...r, team_id: teamId }));
    const { data, error: err } = await supabase
      .from('players')
      .insert(payload)
      .select();
    if (err) throw err;
    setPlayers(prev =>
      [...prev, ...(data ?? [])].sort(
        (a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999)
      )
    );
    return data ?? [];
  }, [teamId]);

  return { players, loading, error, addPlayer, updatePlayer, removePlayer, bulkAddPlayers, reload: loadPlayers };
}

// ── useSchedule — games for a specific team ───────────────────────────────
export function useSchedule(teamId) {
  const [games,   setGames]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    // FIX: was querying the `teams` table (copy/paste bug) and calling
    // setTeams/setError-without-state, neither of which exists in this hook.
    // Now correctly queries `games` for this team, home or away.
    const { data, error: err } = await supabase
      .from('games')
      .select('*')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('scheduled_at', { ascending: true });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setGames(data ?? []);
  }, [teamId]);

  useEffect(() => { load(); }, [load]);

  const addGame = async (fields) => {
    const insert = {
      home_team_id:  fields.is_home ? teamId : null,
      away_team_id:  fields.is_home ? null   : teamId,
      opponent_name: fields.opponent,
      scheduled_at:  fields.scheduled_at || null,
      location:      fields.location     || null,
      season_year:   fields.season_year  ?? null,
      is_exhibition: !!fields.is_exhibition,
      status:        'scheduled',
    };
    const { data, error: err } = await supabase
      .from('games')
      .insert(insert)
      .select()
      .single();
    if (err) throw err;
    setGames(prev =>
      [...prev, data].sort((a, b) =>
        new Date(a.scheduled_at) - new Date(b.scheduled_at)
      )
    );
    return data;
  };

  const removeGame = async (id) => {
    const { error: err } = await supabase.from('games').delete().eq('id', id);
    if (err) throw err;
    setGames(prev => prev.filter(g => g.id !== id));
  };

  return { games, loading, error, addGame, removeGame, reload: load };
}