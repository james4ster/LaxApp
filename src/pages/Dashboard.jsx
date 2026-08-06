import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useTeams, usePlayers, useSchedule } from '../hooks/useTeam';
import TeamSetup from '../pages/TeamSetup';
import RosterSetup from './RosterSetup';
import ScheduleSetup from './ScheduleSetup';


function completeness(team, players, games) {
  return {
    team:     !!(team?.name && team?.gender),
    logo:     !!team?.logo_url,
    roster:   players.length > 0,
    schedule: games.length >= 1,
  };
}

function NavItem({ icon, title, sub, done, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...S.navItem,
        background: active ? 'rgba(26,107,58,.08)' : 'transparent',
        borderColor: active ? 'var(--tp)' : 'transparent',
      }}
    >
      <div style={{
        ...S.navIcon,
        background: done ? 'var(--tp)' : 'var(--surf2)',
        color:      done ? '#fff' : 'var(--txt2)',
      }}>
        {done ? '✓' : icon}
      </div>
      <div style={S.navText}>
        <div style={{ ...S.navTitle, color: active ? 'var(--tp)' : 'var(--txt)' }}>{title}</div>
        <div style={S.navSub}>{sub}</div>
      </div>
    </button>
  );
}

const BLANK_FORM = {
  name:            '',
  gender:          '',
  season_year:     new Date().getFullYear(),
  primary_color:   '#1A6B3A',
  secondary_color: '#0b2e16',
  accent_color:    '#8FD14F',
  slug:            '',
};

const generateSlug = (name) =>
  (name ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');


export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { teams, loading, createTeam, updateTeam, uploadLogo, reload } = useTeams();

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [activeStep, setActiveStep]         = useState('team');

  // Use first team if none selected
  const team = teams.find(t => t.id === selectedTeamId) ?? teams[0] ?? null;

  // ── Roster and schedule live here (single source of truth), passed down
  // as props instead of RosterSetup/ScheduleSetup each calling their own
  // hook instance.
  const {
    players = [],
    loading: playersLoading,
    addPlayer,
    updatePlayer,
    removePlayer,
    bulkAddPlayers,
  } = usePlayers(team?.id);

  const {
    games = [],
    loading: gamesLoading,
    addGame,
    removeGame,
  } = useSchedule(team?.id);

  // ── Team-edit form state, kept in sync with whichever team is selected ──
   const [formFields, setFormFields] = useState(BLANK_FORM);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [formError,  setFormError]  = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Tracks whether the coach has hand-edited the slug for the *currently
  // loaded* team — reset whenever the selected team changes (see effect
  // below), since "touched" from one team shouldn't carry over to another.
  const slugTouched = useRef(false);

  useEffect(() => {
    slugTouched.current = !!team?.slug; // existing non-empty slug counts as touched
    setFormFields(team ? {
      name:            team.name            ?? '',
      gender:          team.gender          ?? '',
      season_year:     team.season_year     ?? new Date().getFullYear(),
      primary_color:   team.primary_color   ?? '#1A6B3A',
      secondary_color: team.secondary_color ?? '#0b2e16',
      accent_color:    team.accent_color    ?? '#8FD14F',
      slug:            team.slug            ?? '',
    } : BLANK_FORM);
  }, [team?.id]);

  const updateField = (field, value) => {
    if (field === 'slug') {
      slugTouched.current = true; // coach took over — stop auto-syncing
    }
    setFormFields(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'name' && !slugTouched.current) {
        next.slug = generateSlug(value);
      }
      return next;
    });
  };

  // Handles both creating a brand-new team and updating the selected one.
  const saveTeam = async () => {
    setSaving(true);
    setFormError(null);
    try {
      let result;
      if (team) {
        result = await updateTeam(team.id, formFields);
      } else {
        result = await createTeam(formFields);
        setSelectedTeamId(result.id);
        setActiveStep('logo');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return result;
    } catch (e) {
      setFormError(e.message ?? 'Failed to save team');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Logo uploads need a real team id, so this is only usable once a team exists.
  const handleLogoUpload = async (file) => {
    if (!team?.id) {
      setFormError('Save the team before uploading a logo');
      return null;
    }
    setLogoUploading(true);
    try {
      return await uploadLogo(team.id, file);
    } catch (e) {
      setFormError(e.message ?? 'Logo upload failed');
      return null;
    } finally {
      setLogoUploading(false);
    }
  };

  if (loading) return <div style={S.loading}>Loading…</div>;

  const done = completeness(team, players, games);
  const readyToTrack = done.team && done.roster;

  const NAV_STEPS = [
    { key: 'team', icon: '🏑', title: team ? team.name : 'Create your team',
      sub: team ? `${team.gender === 'boys' ? 'Boys' : 'Girls'} · ${team.season_year ?? 'No season set'}` : 'Name, gender, season year',
      done: done.team, visible: true },
    { key: 'logo', icon: '🖼', title: 'Team logo',
      sub: team?.logo_url ? 'Logo uploaded ✓' : 'Optional — no logo added',
      done: !!team?.logo_url, visible: !!team },
    { key: 'roster', icon: '👥', title: 'Roster',
      sub: players.length > 0 ? `${players.length} players loaded` : 'Import or add your roster',
      done: done.roster, visible: !!team },
    { key: 'schedule', icon: '📅', title: 'Schedule',
      sub: games.length > 0 ? `${games.length} games added` : 'Add upcoming games (optional)',
      done: done.schedule, visible: !!team },
  ];

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.appName}>LaxTrack</div>
          <div style={S.welcome}>
            {user?.user_metadata?.full_name || user?.email}
          </div>
        </div>
        <button style={S.signOutBtn} onClick={signOut}>Sign out</button>
      </div>

      {/* Team switcher — shown if coach has multiple teams */}
      {teams.length > 1 && (
        <div style={S.teamSwitcher}>
          {teams.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              style={{
                ...S.teamChip,
                background:  t.id === team?.id ? 'var(--tp)'   : 'var(--surf2)',
                color:       t.id === team?.id ? 'var(--tpt)'  : 'var(--txt)',
                borderColor: t.id === team?.id ? 'var(--tp)'   : 'var(--bdr)',
              }}
            >
              {t.logo_url && (
                <img src={t.logo_url} alt="" style={{ width: 18, height: 18, borderRadius: 3, objectFit: 'contain' }} />
              )}
              {t.name}
            </button>
          ))}
          <button style={S.addTeamBtn} onClick={() => { setSelectedTeamId(null); setActiveStep('team'); }}>
            + New team
          </button>
        </div>
      )}

      {/* Manager link — coach shares this once with whoever handles game
          day (team mom/manager); it's their entry point, not the coach's. */}
      {team && (
        <div style={S.managerCard}>
          <div>
            <div style={S.managerTitle}>Team manager link</div>
            <div style={S.managerSub}>Share this once — gives access to the schedule + tracker/fan links, no login needed.</div>
          </div>
          <button
            style={S.managerCopyBtn}
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/manage/${team.manager_token}`)}
          >
            Copy link
          </button>
        </div>
      )}

      {/* Ready to track banner */}
      {readyToTrack && (
        <div style={S.cta}>
          <div style={S.ctaText}>
            <div style={S.ctaTitle}>Ready to track!</div>
            <div style={S.ctaSub}>{team?.name} is set up and ready for game day.</div>
          </div>
          <a href="/track" style={S.ctaBtn}>Start tracking →</a>
        </div>
      )}

      {/* App shell: sidebar + content, no page-level scroll */}
      <div style={S.shell}>

        <div style={S.sidebar}>
          {NAV_STEPS.filter(s => s.visible).map(s => (
            <NavItem
              key={s.key}
              icon={s.icon}
              title={s.title}
              sub={s.sub}
              done={s.done}
              active={activeStep === s.key}
              onClick={() => setActiveStep(s.key)}
            />
          ))}
        </div>

        <div style={S.content}>
          <div style={S.contentInner}>

            {activeStep === 'team' && (
              <>
                <div style={S.contentTitle}>{team ? 'Team Details' : 'Create your team'}</div>
                <TeamSetup
                  team={formFields}
                  onFieldChange={updateField}
                  onCreate={saveTeam}
                  onUpdate={saveTeam}
                  saving={saving}
                  saved={saved}
                  error={formError}
                  teamId={team?.id ?? null}
                />
              </>
            )}

            {activeStep === 'logo' && team && (
              <>
                <div style={S.contentTitle}>Team Logo</div>
                <LogoUploader
                  team={team}
                  onUpload={handleLogoUpload}
                  onDone={async () => { await reload(); }}
                />
              </>
            )}

            {activeStep === 'roster' && team && (
              <>
                <div style={S.contentTitle}>Roster</div>
                <RosterSetup
                  players={players}
                  loading={playersLoading}
                  addPlayer={addPlayer}
                  updatePlayer={updatePlayer}
                  removePlayer={removePlayer}
                  bulkAddPlayers={bulkAddPlayers}
                  onReady={() => setActiveStep('schedule')}
                />
              </>
            )}

            {activeStep === 'schedule' && team && (
              <>
                <div style={S.contentTitle}>Schedule</div>
                <ScheduleSetup
                  teamId={team.id}
                  seasonYear={team.season_year}
                  games={games}
                  loading={gamesLoading}
                  addGame={addGame}
                  removeGame={removeGame}
                />
              </>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}

// ── Logo uploader (inline, no separate file needed at this stage) ─────────
function LogoUploader({ team, onUpload, onDone }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(team?.logo_url ?? null);
  const [err, setErr]             = useState(null);

  useEffect(() => {
    setPreview(team?.logo_url ?? null);
  }, [team?.logo_url]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErr('File must be under 2MB');
      return;
    }

    setErr(null);
    setUploading(true);

    try {
      const url = await onUpload(file);
      if (url) {
        setPreview(url);
        await onDone(url);
      }
    } catch (ex) {
      setErr(ex.message);
    }

    setUploading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0 4px' }}>
      {preview && (
        <img src={preview} alt="logo preview" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--bdr)' }} />
      )}
      <label style={S.uploadLabel}>
        {uploading ? 'Uploading…' : preview ? 'Replace logo' : 'Choose file'}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {err && <div style={{ fontSize: 11, color: 'var(--danger)' }}>{err}</div>}
      <div style={{ fontSize: 11, color: 'var(--txt2)' }}>PNG or JPG, max 2MB</div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const S = {
  page: {
    width: '100%',
    height: '100dvh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  loading: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100dvh', color: 'var(--txt2)', fontSize: 14,
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px 12px',
    background: 'var(--ts)',
    flexShrink: 0,
  },
  appName: { fontSize: 18, fontWeight: 800, color: 'var(--ta)', letterSpacing: .5 },
  welcome: { fontSize: 12, color: 'rgba(255,255,255,.5)', marginTop: 2 },
  signOutBtn: {
    background: 'rgba(255,255,255,.1)', border: 'none',
    color: 'rgba(255,255,255,.6)', fontSize: 11, fontWeight: 600,
    borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
  },
  teamSwitcher: {
    display: 'flex', gap: 6, padding: '10px 20px',
    overflowX: 'auto', WebkitOverflowScrolling: 'touch',
    background: 'var(--surf)', borderBottom: '1px solid var(--bdr)',
    flexShrink: 0,
  },
  teamChip: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '5px 10px', borderRadius: 20, border: '1px solid',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
  },
  addTeamBtn: {
    padding: '5px 10px', borderRadius: 20,
    border: '1px dashed var(--bdr)', background: 'none',
    color: 'var(--txt2)', fontSize: 12, cursor: 'pointer', flexShrink: 0,
  },

  cta: {
    margin: '10px 20px 0',
    background: 'var(--tp)', borderRadius: 12,
    padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    flexShrink: 0,
  },
  ctaText:  {},
  ctaTitle: { fontSize: 14, fontWeight: 800, color: 'var(--tpt)' },
  ctaSub:   { fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 2 },
   ctaBtn: {
    background: 'var(--ta)', color: 'var(--tat)',
    borderRadius: 9, padding: '8px 14px',
    fontSize: 12, fontWeight: 800, textDecoration: 'none', flexShrink: 0,
  },

  managerCard: {
    margin: '10px 20px 0',
    background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 12,
    padding: '12px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    flexShrink: 0,
  },
  managerTitle: { fontSize: 13, fontWeight: 700, color: 'var(--txt)' },
  managerSub:   { fontSize: 11, color: 'var(--txt2)', marginTop: 2, maxWidth: 340, lineHeight: 1.4 },
  managerCopyBtn: {
    background: 'var(--surf2)', border: '1px solid var(--bdr)', color: 'var(--txt)',
    borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
  },

  // ── App shell ──
  shell: {
    flex: 1,
    display: 'flex',
    minHeight: 0, // lets children actually scroll instead of growing the page
    padding: '16px 20px 20px',
    gap: 16,
  },
  sidebar: {
    width: 260,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 10px', borderRadius: 10,
    border: '1px solid', background: 'none',
    cursor: 'pointer', textAlign: 'left', width: '100%',
  },
  navIcon: {
    width: 32, height: 32, borderRadius: 9,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 700, flexShrink: 0,
  },
  navText: { flex: 1, minWidth: 0 },
  navTitle: { fontSize: 13, fontWeight: 700, lineHeight: 1.3 },
  navSub:   { fontSize: 11, color: 'var(--txt2)', marginTop: 1 },

  content: {
    flex: 1,
    minWidth: 0,
    background: 'var(--surf)',
    borderRadius: 14,
    border: '1px solid var(--bdr)',
    overflowY: 'auto',
  },
  contentInner: {
    padding: '20px 24px 28px',
    maxWidth: 720,
  },
  contentTitle: {
    fontSize: 16, fontWeight: 800, color: 'var(--txt)',
    marginBottom: 14,
  },

  uploadLabel: {
    background: 'var(--tp)', color: 'var(--tpt)',
    borderRadius: 8, padding: '9px 18px',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
  },
};