---
kind: paper
title: "Look & Touch: Gaze-supported Target Acquisition"
authors: ["Sophie Stellmach", "Raimund Dachselt"]
institutions: ["Technische Universitat Dresden (Interactive Media Lab)"]
year: 2012
venue: "CHI 2012 (ACM CHI Conference on Human Factors in Computing Systems), pp. 2981-2990"
peer_reviewed: true
url: https://dl.acm.org/doi/10.1145/2207676.2208709
code_url: null
citations: null
source: "raw/papers/look-and-touch-2012.md"
added: "2026-07-01"
relevance: 4
credibility: 5
status: skimmed
related_experiments: []
related_concepts: ["gaze-cursor-positioning", "coarse-to-fine-selection", "gaze-suggests-x-confirms", "midas-touch-problem", "target-expansion"]
tags: ["gaze", "touch", "target-acquisition", "distant-display", "multimodal", "selection", "foundational"]
---

# Look & Touch: Gaze-supported Target Acquisition

> ACCESS: ABSTRACT ONLY (ACM PDF 403). Body below from ACM/ResearchGate
> metadata plus clearly-marked domain knowledge. NOTE: the candidate-supplied
> URL (doi/pdf/10.1145/1983302.1983303) does not resolve to this paper; the
> correct ACM DOI is 10.1145/2207676.2208709 (CHI '12, pp. 2981-2990).

## TL;DR

Foundational gaze-supported selection paper. Gaze coarsely positions a cursor on
a distant display (fast but imprecise); a handheld touch device refines the
position (zoom lens / manual offset) and confirms the selection. Design
principle: "gaze suggests, touch confirms." User study N=24.

## Claims

- Gaze-only interaction is fast but error-prone and unnatural for selection.
- Combining gaze (coarse "where") with touch (precise "commit") is more natural
  and effective — the "gaze suggests, touch confirms" principle.
- A family of practical techniques (enhanced gaze cursor, local zoom lens,
  manual touch fine-positioning) supports selection across target sizes/distances.

## Methods

- Techniques for distant displays: enhanced gaze-directed cursor; local zoom
  lenses; manual fine-positioning of the cursor via touch on a handheld.
- User study with 24 participants across different target sizes and distances.
- *[Domain knowledge, not from source:]* The coarse-to-fine decomposition
  (gaze acquires the neighborhood, a second modality commits) is the canonical
  answer to the Midas-touch problem and is the template later work adapts by
  swapping touch for voice/pinch (cf. Eyes on Many; disabled-limbs interface).

## Results

- Comparative evaluation of the techniques across target sizes/distances;
  numeric outcomes behind the paywall (not captured).

## Critique / open questions

- Not hands-free: it relies on a handheld touch device, so it is the *touch*
  ancestor of the project's gaze+voice pattern rather than a direct instance —
  its value is the design principle, which transfers when touch -> voice.
- 2012 hardware (remote-display eye trackers); latency/accuracy numbers are
  dated, but the interaction model is not.
- Abstract-only capture: no effect sizes.

## Trust signals

- **Credibility:** 5 — CHI 2012 full paper (top-tier peer-reviewed HCI),
  Stellmach & Dachselt (TU Dresden), a widely-cited foundational reference for
  gaze-supported selection. Rated on venue + field standing despite
  abstract-only access.

## Follow-up

- Obtain full text for the technique details and study numbers.
- Treat "gaze suggests, X confirms" as the load-bearing concept linking every
  paper in this batch; candidate for a concept + eventual MoC on gaze-supported
  selection.
