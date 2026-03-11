const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// WebSocket server for real-time communication
const wss = new WebSocket.Server({ port: 8090 });

// Command mapping - voice phrase to CLI command
const COMMAND_MAP = {
  // Scene Management
  'switch to gameplay': 'scene set-active "Gameplay"',
  'switch to starting': 'scene set-active "Starting Soon"',
  'switch to ending': 'scene set-active "Ending Screen"',
  'switch to just chatting': 'scene set-active "Just Chatting"',
  'switch to break': 'scene set-active "Be Right Back"',

  // Recording/Streaming
  'start recording': 'output recording start',
  'stop recording': 'output recording stop',
  'start streaming': 'output streaming start',
  'stop streaming': 'output streaming stop',

  // Audio Control
  'mute my mic': 'audio mute "Mic/Aux"',
  'unmute my mic': 'audio unmute "Mic/Aux"',
  'mute desktop': 'audio mute "Desktop Audio"',
  'unmute desktop': 'audio unmute "Desktop Audio"',

  // Quick Actions
  'emergency privacy': 'scene set-active "Privacy Screen"',
  'show my screen': 'source show "Display Capture"',
  'hide my screen': 'source hide "Display Capture"',
  'show webcam': 'source show "Webcam"',
  'hide webcam': 'source hide "Webcam"',

  // Sponsor/Alert Commands
  'activate sponsor mode': 'scene set-active "Sponsor"',
  'show donation alert': 'source show "Alerts"',
  'clear alerts': 'source hide "Alerts"'
};

// Fuzzy matching for voice commands
function findBestMatch(input) {
  input = input.toLowerCase().trim();

  // Direct match
  if (COMMAND_MAP[input]) {
    return { command: COMMAND_MAP[input], confidence: 1.0 };
  }

  // Fuzzy match
  let bestMatch = null;
  let bestScore = 0;

  for (const [phrase, command] of Object.entries(COMMAND_MAP)) {
    const score = calculateSimilarity(input, phrase);
    if (score > bestScore && score > 0.7) {
      bestScore = score;
      bestMatch = command;
    }
  }

  return bestMatch ? { command: bestMatch, confidence: bestScore } : null;
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

// Execute OBS CLI command
function executeOBSCommand(command) {
  return new Promise((resolve, reject) => {
    const fullCommand = `cli-anything-obs-studio ${command}`;
    console.log(`Executing: ${fullCommand}`);

    exec(fullCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        reject({ success: false, error: error.message });
      } else {
        console.log(`Success: ${stdout}`);
        resolve({ success: true, output: stdout });
      }
    });
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('StreamVoice client connected');

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'StreamVoice ready!',
    commands: Object.keys(COMMAND_MAP).length
  }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received:', message);

      if (message.type === 'voice_command') {
        const match = findBestMatch(message.text);

        if (match && match.confidence > 0.7) {
          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'command_recognized',
            text: message.text,
            confidence: match.confidence
          }));

          // Execute command
          try {
            const result = await executeOBSCommand(match.command);
            ws.send(JSON.stringify({
              type: 'command_executed',
              success: true,
              command: match.command
            }));
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'command_failed',
              success: false,
              error: error.error
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
    console.log('Client disconnected');
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
  res.json({ status: 'ok', version: '0.1.0' });
});

app.get('/commands', (req, res) => {
  res.json({ commands: Object.keys(COMMAND_MAP) });
});

app.post('/execute', async (req, res) => {
  const { command } = req.body;
  const match = findBestMatch(command);

  if (match && match.confidence > 0.7) {
    try {
      const result = await executeOBSCommand(match.command);
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, ...error });
    }
  } else {
    res.status(400).json({
      success: false,
      error: 'Command not recognized',
      suggestions: findSuggestions(command)
    });
  }
});

// Start HTTP server
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
  console.log(`StreamVoice API running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:8090`);
  console.log(`\n✨ StreamVoice Server Ready!`);
  console.log(`📝 ${Object.keys(COMMAND_MAP).length} voice commands available`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down StreamVoice...');
  wss.close();
  process.exit(0);
});