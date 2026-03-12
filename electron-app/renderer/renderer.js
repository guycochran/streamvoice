const voiceBtn = document.getElementById('voice-btn');
const commandFeedback = document.getElementById('command-feedback');
const obsStatusDot = document.getElementById('obs-status');
const obsStatusText = document.getElementById('obs-status-text');
const webUI = document.getElementById('web-ui');
const webUIFeedback = document.getElementById('web-ui-feedback');

let recognition;
let isListening = false;
let webUIReady = false;
let pendingSpeechInit = false;
let webUIBaseUrl = null;

document.getElementById('minimize-btn').addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
});

document.getElementById('maximize-btn').addEventListener('click', () => {
    window.electronAPI.maximizeWindow();
});

document.getElementById('close-btn').addEventListener('click', () => {
    window.electronAPI.closeWindow();
});

voiceBtn.addEventListener('mousedown', startListening);
voiceBtn.addEventListener('mouseup', stopListening);
voiceBtn.addEventListener('mouseleave', stopListening);

voiceBtn.addEventListener('touchstart', (event) => {
    event.preventDefault();
    startListening();
});

voiceBtn.addEventListener('touchend', (event) => {
    event.preventDefault();
    stopListening();
});

document.querySelectorAll('.action-btn').forEach((button) => {
    button.addEventListener('click', async () => {
        await handleVoiceCommand(button.dataset.command);
    });
});

document.getElementById('start-with-windows').addEventListener('change', async (event) => {
    await window.electronAPI.saveSettings({
        startWithWindows: event.target.checked
    });
});

document.getElementById('view-commands').addEventListener('click', () => {
    if (!webUIReady) {
        setWebUIFeedback('Waiting for the local backend UI to load...', true);
        initializeWebUI(true);
    }

    showWebUI();
});

document.getElementById('check-updates').addEventListener('click', () => {
    window.electronAPI.checkForUpdates();
});

function setWebUIFeedback(message, isError = false) {
    if (!webUIFeedback) {
        return;
    }

    webUIFeedback.style.display = message ? 'block' : 'none';
    webUIFeedback.textContent = message || '';
    webUIFeedback.style.color = isError ? '#ff8a8a' : '';
}

function showWebUI() {
    webUI.style.display = 'block';
    webUI.style.position = 'fixed';
    webUI.style.top = '32px';
    webUI.style.left = '0';
    webUI.style.width = '100%';
    webUI.style.height = 'calc(100% - 32px)';
    webUI.style.zIndex = '1000';
}

async function initializeWebUI(forceRefresh = false) {
    try {
        if (!webUIBaseUrl || forceRefresh) {
            webUIBaseUrl = await window.electronAPI.getServerBaseUrl();
        }
    } catch (error) {
        webUIReady = false;
        setWebUIFeedback(`Local backend unavailable: ${error.message}`, true);
        return;
    }

    webUI.addEventListener('load', () => {
        webUIReady = true;
        setWebUIFeedback('');

        if (pendingSpeechInit || !recognition) {
            pendingSpeechInit = false;
            initSpeechRecognition();
        }
    });

    webUI.addEventListener('error', () => {
        webUIReady = false;
        setWebUIFeedback('Enhanced UI failed to load from the local backend.', true);
    });

    webUI.src = `${webUIBaseUrl}/index-enhanced.html`;
}

function initSpeechRecognition() {
    if (!webUIReady) {
        pendingSpeechInit = true;
        return;
    }

    const iframeWindow = webUI.contentWindow;
    const SpeechRecognitionCtor = iframeWindow?.SpeechRecognition || iframeWindow?.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
        commandFeedback.textContent = 'Speech recognition unavailable';
        return;
    }

    recognition = new SpeechRecognitionCtor();
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
        commandFeedback.textContent = `Error: ${event.error}`;
        stopListening();
    };

    recognition.onend = () => {
        stopListening();
    };
}

function startListening() {
    if (!recognition || isListening) {
        return;
    }

    isListening = true;
    voiceBtn.classList.add('listening');
    voiceBtn.querySelector('.voice-status').textContent = 'Listening...';
    commandFeedback.textContent = '';

    try {
        recognition.start();
    } catch (error) {
        console.error('Failed to start recognition:', error);
    }
}

function stopListening() {
    if (!isListening) {
        return;
    }

    isListening = false;
    voiceBtn.classList.remove('listening');
    voiceBtn.querySelector('.voice-status').textContent = 'Press & Hold to Talk';

    if (recognition) {
        recognition.stop();
    }
}

async function handleVoiceCommand(command) {
    commandFeedback.textContent = `Command: "${command}"`;

    try {
        if (webUIReady && webUI.contentWindow) {
            webUI.contentWindow.postMessage({
                type: 'voice-command',
                command
            }, '*');
        } else {
            const result = await window.electronAPI.sendVoiceCommand(command);
            if (!result.success) {
                throw new Error(result.error || 'Command failed');
            }
        }
    } catch (error) {
        commandFeedback.textContent = `Command failed: ${error.message}`;
    }

    commandFeedback.classList.add('fade-in');
    setTimeout(() => {
        commandFeedback.textContent = '';
    }, 3000);
}

async function checkOBSStatus() {
    try {
        const status = await window.electronAPI.checkOBSConnection();
        const connected = Boolean(status.connected);
        const errorMessage = status.error || status.lastObsError || status.lastStateRefreshError || '';

        obsStatusDot.classList.toggle('active', connected);
        obsStatusText.textContent = connected ? 'Connected' : 'Not Connected';

        if (!connected && errorMessage) {
            setWebUIFeedback(`OBS status: ${errorMessage}`, true);
        } else if (webUIReady) {
            setWebUIFeedback('');
        }
    } catch (error) {
        obsStatusDot.classList.remove('active');
        obsStatusText.textContent = 'Error';
        setWebUIFeedback(`OBS status check failed: ${error.message}`, true);
    }
}

async function init() {
    const version = await window.electronAPI.getVersion();
    document.querySelector('.version').textContent = `v${version}`;

    const settings = await window.electronAPI.getSettings();
    if (settings.startWithWindows !== undefined) {
        document.getElementById('start-with-windows').checked = settings.startWithWindows;
    }

    await initializeWebUI();
    initSpeechRecognition();
    checkOBSStatus();
    setInterval(checkOBSStatus, 5000);
}

window.addEventListener('message', (event) => {
    if (event.data.type === 'obs-status') {
        const connected = Boolean(event.data.connected);
        obsStatusDot.classList.toggle('active', connected);
        obsStatusText.textContent = connected ? 'Connected' : 'Not Connected';
    }
});

init();
