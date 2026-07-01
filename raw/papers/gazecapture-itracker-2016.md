source: https://arxiv.org/abs/1606.05814
fetched: 2026-07-01
title: Eye Tracking for Everyone (GazeCapture / iTracker)

# Eye Tracking for Everyone (captured abstract + metadata)

**Title:** Eye Tracking for Everyone

**Authors:** Kyle Krafka, Aditya Khosla, Petr Kellnhofer, Harini Kannan,
Suchendra Bhandarkar, Wojciech Matusik, Antonio Torralba

**Affiliations:** MIT CSAIL / University of Georgia (inferred; dataset hosted at
gazecapture.csail.mit.edu). Not explicitly listed on the abstract page.

**Year:** 2016

**Venue:** IEEE Conference on Computer Vision and Pattern Recognition (CVPR 2016)

**Abstract:** The authors present an approach to make eye tracking accessible on
consumer devices: "We believe that we can put the power of eye tracking in
everyone's palm by building eye tracking software that works on commodity
hardware such as mobile phones and tablets, without the need for additional
sensors or devices."

**Key Method:** iTracker, a convolutional neural network designed for real-time
eye tracking (10-15fps on mobile devices). Inputs: left eye, right eye, full
face, and a face-grid encoding face location within the frame.

**Dataset — GazeCapture:**
- Over 1,450 subjects
- Nearly 2.5M frames
- Collected from mobile phones and tablets

**Reported Error Rates:**
- Without calibration: 1.71cm (phones), 2.53cm (tablets)
- With calibration: 1.34cm (phones), 2.12cm (tablets)

**Resources:** Code, data, and models at http://gazecapture.csail.mit.edu

**Citation Count:** Not displayed on this page.
