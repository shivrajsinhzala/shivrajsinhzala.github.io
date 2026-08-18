# Skill logos

Drop official brand SVGs here and the 3D scene picks them up automatically —
they are extruded into real geometry alongside the other marks. A missing file
is a supported state: the skill falls back to its inline path, or to a plain
block if it has neither.

Currently expected:

- `openai.svg`  — https://openai.com/brand/
- `claude.svg`  — https://www.anthropic.com/  (Claude brand assets)

Save the plain monochrome mark (not the wordmark/lockup) so it reads at small
sizes. A single `<path>` on a square viewBox works best; the loader normalises
scale and centring, so the source dimensions do not matter.

These two are deliberately absent rather than approximated: an invented
version of someone else's logo looks wrong and misrepresents their brand.
