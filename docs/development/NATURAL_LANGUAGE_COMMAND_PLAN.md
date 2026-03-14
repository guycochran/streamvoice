# Natural Language Command Plan

## Purpose

This plan defines how StreamVoice should evolve from phrase matching into a more reliable natural-language command system.

The goal is not open-ended conversation. The goal is:
- natural command phrasing
- deterministic intent extraction
- slot-based execution
- fewer misses from common operator language

## Problem

Today the app mostly does:
- transcript
- normalization
- pattern and phrase matching

That works for early beta, but it does not scale well when users say:
- `go to camera 1`
- `switch to camera 1`
- `bring up camera 1`
- `show camera 1`
- `take me to slides`

If we keep patching this one phrase at a time, the parser will become brittle and hard to trust.

## Target Model

StreamVoice should parse commands into:
- `intent`
- `target slot`
- optional `value`
- optional `modifier`

Examples:
- `switch_scene(camera1)`
- `switch_scene(slides)`
- `mute(mic)`
- `adjust_volume(mic, +10%)`
- `set_volume(desktop, 50%)`
- `start_stream()`
- `stop_recording()`

## Intent Layer

Start with a small set of high-value intents.

### Core intents
- `switch_scene`
- `mute`
- `unmute`
- `set_volume`
- `adjust_volume`
- `start_stream`
- `stop_stream`
- `start_recording`
- `stop_recording`
- `take_screenshot`

### Later intents
- `show_source`
- `hide_source`
- `run_macro`
- `save_replay`
- `clip_replay`

## Slot Layer

The parser should resolve natural language into stable internal slot names.

Examples:
- `camera 1` -> `camera1`
- `camera one` -> `camera1`
- `cam one` -> `camera1`
- `slides` -> `slides`
- `powerpoint` -> `slides`
- `browser` -> `browser`
- `break` -> `break`

These slot names should then resolve through confirmed user mappings.

## Phrase Lexicons

Each intent should have its own verb lexicon.

### `switch_scene`
- `switch to`
- `switch`
- `go to`
- `go`
- `show`
- `bring up`
- `take me to`

### `mute`
- `mute`
- `turn off`
- `silence`

### `unmute`
- `unmute`
- `turn on`
- `bring back`

### `adjust_volume`
- `turn up`
- `turn down`
- `bring up`
- `bring down`
- `raise`
- `lower`

### `set_volume`
- `set`
- `set to`
- `make`

The parser should match these lexicons before trying broad phrase fallbacks.

## Command Parsing Strategy

### Phase 1: Normalization
- lowercase
- strip punctuation
- normalize common STT mistakes:
  - `too` -> `two` when used as a scene number target
  - `won` -> `one`
  - `tree` -> `three`
  - `fore` -> `four`
- drop filler words where safe:
  - `please`
  - `okay`
  - `now`

### Phase 2: Intent Detection
- identify the most likely command family from verb phrases
- examples:
  - `go to ...` => `switch_scene`
  - `turn up ...` => `adjust_volume`
  - `mute ...` => `mute`

### Phase 3: Slot Extraction
- map the remaining phrase to a slot:
  - `camera 1`
  - `slides`
  - `browser`
  - `mic`
  - `desktop`

### Phase 4: Value Extraction
- if needed, extract:
  - percentage
  - up/down step

### Phase 5: Deterministic Execution
- execute the resolved intent against:
  - confirmed scene slot mapping
  - confirmed source mapping
  - central command dispatcher

## Safety Rules

- do not guess past ambiguity for high-risk scene changes
- numbered camera commands must resolve to the correct numbered slot
- if intent is detected but slot is ambiguous, fail clearly
- unsupported natural phrasing should not silently fall through to unrelated commands

## Examples Of Desired Behavior

All of these should resolve to `switch_scene(camera1)`:
- `switch to camera 1`
- `switch camera one`
- `go to camera one`
- `bring up camera 1`
- `show camera one`

All of these should resolve to `switch_scene(slides)`:
- `switch to powerpoint`
- `go to the powerpoint`
- `show slides`
- `bring up presentation`

All of these should resolve to `adjust_volume(mic, +10%)`:
- `turn up the mic`
- `turn up my mic`
- `bring up the mic`
- `raise mic`

## Implementation Phases

### Phase 1
- centralize parser helpers
- split command extraction into:
  - intent detection
  - slot normalization
  - value extraction

### Phase 2
- add scene-slot lexicon
- add audio-target lexicon
- make parser return structured command objects before execution

### Phase 3
- update diagnostics to show:
  - raw transcript
  - parsed intent
  - parsed slot
  - parsed value
  - execution result

### Phase 4
- add alias editor support for natural phrasing per slot

## Suggested Ticket Breakdown

- `SV-NL-001` Intent parser scaffold
- `SV-NL-002` Slot normalization layer
- `SV-NL-003` Verb lexicon per intent
- `SV-NL-004` Structured parser diagnostics
- `SV-NL-005` Slot alias integration
- `SV-NL-006` High-risk ambiguity rules

## Definition Of Done

This plan is successful when:
- users can speak common variants naturally
- commands resolve through structured intents and slots
- scene switching is deterministic
- diagnostics show exactly how speech was interpreted
- new phrasing can be added cleanly without regex sprawl
