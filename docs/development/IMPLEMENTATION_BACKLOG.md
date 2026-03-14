# StreamVoice Implementation Backlog

## Purpose
This backlog translates the product analysis and roadmap into concrete execution work. It is written so another developer or LLM can pick up the project and move it forward without guessing at priorities.

## How To Use This Backlog
- `P0` means blocking for trust, release readiness, or core usability
- `P1` means high-value work that materially improves the product
- `P2` means important but not immediate
- version targets are recommendations, not rigid rules

## Current Priority Order
1. reliability and visibility
2. setup and configuration
3. unified execution
4. macros and flagship workflows
5. platform expansion

## P0: Reliability And Diagnostics

### SV-001: Explicit System Health Model
- Priority: `P0`
- Target version: `v1.0.5`
- Outcome:
  - separate health indicators for:
    - app
    - backend
    - transport
    - OBS
    - microphone
    - speech recognition
- Acceptance criteria:
  - UI never collapses multiple failures into one generic label
  - each subsystem can show healthy, degraded, or failed state
  - health model is accessible from the main UI and diagnostics panel

### SV-002: Diagnostics Panel
- Priority: `P0`
- Target version: `v1.0.5`
- Outcome:
  - in-app diagnostics screen with actionable data
- Acceptance criteria:
  - displays:
    - backend status
    - transport status
    - OBS connection status
    - configured OBS host/port
    - last OBS error
    - last transport error
    - recent command log
  - user can open diagnostics without developer tools

### SV-003: Copy Debug Report
- Priority: `P0`
- Target version: `v1.0.5`
- Outcome:
  - one-click copy/export of a support-friendly debug bundle
- Acceptance criteria:
  - includes app version, platform, uptime, current health states, recent errors, and recent commands
  - no secrets copied in plaintext without explicit user choice

### SV-004: Startup Health Checks
- Priority: `P0`
- Target version: `v1.0.5`
- Outcome:
  - startup sequence validates required subsystems and reports issues clearly
- Acceptance criteria:
  - startup checks:
    - backend launch
    - local API reachability
    - OBS connectivity
    - speech engine availability
    - microphone availability
  - failures are shown in plain language with next-step guidance

### SV-005: Structured Command Logging
- Priority: `P0`
- Target version: `v1.1.0`
- Outcome:
  - every command has observable lifecycle data
- Acceptance criteria:
  - each command log includes:
    - timestamp
    - source (`voice`, `button`, `macro`)
    - raw input
    - mapped action
    - result
    - duration
    - error if any

## P0: Setup And Configuration

### SV-006: OBS Settings Screen
- Priority: `P0`
- Target version: `v1.0.5`
- Outcome:
  - users can configure OBS connection details in-app
- Acceptance criteria:
  - configurable fields:
    - host
    - port
    - password
  - settings persist across app restarts
  - settings can be validated with a test action

### SV-007: OBS Connection Test
- Priority: `P0`
- Target version: `v1.0.5`
- Outcome:
  - users can explicitly test their OBS setup before streaming
- Acceptance criteria:
  - test shows success/failure
  - failure includes useful reason where possible
  - results surface in diagnostics

### SV-008: Microphone And Speech Test
- Priority: `P0`
- Target version: `v1.0.5`
- Outcome:
  - users can verify mic and speech support during onboarding
- Acceptance criteria:
  - mic test confirms device availability
  - speech test confirms recognition engine can start
  - errors are shown in plain language

### SV-009: First-Run Setup Wizard
- Priority: `P0`
- Target version: `v1.3.0`
- Outcome:
  - guided onboarding for first-time users
- Acceptance criteria:
  - user is guided through:
    - OBS setup
    - OBS connection
    - microphone check
    - speech check
    - first command test

## P0: Unified Execution And Trust

### SV-010: Unified Command Dispatcher
- Priority: `P0`
- Target version: `v1.1.0`
- Outcome:
  - buttons, voice input, and macros all use one execution pipeline
- Acceptance criteria:
  - no separate command code paths with inconsistent behavior
  - one result model for all command sources
  - one timeout/retry strategy

### SV-011: Command Result UX
- Priority: `P0`
- Target version: `v1.1.0`
- Outcome:
  - the user always sees what happened
- Acceptance criteria:
  - show:
    - recognized input
    - mapped command
    - execution result
    - explicit failure reason

### SV-012: Safe Timeout And Retry Policy
- Priority: `P0`
- Target version: `v1.1.0`
- Outcome:
  - command handling is predictable under failure
- Acceptance criteria:
  - safe commands can retry
  - risky commands do not silently retry
  - timeout values are defined centrally

## P1: Streamer Value Features

### SV-013: Editable Macros
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - users can create and edit multi-step workflows
- Acceptance criteria:
  - macro editor supports:
    - ordered steps
    - delay between steps
    - naming/saving
    - execution from button or voice alias

### SV-014: Alias And Phrase Mapping
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - users can train StreamVoice to their language
- Acceptance criteria:
  - users can assign alternative phrases to scenes, macros, and commands
  - mappings persist across restarts

### SV-015: Import/Export Profiles
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - settings and macros can be moved between machines
- Acceptance criteria:
  - import/export includes:
    - OBS config except secrets unless explicitly included
    - aliases
    - macros
    - user preferences

### SV-016: Flagship Workflow Pack
- Priority: `P1`
- Target version: `v1.4.0`
- Outcome:
  - ship a curated set of high-value automation presets
- Acceptance criteria:
  - includes at least:
    - start stream routine
    - BRB mode
    - panic/privacy mode
    - clip/highlight workflow
    - end stream routine

### SV-017: Push-To-Talk Hotkey
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - users can trigger voice capture from a keyboard shortcut during gameplay
- Acceptance criteria:
  - user can assign a global or app-level hotkey for push-to-talk
  - hotkey assignment is editable in settings
  - hotkey works without clicking the on-screen mic button
  - the UI still shows listening, transcribing, transcript, and result states when invoked by hotkey
  - conflicts or unsupported shortcuts are reported clearly

### SV-018: Scene And Target Mapping UI
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - users can map StreamVoice actions to their real OBS scenes and sources instead of relying on default names like `raid` or `gameplay`
- Acceptance criteria:
  - app can query and display the current OBS scene list when connected
  - user can choose scenes/targets from a visible picker or dropdown

### SV-019: Scene Slot Mapping Model
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - StreamVoice uses explicit named scene slots as the primary trust model
- Acceptance criteria:
  - app stores named slots like:
    - `starting`
    - `ending`
    - `break`
    - `gameplay`
    - `focus`
    - `camera1` through `camera4`
    - `slides`
    - `browser`
    - `pip`
  - each slot can map to one explicit OBS scene
  - slot mappings persist across restarts
  - slot mappings show whether they were manually confirmed or auto-detected

### SV-020: Scene Setup Wizard
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - first-run or on-demand guided setup for microphones, OBS, and confirmed scene slots
- Acceptance criteria:
  - user can review proposed scene matches from the live OBS scene list
  - user can confirm or override each proposed slot match
  - wizard saves the final slot mapping
  - setup includes at least one voice test against a confirmed slot

### SV-021: Scene Alias Editor
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - users can teach StreamVoice natural aliases for confirmed scene slots
- Acceptance criteria:
  - aliases are editable per slot
  - aliases persist across restarts
  - slot aliases are evaluated before generic fuzzy scene matching

### SV-022: Template Packs And Starter Layouts
- Priority: `P1`
- Target version: `v1.3.0`
- Outcome:
  - users can start from a curated slot template instead of a blank configuration
- Acceptance criteria:
  - includes starter packs for:
    - gaming
    - podcast
    - presentation
    - live event
  - template packs populate slot names and suggested matches
  - users can still edit all mappings before saving

### SV-023: Strict Confidence Rules For High-Risk Scene Commands
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - high-risk scene commands are deterministic and do not silently guess
- Acceptance criteria:
  - numbered camera commands require matching number tokens
  - ambiguous scene requests fail clearly instead of drifting to a weak match
  - explicit slot mappings override fuzzy scene inference
  - built-in actions like `Raid Mode`, `Start Stream`, and scene switches use the saved mapping
  - mappings support non-stream scenes such as cameras, browser, and presentation layouts
  - mappings persist across restarts
  - diagnostics show whether scene discovery succeeded

### SV-022: Scene Alias Mapping
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - users can assign friendly aliases to scenes so voice commands work with real-world names and abbreviations
- Acceptance criteria:
  - user can assign multiple aliases to a scene
  - aliases support examples like `pip`, `picture in picture`, `camera 1`, `browser`, and `powerpoint`
  - voice commands resolve aliases before falling back to raw scene-name matching
  - aliases persist across restarts

### SV-023: Source And Overlay Toggle Controls
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - users can show/hide common OBS sources and overlays by voice or button
- Acceptance criteria:
  - source picker can list visible OBS inputs/browser sources when connected
  - user can map commands like `show chat`, `hide chat`, `show webcam`, `hide overlay`
  - command execution confirms whether the target source changed visibility
  - mappings persist across restarts

### SV-024: Replay And Clip Workflow
- Priority: `P1`
- Target version: `v1.4.0`
- Outcome:
  - users can trigger replay-buffer saves and clip workflows during live use
- Acceptance criteria:
  - app can detect replay buffer availability
  - `save replay`, `clip that`, or mapped aliases execute reliably
  - failures are reported clearly if replay buffer is off

### SV-025: Streamer Preset Packs
- Priority: `P2`
- Target version: `v1.4.0`
- Outcome:
  - ship ready-made mappings for common creator setups
- Acceptance criteria:
  - include presets for:
    - single-camera gameplay
    - multi-camera / podcast
    - presentation / browser / PiP
  - presets can populate scenes, aliases, and macro suggestions

### SV-026: Natural Language Intent Parser
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - common phrasing resolves through intents and slots instead of ad hoc phrase checks
- Acceptance criteria:
  - parser distinguishes:
    - intent
    - target slot
    - optional value
  - supports natural variants like:
    - `go to`
    - `switch to`
    - `show`
    - `bring up`
  - numbered camera phrasing resolves deterministically

### SV-027: Structured Speech Interpretation Diagnostics
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - diagnostics show how speech was interpreted before execution
- Acceptance criteria:
  - show:
    - raw transcript
    - parsed intent
    - parsed slot
    - parsed value
    - execution result
  - ambiguity or parse failures are visible to users and testers

### SV-028: Studio Mode Preview / Program Support
- Priority: `P1`
- Target version: `v1.3.0`
- Outcome:
  - StreamVoice supports a switcher-style Preview/Program workflow for OBS Studio Mode
- Acceptance criteria:
  - app detects whether OBS Studio Mode is enabled
  - app can show current preview and program scene names
  - voice command `preview <scene>` sends the mapped scene to preview
  - voice command `cut` transitions preview to program
  - failures are clear if Studio Mode is unavailable or disabled

### SV-029: Studio Mode HUD And Transition Controls
- Priority: `P1`
- Target version: `v1.3.0`
- Outcome:
  - operators can see and control preview/program state clearly
- Acceptance criteria:
  - UI shows preview scene and program scene
  - diagnostics show whether Studio Mode is active
  - app supports at least:
    - `cut`
    - optional `fade` or `auto`
  - settings can store a preferred transition mode

## P1: Product Validation

### SV-019: Real User Test Plan
- Priority: `P1`
- Target version: `v1.1.0`
- Outcome:
  - structured testing with real streamers
- Acceptance criteria:
  - at least 3 real users run guided tests
  - issues categorized by setup, reliability, latency, and clarity

### SV-020: Operator Confidence Survey
- Priority: `P1`
- Target version: `v1.2.0`
- Outcome:
  - gather trust-oriented feedback
- Acceptance criteria:
  - collect qualitative feedback on:
    - confidence using live
    - clarity of status
    - clarity of failures
    - perceived usefulness

## P2: Platform And Expansion

### SV-021: Internal State Model Refactor
- Priority: `P2`
- Target version: `v2.0.0`
- Outcome:
  - reduce brittle internal coupling
- Acceptance criteria:
  - app state is modeled explicitly
  - transport and UI state are not inferred indirectly from each other

### SV-022: Integration Architecture
- Priority: `P2`
- Target version: `v2.0.0`
- Outcome:
  - prepare for non-OBS triggers and actions
- Acceptance criteria:
  - extension points exist for:
    - Twitch events
    - timers
    - webhook triggers
    - additional action providers

### SV-021: Creator Templates
- Priority: `P2`
- Target version: `v1.4.0`
- Outcome:
  - starter presets for different creator types
- Acceptance criteria:
  - ship templates for at least:
    - gaming streamer
    - podcast/live show
    - tutorial creator

## Suggested Next Sprint
If only one focused sprint can be run, it should cover:

1. `SV-001` Explicit System Health Model
2. `SV-002` Diagnostics Panel
3. `SV-006` OBS Settings Screen
4. `SV-007` OBS Connection Test
5. `SV-010` Unified Command Dispatcher

That sprint should aim to deliver the true `v1.0.5` baseline.

## Suggested “Do Not Do Yet” List
Until the `P0` items are done, avoid spending time on:
- extra low-value commands
- cosmetic branding tweaks
- social launch polish
- advanced integrations
- cross-platform expansion

## Summary
This backlog exists to keep StreamVoice focused on the work that makes it:
- reliable enough to trust
- useful enough to keep
- coherent enough to scale

If priorities get fuzzy, default back to the core rule:

**Anything that increases operator trust beats almost any new feature.**
