const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const OBSWebSocket = require('obs-websocket-js').default;
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// WebSocket server for client communication
const wss = new WebSocket.Server({ port: 8090 });

// OBS WebSocket instance
const obs = new OBSWebSocket();

// Configuration
const OBS_WEBSOCKET_URL = 'ws://127.0.0.1:4455'; // Force IPv4 connection
const OBS_PASSWORD = ''; // Set this if you have a password

// Connection state
let obsConnected = false;
let obsScenes = [];
let obsCurrentScene = '';
let obsInputs = [];
let obsFilters = [];
let obsTransitions = [];
let obsCurrentTransition = '';
let obsSceneCollections = [];
let obsProfiles = [];

// Connect to OBS
async function connectToOBS() {
  try {
    await obs.connect(OBS_WEBSOCKET_URL, OBS_PASSWORD);
    obsConnected = true;
    console.log('✅ Connected to OBS WebSocket');

    // Get initial state
    await refreshOBSState();

    // Send OBS status to all connected clients
    broadcastToClients({
      type: 'obs_connected',
      scenes: obsScenes,
      currentScene: obsCurrentScene,
      inputs: obsInputs,
      transitions: obsTransitions,
      currentTransition: obsCurrentTransition
    });

  } catch (error) {
    console.error('❌ Failed to connect to OBS:', error.message);
    obsConnected = false;
    setTimeout(connectToOBS, 5000); // Retry in 5 seconds
  }
}

// Refresh OBS state
async function refreshOBSState() {
  try {
    // Get scenes
    const { scenes, currentProgramSceneName } = await obs.call('GetSceneList');
    obsScenes = scenes.map(s => s.sceneName);
    obsCurrentScene = currentProgramSceneName;

    // Get inputs (sources)
    const { inputs } = await obs.call('GetInputList');
    obsInputs = inputs;

    // Get transitions
    const { transitions, currentSceneTransitionName } = await obs.call('GetSceneTransitionList');
    obsTransitions = transitions.map(t => t.transitionName);
    obsCurrentTransition = currentSceneTransitionName;

    // Try to get scene collections (might not be available in all versions)
    try {
      const collections = await obs.call('GetSceneCollectionList');
      obsSceneCollections = collections.sceneCollections || [];
    } catch (e) {
      // Scene collections not supported
    }

    console.log(`📺 Current scene: ${obsCurrentScene}`);
    console.log(`📋 Available scenes: ${obsScenes.join(', ')}`);
    console.log(`🎚️ Inputs: ${obsInputs.length}`);
    console.log(`🎬 Transitions: ${obsTransitions.join(', ')}`);
  } catch (error) {
    console.error('Error refreshing OBS state:', error);
  }
}

// Broadcast message to all connected clients
function broadcastToClients(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// OBS event handlers
obs.on('ConnectionClosed', () => {
  console.log('❌ OBS connection closed');
  obsConnected = false;
  broadcastToClients({ type: 'obs_disconnected' });
  setTimeout(connectToOBS, 5000); // Attempt reconnection
});

obs.on('CurrentProgramSceneChanged', (data) => {
  obsCurrentScene = data.sceneName;
  console.log(`📺 Scene changed to: ${obsCurrentScene}`);
  broadcastToClients({
    type: 'scene_changed',
    sceneName: obsCurrentScene
  });
});

// Enhanced command mapping with Stream Deck-like features
const COMMAND_MAP = {
  // Scene switching - with fuzzy matching
  'switch to gameplay': async () => await switchToScene('gameplay'),
  'switch to starting': async () => await switchToScene('starting'),
  'switch to ending': async () => await switchToScene('ending'),
  'switch to just chatting': async () => await switchToScene('chatting'),
  'switch to break': async () => await switchToScene('brb'),
  'switch to be right back': async () => await switchToScene('brb'),
  'switch to fullscreen': async () => await switchToScene('fullscreen'),
  'switch to camera': async () => await switchToScene('camera'),
  'switch to desktop': async () => await switchToScene('desktop'),

  // Recording control
  'start recording': async () => {
    const { outputActive } = await obs.call('GetRecordStatus');
    if (!outputActive) {
      await obs.call('StartRecord');
      return { success: true, message: 'Recording started' };
    }
    return { success: false, message: 'Already recording' };
  },
  'stop recording': async () => {
    const { outputActive } = await obs.call('GetRecordStatus');
    if (outputActive) {
      await obs.call('StopRecord');
      return { success: true, message: 'Recording stopped' };
    }
    return { success: false, message: 'Not recording' };
  },
  'pause recording': async () => {
    const { outputPaused } = await obs.call('GetRecordStatus');
    if (!outputPaused) {
      await obs.call('PauseRecord');
      return { success: true, message: 'Recording paused' };
    }
    return { success: false, message: 'Already paused' };
  },
  'resume recording': async () => {
    const { outputPaused } = await obs.call('GetRecordStatus');
    if (outputPaused) {
      await obs.call('ResumeRecord');
      return { success: true, message: 'Recording resumed' };
    }
    return { success: false, message: 'Not paused' };
  },

  // Streaming control
  'start streaming': async () => {
    const { outputActive } = await obs.call('GetStreamStatus');
    if (!outputActive) {
      await obs.call('StartStream');
      return { success: true, message: 'Stream started' };
    }
    return { success: false, message: 'Already streaming' };
  },
  'stop streaming': async () => {
    const { outputActive } = await obs.call('GetStreamStatus');
    if (outputActive) {
      await obs.call('StopStream');
      return { success: true, message: 'Stream stopped' };
    }
    return { success: false, message: 'Not streaming' };
  },

  // Audio control - enhanced
  'mute my mic': async () => await setAudioMute('Mic/Aux', true),
  'unmute my mic': async () => await setAudioMute('Mic/Aux', false),
  'mute desktop': async () => await setAudioMute('Desktop Audio', true),
  'unmute desktop': async () => await setAudioMute('Desktop Audio', false),
  'mute all audio': async () => {
    await setAudioMute('Mic/Aux', true);
    await setAudioMute('Desktop Audio', true);
    return { success: true, message: 'All audio muted' };
  },
  'unmute all audio': async () => {
    await setAudioMute('Mic/Aux', false);
    await setAudioMute('Desktop Audio', false);
    return { success: true, message: 'All audio unmuted' };
  },

  // Volume control
  'increase mic volume': async () => await adjustAudioVolume('Mic/Aux', 0.1),
  'decrease mic volume': async () => await adjustAudioVolume('Mic/Aux', -0.1),
  'increase desktop volume': async () => await adjustAudioVolume('Desktop Audio', 0.1),
  'decrease desktop volume': async () => await adjustAudioVolume('Desktop Audio', -0.1),
  'mic volume fifty percent': async () => await setAudioVolume('Mic/Aux', 0.5),
  'desktop volume fifty percent': async () => await setAudioVolume('Desktop Audio', 0.5),

  // Source visibility
  'show webcam': async () => await setSourceVisible('Webcam', true),
  'hide webcam': async () => await setSourceVisible('Webcam', false),
  'show my screen': async () => await setSourceVisible('Display Capture', true),
  'hide my screen': async () => await setSourceVisible('Display Capture', false),
  'show overlay': async () => await setSourceVisible('Overlay', true),
  'hide overlay': async () => await setSourceVisible('Overlay', false),
  'show chat': async () => await setSourceVisible('Chat', true),
  'hide chat': async () => await setSourceVisible('Chat', false),
  'show alerts': async () => await setSourceVisible('Alerts', true),
  'hide alerts': async () => await setSourceVisible('Alerts', false),

  // Transition control
  'use cut transition': async () => await setTransition('Cut'),
  'use fade transition': async () => await setTransition('Fade'),
  'use slide transition': async () => await setTransition('Slide'),
  'use stinger transition': async () => await setTransition('Stinger'),
  'set transition duration short': async () => await setTransitionDuration(300),
  'set transition duration medium': async () => await setTransitionDuration(700),
  'set transition duration long': async () => await setTransitionDuration(1500),

  // Filter control
  'enable green screen': async () => await toggleFilter('Webcam', 'Chroma Key', true),
  'disable green screen': async () => await toggleFilter('Webcam', 'Chroma Key', false),
  'enable blur': async () => await toggleFilter('Webcam', 'Blur', true),
  'disable blur': async () => await toggleFilter('Webcam', 'Blur', false),
  'enable color correction': async () => await toggleFilter('Webcam', 'Color Correction', true),
  'disable color correction': async () => await toggleFilter('Webcam', 'Color Correction', false),

  // Studio mode
  'enable studio mode': async () => await setStudioMode(true),
  'disable studio mode': async () => await setStudioMode(false),
  'switch preview and program': async () => {
    await obs.call('TriggerStudioModeTransition');
    return { success: true, message: 'Switched preview and program' };
  },

  // Screenshot
  'take screenshot': async () => await takeScreenshot(),
  'save replay buffer': async () => await saveReplayBuffer(),

  // Quick actions
  'emergency privacy': async () => await switchToScene('privacy'),
  'emergency mute': async () => {
    await setAudioMute('Mic/Aux', true);
    await switchToScene('brb');
    return { success: true, message: 'Emergency mute activated' };
  },
  'stream starting setup': async () => await executeStreamDeckMacro('stream_start'),
  'stream ending setup': async () => await executeStreamDeckMacro('stream_end'),
  'raid mode': async () => await executeStreamDeckMacro('raid_mode'),
  'subscriber celebration': async () => await executeStreamDeckMacro('sub_celebration'),

  // Virtual camera
  'start virtual camera': async () => {
    const { outputActive } = await obs.call('GetVirtualCamStatus');
    if (!outputActive) {
      await obs.call('StartVirtualCam');
      return { success: true, message: 'Virtual camera started' };
    }
    return { success: false, message: 'Virtual camera already active' };
  },
  'stop virtual camera': async () => {
    const { outputActive } = await obs.call('GetVirtualCamStatus');
    if (outputActive) {
      await obs.call('StopVirtualCam');
      return { success: true, message: 'Virtual camera stopped' };
    }
    return { success: false, message: 'Virtual camera not active' };
  },

  // Profile and scene collection
  'switch to streaming profile': async () => await switchProfile('Streaming'),
  'switch to recording profile': async () => await switchProfile('Recording'),
  'switch to podcast setup': async () => await switchSceneCollection('Podcast'),
  'switch to gaming setup': async () => await switchSceneCollection('Gaming'),
};

// Helper function to switch scenes with fuzzy matching
async function switchToScene(targetScene) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  // Try exact match first
  let sceneName = obsScenes.find(s => s.toLowerCase() === targetScene.toLowerCase());

  // If no exact match, try fuzzy matching
  if (!sceneName) {
    sceneName = obsScenes.find(s =>
      s.toLowerCase().includes(targetScene.toLowerCase()) ||
      targetScene.toLowerCase().includes(s.toLowerCase())
    );
  }

  if (sceneName) {
    await obs.call('SetCurrentProgramScene', { sceneName });
    return { success: true, message: `Switched to ${sceneName}` };
  }

  return { success: false, message: `Scene "${targetScene}" not found. Available: ${obsScenes.join(', ')}` };
}

// Helper function to control audio mute
async function setAudioMute(sourceName, muted) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    // Get all inputs to find the audio source
    const { inputs } = await obs.call('GetInputList');
    const audioInput = inputs.find(input =>
      input.inputName.toLowerCase().includes(sourceName.toLowerCase())
    );

    if (audioInput) {
      await obs.call('SetInputMute', {
        inputName: audioInput.inputName,
        inputMuted: muted
      });
      return { success: true, message: `${audioInput.inputName} ${muted ? 'muted' : 'unmuted'}` };
    }

    return { success: false, message: `Audio source "${sourceName}" not found` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Helper function to adjust audio volume
async function adjustAudioVolume(sourceName, adjustment) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    const { inputs } = await obs.call('GetInputList');
    const audioInput = inputs.find(input =>
      input.inputName.toLowerCase().includes(sourceName.toLowerCase())
    );

    if (audioInput) {
      const { inputVolumeDb } = await obs.call('GetInputVolume', {
        inputName: audioInput.inputName
      });

      const newVolume = Math.max(-100, Math.min(0, inputVolumeDb + (adjustment * 20)));

      await obs.call('SetInputVolume', {
        inputName: audioInput.inputName,
        inputVolumeDb: newVolume
      });

      return { success: true, message: `${audioInput.inputName} volume adjusted` };
    }

    return { success: false, message: `Audio source "${sourceName}" not found` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Helper function to set specific audio volume
async function setAudioVolume(sourceName, volumePercent) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    const { inputs } = await obs.call('GetInputList');
    const audioInput = inputs.find(input =>
      input.inputName.toLowerCase().includes(sourceName.toLowerCase())
    );

    if (audioInput) {
      // Convert percentage to dB (0% = -100dB, 100% = 0dB)
      const volumeDb = (volumePercent - 1) * 100;

      await obs.call('SetInputVolume', {
        inputName: audioInput.inputName,
        inputVolumeDb: volumeDb
      });

      return { success: true, message: `${audioInput.inputName} volume set to ${volumePercent * 100}%` };
    }

    return { success: false, message: `Audio source "${sourceName}" not found` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Helper function to control source visibility
async function setSourceVisible(sourceName, visible) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    // Get current scene items
    const { sceneItems } = await obs.call('GetSceneItemList', {
      sceneName: obsCurrentScene
    });

    const item = sceneItems.find(item =>
      item.sourceName.toLowerCase().includes(sourceName.toLowerCase())
    );

    if (item) {
      await obs.call('SetSceneItemEnabled', {
        sceneName: obsCurrentScene,
        sceneItemId: item.sceneItemId,
        sceneItemEnabled: visible
      });
      return { success: true, message: `${item.sourceName} ${visible ? 'shown' : 'hidden'}` };
    }

    return { success: false, message: `Source "${sourceName}" not found in current scene` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Helper function to change transition
async function setTransition(transitionName) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    const transition = obsTransitions.find(t =>
      t.toLowerCase().includes(transitionName.toLowerCase())
    );

    if (transition) {
      await obs.call('SetCurrentSceneTransition', {
        transitionName: transition
      });
      return { success: true, message: `Transition set to ${transition}` };
    }

    return { success: false, message: `Transition "${transitionName}" not found` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Helper function to set transition duration
async function setTransitionDuration(duration) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    await obs.call('SetCurrentSceneTransitionDuration', {
      transitionDuration: duration
    });
    return { success: true, message: `Transition duration set to ${duration}ms` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Helper function to toggle filters
async function toggleFilter(sourceName, filterName, enabled) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    const input = obsInputs.find(i =>
      i.inputName.toLowerCase().includes(sourceName.toLowerCase())
    );

    if (input) {
      await obs.call('SetSourceFilterEnabled', {
        sourceName: input.inputName,
        filterName: filterName,
        filterEnabled: enabled
      });
      return { success: true, message: `${filterName} ${enabled ? 'enabled' : 'disabled'} on ${input.inputName}` };
    }

    return { success: false, message: `Source "${sourceName}" not found` };
  } catch (error) {
    // Filter might not exist, but that's okay
    return { success: false, message: `Filter "${filterName}" not found on source` };
  }
}

// Helper function for studio mode
async function setStudioMode(enabled) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    await obs.call('SetStudioModeEnabled', {
      studioModeEnabled: enabled
    });
    return { success: true, message: `Studio mode ${enabled ? 'enabled' : 'disabled'}` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Helper function to take screenshot
async function takeScreenshot() {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await obs.call('SaveSourceScreenshot', {
      sourceName: obsCurrentScene,
      imageFormat: 'png',
      imageFilePath: `screenshot_${timestamp}.png`
    });
    return { success: true, message: 'Screenshot saved' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Helper function for replay buffer
async function saveReplayBuffer() {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    await obs.call('SaveReplayBuffer');
    return { success: true, message: 'Replay buffer saved' };
  } catch (error) {
    return { success: false, message: 'Replay buffer not active' };
  }
}

// Helper function to switch profiles
async function switchProfile(profileName) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    await obs.call('SetCurrentProfile', {
      profileName: profileName
    });
    return { success: true, message: `Switched to ${profileName} profile` };
  } catch (error) {
    return { success: false, message: `Profile "${profileName}" not found` };
  }
}

// Helper function to switch scene collections
async function switchSceneCollection(collectionName) {
  if (!obsConnected) {
    return { success: false, message: 'OBS not connected' };
  }

  try {
    await obs.call('SetCurrentSceneCollection', {
      sceneCollectionName: collectionName
    });
    // Need to refresh state after switching collections
    setTimeout(refreshOBSState, 1000);
    return { success: true, message: `Switched to ${collectionName} scene collection` };
  } catch (error) {
    return { success: false, message: `Scene collection "${collectionName}" not found` };
  }
}

// Execute Stream Deck-like macros
async function executeStreamDeckMacro(macroName) {
  const macros = {
    stream_start: async () => {
      await switchToScene('starting');
      await setAudioMute('Mic/Aux', true);
      await setSourceVisible('Webcam', false);
      setTimeout(async () => {
        await switchToScene('gameplay');
        await setAudioMute('Mic/Aux', false);
        await setSourceVisible('Webcam', true);
      }, 5000);
      return { success: true, message: 'Stream starting sequence initiated' };
    },
    stream_end: async () => {
      await switchToScene('ending');
      await setAudioMute('Desktop Audio', true);
      setTimeout(async () => {
        await obs.call('StopStream');
        await obs.call('StopRecord');
      }, 10000);
      return { success: true, message: 'Stream ending sequence initiated' };
    },
    raid_mode: async () => {
      await switchToScene('raid');
      await setSourceVisible('Chat', true);
      await setAudioMute('Desktop Audio', true);
      return { success: true, message: 'Raid mode activated' };
    },
    sub_celebration: async () => {
      await setSourceVisible('Alerts', true);
      setTimeout(async () => {
        await setSourceVisible('Alerts', false);
      }, 10000);
      return { success: true, message: 'Subscriber celebration triggered' };
    }
  };

  if (macros[macroName]) {
    return await macros[macroName]();
  }

  return { success: false, message: 'Macro not found' };
}

// Fuzzy matching for voice commands
function findBestMatch(input) {
  input = input.toLowerCase().trim();

  // Direct match
  if (COMMAND_MAP[input]) {
    return { command: COMMAND_MAP[input], key: input, confidence: 1.0 };
  }

  // Fuzzy match
  let bestMatch = null;
  let bestScore = 0;
  let bestKey = '';

  for (const [phrase, command] of Object.entries(COMMAND_MAP)) {
    const score = calculateSimilarity(input, phrase);
    if (score > bestScore && score > 0.7) {
      bestScore = score;
      bestMatch = command;
      bestKey = phrase;
    }
  }

  return bestMatch ? { command: bestMatch, key: bestKey, confidence: bestScore } : null;
}

// Simple similarity calculation
function calculateSimilarity(str1, str2) {
  const words1 = str1.split(' ');
  const words2 = str2.split(' ');
  let matches = 0;

  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || (word1.length > 3 && word2.includes(word1))) {
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(words1.length, words2.length);
}

// WebSocket client connection handler
wss.on('connection', (ws) => {
  console.log('🔌 StreamVoice client connected');

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'StreamVoice Enhanced ready!',
    commands: Object.keys(COMMAND_MAP).length,
    obsConnected,
    obsScenes,
    currentScene: obsCurrentScene,
    features: ['advanced-obs-control', 'stream-deck-macros', 'audio-mixer', 'transitions']
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log('📨 Received:', message);

      if (message.type === 'voice_command') {
        const match = findBestMatch(message.text);

        if (match && match.confidence > 0.7) {
          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'command_recognized',
            text: message.text,
            command: match.key,
            confidence: match.confidence
          }));

          // Execute command
          try {
            const result = await match.command();
            ws.send(JSON.stringify({
              type: 'command_executed',
              success: result.success,
              message: result.message,
              command: match.key
            }));
          } catch (error) {
            console.error('Command error:', error);
            ws.send(JSON.stringify({
              type: 'command_failed',
              success: false,
              error: error.message
            }));
          }
        } else {
          ws.send(JSON.stringify({
            type: 'command_not_recognized',
            text: message.text,
            suggestions: findSuggestions(message.text)
          }));
        }
      } else if (message.type === 'get_status') {
        // Send current OBS status
        ws.send(JSON.stringify({
          type: 'status_update',
          obsConnected,
          scenes: obsScenes,
          currentScene: obsCurrentScene,
          inputs: obsInputs.map(i => i.inputName),
          transitions: obsTransitions,
          currentTransition: obsCurrentTransition,
          commands: Object.keys(COMMAND_MAP)
        }));
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  });

  ws.on('close', () => {
    console.log('👋 Client disconnected');
  });
});

// Find command suggestions
function findSuggestions(input) {
  const words = input.toLowerCase().split(' ');
  const suggestions = [];

  for (const phrase of Object.keys(COMMAND_MAP)) {
    for (const word of words) {
      if (phrase.includes(word) && word.length > 3) {
        suggestions.push(phrase);
        break;
      }
    }
  }

  return suggestions.slice(0, 3);
}

// REST API endpoints
app.get('/api/obs-status', (req, res) => {
  res.json({
    connected: obsConnected,
    currentScene: obsCurrentScene,
    scenes: obsScenes,
    inputs: obsInputs.map(input => input.inputName),
    transitions: obsTransitions,
    currentTransition: obsCurrentTransition
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '0.3.0',
    obsConnected,
    features: ['obs-websocket', 'real-control', 'stream-deck-macros', 'advanced-audio']
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    connected: obsConnected
  });
});

app.get('/commands', (req, res) => {
  const categories = {
    scenes: [],
    recording: [],
    streaming: [],
    audio: [],
    sources: [],
    transitions: [],
    filters: [],
    studio: [],
    macros: [],
    other: []
  };

  for (const command of Object.keys(COMMAND_MAP)) {
    if (command.includes('switch to') && !command.includes('profile')) {
      categories.scenes.push(command);
    } else if (command.includes('recording')) {
      categories.recording.push(command);
    } else if (command.includes('streaming')) {
      categories.streaming.push(command);
    } else if (command.includes('mute') || command.includes('volume')) {
      categories.audio.push(command);
    } else if (command.includes('show') || command.includes('hide')) {
      categories.sources.push(command);
    } else if (command.includes('transition')) {
      categories.transitions.push(command);
    } else if (command.includes('filter') || command.includes('green screen') || command.includes('blur')) {
      categories.filters.push(command);
    } else if (command.includes('studio')) {
      categories.studio.push(command);
    } else if (['stream starting setup', 'stream ending setup', 'raid mode', 'subscriber celebration'].includes(command)) {
      categories.macros.push(command);
    } else {
      categories.other.push(command);
    }
  }

  res.json({
    total: Object.keys(COMMAND_MAP).length,
    categories,
    obsConnected,
    scenes: obsScenes
  });
});

app.get('/api/commands', (req, res) => {
  res.redirect(307, '/commands');
});

async function handleExecuteRequest(req, res) {
  const { command } = req.body;
  const match = findBestMatch(command);

  if (match && match.confidence > 0.7) {
    try {
      const result = await match.command();
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(400).json({
      success: false,
      error: 'Command not recognized',
      suggestions: findSuggestions(command)
    });
  }
}

app.post('/execute', handleExecuteRequest);
app.post('/api/command', handleExecuteRequest);
app.post('/api/execute', handleExecuteRequest);

// Start servers
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`StreamVoice API running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:8090`);
  console.log(`\n✨ StreamVoice Enhanced Server v0.3.0 Ready!`);
  console.log(`📝 ${Object.keys(COMMAND_MAP).length} voice commands available`);
  console.log(`🎯 Features: Advanced OBS control, Stream Deck macros, Audio mixer, Transitions`);
  console.log(`\n⚡ Connecting to OBS WebSocket...`);

  // Connect to OBS
  connectToOBS();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down StreamVoice Enhanced...');
  obs.disconnect();
  wss.close();
  process.exit(0);
});
