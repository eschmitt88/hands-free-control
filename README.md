# hands-free-control

**Hands-free desktop control from a webcam and microphone — voice as the primary
channel behind an LLM intent layer, gaze and head tracking for coarse pointing.**

📂 **[Browse this repo →](https://eschmitt88.github.io/hands-free-control/)** —
interactive, always-live view of experiments, concepts, literature, and maps of
content. Served via GitHub Pages from `docs/index.html`; reads the live file
tree, no build step.

## What this is

How far can an able-bodied user get controlling a desktop with no keyboard or
mouse, using only commodity hardware? The working thesis, from a July 2026
prior-art survey, is that voice carries most of the intent once an LLM sits
between speech and action, while gaze or head tracking supplies coarse
pointing — the two combine as *gaze points, voice confirms*. Consumer EEG/BCI
was surveyed and parked: its bandwidth ceiling (roughly 30 bits per minute) is
too low to compete. The knowledge graph collects the prior art, the concepts
that fall out of it, and experiments testing each channel and their fusion.
`mocs/multimodal-gaze-voice.md` is the spine.

## How it's organized

Plain Markdown + flat YAML frontmatter, cross-linked with `[[wikilinks]]`:

- `concepts/` / `mocs/` — atomic ideas; promoted to a map of content when ≥5 cluster.
- `literature/` — processed notes on papers, repos, posts (0–5 relevance scored).
- `experiments/YYYY-MM-DD-<slug>/` — self-contained runs (hypothesis → result, config, metrics, log).
- `raw/` — immutable source captures · `docs/decisions/` — ADRs · `_meta/` — index, log, templates.

## Local use

```sh
make env    # uv sync
make lint   # knowledge-graph / experiment health check
```

Part of a personal research framework
([claude-system](https://github.com/eschmitt88/claude-system)). See `CLAUDE.md`
for the agent-facing orientation and `~/.claude/CLAUDE.md` for the framework's
durable principles.
