source: https://www.mdpi.com/1424-8220/25/16/5215
fetched: 2026-07-01
title: Recent Advances in Portable Dry Electrode EEG: Architecture and Applications in Brain-Computer Interfaces

# Recent Advances in Portable Dry Electrode EEG: Architecture and Applications in Brain-Computer Interfaces

**Authors:** Meihong Zhang, Bocheng Qian, Jianming Gao, Shaokai Zhao, Yibo Cui,
Zhiguo Luo, Kecheng Shi, Erwei Yin
**Institutions:** University of Electronic Science and Technology of China
(Chengdu); Defense Innovation Institute, Academy of Military Sciences (Beijing);
Academy of Medical Engineering and Translational Medicine, Tianjin University
**Year:** 2025 · **Journal:** Sensors (Basel) 25(16):5215 · **DOI:** 10.3390/s25165215
· Published 2025-08-21
**Access:** full text (MDPI page returned HTTP 403; recovered via PMC mirror
PMC12389868 + WebSearch). Literature search span Jan 2019 – Jul 2025.

## Captured content

Review of dry-electrode EEG (no conductive gel) for BCI, focused on hardware
structural innovation + material development, and applications in emotion
recognition, fatigue/drowsiness detection, motor imagery, and SSVEP.

### Electrode taxonomy
1. **MEMS / microneedle** — silicon (brittle, biocompatibility limits), polymers
   (PDMS, SU-8, parylene C, polyimide), metals (Ti, stainless steel); penetrate
   stratum corneum to cut contact impedance.
2. **Dry non-contact (capacitive)** — dielectric layer; safe/comfortable but
   electrode–skin impedance up to "several megohms".
3. **Dry contact** — comb/claw structures, carbon-fiber flex needles, arch,
   textile. E.g. TPU–Ag (2:1) ~100 Ω; PEDOT:PSS/PDMS conductive cotton 67.23 Ω/sq;
   SAN/Ir−TiO₂ ~19.9 kΩ in hairy regions.

### Application accuracy ranges (captured)
- Emotion recognition: 58–99%.
- Fatigue/drowsiness: 71–99%.
- Motor imagery: 35–96.5% (high variability); reach-grasp decode 56.4 ± 8%.
- **SSVEP: 70–99.6% accuracy; ITR 39–346.8 bits/min** (e.g. 24-ch Neuracle
  90.18% @ 117.05 bits/min on 60-char speller; 10-ch Avertus H10C 87.5% @
  346.8 bits/min).

### Reported limitations (captured)
- Impedance ">100 kΩ" (dry) vs "<10 kΩ" (wet); attenuates <4 Hz (delta/theta).
- Rigid contact, no gel damping → baseline drift, mechanical decoupling on motion.
- Motion artifacts: 30–40% rise in 50/60 Hz line noise in dynamic scenes.
- Subject-independent accuracy generally 10–15% below subject-dependent.
- Majority of results still offline; device fragmentation across vendors.
- **Battery/power:** paper does NOT give specific battery-life/power figures;
  only notes wireless designs improve portability.
