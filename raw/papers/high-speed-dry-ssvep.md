source: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6168577/
fetched: 2026-07-01
title: A High-Speed SSVEP-Based BCI Using Dry EEG Electrodes

# A High-Speed SSVEP-Based BCI Using Dry EEG Electrodes

Authors: Xiao Xing, Yijun Wang, Weihua Pei, Xuhong Guo, Zhiduo Liu, Fei Wang,
Gege Ming, Hongze Zhao, Qiang Gui, Hongda Chen.

Institutions: State Key Laboratory on Integrated Optoelectronics, Institute of
Semiconductors, Chinese Academy of Sciences; University of Chinese Academy of
Sciences; CAS Center for Excellence in Brain Science and Intelligence Technology.

Venue: Scientific Reports (2018). Peer-reviewed.

## Abstract (paraphrased from capture)
Presents a high-speed SSVEP-based BCI using claw-like flexible dry EEG
electrodes. Average classification accuracy over 11 participants was 93.2%
using 1-second SSVEP epochs, giving an average ITR of 92.35 bits/min.

## Methods
- Electrodes: claw-like flexible dry electrodes (14 mm dia, 8 fingers 6 mm long
  x 2 mm dia), thermoplastic polyurethane coated with conductive silver ink.
- Channels: 8 occipital/parietal (PO5, PO3, POz, PO4, PO6, O1, Oz, O2).
- Paradigm: 12-class SSVEP, 3x4 stimulus matrix, 9.25-14.75 Hz at 0.5 Hz steps,
  60 Hz monitor.
- Algorithm: filter bank analysis (5 sub-bands) + task-related component
  analysis (TRCA). Calibration ~4 min.

## Results (dry vs wet)
- Accuracy: dry 93.2 +/- 5.74% ; wet 97.35 +/- 4.33% (1 s epochs)
- ITR: dry 92.35 +/- 12.08 bits/min ; wet 101.28 +/- 9.46 bits/min
- SNR: dry 12.83 +/- 2.85 dB ; wet 14.1 +/- 3.24 dB
- Impedance @10 Hz: dry 38.6 +/- 9.5 kOhm ; wet 8.3 +/- 1.67 kOhm
- Optimal offline ITR: 102.37 +/- 26.92 bits/min (dry) at 500 ms stimulation.
- Subjects: 11 healthy (4 female, mean age 25). Train 10 blocks x 12 trials;
  test 5 blocks x 12 trials.

## Limitations
1. Dry electrodes show more interference in 0-5 Hz and 50 Hz power-line bands.
2. Low-frequency noise from unstable electrode-skin contact.
3. Requires per-user calibration; calibration-free CCA dropped to 74.82%.
4. Signal quality still significantly worse than wet across all epoch lengths (p<0.05).

## Note on candidate description discrepancy
The candidate brief cited "325 bits/min cue-guided / ~199 bits/min free-spelling"
ITR. Those figures do NOT appear in THIS article (which reports 92.35 bits/min
average, ~102 bits/min best offline). The 319/199 bits/min figures come from a
different, well-known WET-electrode SSVEP speller (Chen et al., PNAS 2015). The
brief appears to have conflated two papers. Figures above are the true content of
PMC6168577.
