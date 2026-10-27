---
name: ai-motion-studio
description: Make Paper Cut logo motions, animated Persian (RTL) titles and short 2D paper-style motion videos as real MP4 files with the AI Motion Studio engine. Use when the user asks for لوگوموشن، موشن گرافیک، تیتر متحرک فارسی، اینترو/اوترو، or a paper-cut style animation.
---

# AI Motion Studio

Renders motion graphics with the user's own engine (repo `akhavan2525/ai-motion-studio`, Remotion + React). You write a JSON spec, the engine validates it and renders an MP4 (H.264, 30fps). No video-generation model is involved, so output is exact and repeatable.

Talk to the user in Persian unless they write in another language.

## What it can and cannot do (v0.1)

Can: paper-cut landscape/sea/city/night backgrounds with 5 to 7 animated layers, logo motion (paper ring assembling around a 1 to 4 letter monogram, or the user's PNG/SVG logo), Persian RTL titles with Vazirmatn font, palette changes, 16:9 / 9:16 / 1:1.

Cannot yet: edit raw footage (trim, cut, subtitles on a video), add music/voice, character animation. If asked, say plainly it is not built yet and offer what is possible now (for example an intro/outro clip the user can put before their video).

## Setup (once per machine)

1. Find the repo: look for a folder containing `scripts/render.ts` and `packages/animation-engine` (often the current working directory). If missing, clone it: `git clone https://github.com/akhavan2525/ai-motion-studio`.
2. In the repo run `npm install` (Node 22+). This installs only the engine, not Electron, so it is quick. First render downloads a headless Chromium on Windows/macOS; FFmpeg is bundled. The desktop app is optional and installed separately with `npm run desktop:install`.

All commands below run from the repo root.

## Workflow

1. Understand the brief: duration (default 6 s for a logo, 10 s for an intro), aspect (Instagram reel/story = 9:16, post = 1:1, YouTube = 16:9), brand name, monogram letters, logo file, palette/mood, Persian title and subtitle. Ask only if the brand name or text is missing; otherwise choose sensible defaults and say what you chose.
2. Write the spec to `output/<slug>.json` (ops format below is easiest).
3. Validate: `npm run render -- output/<slug>.json --check`. Fix any error it prints (messages are Persian, field paths are English).
4. Optional quick look: `npm run render -- output/<slug>.json --stills` writes 4 PNG frames next to the output; view them to check layout and text before the full render.
5. Render: `npm run render -- output/<slug>.json --out output/<slug>.mp4` (about 30 to 60 s for 6 to 10 s of video).
6. Give the user the MP4 path (and attach/upload it if the surface allows). The resolved project is saved as `output/<slug>.project.json`.

### Edits after the first render

Make small edits, never rebuild from scratch. Write a short ops file and apply it on the saved project:

```json
{ "ops": [
  { "name": "setPalette", "args": { "preset": "gold" } },
  { "name": "updateScene", "args": { "id": "title", "text": "عنوان جدید" } }
] }
```

`npm run render -- output/edit.json --base output/<slug>.project.json --out output/<slug>-v2.mp4`

## Spec format A: ops (recommended)

`{ "ops": [ { "name": <tool>, "args": {...} }, ... ] }` applied in order. Times are in seconds.

| tool | args |
| --- | --- |
| `createProject` (must be first for a new project) | `name`, `durationSeconds` (1 to 600), `style` `paper-cut`\|`minimal`, `aspect` `16:9`\|`9:16`\|`1:1`, `palette` `sky`\|`gold`\|`sunset`\|`night` |
| `addPaperCutScene` | `id`, `startSeconds`, `durationSeconds`, `theme` `landscape`\|`sea`\|`city`\|`night` (auto layers), `camera` `none`\|`push-in`\|`pan`, optional `layers`: `[{shape, depth 0..1, motions[]}]` |
| `animateLogo` | `id`, `startSeconds`, `durationSeconds` (≥1), `monogram` (1 to 4 chars), optional `logoSrc` (path to PNG/SVG, relative to the spec file or absolute) |
| `addAnimatedText` | `id`, `text` (≤120 chars), optional `subtitle`, `startSeconds`, `durationSeconds`, `animation` `word-by-word`\|`fade-up`\|`paper-strip` |
| `setPalette` | `preset` and/or `background`, `primary`, `accent`, `text` as `#RRGGBB` |
| `updateScene` | `id` plus any of `text`, `subtitle`, `monogram`, `animation`, `startSeconds`, `durationSeconds` |
| `removeScene` | `id` |
| `exportVideo` | optional `fileName` (used as default MP4 name) |

Shapes: `hills`, `mountains`, `waves`, `clouds`, `sun`, `trees`, `city`. Motions: `rise`, `drop`, `parallax`, `sway`, `float`, `spin` (1 to 3 per layer). Scenes that run past the project end are trimmed automatically.

Example logo motion (6 s, 16:9):

```json
{ "ops": [
  { "name": "createProject", "args": { "name": "لوگوموشن آکادمی اخوان", "durationSeconds": 6, "style": "paper-cut", "aspect": "16:9", "palette": "gold" } },
  { "name": "addPaperCutScene", "args": { "id": "bg", "startSeconds": 0, "durationSeconds": 6, "theme": "landscape", "camera": "push-in" } },
  { "name": "animateLogo", "args": { "id": "logo", "startSeconds": 0.8, "durationSeconds": 3, "monogram": "AK" } },
  { "name": "addAnimatedText", "args": { "id": "title", "text": "آکادمی اخوان", "subtitle": "یادگیری هوش مصنوعی", "startSeconds": 3.4, "durationSeconds": 2.6, "animation": "paper-strip" } },
  { "name": "exportVideo", "args": { "fileName": "akhavan-logo" } }
] }
```

## Spec format B: full project JSON

For fine control (custom layer delays, exact frames, a custom 2 to 6 colour layer palette) write the whole project. See `examples/paper-cut-full.json` and `packages/project-schema/src/index.ts` (zod schema, the single source of truth). Key rules: `fps` 12 to 60, everything in frames, scene ids unique, `startFrame + durationFrames <= durationFrames` of the project, `action` is `paper_layers_reveal` | `logo_assemble` | `title_reveal`, a title can sit on a background with `overScene: "<scene id>"`.

## Design tips

- Logo: background from 0, logo enters around 0.5 to 1 s and holds 2.5 to 3 s, brand title after it. Total 5 to 7 s.
- Reels/stories: 9:16, keep titles short (two lines max), 8 to 15 s.
- Palettes: `sky` fresh/educational, `gold` premium, `sunset` warm, `night` dark (title card turns dark automatically when the text colour is light).
- Keep monograms Latin or short Persian (1 to 2 letters) so they fit the ring.
