source: https://alexandre.barachant.org/blog/2017/02/05/P300-with-muse.html
fetched: 2026-07-01
title: P300 with the Muse

# P300 with the Muse (blog)

Author: Alexandre Barachant, PhD (BCI researcher; Riemannian-geometry methods,
pyriemann/MNE contributor).

## What
DIY demonstration of detecting the P300 ERP on the 4-channel dry Muse (2016)
headband (electrodes TP9, TP10, AF7, AF8). Author notes Muse channels are not
ideally placed for P300.

## Experiment
Visual oddball: 960 non-target (vertical gratings) + 184 target (horizontal
gratings) over six 2-minute runs; subject silently counts targets.

## Methods
1-30 Hz bandpass; epochs -100 to 800 ms; artifact rejection >100 uV;
grand-averaged ERP. Four classification pipelines: vectorization + logistic
regression; regularized LDA; ERPCov + tangent-space (Riemannian); ERPCov + MDM.

## Results
- Clear P300 visible on temporal electrodes.
- Best pipeline (ERPCov + MDM) reached ~0.8 AUC (vs 0.5 chance).

## Caveats (author's own)
Device can support "some BCI application" but readers should not expect
"outstanding results" given suboptimal electrode placement and modest SNR.
