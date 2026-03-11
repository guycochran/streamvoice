class StreamVoiceEnhanced {
    constructor() {
        this.ws = null;
        this.recognition = null;
        this.isListening = false;
        this.obsConnected = false;
        this.obsScenes = [];
        this.currentScene = '';
        this.commandCategories = {};

        // DOM elements
        this.connectionStatus = document.getElementById('connection-status');
        this.connectionDetails = document.getElementById('connection-details');
        this.voiceButton = document.getElementById('voice-button');
        this.voiceFeedback = document.getElementById('voice-feedback');
        this.transcript = document.getElementById('transcript');
        this.result = document.getElementById('result');
        this.historyList = document.getElementById('history-list');
        this.commandCategories = document.getElementById('command-categories');
        this.currentSceneElement = document.getElementById('current-scene');
        this.sceneCountElement = document.getElementById('scene-count');

        this.init();
    }

    init() {
        this.connectWebSocket();
        this.setupSpeechRecognition();
        this.setupEventListeners();
        this.loadCommandCategories();
    }

    connectWebSocket() {
        const wsUrl = 'ws://localhost:8090';
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('Connected to StreamVoice server');
            this.updateConnectionStatus('connected');

            // Request current status
            this.ws.send(JSON.stringify({ type: 'get_status' }));
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus('disconnected');
            // Attempt reconnection after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('error');
        };
    }

    handleServerMessage(message) {
        console.log('Server message:', message);

        switch (message.type) {
            case 'connected':
                this.voiceButton.disabled = false;
                this.showNotification('✅ StreamVoice Enhanced connected!', 'success');
                if (message.commands) {
                    this.showNotification(`📝 ${message.commands} commands available`, 'info');
                }
                this.obsConnected = message.obsConnected;
                if (message.obsScenes) {
                    this.obsScenes = message.obsScenes;
                    this.currentScene = message.currentScene;
                    this.updateOBSStatus();
                }
                break;

            case 'obs_connected':
                this.obsConnected = true;
                this.obsScenes = message.scenes || [];
                this.currentScene = message.currentScene || '';
                this.updateOBSStatus();
                this.showNotification('✅ OBS Connected!', 'success');
                break;

            case 'obs_disconnected':
                this.obsConnected = false;
                this.updateOBSStatus();
                this.showNotification('❌ OBS Disconnected', 'error');
                break;

            case 'scene_changed':
                this.currentScene = message.sceneName;
                this.updateOBSStatus();
                this.showNotification(`📺 Switched to ${message.sceneName}`, 'info');
                break;

            case 'command_recognized':
                this.transcript.textContent = `Recognized: "${message.command}"`;
                this.transcript.style.color = '#2ecc71';
                break;

            case 'command_executed':
                this.result.textContent = message.message;
                this.result.style.color = message.success ? '#2ecc71' : '#e74c3c';
                if (message.success) {
                    this.showNotification(`✅ ${message.message}`, 'success');
                }
                break;

            case 'command_failed':
                this.result.textContent = `Error: ${message.error}`;
                this.result.style.color = '#e74c3c';
                this.showNotification(`❌ ${message.error}`, 'error');
                break;

            case 'command_not_recognized':
                this.transcript.textContent = `Not recognized: "${message.text}"`;
                this.transcript.style.color = '#e74c3c';
                if (message.suggestions && message.suggestions.length > 0) {
                    this.result.textContent = `Did you mean: ${message.suggestions.join(', ')}?`;
                    this.result.style.color = '#f39c12';
                }
                break;

            case 'status_update':
                this.obsConnected = message.obsConnected;
                this.obsScenes = message.scenes || [];
                this.currentScene = message.currentScene || '';
                this.updateOBSStatus();
                if (message.commands) {
                    this.displayCommands(message.commands);
                }
                break;
        }
    }

    setupSpeechRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showNotification('❌ Speech recognition not supported. Please use Chrome.', 'error');
            this.voiceButton.disabled = true;
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;

            this.transcript.textContent = transcript;
            this.transcript.style.color = event.results[last].isFinal ? '#fff' : '#95a5a6';

            if (event.results[last].isFinal && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'voice_command',
                    text: transcript.toLowerCase()
                }));
                this.addToHistory(transcript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.showNotification(`❌ Speech error: ${event.error}`, 'error');
            this.stopListening();
        };

        this.recognition.onend = () => {
            this.stopListening();
        };
    }

    setupEventListeners() {
        // Hold-to-talk functionality
        this.voiceButton.addEventListener('mousedown', () => this.startListening());
        this.voiceButton.addEventListener('mouseup', () => this.stopListening());
        this.voiceButton.addEventListener('mouseleave', () => this.stopListening());

        // Touch support for mobile
        this.voiceButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startListening();
        });
        this.voiceButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopListening();
        });

        // Volume sliders
        const micVolume = document.getElementById('mic-volume');
        const desktopVolume = document.getElementById('desktop-volume');

        if (micVolume) {
            micVolume.addEventListener('change', (e) => {
                const percent = e.target.value / 100;
                this.executeCommand(`mic volume ${Math.round(percent * 100)} percent`);
            });
        }

        if (desktopVolume) {
            desktopVolume.addEventListener('change', (e) => {
                const percent = e.target.value / 100;
                this.executeCommand(`desktop volume ${Math.round(percent * 100)} percent`);
            });
        }
    }

    startListening() {
        if (!this.isListening && this.recognition) {
            this.isListening = true;
            this.voiceButton.classList.add('listening');
            this.voiceFeedback.classList.remove('hidden');
            this.transcript.textContent = 'Listening...';
            this.transcript.style.color = '#95a5a6';
            this.result.textContent = '';

            try {
                this.recognition.start();
            } catch (error) {
                console.error('Failed to start recognition:', error);
                this.stopListening();
            }
        }
    }

    stopListening() {
        if (this.isListening) {
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            this.voiceFeedback.classList.add('hidden');

            if (this.recognition) {
                this.recognition.stop();
            }
        }
    }

    updateConnectionStatus(status) {
        const statusText = this.connectionStatus.querySelector('.status-text');

        this.connectionStatus.className = 'status ' + status;

        switch (status) {
            case 'connected':
                statusText.textContent = 'Connected';
                break;
            case 'disconnected':
                statusText.textContent = 'Disconnected';
                this.voiceButton.disabled = true;
                break;
            case 'error':
                statusText.textContent = 'Connection Error';
                this.voiceButton.disabled = true;
                break;
        }
    }

    updateOBSStatus() {
        if (this.currentSceneElement) {
            this.currentSceneElement.textContent = this.currentScene || '-';
        }
        if (this.sceneCountElement) {
            this.sceneCountElement.textContent = this.obsScenes.length;
        }

        const sceneList = document.getElementById('scene-list');
        if (sceneList && this.obsScenes.length > 0) {
            sceneList.innerHTML = '<h4>Available Scenes:</h4>' +
                this.obsScenes.map(scene =>
                    `<button class="command-chip" onclick="executeCommand('switch to ${scene.toLowerCase()}')">${scene}</button>`
                ).join('');
        }

        const obsStatus = document.getElementById('obs-status');
        if (obsStatus) {
            obsStatus.textContent = this.obsConnected ? 'Connected' : 'Not Connected';
            obsStatus.style.color = this.obsConnected ? '#2ecc71' : '#e74c3c';
        }
    }

    addToHistory(command) {
        const time = new Date().toLocaleTimeString();
        const li = document.createElement('li');
        li.innerHTML = `<span class="time">${time}</span> <span class="command">${command}</span>`;

        this.historyList.insertBefore(li, this.historyList.firstChild);

        // Keep only last 10 commands
        while (this.historyList.children.length > 10) {
            this.historyList.removeChild(this.historyList.lastChild);
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async loadCommandCategories() {
        try {
            const response = await fetch('http://localhost:3030/commands');
            const data = await response.json();

            if (data.categories) {
                this.displayCommandCategories(data.categories);
            }
        } catch (error) {
            console.error('Failed to load command categories:', error);
        }
    }

    displayCommandCategories(categories) {
        const container = document.getElementById('command-categories');
        if (!container) return;

        container.innerHTML = '';

        for (const [category, commands] of Object.entries(categories)) {
            if (commands.length === 0) continue;

            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';

            const title = document.createElement('h4');
            title.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryDiv.appendChild(title);

            const commandsDiv = document.createElement('div');
            commandsDiv.className = 'category-commands';

            commands.forEach(command => {
                const chip = document.createElement('button');
                chip.className = 'command-chip';
                chip.textContent = command;
                chip.onclick = () => this.executeCommand(command);
                commandsDiv.appendChild(chip);
            });

            categoryDiv.appendChild(commandsDiv);
            container.appendChild(categoryDiv);
        }
    }

    executeCommand(command) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'voice_command',
                text: command
            }));
            this.addToHistory(command);
        } else {
            this.showNotification('Not connected to StreamVoice server!', 'error');
        }
    }
}

// Add notification styles
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2c3e50;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 1000;
    }

    .notification.show {
        transform: translateX(0);
    }

    .notification.success {
        background: #2ecc71;
    }

    .notification.error {
        background: #e74c3c;
    }

    .notification.info {
        background: #3498db;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.streamVoice = new StreamVoiceEnhanced();
    });
} else {
    window.streamVoice = new StreamVoiceEnhanced();
}