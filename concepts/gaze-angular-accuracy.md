---
kind: concept
name: "Gaze Angular Accuracy"
status: seedling
added: "2026-07-01"
sources: ["l2cs-net-2022", "eth-xgaze-2020", "gazecapture-itracker-2016"]
related_concepts: ["appearance-based-gaze-estimation", "gaze-estimation-benchmark"]
tags: ["gaze", "metric"]
---
# Gaze Angular Accuracy
## Definition
Measuring gaze error as the angle in degrees between predicted and true gaze direction, the standard in-the-wild evaluation metric.
## Why it matters here
It translates into on-screen pointing error, so it is the number that predicts whether gaze can hit a target or must defer to voice.
## Connections
- [[appearance-based-gaze-estimation]] — the model family this metric scores
- [[gaze-estimation-benchmark]] — where angular accuracy is measured under a fixed protocol
