---
kind: paper
title: "From Language to Action: A Review of Large Language Models as Autonomous Agents and Tool Users"
authors: [Sadia Sultana Chowa, Riasad Alvi, Subhey Sadi Rahman, Md Abdur Rahman, Mohaimenul Azam Khan Raiaan, Md Rafiqul Islam, Mukhtar Hussain, Sami Azam]
institutions: []
year: 2025
venue: "Artificial Intelligence Review (accepted, 2026)"
peer_reviewed: true
url: https://arxiv.org/abs/2508.17281
code_url: ""
citations: unknown
source: https://arxiv.org/abs/2508.17281
added: 2026-07-01
relevance: 4
status: skimmed
related_experiments: []
related_concepts: [llm-agent-tool-use, llm-planning, gui-grounding]
tags: [survey, llm-agents, tool-use, planning, gui-grounding, intent]
---

## TL;DR

Survey of 2023-2025 work on LLMs as autonomous decision-making agents and tool
users, covering agent architecture, single- vs multi-agent designs, external tool
integration, and cognitive mechanisms (reasoning, planning, memory), grounded in
an analysis of 68 public benchmark datasets. Relevant here as the map of the
"interpret spoken instruction -> plan -> call a tool/act on the GUI" layer that
sits above ASR in a hands-free control stack.

## Claims

- LLMs are now widely used as agents because they can interpret instructions,
  manage sequential tasks, and adapt through feedback.
- The agent design space decomposes into architecture, single/multi-agent
  strategy, tool integration, and cognitive mechanisms (reasoning/planning/memory).
- Verifiable reasoning, self-improvement, and personalization are the central open
  research areas; the paper lists ten future directions.

## Methods

Literature review of top-venue papers 2023-2025; taxonomic organization of agent
design principles; analysis of 68 public datasets / benchmarks and assessment
protocols. (Survey, not an empirical system.)

## Results

A taxonomy plus a consolidated benchmark landscape (68 datasets) and ten named
future-research gaps. No new metrics of its own.

## Critique / open questions

- Survey breadth over depth: useful as an index, not a recipe. For this project the
  actionable content is the tool-calling and GUI-grounding subsections — need the
  full PDF to extract concrete methods.
- The candidate description cited Agent-S, OmniParser, ShowUI as covered GUI-
  grounding systems, but the captured abstract did not confirm these; verify
  against the PDF before relying on that framing.
- Says nothing (at abstract level) about voice as the input modality — the
  instruction-interpretation layer is text-first; the ASR->intent bridge is our
  problem to add.

## Trust signals

- **Credibility:** 4 — accepted at a peer-reviewed venue (Artificial Intelligence
  Review, 2026); multi-author; recent. Survey rather than reproduced result, and
  specific-system claims unverified from the abstract, so not a 5.

## Follow-up

- Fetch the full PDF and pull the tool-calling + GUI-grounding sections; confirm
  Agent-S / OmniParser / ShowUI coverage and cite the primary papers directly.
- Use the 68-dataset benchmark list to find an evaluation harness for the
  intent/action layer of a hands-free controller.
