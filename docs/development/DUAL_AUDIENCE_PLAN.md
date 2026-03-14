# Dual Audience Plan

## Goal

Grow StreamVoice into a product that works for both:
- gamers and streamers
- presenters, podcasters, educators, churches, and other live-production users

The right way to do this is not to split the product in two.

The right way is:
- build the shared control layer first
- then add audience-specific workflows on top

## Shared Value Layer

These are the features both audiences need.

### 1. Scene Aliases

Users should be able to say what feels natural for their setup.

Examples:
- `gameplay`
- `break`
- `PiP`
- `camera 1`
- `camera 2`
- `slides`
- `browser`
- `screen share`
- `powerpoint`

Why it matters:
- gamers use custom scene names
- presenters use camera and slide names
- podcasters use camera layouts
- everyone benefits from lower-friction voice control

### 2. Source And Overlay Toggles

The product needs to control more than scenes.

Examples:
- `show chat`
- `hide chat`
- `show webcam`
- `hide webcam`
- `show overlay`
- `hide overlay`
- `show lower third`
- `hide logo`

Why it matters:
- gamers care about chat and overlays
- non-gamers care about titles, logos, lyrics, and lower thirds

### 3. Better Mapping UI

The current mapping needs to expand from scenes into a fuller production model.

The app should let users map:
- scenes
- sources
- overlays
- browser sources
- recurring macros

Why it matters:
- users should adapt the app to their setup
- they should not have to rename OBS to fit StreamVoice

### 4. Better Feedback And Trust

Every audience wants the same core trust signals:
- what was heard
- what command was extracted
- what action ran
- what failed

To support broader natural language without losing trust, the product also needs:
- intent parsing
- slot-based execution
- clearer interpretation diagnostics

Why it matters:
- gamers want speed and confidence
- non-gamers want professionalism and predictability

### 5. Preset Workflow Packs

The product should ship with starter configurations that reduce setup effort.

## Audience-Specific Value

### Gamer / Streamer Priorities

- replay/clip workflows
- hotkey polish
- faster short-command mode
- chat overlay control
- raid / BRB / panic routines

### Non-Gamer Priorities

- camera switching
- slide / browser / screen-share switching
- lower-third and logo toggles
- webinar / podcast / presentation macros
- guided setup

## Recommended Product Packs

### Gaming Pack

- gameplay
- break
- raid
- screenshot
- replay / clip
- webcam / chat overlay toggles

### Podcast Pack

- camera 1
- camera 2
- guest full
- side-by-side
- show lower third

### Presentation Pack

- slides
- browser
- camera
- screen share
- Q&A mode

### Live Event Pack

- speaker
- wide
- lyrics
- announcement
- intermission

## Recommended Delivery Order

### Phase 1: Shared Foundation

1. scene alias editor
2. source and overlay toggle support
3. improved mapping UI
4. stronger command/result feedback

### Phase 2: Presets

1. gaming preset
2. podcast preset
3. presentation preset
4. live-event preset

### Phase 3: Audience-Specific Depth

#### For gamers
- replay/clip workflow
- hotkey refinement
- optional wake word later

#### For non-gamers
- presentation macros
- multi-camera presets
- more guided setup

## Version Recommendation

### v1.1.x

Focus:
- beta hardening
- command alias improvements
- hotkey polish
- diagnostics cleanup

### v1.2.0

Focus:
- scene alias editor
- source/overlay toggles
- expanded mapping UI

### v1.3.0

Focus:
- preset packs
- onboarding improvements
- user-flow simplification

### v1.4.0

Focus:
- replay/clip workflows
- presentation/live-event macros
- stronger audience-specific polish

## Positioning

Do not position StreamVoice only as:
- voice control for streamers

Position it as:
- voice control for live production

That includes:
- streamers
- podcasters
- presenters
- educators
- churches
- live event operators

## Definition Of Success

The plan is working if:
- gamers can use it fast during live play
- non-gamers can configure it without deep OBS knowledge
- scene/source naming no longer blocks usability
- the app feels like a general live-production control surface, not a niche gimmick
