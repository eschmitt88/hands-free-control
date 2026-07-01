source: https://www.frontiersin.org/journals/neuroinformatics/articles/10.3389/fninf.2025.1625279/full
fetched: 2026-07-01
title: Motor imagery-based brain-computer interfaces - an exploration of multiclass motor imagery-based control for Emotiv EPOC X

# Motor imagery-based BCI: multiclass MI control for Emotiv EPOC X

Authors: Paulina Tarara, Iwona Przybyl, Julius Schoning, Artur Gunia.

Institutions: Academy of Fine Arts and Design in Katowice (Poland); Business
Service Galop (Poland); Osnabrueck University of Applied Sciences (Germany);
Jagiellonian University, Krakow (Poland).

Venue: Frontiers in Neuroinformatics (2025). Peer-reviewed.

## Abstract (paraphrased from capture)
Multiclass BCI to classify six mental states (resting + five imagined movements:
left/right hand, tongue, left/right lateral bending) using consumer Emotiv EPOC X.
Seven participants did body-awareness (mindfulness + exercise) training.
Post-training MI proficiency improved modestly, but classification was limited by
inter/intra-subject signal variability and consumer-grade hardware constraints.

## Methods
- Device: Emotiv EPOC X, 14 electrodes + 4 references, 128 Hz.
- Channels: AF3, F7, F3, FC5, T7, P7, O1, O2, P8, T8, FC6, F4, F8, AF4.
- Classes: 6 (rest + 5 imagined movements).
- Features/classifier: Common Spatial Pattern (CSP) + Support Vector
  Classification (RBF kernel).
- Subjects: 7 (3 women, 4 men; mean age 24). 12 trials per class.

## Results
- Test accuracy: 0.17-0.36 (near chance for 6-class ~0.167).
- Training accuracy: 0.48-0.62 -> substantial overfitting.
- Cohen's Kappa slightly above zero in most cases.

## Limitations
1. No central electrodes (C3, C4) over sensorimotor cortex - poor MI coverage.
2. Inter/intra-subject variability.
3. Small dataset (7 subjects, 12 trials/class) -> overfitting.
4. Low SNR; no artifact removal (ICA omitted for ecological applicability).
5. Eye-movement / gaze-shift artifacts confounding classification.
