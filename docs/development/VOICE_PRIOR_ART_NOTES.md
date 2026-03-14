# Voice Prior Art Notes

## Purpose

Capture the most relevant reusable ideas from local prior-art repos without pulling StreamVoice back into unstable browser-capture or cloud-required architecture.

Primary reference reviewed:
- `/home/guycochran/Vmix-osc-dashboard-main`

Secondary references reviewed:
- `/home/guycochran/vmix-ai-director`
- `/home/guycochran/ai-director-client`
- `/home/guycochran/ai-director-mcp`
- `/home/guycochran/ai-director-clean`

## Most Useful Findings From `Vmix-osc-dashboard-main`

### 1. Transcript -> Intent -> Action Is A Strong Pattern

That project uses a clean staged flow:
- capture speech
- transcribe audio
- interpret transcript against available inputs
- return structured action JSON
- execute the action

This is a strong design pattern for StreamVoice even though our active speech path is local and native.

What to borrow:
- keep transcript separate from command interpretation
- interpret against live OBS scene inventory
- return structured intent/action data instead of relying only on direct phrase matching

### 2. Live Input Grounding Improves Natural Language

The vMix dashboard sends the available input list into the interpretation step.

This matters because commands like these become easier to handle:
- `go to powerpoint`
- `preview camera 2`
- `cut to browser`

What to borrow:
- ground interpretation against real OBS scenes and mapped slots
- prefer scene-slot resolution over raw fuzzy name matching

### 3. Correction Maps Are Useful

The browser voice file has a practical correction layer for common speech-to-text mistakes:
- word substitutions
- homophones
- merged-word fixes

What to borrow:
- correction map ideas for:
  - `too` -> `two`
  - `won` -> `one`
  - common command phrase cleanup
- keep this as a normalization layer before intent parsing

### 4. Command Grammar Should Be Structured

The vMix dashboard prompt effectively encodes:
- action verbs
- targets
- compound actions

This reinforces the current StreamVoice direction:
- intent parsing
- slot normalization
- deterministic execution

What to borrow:
- scene-switch intents:
  - `go to`
  - `switch to`
  - `preview`
  - `show`
  - `bring up`
- support for compound future actions:
  - `preview camera 1`
  - `cut`
  - `fade`

## What Not To Borrow

### 1. Browser Media Capture As The Primary Path

That repo uses browser capture and server upload.

StreamVoice already learned the hard way that browser/renderer capture is not stable enough as the production path in packaged Electron on Windows.

Do not reintroduce:
- renderer `MediaRecorder` as the main capture path
- hidden browser windows for production speech capture

### 2. Cloud Transcription As The Primary Requirement

The vMix dashboard uses OpenAI transcription and OpenAI interpretation.

That is useful as a reference, but not as the primary StreamVoice architecture because:
- it increases operating cost
- it adds latency
- it creates online dependency
- it changes the privacy/offline story

### 3. LLM Interpretation Without Strong Safety Boundaries

The vMix dashboard can afford more ambiguity because it is an operator dashboard with broader interpretation.

StreamVoice should stay more conservative for high-risk commands like:
- `mute` vs `unmute`
- numbered camera commands
- start/stop stream

## Concrete StreamVoice Takeaways

### Near-Term

1. Add a stronger intent layer after local Whisper transcription
- transcript
- normalization
- intent extraction
- slot resolution
- execution

2. Use live OBS scenes plus future scene slots as interpretation context
- this is the safest way to support more natural phrasing

3. Expand the correction map using the practical patterns from the vMix dashboard
- especially number homophones
- command-verb cleanup

### Medium-Term

1. Move from alias sprawl to:
- intent definitions
- verb lexicons
- target slots

2. Use Studio Mode grammar influenced by vMix workflows:
- `preview camera 1`
- `preview slides`
- `cut`
- `fade`

3. Consider optional cloud interpretation later only as an enhancement
- not as the core path
- local speech should remain the default

## Bottom Line

The best reusable lesson from the vMix dashboard is not its speech transport.

The best reusable lesson is:
- structured transcript interpretation grounded in real production targets

For StreamVoice, that means:
- keep native local capture
- keep local Whisper by default
- improve the command-understanding layer using slot-aware intent parsing
