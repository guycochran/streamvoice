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
      transcript: '',
      lastError: null
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

  startPushToTalk() {
    return this.setState({
      recording: true,
      transcribing: false,
      status: 'recording',
      transcript: '',
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
      transcribing: false,
      status: 'ready',
      lastError: null
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
}

module.exports = {
  SpeechService
};
