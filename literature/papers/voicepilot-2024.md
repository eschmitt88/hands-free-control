---
kind: paper
title: "VoicePilot: Harnessing LLMs as Speech Interfaces for Physically Assistive Robots"
authors: [Akhil Padmanabha, Jessie Yuan, Janavi Gupta, Zulekha Karachiwalla, Carmel Majidi, Henny Admoni, Zackory Erickson]
institutions: [Carnegie Mellon University]
year: 2024
venue: "UIST 2024 (ACM Symposium on User Interface Software and Technology)"
peer_reviewed: true
url: https://arxiv.org/abs/2404.04066
code_url: null
citations: null
source: "raw/papers/voicepilot-2024.md"
added: "2026-07-01"
relevance: 4
credibility: 4
status: skimmed
related_experiments: []
related_concepts: [llm-intent-layer, speech-to-action-mapping, human-centered-interface-design, assistive-robotics, natural-language-command-interface]
tags: [llm, speech-interface, assistive-robotics, hci, uist, user-study]
---
# VoicePilot: Harnessing LLMs as Speech Interfaces for Physically Assistive Robots

## TL;DR
VoicePilot is a framework that puts an LLM between natural-language speech and an assistive robot's actions, translating spoken requests (plus user preferences) into robot behaviors. Validated on a feeding robot through three iterative design stages and a final study with 11 older adults, it yields design guidelines for human-centered LLM speech interfaces. The value for a hands-free desktop project is the LLM-as-intent-layer pattern and the human-centered design guidelines, not the robotics specifics.

## Claims
- Existing frameworks that use LLMs as interfaces to robots omit human-centric considerations essential to assistive interfaces.
- An LLM can serve as a robust speech-to-action interface that incorporates user preferences, given an appropriate framework.
- The work produces generalizable design guidelines for LLM-based speech interfaces in assistive settings.

## Methods
- LLM framework mapping natural-language speech + preferences → assistive-robot actions.
- Iterative design across three testing stages on a physical feeding-robot system.
- Final evaluation: in-situ user study with 11 older adults at an independent living facility; mixed methods (quantitative metrics + qualitative feedback).

## Results
- Reported as a successful iterative deployment culminating in the 11-participant study; specific quantitative outcomes were not captured in the fetched abstract/summary (full-text PDF needed for exact numbers).
- Primary deliverable: a systematic framework plus a set of human-centered design guidelines for LLM speech interfaces on assistive robots.

## Critique / open questions
- Domain is physical assistive robotics (feeding), not desktop/GUI control — transfer of the intent-layer pattern is promising but unverified for on-screen targeting.
- Small n (11), single site — appropriate for HCI formative work but not a performance benchmark.
- No code URL surfaced; reproducibility of the framework unclear.
- Fetched summary lacked concrete latency/accuracy/success-rate numbers — needs full PDF for the Results section.

## Trust signals
- **Credibility:** 4 — CMU robotics/HCI group (Erickson, Admoni, Majidi), peer-reviewed at UIST 2024 (top-tier HCI venue), real deployed hardware and an IRB-style user study; docked for small n and single application domain.

## Follow-up
- Pull the full PDF to extract quantitative results and the exact design guidelines.
- Extract the LLM-intent-layer prompt/architecture as a candidate pattern for mapping speech → desktop UI actions.
- Check citation count and any follow-on work (frontmatter `citations:` left null).
