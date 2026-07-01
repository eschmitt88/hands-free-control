source: https://arxiv.org/abs/2104.00870
fetched: 2026-07-01
title: "GAVIN: Gaze-Assisted Voice-Based Implicit Note-taking"

# GAVIN — captured content

**Title:** GAVIN: Gaze-Assisted Voice-Based Implicit Note-taking

**Authors:** Anam Ahmad Khan, Joshua Newn, Ryan Kelly, Namrata Srivastava, James Bailey, Eduardo Velloso

**Year:** 2021 (submitted April 2, 2021)

**Venue:** ACM Transactions on Computer-Human Interaction (TOCHI), Vol. 28, pp. 1-32.

**Abstract (verbatim):**
"Annotation is an effective reading strategy people often undertake while interacting with digital text. It involves highlighting pieces of text and making notes about them. Annotating while reading in a desktop environment is considered trivial but, in a mobile setting where people read while hand-holding devices, the task of highlighting and typing notes on a mobile display is challenging. In this paper, we introduce GAVIN, a gaze-assisted voice note-taking application, which enables readers to seamlessly take voice notes on digital documents by implicitly anchoring them to text passages. We first conducted a contextual enquiry focusing on participants' note-taking practices on digital documents. Using these findings, we propose a method which leverages eye-tracking and machine learning techniques to annotate voice notes with reference text passages. To evaluate our approach, we recruited 32 participants performing voice note-taking. Following, we trained a classifier on the data collected to predict text passage where participants made voice notes. Lastly, we employed the classifier to built GAVIN and conducted a user study to demonstrate the feasibility of the system. This research demonstrates the feasibility of using gaze as a resource for implicit anchoring of voice notes, enabling the design of systems that allow users to record voice notes with minimal effort and high accuracy."

**Contributions / claims (from abstract):**
- GAVIN: a gaze-assisted voice note-taking application that implicitly anchors spoken notes to the text passage the reader was gazing at — no manual highlighting/pointing.
- A method combining eye-tracking + a trained ML classifier to predict which text passage a voice note refers to.
- Contextual inquiry into note-taking practice; data collection from 32 participants; classifier training; feasibility user study.

**Method (as captured):** Contextual enquiry → collect gaze + voice-note data (N=32) → train classifier to predict the referenced passage from gaze features → deploy classifier inside GAVIN → feasibility user study. Implicit anchoring means the passage reference is inferred from gaze rather than explicitly selected.

**Results (as captured):** Demonstrates feasibility of gaze as a resource for implicit anchoring of voice notes with "minimal effort and high accuracy" (exact accuracy figures behind the PDF).

**Code URL:** Not stated in fetched content.

Note: PDF stream was binary/uncapturable; captured from the arXiv abstract page.
