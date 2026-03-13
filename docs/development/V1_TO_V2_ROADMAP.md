# StreamVoice V1 To V2 Roadmap

## Goal
This roadmap defines the most pragmatic path from the current StreamVoice codebase to a product that is reliable for streamers and strategically valuable as creator infrastructure.

The roadmap assumes one constraint:

**Reliability comes before expansion.**

## North Star
StreamVoice should evolve into:

- a dependable live-production assistant
- a hands-free control surface for streamers
- an automation layer for OBS and adjacent creator workflows

## Product Stages

### Stage 1: Make It Reliable
This stage is about removing ambiguity and building trust.

#### Objectives
- make startup predictable
- make connection state understandable
- make command execution observable
- make failures diagnosable

#### Must-Have Work
- add explicit health states:
  - app
  - backend
  - transport
  - OBS
  - mic
  - speech engine
- unify command execution paths
- add structured command logging
- add startup checks
- support OBS password, host, and port configuration
- add first-run connection testing
- build copyable diagnostics panel

#### Definition Of Done
- a user can tell exactly what is failing
- buttons and voice use the same command engine
- the app no longer hides backend or transport problems behind one generic status label

### Stage 2: Make It Useful Enough To Matter
This stage is about creating strong day-to-day value.

#### Objectives
- reduce repetitive live workflow effort
- make the product feel like a real control tool, not just a voice toy

#### Must-Have Work
- ship editable macros
- ship reusable templates
- add structured profile/mapping support for scenes, sources, aliases, and workflows
- add common streamer workflows:
  - start stream
  - end stream
  - BRB mode
  - panic/privacy mode
  - replay buffer save
  - sponsor read mode
  - raid mode
- add aliases and custom phrase mapping
- add visible execution feedback

#### Definition Of Done
- the product saves real time during streams
- the product does more than simple scene switching
- streamers can configure it for their own workflow

### Stage 3: Make It Strategic
This stage is about extensibility and long-term differentiation.

#### Objectives
- grow from OBS controller to creator workflow platform
- prepare for a stronger monetization or acquisition story

#### Must-Have Work
- plugin or integration architecture
- Twitch / YouTube / Kick event hooks
- timer and trigger system
- import/export profiles
- starter packs for different creator types
- settings sync or sharable configs

#### Definition Of Done
- the product can orchestrate live production workflows, not just trigger OBS calls
- the value story expands beyond one integration point

## Recommended Version Path

### v1.0.5
Focus: trust and visibility

- diagnostics panel
- copy debug report
- explicit system health indicators
- OBS config screen
- connection test button
- microphone test button

### v1.1.0
Focus: execution consistency

- one command pipeline for voice and UI
- command log
- command ids and durations
- success/failure feedback for all actions
- timeout and retry policies

### v1.2.0
Focus: user-configurable value

- custom command aliases
- editable macros
- scene/source target mapping UI
- import/export settings
- saved profiles for different stream setups

### v1.3.0
Focus: onboarding and usability

- first-run wizard
- guided OBS setup
- guided permissions check
- clearer recovery messaging

### v1.4.0
Focus: live-production leverage

- killer macro pack
- replay/clip workflows
- panic mode
- creator templates

### v2.0.0
Focus: platform maturity

- hardened architecture
- extensible integration layer
- stable internal state model
- polished operator UX

## Immediate Engineering Priorities
These are the highest-leverage next implementation steps.

1. Build a proper diagnostics model
2. Add OBS settings and auth support
3. Unify all commands through one execution path
4. Add structured logs for commands and connection events
5. Test with real users under live conditions

## Immediate Product Priorities
These are the highest-leverage next product steps.

1. Define 5 flagship workflows
2. Reduce setup friction
3. Make failures legible
4. Improve visible trust cues
5. Validate with streamers, not just internal testing

## Five Flagship Workflows To Prioritize
These should become the product’s headline capabilities.

1. Start Stream Routine
   - scene switch
   - unmute mic
   - enable overlays
   - start recording/streaming

2. BRB / Interruption Mode
   - scene switch
   - mute mic
   - optional music / overlay state

3. Panic Privacy Mode
   - emergency scene
   - mute mic
   - hide webcam
   - kill sensitive sources

4. Clip / Highlight Workflow
   - save replay buffer
   - mark event
   - optionally notify user

5. End Stream Routine
   - thank-you scene
   - stop stream
   - stop recording
   - reset overlays and audio

## Success Metrics
If StreamVoice is going to become a serious product, these metrics matter more than raw download count.

- successful first-run connection rate
- median time to first successful command
- command success rate during real usage
- user trust / reported confidence
- retained usage after first week
- number of macros created per active user

## What To Avoid
- adding too many low-value commands before reliability is solved
- hiding state behind generic “Connected/Disconnected” labels
- creating separate logic paths for buttons, voice, and macros
- treating diagnostics as a developer-only concern
- over-investing in branding before operator trust exists

## Summary
The shortest path to a credible v2 is:

1. make it reliable
2. make it explain itself
3. make it automate high-value workflows
4. then expand into a broader creator platform

That sequence is the difference between shipping a neat app and building something with strategic value.
