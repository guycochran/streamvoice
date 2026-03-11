// StreamVoice v0.2 - Voice Control for OBS with WebSocket Support
class StreamVoice {
    constructor() {
        this.ws = null;
        this.recognition = null;
        this.isConnected = false;
        this.isListening = false;
        this.obsConnected = false;
        this.obsScenes = [];

        // DOM elements
        this.voiceButton = document.getElementById('voice-button');
        this.connectionStatus = document.getElementById('connection-status');
        this.transcript = document.getElementById('transcript');
        this.result = document.getElementById('result');
        this.historyList = document.getElementById('history-list');
        this.voiceFeedback = document.getElementById('voice-feedback');

        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupVoiceRecognition();
        this.setupEventListeners();
        this.loadCommandsList();
    }

    connectWebSocket() {
        console.log('Attempting to connect to WebSocket at ws://localhost:8090');
        this.ws = new WebSocket('ws://localhost:8090');

        this.ws.onopen = () => {
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.voiceButton.disabled = false;
            console.log('Connected to StreamVoice server');
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            this.obsConnected = false;
            this.updateConnectionStatus(false);
            this.voiceButton.disabled = true;
            console.log('Disconnected from server');

            // Attempt to reconnect after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus(false);
        };
    }

    setupVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Voice recognition is not supported in your browser. Please use Chrome.');
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.voiceButton.classList.add('listening');
            this.voiceFeedback.classList.remove('hidden');
            this.transcript.textContent = 'Listening...';
            this.result.textContent = '';
        };

        this.recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript;

            if (event.results[current].isFinal) {
                this.transcript.textContent = `You said: "${transcript}"`;
                this.sendVoiceCommand(transcript);
            } else {
                this.transcript.textContent = transcript;
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            this.stopListening();
            this.result.textContent = 'Error: ' + event.error;
            this.result.className = 'result error';
        };

        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    setupEventListeners() {
        // Voice button - press and hold
        this.voiceButton.addEventListener('mousedown', () => {
            if (this.isConnected && !this.isListening) {
                this.startListening();
            }
        });

        this.voiceButton.addEventListener('mouseup', () => {
            if (this.isListening) {
                this.recognition.stop();
            }
        });

        this.voiceButton.addEventListener('mouseleave', () => {
            if (this.isListening) {
                this.recognition.stop();
            }
        });

        // Touch support for mobile
        this.voiceButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.isConnected && !this.isListening) {
                this.startListening();
            }
        });

        this.voiceButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.isListening) {
                this.recognition.stop();
            }
        });

        // Quick command buttons
        document.querySelectorAll('.quick-cmd').forEach(button => {
            button.addEventListener('click', () => {
                const command = button.dataset.command;
                this.sendVoiceCommand(command);
                this.transcript.textContent = `Quick command: "${command}"`;
            });
        });

        // Commands modal
        document.getElementById('show-commands').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('commands-modal').classList.remove('hidden');
        });

        document.querySelector('.modal-close').addEventListener('click', () => {
            document.getElementById('commands-modal').classList.add('hidden');
        });
    }

    startListening() {
        this.recognition.start();
        this.playSound('start');
    }

    stopListening() {
        this.isListening = false;
        this.voiceButton.classList.remove('listening');
        this.voiceFeedback.classList.add('hidden');
    }

    sendVoiceCommand(text) {
        if (!this.isConnected) return;

        this.ws.send(JSON.stringify({
            type: 'voice_command',
            text: text
        }));
    }

    handleServerMessage(message) {
        switch (message.type) {
            case 'connected':
                console.log('Server ready with', message.commands, 'commands');
                this.obsConnected = message.obsConnected;
                this.obsScenes = message.obsScenes || [];
                this.updateOBSStatus();
                break;

            case 'obs_connected':
                this.obsConnected = true;
                this.obsScenes = message.scenes || [];
                this.updateOBSStatus();
                this.showNotification('✅ OBS Connected!', 'success');
                break;

            case 'obs_disconnected':
                this.obsConnected = false;
                this.updateOBSStatus();
                this.showNotification('❌ OBS Disconnected', 'error');
                break;

            case 'scene_changed':
                this.showNotification(`📺 Scene: ${message.sceneName}`, 'info');
                break;

            case 'command_recognized':
                this.result.textContent = `✓ Recognized: "${message.command}"`;
                this.result.className = 'result success';
                this.playSound('success');
                break;

            case 'command_executed':
                this.addToHistory(this.transcript.textContent, message.success);
                this.result.textContent = message.success
                    ? `✓ ${message.message}`
                    : `✗ ${message.message}`;
                this.result.className = message.success ? 'result success' : 'result error';
                break;

            case 'command_failed':
                this.addToHistory(this.transcript.textContent, false);
                this.result.textContent = '✗ Command failed: ' + message.error;
                this.result.className = 'result error';
                this.playSound('error');
                break;

            case 'command_not_recognized':
                this.result.textContent = '? Command not recognized';
                this.result.className = 'result error';
                if (message.suggestions.length > 0) {
                    this.result.textContent += '. Did you mean: ' + message.suggestions.join(', ') + '?';
                }
                this.playSound('error');
                break;
        }
    }

    updateConnectionStatus(connected) {
        const statusEl = this.connectionStatus;
        const detailsEl = document.getElementById('connection-details');

        if (connected) {
            statusEl.className = 'status connected';
            statusEl.querySelector('.status-text').textContent = 'Connected';
        } else {
            statusEl.className = 'status disconnected';
            statusEl.querySelector('.status-text').textContent = 'Disconnected';
        }

        // Update details
        if (detailsEl) {
            if (connected) {
                detailsEl.textContent = this.obsConnected
                    ? `✅ OBS Connected (${this.obsScenes.length} scenes)`
                    : '⚠️ OBS not detected - Install WebSocket plugin';
            } else {
                detailsEl.textContent = 'WebSocket: ws://localhost:8090';
            }
        }
    }

    updateOBSStatus() {
        const detailsEl = document.getElementById('connection-details');
        if (detailsEl && this.isConnected) {
            detailsEl.textContent = this.obsConnected
                ? `✅ OBS Connected (${this.obsScenes.length} scenes)`
                : '⚠️ OBS not detected - Install WebSocket plugin';
        }
    }

    showNotification(text, type) {
        // Create a temporary notification
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = text;
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db'};
            color: white;
            border-radius: 8px;
            animation: slideIn 0.3s ease;
            z-index: 1000;
        `;
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }

    addToHistory(command, success) {
        const time = new Date().toLocaleTimeString();
        const item = document.createElement('li');
        item.className = `history-item ${success ? 'success' : 'error'}`;
        item.innerHTML = `
            <span>${command}</span>
            <span class="history-time">${time}</span>
        `;

        this.historyList.insertBefore(item, this.historyList.firstChild);

        // Keep only last 10 items
        while (this.historyList.children.length > 10) {
            this.historyList.removeChild(this.historyList.lastChild);
        }
    }

    async loadCommandsList() {
        try {
            const response = await fetch('http://localhost:3030/commands');
            const data = await response.json();
            const commands = data.commands;

            // Group commands by category
            const categories = {
                'Scenes': commands.filter(cmd => cmd.includes('switch to')),
                'Recording/Streaming': commands.filter(cmd => cmd.includes('recording') || cmd.includes('streaming')),
                'Audio': commands.filter(cmd => cmd.includes('mute') || cmd.includes('audio')),
                'Quick Actions': commands.filter(cmd => !cmd.includes('switch to') && !cmd.includes('recording') && !cmd.includes('streaming') && !cmd.includes('mute'))
            };

            const commandsList = document.getElementById('commands-list');
            commandsList.innerHTML = '';

            // Add OBS status at top
            if (data.obsConnected && data.scenes) {
                const obsStatus = document.createElement('div');
                obsStatus.className = 'obs-status';
                obsStatus.innerHTML = `
                    <h4>✅ OBS Connected</h4>
                    <p>Available scenes: ${data.scenes.join(', ')}</p>
                `;
                obsStatus.style.cssText = `
                    background: #2ecc71;
                    color: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                `;
                commandsList.appendChild(obsStatus);
            }

            for (const [category, cmds] of Object.entries(categories)) {
                if (cmds.length === 0) continue;

                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'command-category';
                categoryDiv.innerHTML = `<h4>${category}</h4>`;

                cmds.forEach(cmd => {
                    const cmdDiv = document.createElement('div');
                    cmdDiv.className = 'command-item';
                    cmdDiv.textContent = cmd;
                    categoryDiv.appendChild(cmdDiv);
                });

                commandsList.appendChild(categoryDiv);
            }
        } catch (error) {
            console.error('Failed to load commands:', error);
        }
    }

    playSound(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            gainNode.gain.value = 0.1;

            switch (type) {
                case 'start':
                    oscillator.frequency.value = 800;
                    break;
                case 'success':
                    oscillator.frequency.value = 1200;
                    break;
                case 'error':
                    oscillator.frequency.value = 400;
                    break;
            }

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Audio playback failed:', e);
        }
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize StreamVoice when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.streamVoice = new StreamVoice();
});