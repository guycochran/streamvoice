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
const OBS_WEBSOCKET_URL = 'ws://localhost:4455'; // OBS WebSocket v5 default
const OBS_PASSWORD = ''; // Set this if you have a password

// Connection state
let obsConnected = false;
let obsScenes = [];
let obsCurrentScene = '';

// Connect to OBS
async function connectToOBS() {
  try {
    await obs.connect(OBS_WEBSOCKET_URL, OBS_PASSWORD);
    obsConnected = true;
    console.log('✅ Connected to OBS WebSocket');

    // Get initial scene list
    const { scenes, currentProgramSceneName } = await obs.call('GetSceneList');
    obsScenes = scenes.map(s => s.sceneName);
    obsCurrentScene = currentProgramSceneName;
    console.log(`📺 Current scene: ${obsCurrentScene}`);
    console.log(`📋 Available scenes: ${obsScenes.join(', ')}`);

    // Send OBS status to all connected clients
    broadcastToClients({
      type: 'obs_connected',
      scenes: obsScenes,
      currentScene: obsCurrentScene
    });

  } catch (error) {
    console.error('❌ Failed to connect to OBS:', error.message);
    obsConnected = false;
    setTimeout(connectToOBS, 5000); // Retry in 5 seconds
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

// Command mapping with real OBS functions
const COMMAND_MAP = {
  // Scene switching - with fuzzy matching
  'switch to gameplay': async () => await switchToScene('gameplay'),
  'switch to starting': async () => await switchToScene('starting'),
  'switch to ending': async () => await switchToScene('ending'),
  'switch to just chatting': async () => await switchToScene('chatting'),
  'switch to break': async () => await switchToScene('brb'),
  'switch to be right back': async () => await switchToScene('brb'),

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

  // Audio control
  'mute my mic': async () => await setAudioMute('Mic/Aux', true),
  'unmute my mic': async () => await setAudioMute('Mic/Aux', false),
  'mute desktop': async () => await setAudioMute('Desktop Audio', true),
  'unmute desktop': async () => await setAudioMute('Desktop Audio', false),

  // Source visibility
  'show webcam': async () => await setSourceVisible('Webcam', true),
  'hide webcam': async () => await setSourceVisible('Webcam', false),
  'show my screen': async () => await setSourceVisible('Display Capture', true),
  'hide my screen': async () => await setSourceVisible('Display Capture', false),

  // Quick actions
  'emergency privacy': async () => await switchToScene('privacy'),
  'activate sponsor mode': async () => await switchToScene('sponsor'),
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
    message: 'StreamVoice ready!',
    commands: Object.keys(COMMAND_MAP).length,
    obsConnected,
    obsScenes,
    currentScene: obsCurrentScene
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
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '0.2.0',
    obsConnected,
    features: ['obs-websocket', 'real-control']
  });
});

app.get('/commands', (req, res) => {
  res.json({
    commands: Object.keys(COMMAND_MAP),
    obsConnected,
    scenes: obsScenes
  });
});

app.post('/execute', async (req, res) => {
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
});

// Start servers
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`StreamVoice API running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:8090`);
  console.log(`\n✨ StreamVoice Server v0.2.0 Ready!`);
  console.log(`📝 ${Object.keys(COMMAND_MAP).length} voice commands available`);
  console.log(`\n⚡ Connecting to OBS WebSocket...`);

  // Connect to OBS
  connectToOBS();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down StreamVoice...');
  obs.disconnect();
  wss.close();
  process.exit(0);
});