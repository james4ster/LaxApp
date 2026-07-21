// == Used for testing
export const MY_TEAM_ID = 'ac84353f-3354-4cbc-8bdf-cb86763edea1';

// ── Stat keys that require player attribution ──────────────────────────────
export const NEEDS_PLAYER = new Set([
  'goal',
  'sog',
  'miss',
  'gb',
  'cto',
  'to',
  'interc',
  'fo_w',
  'fo_l',
]);

// ── Human-readable labels for each stat key ────────────────────────────────
export const STAT_LABELS = {
  goal: 'Goal For',
  ogoal: 'Goal Against',
  sog: 'SOG',
  miss: 'Shot Missed',
  oshot: 'Opp Shot',
  gb: 'Ground Ball',
  cto: 'Caused TO',
  to: 'Turnover',
  interc: 'Interception',
  fo_w: 'FO Win',
  fo_l: 'FO Loss',
  assist: 'Assist',
};

// ── Player modal prompt per stat ───────────────────────────────────────────
export const STAT_PROMPTS = {
  goal: 'Who scored?',
  sog:  'Who took the shot?',
  miss: 'Who took the shot?',
  gb: 'Who got the ground ball?',
  cto: 'Who caused the turnover?',
  to: 'Who turned it over?',
  interc: 'Who intercepted?',
  fo_w: 'Who won the faceoff?',
  fo_l: 'Who lost the faceoff?',
};

// ── Stat button definitions per section ───────────────────────────────────
// color: c-lime | c-green | c-slate | c-gray | c-red | c-orange
export const STAT_SECTIONS = [
  {
    id: 'scoring',
    label: 'Scoring',
    stats: [
      { key: 'goal', label: 'Goal For', color: 'c-lime', sub: 'us scored' },
      {
        key: 'ogoal',
        label: 'Goal Against',
        color: 'c-red',
        sub: 'they scored',
      },
    ],
  },
  {
    id: 'shots',
    label: 'Shots',
    stats: [
      {
        key: 'miss',
        label: 'Shot Missed',
        color: 'c-slate',
        sub: 'us · off cage',
      },
      {
        key: 'oshot',
        label: 'Opp Shot',
        color: 'c-gray',
        sub: 'them · on cage',
      },
    ],
  },
  {
    id: 'field',
    label: 'Field',
    stats: [
      { key: 'gb', label: 'Ground Ball', color: 'c-green', sub: 'us' },
      { key: 'cto', label: 'Caused TO', color: 'c-green', sub: 'us' },
      { key: 'to', label: 'Turnover', color: 'c-orange', sub: 'us gave it up' },
      { key: 'interc', label: 'Interception', color: 'c-slate', sub: 'us' },
    ],
  },
  {
    id: 'faceoffs',
    label: 'Faceoffs',
    stats: [
      { key: 'fo_w', label: 'FO Win', color: 'c-green', sub: 'we won it' },
      { key: 'fo_l', label: 'FO Loss', color: 'c-gray', sub: 'they won it' },
    ],
  },
];

// ── Which sections each keeper role sees ──────────────────────────────────
// k1 = "Scoring" role (goals, shots, goalie)
// k2 = "Field" role (ground balls, turnovers, faceoffs)
// k3 = "Penalties" role (penalty pad + man-up/down, no generic sections)
export const ROLE_SECTIONS = {
  solo: ['scoring', 'shots', 'field', 'faceoffs'],
  k1: ['scoring', 'shots'],
  k2: ['field', 'faceoffs'],
  k3: [],
};

// ── Which roles can see/change the active goalie ───────────────────────────
export const ROLE_SHOWS_GOALIE = {
  solo: true,
  k1: true,
  k2: false,
  k3: false,
};

// ── Which roles can control possession ──────────────────────────────────
export const ROLE_SHOWS_POSSESSION = {
  solo: true,
  k1: false,
  k2: false,
  k3: false,
};

// ── Which roles see the penalty pad ─────────────────────────────────────
export const ROLE_SHOWS_PENALTIES = {
  solo: true,
  k1: false,
  k2: false,
  k3: true,
};

// ── Which roles see the man-up/down strength toggle ─────────────────────
// Scoring needs it (PP goals) and Penalties needs it (it's their job to
// set it). Field doesn't depend on strength state.
export const ROLE_SHOWS_STRENGTH = {
  solo: true,
  k1: true,
  k2: false,
  k3: true,
};

export const ROLE_LABELS = {
  solo: { label: 'Solo', sub: 'Track all stats', icon: '👤' },
  k1: { label: 'Scoring', sub: 'Goals, Shots + Goalie', icon: '🥅' },
  k2: { label: 'Field', sub: 'GB, Turnovers + Faceoffs', icon: '🏑' },
  k3: { label: 'Penalties', sub: 'Penalties + Man-Up/Down', icon: '🚩' },
};

// ── Team color presets ─────────────────────────────────────────────────────
// [primary, dark-bg, accent, text-on-primary, text-on-accent]
export const COLOR_PRESETS = [
  { p: '#1A6B3A', s: '#0b2e16', a: '#8FD14F', pt: '#fff', at: '#0d2a0a' },
  { p: '#0A4B8C', s: '#061e3a', a: '#E8C040', pt: '#fff', at: '#1a1000' },
  { p: '#B22222', s: '#3a0808', a: '#f0f0ee', pt: '#fff', at: '#111' },
  { p: '#6B21A8', s: '#2d0a47', a: '#F59E0B', pt: '#fff', at: '#1a0a00' },
  { p: '#0369a1', s: '#0c2a3d', a: '#38bdf8', pt: '#fff', at: '#021824' },
  { p: '#7C3F00', s: '#2a1400', a: '#F5A623', pt: '#fff', at: '#1a0a00' },
];

// ── Player stats table column definitions ─────────────────────────────────
export const FIELD_COLS = [
  { key: 'num', label: '#', width: '20px', align: 'right' },
  { key: 'name', label: 'Player', width: '1fr', align: 'left' },
  { key: 'g', label: 'G', width: '24px', align: 'center' },
  { key: 'a', label: 'A', width: '24px', align: 'center' },
  { key: 'pts', label: 'Pts', width: '28px', align: 'center' },
  { key: 'gb', label: 'GB', width: '24px', align: 'center' },
  { key: 'sog', label: 'SOG', width: '32px', align: 'center' },
  { key: 'to', label: 'TO', width: '24px', align: 'center' },
  { key: 'fo', label: 'FO', width: '36px', align: 'center' },
];

export const GOALIE_COLS = [
  { key: 'num', label: '#', width: '20px', align: 'right' },
  { key: 'name', label: 'Goalie', width: '1fr', align: 'left' },
  { key: 'sv', label: 'SV', width: '28px', align: 'center' },
  { key: 'ga', label: 'GA', width: '28px', align: 'center' },
  { key: 'svp', label: 'SV%', width: '36px', align: 'center' },
];
