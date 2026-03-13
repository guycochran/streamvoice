# CLI-Anything Reusable Ideas For StreamVoice

## Purpose
This note captures the parts of `HKUDS/CLI-Anything` that are worth reusing conceptually in StreamVoice so we do not reinvent the useful pieces later.

Reviewed reference:
- `obs-studio/agent-harness/OBS.md`
- `obs-studio/agent-harness/setup.py`

## What They Built
The OBS harness in `CLI-Anything` is a Python CLI tool for defining OBS scene collections and related streaming configuration as structured JSON.

It is not a packaged desktop creator app and it is not a direct replacement for StreamVoice.

## What Is Worth Borrowing

### 1. Declarative Project/Profile Model
Their strongest idea is representing a stream setup as data:
- scenes
- sources
- filters
- transitions
- audio sources
- streaming settings
- recording settings

StreamVoice should adopt the same general principle for:
- scene mappings
- macro definitions
- phrase aliases
- default workflow packs
- import/export profiles

Why it matters:
- makes the product portable
- makes testing easier
- avoids hardcoded assumptions like `Raid` or `Gameplay`

### 2. User-Visible Scene And Source Inventory
Their structure assumes scenes and sources are first-class entities, not hidden strings.

StreamVoice should expose that in the UI:
- show discovered OBS scenes
- show discovered sources where relevant
- let users map actions to those real targets

This supports setups like:
- `Camera 1`
- `Camera 2`
- `Camera 3`
- `Camera 4`
- `PowerPoint`
- `Browser`

### 3. Import/Export Friendly Format
Because their harness is JSON-first, it naturally lends itself to saving and reusing a setup.

StreamVoice should eventually have a profile format that can store:
- OBS target mappings
- aliases
- macros
- workflow presets
- user preferences

This should be designed from the start so it can:
- export cleanly
- import safely
- survive product growth

### 4. Testability Without OBS
Their note explicitly says tests can run without OBS installed.

That principle is valuable.

StreamVoice should separate:
- OBS adapter logic
- command mapping logic
- profile validation logic
- workflow execution planning

So that the following can be tested offline:
- command normalization
- phrase-to-action mapping
- scene/source/profile validation
- macro sequencing

### 5. Future CLI / Debug Surface
The REPL/CLI model is not the main product direction for StreamVoice, but it is useful as an internal support tool.

Possible future use:
- validate a profile file
- inspect discovered scenes
- test phrase mapping
- dump diagnostics
- run scripted actions

That should be treated as an engineering/support surface, not the primary UX.

## What Not To Copy
- do not turn StreamVoice into a CLI-first tool
- do not make the user manage raw JSON as the main setup flow
- do not let the product become configuration-heavy before the UI is strong

StreamVoice should remain:
- desktop-first
- creator-facing
- live-use oriented

## Recommended StreamVoice Follow-Up
The best concrete follow-up items are:

1. add a profile/mapping model for scenes, sources, macros, and aliases
2. add a UI picker for discovered OBS scenes and targets
3. add import/export for those mappings
4. keep command planning and profile validation testable without OBS

## Summary
The reusable value from `CLI-Anything` is not their interface.

It is their use of structured configuration to model OBS concepts cleanly.

That is the part StreamVoice should adopt.
