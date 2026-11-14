# DeepSeek Chan

A chibi whale-maid who lives under the composer. Her mood follows the session
turn: asleep when nothing runs, awake while the model works, attentive when the
session is waiting on you, cheering when the turn ends.

She is drawn as inline SVG and driven by CSS keyframes. There is no image file,
no canvas, no animation library, and no per-frame JavaScript.

| State | Trigger | What you see |
|---|---|---|
| `sleep` | nothing running | eyes closed, slow breathing, drifting "Zzz", slow tail |
| `wake` | a turn starts | a small hop, eyes open (0.62 s) |
| `work` | the turn runs | floating, hair and tail swaying, bubbles and notes rising |
| `wait` | the turn needs something from you | raised hand, a "?" bubble rocking |
| `cheer` | the turn just ended | singing, hands clapping, sparks (2.9 s) |
| `pet` | you click her | happy hop, laughing eyes, a whale line |

`wake` chains into `work` or `wait`; `cheer` settles back to `sleep`.

## Beyond the character

- **Depth gauge** (left of her, during `work` and `wait`): one metre every two
  seconds, capped at 999 m, with a bar that fills on a 90 m base. It gives a
  sense of how long the turn has been running.
- **Per-session outfit**: four palettes (`navy`, `abyss`, `ice`, `sakura`)
  chosen by a stable hash of the Session id, so two open tabs never look the
  same. `navy` is deliberately duplicated in `OUTFITS` to stay the majority
  case: the whale should be blue most of the time.
- **Click**: a small hop and laughing eyes. No window, no network.

## Built-in notification system

Finishing a turn is announced, so you do not have to watch the window:

- A watcher mounted in `shell.overlay` subscribes to the same
  `useSessionStatus` snapshot and follows the **number of busy sessions**, not
  one session. When that number drops, a turn ended — any turn, including one
  running in a background session whose green badge lights up in the sidebar.
  The component renders nothing at all.
- The signal is two soft sine notes (G5 at 784 Hz, then C6 at 1046.5 Hz, 100 ms
  apart, 20 ms attack, 320 ms decay) at a fixed level. Tuning is one constant,
  `CHIME_DB` (`-16` dBFS).
- At most one chime every 1.2 s: two turns finishing together do not ring
  twice.
- **Off by default.** To turn it on, or to silence it again, just right-click
  her: one gesture toggles the sound, and that is the only control. The choice
  is remembered in `localStorage` under `deepseek-chan.sound`, and a short chip
  confirms the change. The first click also unlocks the browser's
  `AudioContext`, which browsers keep suspended until a user gesture.
- Nothing to install or grant: the sound is synthesized with WebAudio. No
  system notification, no permission prompt, no network request.

## Where the state comes from

The entry renders in `conversation.composer.dock`, a `session`-scoped slot. The
slot provides the standard `useSessionStatus` prop, whose snapshot is a
`Map<SessionId, { running, pendingInteraction, completionUnread }>` (the
`UiSession` service of `@deepseek-ai/dsh-client-ui-session`). The component
selects only two booleans — `running` and `pendingInteraction` — so it
re-renders when one of the two changes, never on every token.

When data is missing (unresolved session, empty snapshot), the selectors answer
`false`: the animation falls back to `sleep` instead of breaking the dock.

## Implementation notes

- `client.js` is one SVG (viewBox 120×120, rendered at 96 px) plus a stylesheet
  driven by `data-phase` and `data-pet` on the container. Every animated
  `transform` is a `translate`, so nothing depends on `transform-origin` inside
  the view box.
- All expressions are pre-drawn; the phase picks the visible set (eyes open /
  closed / laughing, mouth calm / singing).
- The raised hand of `wait` is a second pre-drawn arm shown in place of the
  resting one, so no shoulder rotation has to be recomputed.
- Three `setTimeout` calls (end of `wake`, of `cheer`, of `pet`) are cleared on
  teardown; everything else is CSS.
- `prefers-reduced-motion: reduce` freezes every loop and keeps the current
  pose.
- Pet phrases go through `ctx.locale` (`locale.deepseek-chan`), so they follow
  the active language without a reload.
- The Host half (`index.js`) is empty: the bundle exists so the patch can insert
  the row and the Client is loaded.

## Install

Install the folder as a bundle, by absolute path:

```text
plugin_manager install_bundle  target = <absolute path to this folder>
```

Any other character bundle already mounted under the composer must be disabled
first, otherwise two characters overlap:

```text
plugin_manager set_bundle  target = <bundle id>  enabled = false
```

## Settings

- **Position**: `order` in `client.js` (`0` = activity, `1` = usage,
  `5` = DeepSeek Chan).
- **Size**: the SVG `width` / `height` (96).
- **State durations**: `WAKE_MS`, `CHEER_MS`, `PET_MS`, `CHIP_MS` at the top of
  the component; keep the `cheer` duration consistent with the CSS loop.
- **Palette**: the `chan-hair`, `chan-dress`, `chan-fin`, `chan-fluke`,
  `chan-eye` gradients in the `<defs>`.
- **Phrases**: the `EN` / `FR` dictionaries in `client.js`.
- **Disable**: `plugin_manager set_bundle` on the bundle.

## Known pitfall

A `client.js` write that fails at load time can flip the bundle to
`enabled: false` (the entry then disappears from the slot). Check with
`plugin_manager list_bundles`, then re-enable with `plugin_manager set_bundle`.

## Compatibility

Tested against DSH `0.2.2-rc.3`, web client, desktop profile. The bundle is
client-only: it reads no session content, adds no tool, and makes no network
request.

## Files

| File | Role |
|---|---|
| `index.js` | empty Host half; exists so the bundle can be patched in |
| `client.js` | the SVG character, stylesheet, and slot registrations |
| `cordis.patch.yml` | the insert row |
| `locale/*.json` | pet phrases per language |
| `icon.svg` | plugin icon |

## License

MIT.
