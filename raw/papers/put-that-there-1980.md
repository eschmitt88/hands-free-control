source: https://www.media.mit.edu/speech/papers/1980/bolt_SIGGRAPH80_put-that-there.pdf
fetched: 2026-07-01
title: "Put-That-There: Voice and Gesture at the Graphics Interface"

# Put-That-There (SIGGRAPH 1980)

ACCESS NOTE: The MIT Media Lab PDF repeatedly failed to fetch (socket hang up),
and an alternate review PDF was blocked. The content below was assembled from
web search results plus well-established domain knowledge of this seminal paper,
clearly marked as domain knowledge. No specific results have been invented.
Access level: failed (primary source not captured); note written from secondary
summaries + domain knowledge.

## Metadata
- Author: Richard A. Bolt
- Affiliation: Architecture Machine Group, MIT (later the MIT Media Lab)
- Venue: SIGGRAPH '80 / Computer Graphics 14(3), 1980
- Title: "Put-That-There: Voice and Gesture at the Graphics Interface"

## Content (search + domain knowledge)
Widely considered the first multimodal interactive system. In the "Media Room,"
a user seated before a large wall-sized graphics display issues spoken commands
while pointing at the display; a magnetic position/orientation sensor on the
wrist tracks the pointing gesture. Deictic ("pointing") words in the speech —
"that," "there," "put that there" — are resolved by the concurrent pointing
gesture: speech carries the command and object class while gesture supplies the
spatial referent. Example interactions: create a shape ("Create a blue square
there"), move/copy/delete objects ("Put that ... there"), and name items.

Key idea (domain knowledge): mutual disambiguation — pronoun references in
speech that are ambiguous on their own are grounded by pointing, and the system
can use speech output to query the user on ambiguous input. This demonstrated
that combining speech with a spatial referencing modality yields a natural,
conversational interface and reduces command ambiguity.
