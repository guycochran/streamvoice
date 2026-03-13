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
      lastTranscriptAt: null,
      lastCommand: null,
      lastCommandStatus: null,
      lastCommandMessage: null,
      lastError: null,
      lastAudioPath: null,
      lastAudioDurationMs: 0,
      inputLevel: 0,
      selectedMicDeviceId: '',
      selectedMicLabel: ''
    };
  }

  getState() {
    return { ...this.state };
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
      lastAudioPath: details.filePath || null,
      lastAudioDurationMs: details.durationMs || 0,
      lastError: null
    });
  }

  updatePartialTranscript(transcript = '') {
    return this.setState({
      partialTranscript: transcript || this.state.partialTranscript
    });
  }

  updateCaptureTelemetry(details = {}) {
    return this.setState({
      inputLevel: typeof details.inputLevel === 'number' ? details.inputLevel : this.state.inputLevel,
      selectedMicDeviceId: details.selectedMicDeviceId ?? this.state.selectedMicDeviceId,
      selectedMicLabel: details.selectedMicLabel ?? this.state.selectedMicLabel,
      lastError: details.lastError ?? this.state.lastError
    });
  }
}

module.exports = {
  SpeechService
};
