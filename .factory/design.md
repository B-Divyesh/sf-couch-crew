# Couch Crew visual thesis

## Direction

**Night-drive demoscene.** Couch Crew is one shared heist console with a phone controller for every friend, not a grid of party-game cards. The screen resembles a home computer scene demo imagined by a getaway crew: chunky pixels, scanline texture, a hard-edged city silhouette, status bands, and a road that pulls every role toward the same goal. The asymmetrical layout keeps the playable console visible in the first captured screen. It avoids a generic centered hero and gives a room of players one obvious shared focal point.

The product is intentionally single-mode and dark. A light treatment would break the night-drive world and increase glare on the shared TV. Bright UI colors have tested roles and retain contrast on the dark surfaces.

## Palette

The generated night road sets the palette. Use only these tokens:

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#080b16` | page and night sky |
| `--panel` | `#12182c` | console plates |
| `--panel-raised` | `#1c2540` | interactive controls |
| `--paper` | `#f5f0d4` | primary text |
| `--muted` | `#b9bed0` | secondary text |
| `--cyan` | `#58e7f2` | focus, driver, links |
| `--lime` | `#c7f36b` | success and primary action |
| `--amber` | `#ffb454` | warning and lookout |
| `--coral` | `#ff647c` | danger and pressure |

Primary text on ink is greater than 15:1. Ink on lime is greater than 12:1. Muted text on panels is greater than 8:1. Color always has a label, shape, or icon with it.

## Type and spacing

The display face is the local system monospace stack (`ui-monospace`, `SFMono-Regular`, `Consolas`) rendered with square corners and restrained letter spacing. Body copy uses the local system sans stack. This avoids a network font and keeps the initial font budget at zero. Display copy uses uppercase only for short console labels, never paragraphs.

Spacing follows an 8 px base: 4, 8, 16, 24, 32, 48, 64. Body text is at least 16 px. Controls are at least 48 px high. Paragraph measure stays below 68 characters.

## Shape and interaction grammar

Panels use clipped 45-degree corners rather than rounded SaaS cards. Borders are one pixel with a two-pixel shadow offset, like a low-resolution framebuffer. The primary button is lime with dark text. Secondary buttons are raised navy plates. Presses translate by two pixels and lose their shadow.

The game has one shared command deck and five different role strips. The host creates an anonymous four-letter room through the product-owned WebSocket service. Each joining phone receives only its assigned role controls; a sixth player shares the dispatcher role. Keyboard keys `1`–`0` and the host touch deck remain a fallback. Assist mode slows pressure growth and remains on refresh.

## Game scene and asset plan

The main generated asset is a wide, original pixel-art night city and getaway road. It sits behind the live console as world-building, while text remains on opaque plates. Small role marks, road lanes, packet blocks, and alarm ticks are authored in CSS or Canvas because they are stateful UI, not substitute illustrations.

Art prompt sheet:

- **Subject:** empty getaway hatchback on a rain-slick road, distant geometric city, five colored route signals
- **World:** fictional near-future night city seen through a low-resolution 16-bit home-computer lens
- **Materials:** wet asphalt, dark concrete, phosphor pixels, subtle ordered dithering
- **Light:** cyan road markers, lime dashboard glow, coral alarm reflection, deep indigo sky
- **Lens/composition:** wide side-elevated view, car low-right, open negative space left and top, no people
- **Palette words:** ink navy, phosphor cyan, acid lime, warm amber, alert coral, parchment white
- **Negative list:** no text, logos, brands, watermark, copyrighted characters, weapons, readable signs, photorealism, gradients, blur, modern luxury car badges

The source PNG and a JSON prompt sidecar live in `assets/src/`. Production WebP variants live in `public/art/`; mobile is at most 300 KB. Social artwork is a 1200×630 crop derived from the same scene.

## Motion and feel

The signature motion is road-line travel: short lane marks move toward the bottom edge while a mission runs. Role presses squash their packet blocks for 120 ms; successful beats add a 90 ms hit-stop and a small 4 px console nudge. Nothing flashes faster than 3 Hz. Screen shake has a persistent off switch.

With `prefers-reduced-motion`, lane travel, shake, and entrance movement stop. State changes use instant border and opacity changes. The game simulation remains fixed at 60 Hz, clamps long frames, and pauses when the tab is hidden.

## Difficulty curve

One complete run has three missions. The training mission needs 12 coordinated beats, the bridge mission needs 16, and the vault mission needs 20. A correct move locks immediately, and the next call releases on a 17.5-second cadence. This makes the 48-move real run last at least 14 minutes. A representative 19-second response plus 50 seconds for each mission briefing totals 17 minutes 42 seconds. Pressure rises from slow to quick only while a move is open; a locked answer pauses that risk. Mistimed or late actions add pressure. A run ends when the crew clears all three missions or pressure reaches 100. Demo mode advances correct moves immediately so verification remains quick.

## Accessibility and responsive intent

At 390 px the scene becomes a shallow header strip, role controls stack one per row, and sticky controls stay above the safe area. The shared status remains before role controls in reading order. Every action exposes its role, key, and current availability. Sound starts only after a user action, and mute persists. Keyboard, touch, and an optional calm-pressure assist mode cover the full run.

## Provenance

The hero scene is generated specifically for Couch Crew with the factory image deployment on 2026-09-02 from the prompt sheet above. It contains no supplied reference, person, brand, or copyrighted character. CSS marks and Canvas visuals are authored for this repository. Generated imagery is disclosed in the footer.
