source: https://github.com/brownhci/WebGazer
fetched: 2026-07-01
title: WebGazer.js — browser webcam eye-tracking library

# WebGazer.js Library (captured README)

## What It Does
WebGazer.js is a JavaScript eye-tracking library that "uses common webcams to
infer the eye-gaze locations of web visitors on a page in real time." The
system operates entirely client-side, requiring no server-side video
transmission.

## How It Works
The library employs self-calibration through user interactions: "The eye
tracking model it contains self-calibrates by watching web visitors interact
with the web page and trains a mapping between the features of the eye and
positions on the screen." It learns from clicks and cursor movements to
correlate eye features with screen coordinates.

## Key Features
- Real-time gaze prediction across major browsers (Chrome, Edge, Firefox,
  Opera, Safari)
- Webcam-only requirement (no specialized hardware)
- Swappable components for eye detection and multiple gaze prediction models
- Video feedback to user

## Usage
Simple integration via script tag or NPM package:
    const webgazer = require('webgazer');

## Notable Limitations
Project status: "As of February 24, 2026, WebGazer is fully functional and
works as intended, but updates are no longer guaranteed. Official maintenance
has ended, but community support continues." The current iteration no longer
matches the original peer-reviewed publications from 2016-2018.

## Latest Version
Version 3.5.3 (released February 24, 2026)

## License
GPLv3, with LGPLv3 available for companies under $1,000,000 valuation.
