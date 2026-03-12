// Get UI elements
const voiceBtn = document.getElementById('voice-btn');
const commandFeedback = document.getElementById('command-feedback');
const obsStatusDot = document.getElementById('obs-status');
const obsStatusText = document.getElementById('obs-status-text');
const webUI = document.getElementById('web-ui');

// Window controls
document.getElementById('minimize-btn').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
});

document.getElementById('maximize-btn').addEventListener('click', () => {
    window.electronAPI.maximizeWindow();
});

document.getElementById('close-btn').addEventListener('click', () => {
    window.electronAPI.closeWindow();
});

// Voice control setup
let recognition;
let isListening = false;

// Initialize speech recognition
function initSpeechRecognition() {
    // Access the Web Speech API from the embedded iframe
    webUI.onload = () => {
        const iframeWindow = webUI.contentWindow;

        if (iframeWindow.webkitSpeechRecognition) {
            recognition = new iframeWindow.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;

            recognition.onresult = (event) => {
                const result = event.results[event.results.length - 1];
                const transcript = result[0].transcript.toLowerCase();

                if (result.isFinal) {
                    handleVoiceCommand(transcript);
                } else {
                    commandFeedback.textContent = `Listening: "${transcript}"...`;
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                commandFeedback.textContent = 'Error: ' + event.error;
                stopListening();
            };

            recognition.onend = () => {
                stopListening();
            };
        }
    };
}

// Voice button handlers
voiceBtn.addEventListener('mousedown', startListening);
voiceBtn.addEventListener('mouseup', stopListening);
voiceBtn.addEventListener('mouseleave', stopListening);

// Touch support for future
voiceBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startListening();
});
voiceBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopListening();
});

function startListening() {
    if (!recognition || isListening) return;

    isListening = true;
    voiceBtn.classList.add('listening');
    voiceBtn.querySelector('.voice-status').textContent = 'Listening...';
    commandFeedback.textContent = '';

    try {
        recognition.start();
    } catch (e) {
        console.error('Failed to start recognition:', e);
    }
}

function stopListening() {
    if (!isListening) return;

    isListening = false;
    voiceBtn.classList.remove('listening');
    voiceBtn.querySelector('.voice-status').textContent = 'Press & Hold to Talk';

    if (recognition) {
        recognition.stop();
    }
}

async function handleVoiceCommand(command) {
    commandFeedback.textContent = `Command: "${command}"`;

    // Send to iframe for processing
    webUI.contentWindow.postMessage({
        type: 'voice-command',
        command: command
    }, '*');

    // Show feedback
    commandFeedback.classList.add('fade-in');
    setTimeout(() => {
        commandFeedback.textContent = '';
    }, 3000);
}

// Quick action buttons
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const command = btn.dataset.command;
        handleVoiceCommand(command);
    });
});

// Settings
document.getElementById('start-with-windows').addEventListener('change', async (e) => {
    await window.electronAPI.saveSettings({
        startWithWindows: e.target.checked
    });
});

document.getElementById('view-commands').addEventListener('click', () => {
    // Show commands modal or open web UI in full view
    webUI.style.display = 'block';
    webUI.style.position = 'fixed';
    webUI.style.top = '32px';
    webUI.style.left = '0';
    webUI.style.width = '100%';
    webUI.style.height = 'calc(100% - 32px)';
    webUI.style.zIndex = '1000';
});

document.getElementById('check-updates').addEventListener('click', () => {
    window.electronAPI.checkForUpdates();
});

// Check OBS connection periodically
async function checkOBSStatus() {
    try {
        const status = await window.electronAPI.checkOBSConnection();
        if (status.connected) {
            obsStatusDot.classList.add('active');
            obsStatusText.textContent = 'Connected';
        } else {
            obsStatusDot.classList.remove('active');
            obsStatusText.textContent = 'Not Connected';
        }
    } catch (error) {
        obsStatusDot.classList.remove('active');
        obsStatusText.textContent = 'Error';
    }
}

// Initialize
async function init() {
    // Show version
    const version = await window.electronAPI.getVersion();
    document.querySelector('.version').textContent = `v${version}`;

    // Load settings
    const settings = await window.electronAPI.getSettings();
    if (settings.startWithWindows !== undefined) {
        document.getElementById('start-with-windows').checked = settings.startWithWindows;
    }

    // Initialize speech recognition
    initSpeechRecognition();

    // Start OBS status check
    checkOBSStatus();
    setInterval(checkOBSStatus, 5000);
}

// Listen for messages from iframe
window.addEventListener('message', (event) => {
    if (event.data.type === 'obs-status') {
        if (event.data.connected) {
            obsStatusDot.classList.add('active');
            obsStatusText.textContent = 'Connected';
        } else {
            obsStatusDot.classList.remove('active');
            obsStatusText.textContent = 'Not Connected';
        }
    }
});

// Start the app
init();