---
kind: post
title: "eViacam — free webcam head-tracking mouse replacement"
author: CREA Software Systems
url: https://eviacam.crea-si.com/index.php
source: "raw/web/eviacam.md"
added: "2026-07-01"
relevance: 4
related_experiments: []
related_concepts: [head-pose-pointing, dwell-click, camera-mouse, assistive-pointing-device]
tags: [head-tracking, mouse-replacement, open-source, accessibility, dwell-click]
---

# eViacam — free webcam head-tracking mouse replacement

## TL;DR
eViacam (Enable Viacam) is a free, GPLv3, open-source mouse-replacement app that
moves the cursor as the user moves their head, using only a standard webcam. It
offers adjustable pointer speed/acceleration, smoothing, and dwell-click, plus a
setup wizard, and runs on Windows, GNU/Linux, and Android (as EVA Facial Mouse).

## Key points
- Head-motion-to-cursor mapping from an ordinary webcam feed; no extra hardware.
- Configurable pointer speed, motion acceleration, and smoothing — the core
  tunables for usable head-pointing.
- Dwell-click via configurable dwelling time (hands-free clicking).
- Integrated configuration wizard; designed for post-setup user autonomy.
- Windows Vista-10, Debian 10+/Ubuntu 18.10+, Android variant.
- Directly comparable to Camera Mouse; a strong open-source baseline / reference
  implementation for a head-pointing control channel.

## Follow-up
- Compare eViacam's smoothing/acceleration model and dwell tuning against Camera
  Mouse as baselines for a head-pose pointing channel.
- Check the GitHub source for the actual tracking/smoothing algorithm to reuse
  or benchmark against.
