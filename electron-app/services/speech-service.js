const { EventEmitter } = require('events');

class SpeechService extends EventEmitter {
  constructor() {
    super();

    this.state = {
      provider: 'whisper.cpp',
      status: 'idle',
      mode: 'push_to_talk',
      available: false,
      recording: false,
      transcribing: false,
      model: 'base.en',
      modelStatus: 'not_installed',
      modelPath: null,
      binaryPath: null,
      transcript: '',
      partialTranscript: '',
      lastPreviewTranscript: '',
      lastPreviewAt: null,
      lastPreviewSequence: 0,
      lastTranscriptAt: null,
      lastCommand: null,
      lastCommandStatus: null,
      lastCommandMessage: null,
      lastError: null,
      lastAudioPath: null,
      lastAudioDurationMs: 0,
      lastAudioBytes: 0,
      lastAudioMimeType: null,
      capturePhase: 'idle',
      lastCaptureChunkCount: 0,
      lastWhisperDurationMs: null,
      lastWhisperStdout: '',
      lastWhisperStderr: '',
      lastWhisperAudioPath: null,
      lastWhisperModel: null,
      lastWhisperAttemptCount: 0,
      lastWhisperFallbackUsed: false,
      speechEvents: [],
      inputLevel: 0,
      selectedMicDeviceId: '',
      selectedMicLabel: ''
    };
  }

  getState() {
    return {
      ...this.state,
      speechEvents: [...this.state.speechEvents]
    };
  }

  setState(partial) {
    this.state = {
      ...this.state,
      ...partial
    };

    this.emit('state-changed', this.getState());
    return this.getState();
  }

  initialize() {
    return this.setState({
      status: 'ready',
      available: true,
      lastError: null
    });
  }

  setMode(mode = 'push_to_talk') {
    return this.setState({
      mode: mode === 'latched' ? 'latched' : 'push_to_talk'
    });
  }

  startPushToTalk() {
    return this.setState({
      recording: true,
      transcribing: false,
      status: 'recording',
      capturePhase: 'starting',
      transcript: '',
      partialTranscript: '',
      lastCommand: null,
      lastCommandStatus: null,
      lastCommandMessage: null,
      lastError: null
    });
  }

  stopPushToTalk() {
    return this.setState({
      recording: false,
      transcribing: true,
      status: 'transcribing'
    });
  }

  completeTranscript(transcript) {
    return this.setState({
      transcript,
      partialTranscript: transcript,
      transcribing: false,
      status: 'ready',
      lastTranscriptAt: new Date().toISOString(),
      lastError: null
    });
  }

  updateRuntimeConfig(config = {}) {
    return this.setState({
      modelStatus: config.modelStatus ?? this.state.modelStatus,
      modelPath: config.modelPath ?? this.state.modelPath,
      binaryPath: config.binaryPath ?? this.state.binaryPath
    });
  }

  recordCommand(command, result = {}) {
    return this.setState({
      lastCommand: command,
      lastCommandStatus: result.success ? 'success' : 'error',
      lastCommandMessage: result.message || result.error || null
    });
  }

  fail(error) {
    return this.setState({
      recording: false,
      transcribing: false,
      status: 'error',
      lastError: error instanceof Error ? error.message : String(error || 'Unknown speech error')
    });
  }

  completeCapture(details = {}) {
    return this.setState({
      recording: false,
      transcribing: true,
      status: 'transcribing',
      capturePhase: 'submitted',
      lastAudioPath: details.filePath || null,
      lastAudioDurationMs: details.durationMs || 0,
      lastAudioBytes: details.audioBytes || this.state.lastAudioBytes,
      lastAudioMimeType: details.mimeType || this.state.lastAudioMimeType,
      lastError: null
    });
  }

  updatePartialTranscript(transcript = '') {
    return this.setState({
      partialTranscript: transcript || this.state.partialTranscript
    });
  }

  recordPreview(details = {}) {
    return this.setState({
      partialTranscript: details.transcript || this.state.partialTranscript,
      lastPreviewTranscript: details.transcript || this.state.lastPreviewTranscript,
      lastPreviewAt: new Date().toISOString(),
      lastPreviewSequence: details.sequence ?? this.state.lastPreviewSequence,
      lastWhisperDurationMs: details.durationMs ?? this.state.lastWhisperDurationMs,
      lastWhisperStdout: details.stdout || this.state.lastWhisperStdout,
      lastWhisperStderr: details.stderr || this.state.lastWhisperStderr
    });
  }

  recordWhisperDiagnostics(details = {}) {
    return this.setState({
      lastWhisperDurationMs: details.durationMs ?? this.state.lastWhisperDurationMs,
      lastWhisperStdout: details.stdout || this.state.lastWhisperStdout,
      lastWhisperStderr: details.stderr || this.state.lastWhisperStderr,
      lastWhisperAudioPath: details.audioPath || this.state.lastWhisperAudioPath,
      lastWhisperModel: details.modelPreference || details.modelName || this.state.lastWhisperModel,
      lastWhisperAttemptCount: details.attemptCount ?? this.state.lastWhisperAttemptCount,
      lastWhisperFallbackUsed: details.fallbackUsed ?? this.state.lastWhisperFallbackUsed
    });
  }

  updateCaptureTelemetry(details = {}) {
    return this.setState({
      inputLevel: typeof details.inputLevel === 'number' ? details.inputLevel : this.state.inputLevel,
      selectedMicDeviceId: details.selectedMicDeviceId ?? this.state.selectedMicDeviceId,
      selectedMicLabel: details.selectedMicLabel ?? this.state.selectedMicLabel,
      capturePhase: details.capturePhase ?? this.state.capturePhase,
      lastCaptureChunkCount: details.lastCaptureChunkCount ?? this.state.lastCaptureChunkCount,
      lastAudioBytes: details.lastAudioBytes ?? this.state.lastAudioBytes,
      lastAudioMimeType: details.lastAudioMimeType ?? this.state.lastAudioMimeType,
      lastError: details.lastError ?? this.state.lastError
    });
  }

  logEvent(type, details = {}) {
    const event = {
      timestamp: new Date().toISOString(),
      type,
      ...details
    };

    const speechEvents = [...this.state.speechEvents, event].slice(-30);
    return this.setState({ speechEvents });
  }
}

module.exports = {
  SpeechService
};
