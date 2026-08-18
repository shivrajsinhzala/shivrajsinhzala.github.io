# Skill logos

SVG marks used by the 3D scene. Each is parsed and extruded into real geometry
at runtime, so they need to be plain single-path marks on a square viewBox —
the loader normalises scale and centring, so source dimensions do not matter.

Present:

- `openai.svg` — OpenAI
- `claude.svg` — Claude

Both are the monochrome brand marks, sourced from the Simple Icons collection
(https://simpleicons.org). The collection itself is CC0; the marks remain the
trademarks of their respective owners and are used here nominatively, to
identify the tools in the stack.

A missing file is still a supported state: the skill falls back to its inline
path, or to a plain block if it has neither, so removing one of these will not
break the build.
