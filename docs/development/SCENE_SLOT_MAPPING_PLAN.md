# Scene Slot Mapping Plan

## Purpose

This plan turns scene control into a deterministic setup model instead of a fuzzy matching model. The goal is to protect operator trust, reduce scene misfires, and give StreamVoice a setup experience that works for streamers, presenters, churches, and live production teams.

## Problem

Auto-detect and alias matching are useful for first-run convenience, but they are not a trustworthy long-term control model for high-stakes production.

Current risk areas:
- numbered camera commands can drift if scene names are similar
- users may assume the app "knows" their setup when it only inferred it
- different audiences use very different scene names
- trust breaks immediately if voice sends the wrong shot live

## Target Model

StreamVoice should use named slots as the primary control layer.

Examples:
- `Starting Scene`
- `Ending Scene`
- `Break Scene`
- `Gameplay Scene`
- `Camera 1`
- `Camera 2`
- `Camera 3`
- `Camera 4`
- `Slides`
- `Browser`
- `PiP`
- `Focus Scene`

Voice commands should resolve to slots first, then to the explicitly confirmed OBS scene assigned to that slot.

## Core Principles

1. Auto-detect is for setup assistance, not final trust.
2. Confirmed mappings beat fuzzy matching.
3. Numbered camera slots require strict matching rules.
4. Users should always be able to see exactly what each slot maps to.
5. Voice control should target stable slot names, not fragile raw scene names.

## Implementation Phases

### Phase 1: Slot Model

Add a first-class slot mapping model in app settings.

Required slots:
- `starting`
- `ending`
- `break`
- `gameplay`
- `focus`
- `camera1`
- `camera2`
- `camera3`
- `camera4`
- `slides`
- `browser`
- `pip`

Requirements:
- each slot stores:
  - assigned OBS scene name
  - confidence/source (`manual`, `auto-detected`, `unmapped`)
  - optional user aliases
- slot mappings persist across restarts

### Phase 2: Guided Detection

On first setup or on demand:
- query the live OBS scene list
- propose best matches for known slots
- show the user the proposed matches
- require the user to confirm or adjust them

UI direction:
- `We found likely matches for your setup`
- each slot shows:
  - slot name
  - proposed OBS scene
  - confidence
  - dropdown override

### Phase 3: Setup Wizard

Add a lightweight wizard:
1. Connect to OBS
2. Select microphone
3. Review scene slot matches
4. Test key voice commands
5. Save profile

This should be optimized for trust, not cleverness.

### Phase 4: Slot-First Execution

Voice command resolution order:
1. explicit slot commands
2. mapped user aliases for slots
3. strict deterministic fallback rules
4. raw fuzzy scene matching only as a last resort

For numbered cameras:
- only allow matches to scenes that contain the matching number token
- never drift between `camera 1` and `camera 4`

### Phase 5: Alias Editor

Allow users to define aliases per slot.

Examples:
- `Camera 1`
  - `cam one`
  - `main camera`
  - `wide`
- `PiP`
  - `picture in picture`
  - `overlay`
- `Slides`
  - `powerpoint`
  - `presentation`

This should be user-driven, not over-inferred.

### Phase 6: Template Packs

Provide starter slot packs for common use cases:

#### Gaming
- Starting
- Gameplay
- Break
- Focus
- Camera 1

#### Podcast
- Camera 1
- Camera 2
- Camera 3
- Break
- PiP

#### Presentation
- Camera 1
- Slides
- Browser
- Break
- PiP

#### Live Event / Church
- Camera 1
- Camera 2
- Camera 3
- Camera 4
- Slides
- Break
- Focus

These should pre-populate the slot UI, not blindly create OBS scenes yet.

## Future Extension: Scene Provisioning

Later, StreamVoice can optionally provision scenes into OBS:
- create starter scene names
- optionally help attach sources/layouts

But that should come after slot mapping is trusted.

## UX Requirements

- users can always see:
  - slot name
  - mapped OBS scene
  - mapping source (`manual` or `auto-detected`)
- ambiguous auto-detect results should be surfaced, not hidden
- unmapped slots should be obvious
- the app should prompt for confirmation before using a weak or ambiguous match

## Trust Rules

- slot mappings confirmed by the user override all fuzzy inference
- numbered camera slots require strict number matching
- auto-detect confidence below threshold should not execute silently
- if a requested slot is unmapped, the app should say so plainly instead of guessing

## Suggested Ticket Breakdown

- `SV-SCENE-001` Slot mapping data model
- `SV-SCENE-002` Slot mapping settings UI
- `SV-SCENE-003` Auto-detect proposal engine
- `SV-SCENE-004` Scene setup wizard
- `SV-SCENE-005` Slot-first command resolution
- `SV-SCENE-006` Slot alias editor
- `SV-SCENE-007` Template packs
- `SV-SCENE-008` Optional future OBS scene provisioning

## Definition Of Done

This plan is successful when:
- users can confirm scene slots during setup
- voice commands execute against confirmed slots
- numbered camera commands are deterministic
- users can inspect and edit mappings easily
- trust no longer depends on ongoing fuzzy scene guessing
