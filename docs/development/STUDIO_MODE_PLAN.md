# Studio Mode Plan

## Purpose

Add a traditional switcher-style workflow to StreamVoice using OBS Studio Mode concepts:
- `Preview`
- `Program`
- `Cut`
- later: `Fade` / `Auto`

This makes StreamVoice more credible for professional operators, churches, presenters, and multi-camera production teams.

## Goal

Let users say commands like:
- `preview camera 1`
- `preview slides`
- `preview break`
- `cut`
- `fade`

And have StreamVoice drive OBS Studio Mode predictably.

## Why It Matters

Current scene switching is direct-to-program.

That is useful for simple operators, but many professional workflows expect:
- preview a scene first
- verify it
- take it live intentionally

That is how traditional switchers behave, and it is a much better mental model for:
- churches
- live events
- webinars
- presentations
- multi-camera productions

## Target Behavior

### Preview Commands

Examples:
- `preview camera 1`
- `preview camera 2`
- `preview break`
- `preview powerpoint`

Behavior:
- resolve the target through confirmed scene slot mapping
- send it to OBS preview, not program
- update UI to show current preview scene

### Program Commands

Examples:
- `take camera 1`
- `go live camera 2`
- `program break`

Behavior:
- optional later enhancement
- initially, keep direct scene switch commands for non-studio workflows

### Transition Commands

Examples:
- `cut`
- `fade`
- `auto`

Behavior:
- `cut` transitions current preview scene to program instantly
- `fade` performs the configured transition
- `auto` can map to OBS transition or a default fade

## UI Requirements

When Studio Mode is enabled:
- show `Preview Scene`
- show `Program Scene`
- show current transition name if available
- show whether OBS Studio Mode is active

The HUD should make Preview/Program state obvious.

## Settings Requirements

Add:
- `Enable Studio Mode workflow`
- default transition preference:
  - `Cut`
  - `Fade`
  - `OBS default`

## Parser Requirements

Add intents:
- `preview_scene`
- `take_preview`
- `transition_cut`
- `transition_fade`

Natural phrasing examples:
- `preview camera one`
- `preview slides`
- `put camera one in preview`
- `cut`
- `take`
- `fade`

## Execution Model

1. Resolve spoken target to confirmed scene slot
2. If command is `preview ...`:
   - send scene to OBS preview
3. If command is `cut`:
   - trigger studio mode transition
4. If command is `fade`:
   - trigger configured fade/auto transition

## Trust Rules

- Preview commands should never silently go direct to program when Studio Mode is enabled
- If OBS Studio Mode is off, the app should say so clearly
- If a scene slot is unmapped, the app should fail clearly
- `cut` should only run if a valid preview/program workflow is available

## Suggested Delivery Order

### Phase 1
- detect OBS Studio Mode state
- read preview/program scene names
- show them in UI

### Phase 2
- support `preview <scene>`
- support `cut`

### Phase 3
- support `fade` / `auto`
- support transition preference setting

### Phase 4
- integrate with scene slots and setup wizard

## Suggested Ticket Breakdown

- `SV-STUDIO-001` Detect Studio Mode state and preview/program scenes
- `SV-STUDIO-002` Preview scene voice commands
- `SV-STUDIO-003` Cut transition voice command
- `SV-STUDIO-004` Fade/auto transition support
- `SV-STUDIO-005` Studio Mode HUD and diagnostics
- `SV-STUDIO-006` Studio Mode settings and transition preference

## Definition Of Done

Studio Mode is successful when:
- users can preview mapped scenes by voice
- users can say `cut` and take preview live
- preview/program state is visible in the app
- the workflow feels like a real production switcher, not a scene-jump shortcut
