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

## P1: Product Validation

### SV-017: Real User Test Plan
- Priority: `P1`
- Target version: `v1.1.0`
- Outcome:
  - structured testing with real streamers
- Acceptance criteria:
  - at least 3 real users run guided tests
  - issues categorized by setup, reliability, latency, and clarity

### SV-018: Operator Confidence Survey
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

### SV-019: Internal State Model Refactor
- Priority: `P2`
- Target version: `v2.0.0`
- Outcome:
  - reduce brittle internal coupling
- Acceptance criteria:
  - app state is modeled explicitly
  - transport and UI state are not inferred indirectly from each other

### SV-020: Integration Architecture
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
