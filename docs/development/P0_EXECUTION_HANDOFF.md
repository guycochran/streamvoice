# StreamVoice P0 Execution Handoff

## Purpose
This handoff is for the next engineer or LLM to execute the top `P0` work without re-deriving priorities from the broader strategy docs.

This document focuses on the most important near-term goal:

**Make StreamVoice reliable enough to trust.**

## Source Documents
This handoff is derived from:
- `docs/development/PRODUCT_GAP_ANALYSIS.md`
- `docs/development/V1_TO_V2_ROADMAP.md`
- `docs/development/IMPLEMENTATION_BACKLOG.md`

## Top 5 P0 Items To Execute First

1. `SV-001` Explicit System Health Model
2. `SV-002` Diagnostics Panel
3. `SV-006` OBS Settings Screen
4. `SV-007` OBS Connection Test
5. `SV-010` Unified Command Dispatcher

These five items form the real `v1.0.5` baseline.

## Why These 5 First
They are the minimum set that turns StreamVoice from a fragile prototype into a debuggable, supportable product.

Without them:
- users cannot understand what is failing
- support becomes guesswork
- button and voice behavior diverge
- OBS configuration is too brittle
- trust remains too low for serious live use

## Current Reality
The current codebase already has partial progress in this direction:
- some diagnostics have been added to the enhanced UI
- HTTP fallback exists for some actions
- Electron/main/server route mismatches have been corrected

However, the system is still not unified enough and still relies on implicit state in too many places.

## Recommended Execution Order

### Step 1: Build A Real Health State Model
Implement `SV-001` first.

#### Objective
Represent each subsystem explicitly instead of inferring state through partial UI behavior.

#### Subsystems To Track
- app runtime
- backend service
- HTTP API
- WebSocket transport
- OBS connection
- microphone availability
- speech recognition availability

#### Files Likely To Touch
- `electron-app/main.js`
- `electron-app/preload.js`
- `electron-app/server/index-enhanced.js`
- `electron-app/web/app-enhanced.js`
- `electron-app/web/index-enhanced.html`
- `electron-app/renderer/renderer.js`
- `electron-app/renderer/index.html`

#### Implementation Notes
- define a single status payload shape
- return that shape from backend health/debug endpoints
- render that shape directly in the UI
- stop using one generic label to represent multiple failure types

#### Done Means
- the UI clearly distinguishes:
  - backend down
  - transport degraded
  - OBS disconnected
  - mic unavailable
  - speech engine unavailable

### Step 2: Make Diagnostics A First-Class Feature
Implement `SV-002` next.

#### Objective
Turn diagnostics into a support surface, not a temporary debug patch.

#### Minimum Diagnostics Content
- app version
- backend status
- HTTP API status
- WebSocket status
- OBS status
- configured OBS host/port
- last OBS error
- last transport error
- recent command activity
- uptime

#### Files Likely To Touch
- `electron-app/server/index-enhanced.js`
- `electron-app/web/app-enhanced.js`
- `electron-app/web/index-enhanced.html`
- optionally:
  - `electron-app/main.js`
  - `electron-app/renderer/index.html`
  - `electron-app/renderer/renderer.js`

#### Implementation Notes
- keep diagnostics readable for a non-technical user
- prefer short labels with a verbose details section
- avoid requiring devtools for basic troubleshooting

#### Done Means
- a user can open the app and determine which layer is failing without outside help

### Step 3: Add Proper OBS Configuration
Implement `SV-006`.

#### Objective
Make OBS connectivity configurable instead of hardcoded.

#### Required Fields
- host
- port
- password

#### Files Likely To Touch
- `electron-app/main.js`
- `electron-app/preload.js`
- `electron-app/server/index-enhanced.js`
- `electron-app/web/index-enhanced.html`
- `electron-app/web/app-enhanced.js`

#### Implementation Notes
- persist settings locally
- wire settings through a single source of truth
- do not leave OBS auth handling buried in hardcoded constants

#### Done Means
- a user can change OBS connection settings in-app and the backend uses those values on reconnect

### Step 4: Add Explicit OBS Connection Test
Implement `SV-007`.

#### Objective
Let the user validate OBS setup before trying to stream.

#### Required Behaviors
- test button in UI
- success/failure result
- plain-English error where possible
- result reflected in diagnostics

#### Files Likely To Touch
- `electron-app/server/index-enhanced.js`
- `electron-app/web/index-enhanced.html`
- `electron-app/web/app-enhanced.js`
- optionally:
  - `electron-app/main.js`

#### Implementation Notes
- avoid implicit testing only during startup
- users should be able to re-run the test after changing settings

#### Done Means
- the user can press one button and know whether OBS is reachable with the configured settings

### Step 5: Unify Command Execution
Implement `SV-010`.

#### Objective
Make buttons, voice, and macros use one execution path.

#### Current Risk
The codebase has had repeated bugs where:
- UI buttons used one path
- voice used another
- WebSocket and HTTP fallback behaved differently

This is a structural issue, not a one-off bug.

#### Files Likely To Touch
- `electron-app/web/app-enhanced.js`
- `electron-app/web/index-enhanced.html`
- `electron-app/renderer/renderer.js`
- `electron-app/main.js`
- `electron-app/server/index-enhanced.js`

#### Implementation Notes
- create one command dispatcher function
- all UI controls should call it
- all voice commands should call it
- all future macros should call it
- normalize result payloads from backend responses

#### Done Means
- every command source produces the same result model and user feedback

## Suggested File Map
If the next engineer needs a starting point by file, use this order:

1. `electron-app/server/index-enhanced.js`
   - backend status payloads
   - OBS config support
   - test endpoint
   - command normalization

2. `electron-app/web/app-enhanced.js`
   - UI state model
   - diagnostics rendering
   - unified command execution
   - health handling

3. `electron-app/web/index-enhanced.html`
   - diagnostics layout
   - OBS settings controls
   - connection test UI

4. `electron-app/main.js`
   - persistent settings plumbing
   - backend launch/config handoff
   - optional app-level status surfaces

5. `electron-app/preload.js`
   - expose any additional safe APIs needed by renderer

6. `electron-app/renderer/renderer.js`
   - bring the shell UI in line with the same health model

## Acceptance Criteria For This P0 Sprint
The sprint should be considered complete only when:

1. the app clearly differentiates backend, transport, OBS, mic, and speech issues
2. OBS host/port/password are configurable in-app
3. there is a visible “Test OBS Connection” action
4. buttons and voice commands go through one execution path
5. a user can copy or view enough diagnostics to get help without opening devtools

## What Not To Do During This Sprint
Do not spend this sprint on:
- new low-value commands
- marketing assets
- cross-platform polish
- visual redesign unrelated to trust/clarity
- advanced integrations

## Recommended Validation After Implementation
Test at least these scenarios:

1. backend starts, OBS disconnected
2. backend starts, OBS password incorrect
3. backend starts, OBS reachable and authenticated
4. WebSocket transport unavailable but HTTP API available
5. mic missing or permission denied
6. speech recognition unavailable
7. button command execution
8. voice command execution

## Final Instruction To The Next Engineer
Treat every ambiguous status as a product bug.

The objective is not just to make StreamVoice work. The objective is to make it obvious why it works, why it fails, and what the user should do next.
