---
kind: candidates
topic: "multimodal gaze + voice (and gaze + head) interaction — gaze for coarse pointing, voice for confirmation/commands"
discovered: 2026-07-01
source: discover
n_requested: 10
n_returned: 10
---

## 1. Gaze and Speech in Multimodal Human-Computer Interaction: A Scoping Review

- url: https://dl.acm.org/doi/10.1145/3772318.3791662
- type: paper
- summary: A CHI 2026 scoping review that maps the gaze-and-speech literature, identifying the dominant "gaze to point, speech as command" pattern (17 studies) and task categories including selection, system control, navigation, and spoken-command disambiguation.
- reason: It is the single most direct and current survey of the exact modality being scoped, giving a taxonomy and citation trail for gaze+voice desktop control.

## 2. EyeTAP: A Multimodal Gaze-Based Technique Using Voice Inputs

- url: https://www.sciencedirect.com/science/article/abs/pii/S107158192100094X
- type: paper
- summary: EyeTAP is a contact-free point-and-select method that uses gaze for pointing and voice/acoustic input for confirmation, and in comparative studies showed faster movement and task-completion time and lower cognitive workload than voice-only or dwell approaches.
- reason: It is a direct, empirically evaluated demonstration that voice confirmation on gaze pointing beats dwell, which is the core hypothesis of the project.

## 3. Manual and Gaze Input Cascaded (MAGIC) Pointing

- url: https://dl.acm.org/doi/10.1145/302979.303053
- type: paper
- summary: Zhai, Morimoto, and Ihde's CHI 1999 paper warps the cursor to the gaze region and hands fine selection to a manual actuator, reducing physical effort while avoiding overloading vision with a motor task.
- reason: The seminal formulation of "gaze for coarse pointing, another modality for the precise/confirm step" that underlies every gaze+voice selection design.

## 4. "Put-That-There": Voice and Gesture at the Graphics Interface

- url: https://www.media.mit.edu/speech/papers/1980/bolt_SIGGRAPH80_put-that-there.pdf
- type: paper
- summary: Bolt's 1980 MIT Media Room system let a user command shapes on a large display by speaking deictic commands ("put that there") while pointing, showing that voice plus spatial pointing enables natural pronoun use and mutual disambiguation.
- reason: The foundational multimodal-fusion result showing each modality covers the other's weakness — the conceptual ancestor of gaze+voice, with gaze substituting for the pointing gesture.

## 5. VoxVisio — Combining Gaze and Speech for Accessible HCI

- url: https://www.resna.org/sites/default/files/conference/2016/cac/rozado.html
- type: post
- summary: Rozado's open-source system for motor-impaired users combines gaze pointing for target selection with subsequent speech commands for the action, adding gaze-steered zoom for fine icon selection and a dictation mode.
- reason: A concrete open-source accessibility implementation of dwell-free gaze+voice desktop control, directly matching the project's hands-free goal.

## 6. GazePointAR: A Context-Aware Multimodal Voice Assistant for Pronoun Disambiguation

- url: https://arxiv.org/abs/2404.08213
- type: paper
- summary: A wearable-AR voice assistant that fuses real-time gaze (and pointing/history) with speech so users can issue underspecified pronoun queries like "what is that?" and have the system resolve the referent from where they look.
- reason: Recent (2024) work operationalizing the Put-That-There idea with modern gaze+LLM voice pipelines, relevant to natural deictic command handling in control interfaces.

## 7. Eye-Tracking and Voice Command Interface for GUI Operation with Disabled Upper Limbs

- url: https://link.springer.com/article/10.1007/s10209-022-00939-y
- type: paper
- summary: Develops and evaluates a desktop GUI interface where eye tracking positions the cursor and voice commands trigger clicks and actions for users who cannot use their hands.
- reason: An accessibility-focused, desktop-GUI-specific gaze+voice system with a usability evaluation, close to the intended deployment target.

## 8. Look & Touch: Gaze-Supported Target Acquisition (Stellmach & Dachselt)

- url: https://dl.acm.org/doi/pdf/10.1145/1983302.1983303
- type: paper
- summary: CHI 2012 work showing gaze can supply coarse target positioning while a second modality (touch on a handheld) refines and confirms selection on a remote display, coining the "gaze-supported" interaction framing.
- reason: Establishes the general "gaze-supported" division of labor and evaluation methodology that transfers directly from gaze+touch to gaze+voice confirmation.

## 9. GAVIN: Gaze-Assisted Voice-Based Implicit Note-taking

- url: https://arxiv.org/pdf/2104.00870
- type: paper
- summary: Combines gaze (what the user is reading/looking at) with voice input so spoken notes are implicitly anchored to on-screen context without manual pointing.
- reason: Illustrates gaze providing spatial/context grounding for a voice channel, a lightweight fusion pattern applicable to hands-free command targeting.

## 10. Eyes on Many: Evaluating Gaze, Hand, and Voice for Multi-Object Selection in XR

- url: https://arxiv.org/pdf/2602.12406
- type: paper
- summary: A 2026 empirical comparison of gaze, hand, and voice (and combinations) for selecting multiple objects, quantifying trade-offs in speed, accuracy, and effort across the modalities.
- reason: Recent controlled evidence on when voice complements gaze for selection, useful for designing and benchmarking the project's confirmation strategy.
