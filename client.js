/**
 * Browser half of the deepseek-chan bundle.
 *
 * One ambient entry in `conversation.composer.dock`: DeepSeek Chan, a chibi
 * whale-maid whose mood follows the Session's turn state.
 *
 *   sleep   nothing running: eyes closed, slow breathing, "Zzz", slow tail
 *   wake    a turn just started: a hop, eyes snap open
 *   work    the turn runs: she floats, hair and tail sway, notes and bubbles rise
 *   wait    the turn is waiting on you: hand up, "?" balloon bobbing
 *   cheer   the turn just ended: claps, sings, sparkles, then back to sleep
 *   pet     you clicked her: a hop, delighted eyes, a line from the whale
 *
 * State comes from the slot's standard `useSessionStatus` hook, whose snapshot
 * is a `Map<SessionId, { running, pendingInteraction, completionUnread }>`.
 * The component selects two booleans only, so it re-renders when the turn
 * starts, pauses, or ends, and never on a token.
 *
 * Rendering is one SVG plus a phase-keyed CSS sheet (`data-phase` on the
 * wrapper). Every animated transform is a translate, so nothing depends on
 * `transform-origin` resolution inside the SVG view box. `prefers-reduced-
 * motion` freezes every loop while keeping the per-phase pose.
 */
window.__ModuleLoader__.load({
  id: '@local/deepseek-chan',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const EMPTY_STATUS = { running: false, pendingInteraction: false }

    /** Turn a status snapshot into one session's record, with no surprises on absent data. */
    const statusOf = (map, sessionId) => {
      if (map === null || map === undefined || typeof map.get !== 'function') return EMPTY_STATUS
      const status = map.get(sessionId)
      return status === null || status === undefined ? EMPTY_STATUS : status
    }

    // Fallback hook used only if the slot ever stops providing `useSessionStatus`:
    // it keeps the hook order stable and simply reports "not running".
    const NEVER_SOURCE = { subscribe: () => () => {}, getSnapshot: () => false }
    function useNeverRunning() {
      return React.useSyncExternalStore(NEVER_SOURCE.subscribe, NEVER_SOURCE.getSnapshot)
    }

    /** Fallback locale hook, same shape as the one the bundle passes in. */
    function useNeverLocale() {
      return React.useSyncExternalStore(
        NEVER_SOURCE.subscribe,
        () => 'en',
      )
    }

    /** Four-pointed star path centred on (cx, cy). */
    function star(cx, cy, r) {
      const i = r * 0.36
      return (
        `M${cx} ${cy - r} L${cx + i} ${cy - i} L${cx + r} ${cy} L${cx + i} ${cy + i} ` +
        `L${cx} ${cy + r} L${cx - i} ${cy + i} L${cx - r} ${cy} L${cx - i} ${cy - i} Z`
      )
    }

    /** One quaver (head, stem, flag) anchored on its note head. */
    function quaver(x, y) {
      return h(
        'g',
        null,
        h('ellipse', {
          cx: x,
          cy: y,
          rx: 2.7,
          ry: 2.1,
          fill: '#5C86E8',
          transform: `rotate(-18 ${x} ${y})`,
        }),
        h('path', {
          d: `M${x + 2.5} ${y - 0.4} L${x + 2.5} ${y - 9.6}`,
          fill: 'none',
          stroke: '#5C86E8',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
        }),
        h('path', {
          d: `M${x + 2.5} ${y - 9.6} q3.4 1.4 2.9 4.8`,
          fill: 'none',
          stroke: '#5C86E8',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
        }),
      )
    }

    /** Wide-eyed gaze: sclera, iris gradient, pupil, two highlights, lash line. */
    function openEye(cx, cy) {
      return h(
        'g',
        null,
        h('ellipse', { cx, cy, rx: 8.4, ry: 9.6, fill: '#FFFFFF' }),
        h('ellipse', { cx, cy: cy + 0.4, rx: 7.5, ry: 8.9, fill: 'url(#chan-eye)' }),
        h('ellipse', { cx, cy: cy + 0.9, rx: 3.3, ry: 4.9, fill: '#0B1330' }),
        h('circle', { cx: cx - 2.6, cy: cy - 3.8, r: 2.8, fill: '#FFFFFF' }),
        h('circle', { cx: cx + 2.7, cy: cy + 3.4, r: 1.4, fill: '#FFFFFF', opacity: 0.9 }),
        h('ellipse', { cx, cy: cy + 5.4, rx: 3.2, ry: 1.8, fill: '#A8CCFF', opacity: 0.6 }),
        h('path', {
          d: `M${cx - 8.6} ${cy - 2.4} A 8.9 10 0 0 1 ${cx + 8.6} ${cy - 2.4}`,
          fill: 'none',
          stroke: '#141C3E',
          strokeWidth: 2.6,
          strokeLinecap: 'round',
        }),
      )
    }

    /** Sleepy lash line: a soft downward curve. */
    function closedEye(cx, cy) {
      return h('path', {
        d: `M${cx - 7.4} ${cy - 0.8} q7.4 6.2 14.8 0`,
        fill: 'none',
        stroke: '#141C3E',
        strokeWidth: 2.8,
        strokeLinecap: 'round',
      })
    }

    /** Delighted ^^ eye. */
    function happyEye(cx, cy) {
      return h('path', {
        d: `M${cx - 7.6} ${cy + 2.4} q7.6 -8.2 15.2 0`,
        fill: 'none',
        stroke: '#141C3E',
        strokeWidth: 2.8,
        strokeLinecap: 'round',
      })
    }

    /** The apron emblem: a tiny whale, the only nod to the mascot at this size. */
    function whaleMark() {
      return h(
        'g',
        null,
        h('path', {
          d: 'M53.6 88 C55 83.8 60 83 62.8 85.2 C65.4 87.2 64.4 90 61 90.6 C57.4 91.2 54.6 90.2 53.6 88 Z',
          fill: '#2F5BD0',
        }),
        h('path', { d: 'M63.6 85.4 l5.2 -2.8 l-1 3.6 l2.8 2.8 l-5.2 -0.6 Z', fill: '#2F5BD0' }),
        h('circle', { cx: 56.6, cy: 87.2, r: 0.8, fill: '#FFFFFF' }),
        h('path', {
          d: 'M56.6 82.8 q-0.8 -1.8 0.4 -2.6',
          fill: 'none',
          stroke: '#2F5BD0',
          strokeWidth: 1,
          strokeLinecap: 'round',
        }),
        h('circle', { cx: 58.6, cy: 80.6, r: 0.7, fill: '#2F5BD0' }),
      )
    }

    const PHASE = {
      SLEEP: 'sleep',
      WAKE: 'wake',
      WORK: 'work',
      WAIT: 'wait',
      CHEER: 'cheer',
    }

    /** Copy for the click reaction; keys are stable so a locale switch re-translates. */
        const EN = {
      label: 'DeepSeek Chan',
      pet: 'Pet DeepSeek Chan',
      'sound.on': 'Sound on',
      'sound.off': 'Sound off',
    }

    const FR = {
      label: 'DeepSeek Chan',
      pet: 'Caresser DeepSeek Chan',
      'sound.on': 'Son activé',
      'sound.off': 'Son coupé',
    }


    // Keep in sync with the CSS timeline below.
    const WAKE_MS = 620
    const CHEER_MS = 2900
    const PET_MS = 720
    const NOTICE_MS = 1800

    const HEADBAND_SCALLOPS = [
      [35.6, 37.6],
      [40.1, 29.3],
      [47.0, 23.2],
      [55.5, 19.9],
      [64.5, 19.9],
      [73.0, 23.2],
      [79.9, 29.3],
      [84.4, 37.6],
    ]

    const HEM_SCALLOPS = [34, 41.4, 48.8, 56.2, 63.6, 71, 78.4, 85.8]
    const APRON_SCALLOPS = [49, 54.5, 60, 65.5, 71]

    const CSS = `
.chan-root { position:relative; display:flex; justify-content:center; align-items:flex-end; margin-left:0; padding:2px 0 4px; line-height:0; pointer-events:none; transition:margin-left .28s ease; }
/* Room for the gauge only while it is shown, so the resting row keeps no hole. */
.chan-root[data-phase="work"], .chan-root[data-phase="wait"] { margin-left:30px; }
.chan-hit { display:block; margin:0; padding:0; border:0; border-radius:12px; background:none; line-height:0; cursor:pointer; pointer-events:auto; }
.chan-hit:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
.chan-art { display:block; overflow:visible; }

/* Palettes: one outfit per session, so two tabs are told apart at a glance. */
.chan-root {
  --chan-h0:#2A3572; --chan-h1:#3C4B92; --chan-h2:#5A75D0; --chan-h3:#A2C4FF;
  --chan-b0:#232C5E; --chan-b1:#3A4A8C;
  --chan-d0:#232C56; --chan-d1:#3A4780;
}
[data-outfit="abyss"] {
  --chan-h0:#17303C; --chan-h1:#1F5568; --chan-h2:#2E93A8; --chan-h3:#9FE6E8;
  --chan-b0:#14303C; --chan-b1:#245366;
  --chan-d0:#182B3A; --chan-d1:#24475C;
}
[data-outfit="ice"] {
  --chan-h0:#2A4A74; --chan-h1:#4C7FB0; --chan-h2:#93C9EA; --chan-h3:#EAF7FF;
  --chan-b0:#25405E; --chan-b1:#4A7BA6;
  --chan-d0:#23384F; --chan-d1:#46688A;
}
[data-outfit="sakura"] {
  --chan-h0:#43263F; --chan-h1:#6E3A63; --chan-h2:#B5708F; --chan-h3:#FFD5E2;
  --chan-b0:#3A2036; --chan-b1:#63375A;
  --chan-d0:#33202F; --chan-d1:#523347;
}
.chan-h0 { stop-color:var(--chan-h0); }
.chan-h1 { stop-color:var(--chan-h1); }
.chan-h2 { stop-color:var(--chan-h2); }
.chan-h3 { stop-color:var(--chan-h3); }
.chan-b0 { stop-color:var(--chan-b0); }
.chan-b1 { stop-color:var(--chan-b1); }
.chan-d0 { stop-color:var(--chan-d0); }
.chan-d1 { stop-color:var(--chan-d1); }
.chan-ink { stroke:var(--chan-h0); }

/* Depth gauge, tucked against her left side while the turn dives. */
.chan-depth {
  position:absolute; right:calc(100% + 7px); bottom:12px;
  display:flex; flex-direction:row-reverse; align-items:flex-end; gap:7px;
  opacity:0; transition:opacity .3s linear; pointer-events:none;
}
[data-phase="work"] .chan-depth,
[data-phase="wait"] .chan-depth { opacity:1; }
.chan-depth-track {
  position:relative; width:5px; height:52px; border-radius:3px; overflow:hidden;
  background:var(--dsw-alias-bg-layer-2);
  border:1px solid var(--dsw-alias-border-l1);
}
.chan-depth-fill {
  position:absolute; left:0; right:0; bottom:0;
  background:linear-gradient(to top, #6E96F5, #BFD8FF);
  transition:height .9s linear;
}
.chan-depth-tick { position:absolute; left:-1px; right:-1px; height:1px; background:rgba(255,255,255,.22); }
.chan-depth-text {
  font:600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  color:var(--dsw-alias-label-secondary); padding-bottom:1px; white-space:nowrap;
}

/* Small notice chip, to the right of the character so the dock never reflows. */
.chan-chip {
  position:absolute; left:calc(50% + 52px); bottom:18px; max-width:min(200px, 40vw);
  padding:3px 9px; border-radius:999px;
  font:500 11px/1.3 system-ui, -apple-system, "Segoe UI", sans-serif;
  color:var(--dsw-alias-label-secondary);
  background:var(--dsw-alias-bg-layer-2);
  border:1px solid var(--dsw-alias-border-l1);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  animation:chan-fade-in .18s ease-out both;
}

@media (max-width: 520px) { .chan-depth { display:none; } }

/* Faces: every expression is drawn, the phase picks which one is visible. */
.chan-eyes-open, .chan-eyes-closed, .chan-eyes-happy,
.chan-mouth-smile, .chan-mouth-sing { opacity:0; transition:opacity .16s linear; }
[data-phase="sleep"] .chan-eyes-closed,
[data-phase="wake"] .chan-eyes-open,
[data-phase="work"] .chan-eyes-open,
[data-phase="wait"] .chan-eyes-open,
[data-phase="cheer"] .chan-eyes-happy { opacity:1; }
[data-phase="sleep"] .chan-mouth-smile,
[data-phase="wake"] .chan-mouth-smile,
[data-phase="work"] .chan-mouth-smile,
[data-phase="wait"] .chan-mouth-smile,
[data-phase="cheer"] .chan-mouth-sing { opacity:1; }
[data-pet="on"] .chan-eyes-open { opacity:0; }
[data-pet="on"] .chan-eyes-happy { opacity:1; }
[data-pet="on"] .chan-mouth-smile { opacity:0; }
[data-pet="on"] .chan-mouth-sing { opacity:1; }

/* Body motion, one pose per phase. */
[data-phase="sleep"] .chan-body { animation:chan-breathe 3.6s ease-in-out infinite; }
[data-phase="wake"] .chan-body { animation:chan-hop .62s cubic-bezier(.3,.1,.3,1); }
[data-phase="work"] .chan-body { animation:chan-float 2.8s ease-in-out infinite; }
[data-phase="wait"] .chan-body { animation:chan-bob .9s ease-in-out infinite; }
[data-phase="cheer"] .chan-body { animation:chan-bob .55s ease-in-out infinite; }
[data-pet="on"] .chan-body { animation:chan-pop .68s cubic-bezier(.3,.1,.3,1); }

/* Fin tail and hair follow the mood. */
[data-phase="sleep"] .chan-tail { animation:chan-tail 4.4s ease-in-out infinite; }
[data-phase="work"] .chan-tail { animation:chan-tail 1.15s ease-in-out infinite; }
[data-phase="wait"] .chan-tail { animation:chan-tail 2.1s ease-in-out infinite; }
[data-phase="cheer"] .chan-tail { animation:chan-tail .7s ease-in-out infinite; }
[data-phase="work"] .chan-hairback { animation:chan-sway 4.6s ease-in-out infinite; }
[data-phase="cheer"] .chan-hairback { animation:chan-sway 1.6s ease-in-out infinite; }

/* Effects: each group belongs to a phase. */
.chan-z { fill:none; stroke:#A9BBFF; stroke-width:2.8; stroke-linecap:round; stroke-linejoin:round; }
.chan-bubble { fill:#FFFFFF; fill-opacity:.26; stroke:#E3EDFF; stroke-width:1.1; }
.chan-zzz, .chan-bubbles, .chan-notes, .chan-q, .chan-sparkles { opacity:0; transition:opacity .2s linear; }
[data-phase="sleep"] .chan-zzz { opacity:1; }
[data-phase="sleep"] .chan-z { animation:chan-drift 2.8s ease-in-out infinite; }
[data-phase="sleep"] .chan-z2 { animation-delay:.9s; }
[data-phase="sleep"] .chan-z3 { animation-delay:1.8s; }
[data-phase="work"] .chan-bubbles { opacity:1; }
[data-phase="work"] .chan-bubble { animation:chan-rise 2.6s ease-in-out infinite; }
[data-phase="work"] .chan-b2 { animation-delay:.75s; }
[data-phase="work"] .chan-b3 { animation-delay:1.5s; }
[data-phase="work"] .chan-notes,
[data-phase="cheer"] .chan-notes { opacity:1; }
[data-phase="work"] .chan-note,
[data-phase="cheer"] .chan-note { animation:chan-note 2.4s ease-in-out infinite; }
[data-phase="work"] .chan-note-b,
[data-phase="cheer"] .chan-note-b { animation-delay:.85s; }
[data-phase="wait"] .chan-q { opacity:1; animation:chan-q 1.5s ease-in-out infinite; }
[data-phase="cheer"] .chan-sparkles,
[data-pet="on"] .chan-sparkles { opacity:1; }
[data-phase="cheer"] .chan-sparkle,
[data-pet="on"] .chan-sparkle { animation:chan-sparkle 1.25s ease-in-out infinite; }
[data-phase="cheer"] .chan-sparkle-b { animation-delay:.3s; }
[data-phase="cheer"] .chan-sparkle-c { animation-delay:.6s; }
[data-phase="cheer"] .chan-sparkle-d { animation-delay:.9s; }

/* Hands: only the celebration moves them. */
[data-phase="cheer"] .chan-hand-l { animation:chan-clap-l .56s ease-in-out infinite; }
[data-phase="cheer"] .chan-hand-r { animation:chan-clap-r .56s ease-in-out infinite; }
.chan-hand-r { transition:opacity .18s linear; }
.chan-hand-up { opacity:0; transition:opacity .18s linear; }
[data-phase="wait"] .chan-hand-r { opacity:0; }
[data-phase="wait"] .chan-hand-up { opacity:1; }

@keyframes chan-breathe {
  0%, 100% { transform:translateY(0); }
  50%      { transform:translateY(1.5px); }
}
@keyframes chan-hop {
  0%   { transform:translateY(0); }
  30%  { transform:translateY(-5px); }
  64%  { transform:translateY(.6px); }
  100% { transform:translateY(0); }
}
@keyframes chan-float {
  0%, 100% { transform:translateY(0); }
  50%      { transform:translateY(-2.4px); }
}
@keyframes chan-bob {
  0%, 100% { transform:translateY(0); }
  50%      { transform:translateY(-1.5px); }
}
@keyframes chan-pop {
  0%   { transform:translateY(0); }
  22%  { transform:translateY(-7px); }
  44%  { transform:translateY(0); }
  62%  { transform:translateY(-2.6px); }
  82%  { transform:translateY(0); }
  100% { transform:translateY(0); }
}
@keyframes chan-sway {
  0%, 100% { transform:translateX(0); }
  50%      { transform:translateX(1.5px); }
}
@keyframes chan-tail {
  0%, 100% { transform:translateX(0); }
  50%      { transform:translateX(2.4px); }
}
@keyframes chan-drift {
  0%   { opacity:0; transform:translate(0, 5px); }
  30%  { opacity:1; }
  70%  { opacity:.8; }
  100% { opacity:0; transform:translate(4px, -8px); }
}
@keyframes chan-rise {
  0%   { opacity:0; transform:translate(0, 4px); }
  30%  { opacity:1; }
  75%  { opacity:.9; }
  100% { opacity:0; transform:translate(2px, -14px); }
}
@keyframes chan-note {
  0%   { opacity:0; transform:translate(0, 3px); }
  22%  { opacity:1; }
  62%  { opacity:1; transform:translate(2px, -5px); }
  100% { opacity:0; transform:translate(3px, -10px); }
}
@keyframes chan-q {
  0%, 100% { transform:translateY(0); }
  50%      { transform:translateY(-2.2px); }
}
@keyframes chan-sparkle {
  0%, 100% { opacity:0; transform:translate(0, 1.5px); }
  45%, 60% { opacity:1; transform:translate(0, -1.5px); }
}
@keyframes chan-clap-l {
  0%, 100%   { transform:translate(0, 0); }
  45%, 55%   { transform:translate(5.5px, -1px); }
}
@keyframes chan-clap-r {
  0%, 100%   { transform:translate(0, 0); }
  45%, 55%   { transform:translate(-5.5px, -1px); }
}
@keyframes chan-fade-in {
  from { opacity:0; transform:translateY(2px); }
  to   { opacity:1; transform:translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .chan-body, .chan-tail, .chan-hairback, .chan-z, .chan-bubble, .chan-note,
  .chan-q, .chan-sparkle, .chan-hand-l, .chan-hand-r, .chan-chip
  .chan-depth-fill { animation:none; transition:none; }
  .chan-bubble, .chan-note, .chan-sparkle { opacity:0; }
}
`

    /**
     * The character itself. Everything is drawn once; the CSS sheet decides what
     * is visible and what moves. All coordinates live in a 120x120 view box.
     */
    function art() {
      return h(
        'svg',
        {
          className: 'chan-art',
          viewBox: '0 0 120 120',
          width: 96,
          height: 96,
          focusable: 'false',
          'aria-hidden': 'true',
        },
        h(
          'defs',
          null,
          h(
            'linearGradient',
            { id: 'chan-hair', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', className: 'chan-h0' }),
            h('stop', { offset: '40%', className: 'chan-h1' }),
            h('stop', { offset: '72%', className: 'chan-h2' }),
            h('stop', { offset: '100%', className: 'chan-h3' }),
          ),
          h(
            'radialGradient',
            { id: 'chan-glow', cx: '0.5', cy: '0.5', r: '0.5' },
            h('stop', { offset: '0%', stopColor: '#4D6BFE', stopOpacity: 0.18 }),
            h('stop', { offset: '70%', stopColor: '#4D6BFE', stopOpacity: 0.05 }),
            h('stop', { offset: '100%', stopColor: '#4D6BFE', stopOpacity: 0 }),
          ),
          h(
            'linearGradient',
            { id: 'chan-bangs', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', className: 'chan-b0' }),
            h('stop', { offset: '100%', className: 'chan-b1' }),
          ),
          h(
            'linearGradient',
            { id: 'chan-dress', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', className: 'chan-d0' }),
            h('stop', { offset: '100%', className: 'chan-d1' }),
          ),
          h(
            'linearGradient',
            { id: 'chan-eye', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', stopColor: '#0E1B45' }),
            h('stop', { offset: '55%', stopColor: '#3E6FE0' }),
            h('stop', { offset: '100%', stopColor: '#8FC0FF' }),
          ),
          h(
            'linearGradient',
            { id: 'chan-fin', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', stopColor: '#2A376E' }),
            h('stop', { offset: '100%', stopColor: '#5C7FE2' }),
          ),
          h(
            'linearGradient',
            { id: 'chan-fluke', x1: '0', y1: '0', x2: '0', y2: '1' },
            h('stop', { offset: '0%', stopColor: '#5F8CEA' }),
            h('stop', { offset: '100%', stopColor: '#C6DCFF' }),
          ),
        ),

        // Soft halo, then the grounding shadow.
        h('circle', { cx: 60, cy: 64, r: 46, fill: 'url(#chan-glow)' }),
        h('ellipse', { cx: 60, cy: 114.5, rx: 16, ry: 2.4, fill: '#7FA8F5', opacity: 0.12 }),

        h(
          'g',
          { className: 'chan-body' },

          // Whale fluke, behind everything.
          h(
            'g',
            { className: 'chan-tail' },
            h('path', {
              d: 'M77 94 C84 92 89 95 93 98',
              fill: 'none',
              className: 'chan-ink',
              strokeWidth: 5.5,
              strokeLinecap: 'round',
            }),
            h('ellipse', {
              cx: 93,
              cy: 96,
              rx: 9,
              ry: 5.2,
              fill: 'url(#chan-fluke)',
              transform: 'rotate(-30 93 96)',
            }),
            h('ellipse', {
              cx: 95,
              cy: 106.5,
              rx: 8,
              ry: 4.4,
              fill: 'url(#chan-fluke)',
              transform: 'rotate(24 95 106.5)',
            }),
            h('path', {
              d: 'M87 99 C89 97.6 91 97 93 97',
              fill: 'none',
              stroke: '#EAF2FF',
              strokeWidth: 1.4,
              strokeLinecap: 'round',
              opacity: 0.6,
            }),
          ),

          // Hair mass, behind the body.
          h(
            'g',
            { className: 'chan-hairback' },
            h('path', {
              d:
                'M60 15 C79 15 93 29 92 49 C91 63 97 75 94 88 C91 99 80 101 75 94 ' +
                'C71 88 67 85 60 85 C53 85 49 88 45 94 C40 101 29 99 26 88 C23 75 29 63 28 49 ' +
                'C27 29 41 15 60 15 Z',
              fill: 'url(#chan-hair)',
            }),
            h('path', {
              d: 'M44 30 C50 24 62 22 70 26',
              fill: 'none',
              stroke: '#8FB6F8',
              strokeWidth: 3,
              strokeLinecap: 'round',
              opacity: 0.35,
            }),
          ),

          // Legs and shoes.
          h('rect', { x: 51.5, y: 103, width: 7.5, height: 7, rx: 3.4, fill: '#F7FAFF' }),
          h('rect', { x: 61, y: 103, width: 7.5, height: 7, rx: 3.4, fill: '#F7FAFF' }),
          h('ellipse', { cx: 55.2, cy: 110.6, rx: 7, ry: 4.2, fill: '#1B2347' }),
          h('ellipse', { cx: 64.8, cy: 110.6, rx: 7, ry: 4.2, fill: '#1B2347' }),
          h('path', {
            d: 'M50.4 108.8 q4.8 -1.8 9.6 0',
            fill: 'none',
            stroke: '#414B8C',
            strokeWidth: 1.3,
            strokeLinecap: 'round',
          }),
          h('path', {
            d: 'M60 108.8 q4.8 -1.8 9.6 0',
            fill: 'none',
            stroke: '#414B8C',
            strokeWidth: 1.3,
            strokeLinecap: 'round',
          }),

          // Skirt, petticoat frill, bodice.
          h('path', {
            d: 'M43 84 C38 91 33 99 30.5 103 C44 106.5 76 106.5 89.5 103 C87 99 82 91 77 84 Z',
            fill: 'url(#chan-dress)',
          }),
          h('path', {
            d: 'M52 92 L49.4 104 M60 92 L60 105 M68 92 L70.6 104',
            fill: 'none',
            stroke: '#4A57A0',
            strokeWidth: 1.2,
            opacity: 0.75,
          }),
          h('path', {
            d: 'M30.5 102 C44 105.6 76 105.6 89.5 102 L90.5 104.2 C76 107.8 44 107.8 29.5 104.2 Z',
            fill: '#F7FAFF',
          }),
          HEM_SCALLOPS.map((x) =>
            h('circle', { key: `hem-${x}`, cx: x, cy: 104.6, r: 2.2, fill: '#F7FAFF' }),
          ),
          h('path', {
            d: 'M48 72 C47.5 79 45.5 84 43.5 88 C52 91.5 68 91.5 76.5 88 C74.5 84 72.5 79 72 72 Z',
            fill: 'url(#chan-dress)',
          }),

          // Apron, its frill, and the whale emblem.
          h('path', {
            d: 'M52 74 C52 83 49.5 92 47.5 98.5 C53 100.5 67 100.5 72.5 98.5 C70.5 92 68 83 68 74 Z',
            fill: '#F8FBFF',
          }),
          APRON_SCALLOPS.map((x) =>
            h('circle', { key: `apron-${x}`, cx: x, cy: 99.6, r: 1.9, fill: '#F8FBFF' }),
          ),
          whaleMark(),

          // Collar and ribbon.
          h('path', {
            d: 'M49 71 C53 77 67 77 71 71 L71 74 C67 79 53 79 49 74 Z',
            fill: '#F8FBFF',
          }),
          h('path', { d: 'M58.6 76.6 l-3.4 -2.2 l0.4 4.2 Z', fill: '#5C86E8' }),
          h('path', { d: 'M61.4 76.6 l3.4 -2.2 l-0.4 4.2 Z', fill: '#5C86E8' }),
          h('circle', { cx: 60, cy: 76.4, r: 1.4, fill: '#4C7DE8' }),

          // Puff sleeves.
          h('circle', { cx: 44.5, cy: 79, r: 7.2, fill: 'url(#chan-dress)' }),
          h('circle', { cx: 75.5, cy: 79, r: 7.2, fill: 'url(#chan-dress)' }),
          h('path', {
            d: 'M38.6 82.6 C41 84.8 48 84.8 50.4 82.6',
            fill: 'none',
            stroke: '#F8FBFF',
            strokeWidth: 2.4,
            strokeLinecap: 'round',
          }),
          h('path', {
            d: 'M69.6 82.6 C72 84.8 79 84.8 81.4 82.6',
            fill: 'none',
            stroke: '#F8FBFF',
            strokeWidth: 2.4,
            strokeLinecap: 'round',
          }),

          // Hands, in front of the dress so they can clap; `chan-hand-up` is the
          // waiting pose, drawn beside the head and shown only in `wait`.
          h(
            'g',
            { className: 'chan-hand-l' },
            h('path', {
              d: 'M45 86.8 L42.6 92.4',
              fill: 'none',
              stroke: '#FFE6D6',
              strokeWidth: 5.2,
              strokeLinecap: 'round',
            }),
            h('circle', { cx: 45.2, cy: 87.4, r: 2.3, fill: '#F8FBFF' }),
            h('circle', {
              cx: 42.2,
              cy: 94.2,
              r: 4.2,
              fill: '#FFE6D6',
              stroke: '#E8AE99',
              strokeWidth: 0.7,
            }),
          ),
          h(
            'g',
            { className: 'chan-hand-r' },
            h('path', {
              d: 'M75 86.8 L77.4 92.4',
              fill: 'none',
              stroke: '#FFE6D6',
              strokeWidth: 5.2,
              strokeLinecap: 'round',
            }),
            h('circle', { cx: 74.8, cy: 87.4, r: 2.3, fill: '#F8FBFF' }),
            h('circle', {
              cx: 77.8,
              cy: 94.2,
              r: 4.2,
              fill: '#FFE6D6',
              stroke: '#E8AE99',
              strokeWidth: 0.7,
            }),
          ),
          h(
            'g',
            { className: 'chan-hand-up' },
            h('path', {
              d: 'M75.4 84 C75.6 74 79.4 64 84.4 59',
              fill: 'none',
              stroke: '#FFE6D6',
              strokeWidth: 5,
              strokeLinecap: 'round',
            }),
            h('circle', { cx: 84.4, cy: 59, r: 2.2, fill: '#F8FBFF' }),
            h('circle', {
              cx: 86.2,
              cy: 55.4,
              r: 4.2,
              fill: '#FFE6D6',
              stroke: '#E8AE99',
              strokeWidth: 0.7,
            }),
          ),

          // Whale-fin ears, then the face.
          h('path', {
            d: 'M33 45.5 C25 41 15 40.5 10.5 43.5 C8.6 50 14 58 22 58.4 C28.5 58.6 32.4 53 33 47 Z',
            fill: 'url(#chan-fin)',
          }),
          h('path', {
            d: 'M27 46.6 L13 45.4 M27.5 50.6 L13.6 52.8',
            fill: 'none',
            stroke: '#8FB6F8',
            strokeWidth: 1.1,
            strokeLinecap: 'round',
            opacity: 0.55,
          }),
          h('path', {
            d: 'M87 45.5 C95 41 105 40.5 109.5 43.5 C111.4 50 106 58 98 58.4 C91.5 58.6 87.6 53 87 47 Z',
            fill: 'url(#chan-fin)',
          }),
          h('path', {
            d: 'M93 46.6 L107 45.4 M92.5 50.6 L106.4 52.8',
            fill: 'none',
            stroke: '#8FB6F8',
            strokeWidth: 1.1,
            strokeLinecap: 'round',
            opacity: 0.55,
          }),
          h('ellipse', { cx: 60, cy: 54, rx: 20, ry: 18.6, fill: '#FFE6D6' }),
          h('ellipse', { cx: 39.5, cy: 61, rx: 5.2, ry: 2.6, fill: '#FF9FB4', opacity: 0.45 }),
          h('ellipse', { cx: 80.5, cy: 61, rx: 5.2, ry: 2.6, fill: '#FF9FB4', opacity: 0.45 }),

          h('g', { className: 'chan-eyes-open' }, openEye(49.4, 55), openEye(70.6, 55)),
          h('g', { className: 'chan-eyes-closed' }, closedEye(49.4, 55), closedEye(70.6, 55)),
          h('g', { className: 'chan-eyes-happy' }, happyEye(49.4, 55), happyEye(70.6, 55)),

          h('ellipse', {
            className: 'chan-mouth-smile',
            cx: 60,
            cy: 66.4,
            rx: 2.9,
            ry: 1.7,
            fill: '#8E3E52',
          }),
          h(
            'g',
            { className: 'chan-mouth-sing' },
            h('ellipse', { cx: 60, cy: 66.8, rx: 3.8, ry: 4.4, fill: '#8E3E52' }),
            h('ellipse', { cx: 60, cy: 68.8, rx: 2.8, ry: 1.8, fill: '#F08CA0' }),
          ),

          // Fringe, then the ahoge, then the headband over both.
          h('path', {
            d:
              'M33 50 C33 28 45 20 60 20 C75 20 87 28 87 50 ' +
              'C85 45 82 43 78 44 C79 48 76 51 72 51 C70 47 66 46.5 60 46.5 ' +
              'C54 46.5 50 47 48 51 C44 51 41 48 42 44 C38 43 35 45 33 50 Z',
            fill: 'url(#chan-bangs)',
          }),
          h('path', {
            d: 'M60.4 18.4 C56.2 10.6 61.4 3.6 68.6 5.6 C71.8 6.5 71.6 10.4 68.8 10.2',
            fill: 'none',
            className: 'chan-ink',
            strokeWidth: 4.2,
            strokeLinecap: 'round',
          }),

          // Maid headband: a band against the crown, its lace edge, then the
          // long side locks that tuck its ends away.
          h('path', {
            d: 'M37 47 C38 30 47 22.5 60 22.5 C73 22.5 82 30 83 47',
            fill: 'none',
            stroke: '#FFFFFF',
            strokeWidth: 6,
            strokeLinecap: 'round',
          }),
          HEADBAND_SCALLOPS.map(([x, y]) =>
            h('circle', { key: `lace-${x}-${y}`, cx: x, cy: y, r: 3.4, fill: '#FFFFFF' }),
          ),
          h('path', {
            d:
              'M35 44 C30 58 32 72 28 86 C26 94 29 100 34 99 C39 98 39 91 38 84 ' +
              'C36 70 40 56 42 46 Z',
            fill: 'url(#chan-hair)',
          }),
          h('path', {
            d:
              'M85 44 C90 58 88 72 92 86 C94 94 91 100 86 99 C81 98 81 91 82 84 ' +
              'C84 70 80 56 78 46 Z',
            fill: 'url(#chan-hair)',
          }),

          // Bow, pinned on the band.
          h('path', { d: 'M79 30 C73 25 68 28 70 33 C71.5 36.5 76 35 79 33 Z', fill: '#6FA8F5' }),
          h('path', { d: 'M81 30 C86 24 91 27 89 32.5 C87.8 36 84 35.4 81 33 Z', fill: '#8FBCFA' }),
          h('circle', { cx: 80, cy: 31.6, r: 2.8, fill: '#4C7DE8' }),
        ),

        // Effects, outside the body group so they do not bob with her.
        h(
          'g',
          { className: 'chan-zzz' },
          h('path', { className: 'chan-z chan-z1', d: 'M86 44 h6.6 l-6.6 6.6 h6.6' }),
          h('path', { className: 'chan-z chan-z2', d: 'M93.5 32 h8.4 l-8.4 8.4 h8.4' }),
          h('path', { className: 'chan-z chan-z3', d: 'M102 18 h10.4 l-10.4 10.4 h10.4' }),
        ),

        h(
          'g',
          { className: 'chan-bubbles' },
          h('circle', { className: 'chan-bubble chan-b1', cx: 97, cy: 92, r: 2.6 }),
          h('circle', { className: 'chan-bubble chan-b2', cx: 105, cy: 80, r: 1.9 }),
          h('circle', { className: 'chan-bubble chan-b3', cx: 111, cy: 68, r: 3.1 }),
        ),

        h(
          'g',
          { className: 'chan-notes' },
          h('g', { className: 'chan-note chan-note-a' }, quaver(26, 40)),
          h('g', { className: 'chan-note chan-note-b' }, quaver(100, 28)),
        ),

        h(
          'g',
          { className: 'chan-q' },
          h('path', { d: 'M84.4 41.6 l-3.2 3.8 l4.6 -1 Z', fill: '#FFFFFF' }),
          h('circle', { cx: 90, cy: 36, r: 8.4, fill: '#FFFFFF', stroke: '#4C7DE8', strokeWidth: 1.6 }),
          h('path', {
            d: 'M87.2 33.4 q0 -3.2 2.9 -3.2 q2.9 0 2.9 2.7 q0 2.1 -2.9 2.9 v1.4',
            fill: 'none',
            stroke: '#4C7DE8',
            strokeWidth: 1.9,
            strokeLinecap: 'round',
          }),
          h('circle', { cx: 90, cy: 40.4, r: 1.15, fill: '#4C7DE8' }),
        ),

        h(
          'g',
          { className: 'chan-sparkles' },
          h('path', { className: 'chan-sparkle chan-sparkle-a', d: star(34, 30, 4.2), fill: '#FFD54A' }),
          h('path', { className: 'chan-sparkle chan-sparkle-b', d: star(92, 22, 4.6), fill: '#FFE9A3' }),
          h('path', { className: 'chan-sparkle chan-sparkle-c', d: star(60, 10, 3.4), fill: '#FFFFFF' }),
          h('path', { className: 'chan-sparkle chan-sparkle-d', d: star(24, 50, 3), fill: '#FFD54A' }),
        ),
      )
    }

    // Navy is listed twice on purpose: variety is nice, but the character should
    // mostly stay DeepSeek blue rather than turn green.
    const OUTFITS = ['navy', 'abyss', 'navy', 'ice', 'sakura']

    /** Same session, same outfit; a different one per session, so tabs differ. */
    function outfitOf(sessionId) {
      const text = String(sessionId === undefined || sessionId === null ? '' : sessionId)
      let hash = 0
      for (let index = 0; index < text.length; index += 1) {
        hash = (hash * 31 + text.charCodeAt(index)) % 100003
      }
      return OUTFITS[hash % OUTFITS.length]
    }

    /* ---- turn-end chime ------------------------------------------------ */

    const SOUND_KEY = 'deepseek-chan.sound'
    let audioContext = null

    // Off unless the user turned it on: a chime is a taste, not a default.
    const soundIsOff = () => {
      try {
        return window.localStorage.getItem(SOUND_KEY) !== 'on'
      } catch {
        return true
      }
    }

    const rememberSound = (off) => {
      try {
        window.localStorage.setItem(SOUND_KEY, off ? 'off' : 'on')
      } catch {
        /* storage is optional */
      }
    }

    // A browser only lets audio start after a gesture, so the first interaction
    // creates the context; Electron usually allows it straight away.
    const unlockAudio = () => {
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext
        if (!Ctor) return
        if (audioContext === null) audioContext = new Ctor()
        if (audioContext.state === 'suspended') audioContext.resume().catch(() => {})
      } catch {
        /* audio is a nicety */
      }
    }

    /**
     * Two soft sine notes. Level in dBFS at the peak, so tuning is one number:
     * 0.045 was -26.9 dB, then +3 dB, then +8 dB -> about -16 dB.
     */
    const CHIME_DB = -16
    const CHIME_GAIN = 10 ** (CHIME_DB / 20)

    const chime = () => {
      if (soundIsOff()) return
      unlockAudio()
      if (audioContext === null || audioContext.state !== 'running') return
      try {
        const now = audioContext.currentTime
        const master = audioContext.createGain()
        master.gain.value = CHIME_GAIN
        master.connect(audioContext.destination)
        const notes = [
          [784, 0],
          [1046.5, 0.1],
        ]
        for (const [frequency, offset] of notes) {
          const start = now + offset
          const oscillator = audioContext.createOscillator()
          const gain = audioContext.createGain()
          oscillator.type = 'sine'
          oscillator.frequency.value = frequency
          gain.gain.setValueAtTime(0.0001, start)
          gain.gain.exponentialRampToValueAtTime(1, start + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32)
          oscillator.connect(gain)
          gain.connect(master)
          oscillator.start(start)
          oscillator.stop(start + 0.36)
        }
      } catch {
        /* audio is a nicety */
      }
    }

    /** One chime at most every 1.2 s, whichever session finished. */
    let lastChimeAt = 0
    const ringChime = () => {
      const now = Date.now()
      if (now - lastChimeAt < 1200) return
      lastChimeAt = now
      chime()
    }

    /** How many sessions are busy right now; a decrease means a turn just ended. */
    const selectRunningCount = (map) => {
      if (map === null || map === undefined || typeof map.values !== 'function') return 0
      let count = 0
      for (const status of map.values()) {
        if (status !== null && status !== undefined && status.running === true) count += 1
      }
      return count
    }

    /**
     * Frame-wide watcher: the dock only exists for the session on screen, but the
     * chime should follow every turn — including the background ones whose green
     * badge lights up. Renders nothing.
     */
    function ChimeWatcher(props) {
      const useStatus =
        typeof props.useSessionStatus === 'function' ? props.useSessionStatus : useNeverRunning
      const busy = useStatus(selectRunningCount)
      const previous = React.useRef(null)

      React.useEffect(() => {
        if (previous.current !== null && busy < previous.current) ringChime()
        previous.current = busy
      }, [busy])

      return null
    }

    /** Depth meter: one metre every two seconds, capped so it never lies about the scale. */
    function DepthGauge(props) {
      const running = props.running === true
      const [meters, setMeters] = React.useState(0)

      React.useEffect(() => {
        if (!running) {
          setMeters(0)
          return undefined
        }
        const started = Date.now()
        const id = setInterval(() => {
          setMeters(Math.min(999, Math.round((Date.now() - started) / 2000)))
        }, 1000)
        return () => clearInterval(id)
      }, [running])

      // A visible sliver from the first metre, so the gauge never looks broken.
      const fill = Math.max(7, Math.min(100, Math.round((meters / 90) * 100)))

      return h(
        'div',
        { className: 'chan-depth', 'aria-hidden': 'true' },
        h(
          'div',
          { className: 'chan-depth-track' },
          h('div', { className: 'chan-depth-fill', style: { height: `${fill}%` } }),
          h('span', { className: 'chan-depth-tick', style: { bottom: '33%' } }),
          h('span', { className: 'chan-depth-tick', style: { bottom: '66%' } }),
        ),
        h('span', { className: 'chan-depth-text' }, `−${meters} m`),
      )
    }

    function Chan(props) {
      const t = props.t
      const useStatus =
        typeof props.useSessionStatus === 'function' ? props.useSessionStatus : useNeverRunning
      const useLocale = typeof props.useLocale === 'function' ? props.useLocale : useNeverLocale
      const sessionId = props.sessionId

      useLocale()

      const running = useStatus((map) => statusOf(map, sessionId).running === true)
      const waiting = useStatus((map) => Boolean(statusOf(map, sessionId).pendingInteraction))

      const [phase, setPhase] = React.useState(PHASE.SLEEP)
      const [petting, setPetting] = React.useState(false)
      const [muted, setMuted] = React.useState(() => soundIsOff())
      const [notice, setNotice] = React.useState(null)

      const wasRunning = React.useRef(false)
      const phaseTimer = React.useRef(null)
      const petTimer = React.useRef(null)
      const noticeTimer = React.useRef(null)
      const outfit = React.useMemo(() => outfitOf(sessionId), [sessionId])

      React.useEffect(() => {
        const previous = wasRunning.current
        wasRunning.current = running
        if (phaseTimer.current !== null) {
          clearTimeout(phaseTimer.current)
          phaseTimer.current = null
        }
        if (running && !previous) {
          setPhase(PHASE.WAKE)
          phaseTimer.current = setTimeout(() => {
            phaseTimer.current = null
            setPhase(waiting ? PHASE.WAIT : PHASE.WORK)
          }, WAKE_MS)
          return
        }
        if (running) {
          setPhase(waiting ? PHASE.WAIT : PHASE.WORK)
          return
        }
        if (previous) {
          setPhase(PHASE.CHEER)
          phaseTimer.current = setTimeout(() => {
            phaseTimer.current = null
            setPhase(PHASE.SLEEP)
          }, CHEER_MS)
        }
      }, [running, waiting])

      React.useEffect(
        () => () => {
          if (phaseTimer.current !== null) clearTimeout(phaseTimer.current)
          if (petTimer.current !== null) clearTimeout(petTimer.current)
          if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
        },
        [],
      )

      const pet = () => {
        setPetting(true)
        if (petTimer.current !== null) clearTimeout(petTimer.current)
        petTimer.current = setTimeout(() => {
          petTimer.current = null
          setPetting(false)
        }, PET_MS)
        unlockAudio()
      }

      const toggleSound = (event) => {
        event.preventDefault()
        const next = !muted
        setMuted(next)
        rememberSound(next)
        if (!next) {
          unlockAudio()
          chime()
        }
        setNotice(t(next ? 'sound.off' : 'sound.on'))
        if (noticeTimer.current !== null) clearTimeout(noticeTimer.current)
        noticeTimer.current = setTimeout(() => {
          noticeTimer.current = null
          setNotice(null)
        }, NOTICE_MS)
      }

      return h(
        'div',
        {
          className: 'chan-root',
          'data-phase': phase,
          'data-pet': petting ? 'on' : 'off',
          'data-outfit': outfit,
          'data-plugin': 'deepseek-chan',
        },
        h('style', null, CSS),
        h(
          'button',
          {
            className: 'chan-hit',
            type: 'button',
            onClick: pet,
            onContextMenu: toggleSound,
            'aria-label': t('pet'),
            title: t('pet'),
          },
          art(),
        ),
        h(DepthGauge, { running }),
        notice === null ? null : h('span', { className: 'chan-chip' }, notice),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        const t = ctx.locale.bind('deepseek-chan')
        ctx.effect(() => ctx.locale.register('deepseek-chan', 'en', EN))
        ctx.effect(() => ctx.locale.register('deepseek-chan', 'fr', FR))
        const translate = (key) => t(key)
        const subscribe = (callback) => ctx.locale.subscribe(callback)
        const useLocale = () =>
          React.useSyncExternalStore(subscribe, () => ctx.locale.getSnapshot().active)

        ctx.slots.inject('conversation.composer.dock', () =>
          ctx.slots.register(
            {
              name: 'conversation.composer.dock',
              id: 'deepseek-chan',
              order: 5,
              label: () => translate('label'),
            },
            (props) => h(Chan, { ...props, t: translate, useLocale }),
          ),
        )

        // The chime is not the dock's: it must follow every session, including
        // the background ones whose green badge lights up in the sidebar.
        ctx.slots.inject('shell.overlay', () =>
          ctx.slots.register(
            { name: 'shell.overlay', id: 'deepseek-chan.chime', order: 95 },
            (props) => h(ChimeWatcher, props),
          ),
        )
      },
    }
  },
})
