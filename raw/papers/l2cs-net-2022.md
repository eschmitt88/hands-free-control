source: https://arxiv.org/abs/2203.03339
fetched: 2026-07-01
title: L2CS-Net — Fine-Grained Gaze Estimation in Unconstrained Environments

# L2CS-Net (captured abstract + metadata)

**Full Title:** L2CS-Net: Fine-Grained Gaze Estimation in Unconstrained
Environments

**Authors:** Ahmed A. Abdelrahman, Thorsten Hempel, Aly Khalifa,
Ayoub Al-Hamadi

**Institutions:** Not explicitly listed in the abstract page (Otto von Guericke
University Magdeburg, per author group; not confirmed on this page).

**Year:** 2022 (submitted March 7, 2022)

**Venue:** IEEE International Conference on Image Processing (ICIP) 2022

**Abstract:** A CNN-based approach for predicting gaze direction in real-world
settings. Key idea: "regress[ing] each gaze angle separately to improve the
per-angel [per-angle] prediction accuracy," using dual identical losses to
enhance learning and generalization across diverse head poses and lighting
conditions.

**Method:** Two-branch architecture with separate angle regression and
multi-loss training addressing per-angle prediction accuracy. Backbone details
not fully elaborated in the excerpt (ResNet-family backbone per the released
code).

**Datasets:** MPIIGaze and Gaze360

**Performance:** 3.92° angular error on MPIIGaze; 10.41° on Gaze360.

**Code:** https://github.com/Ahmednull/L2CS-Net (open source, CC BY 4.0).

**Citation Count:** Not displayed in the provided content.
