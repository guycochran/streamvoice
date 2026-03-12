class StreamVoiceEnhanced {
    constructor() {
        this.ws = null;
        this.recognition = null;
        this.isListening = false;
        this.obsConnected = false;
        this.obsScenes = [];
        this.currentScene = '';
        this.commandCategories = {};
        this.apiBaseUrl = 'http://127.0.0.1:3030';
        this.statusPollInterval = null;
        this.serverReachable = false;
        this.wsConnected = false;
        this.lastApiError = null;
        this.lastWsError = null;
        this.debugStatus = null;

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
        this.startStatusPolling();
        this.setupSpeechRecognition();
        this.setupEventListeners();
        this.loadCommandCategories();
    }

    connectWebSocket() {
        const wsUrl = 'ws://127.0.0.1:8090';  // Force IPv4 connection
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('Connected to StreamVoice server');
            this.wsConnected = true;
            this.lastWsError = null;
            this.updateConnectionStatus();

            // Request current status
            this.ws.send(JSON.stringify({ type: 'get_status' }));
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.wsConnected = false;
            this.lastWsError = 'WebSocket connection closed';
            this.updateConnectionStatus();
            // Attempt reconnection after 3 seconds
            setTimeout(() => this.connectWebSocket(), 3000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.wsConnected = false;
            this.lastWsError = 'WebSocket error';
            this.updateConnectionStatus();
        };
    }

    startStatusPolling() {
        this.refreshStatusFromApi();
        this.statusPollInterval = setInterval(() => {
            this.refreshStatusFromApi();
        }, 3000);
    }

    async refreshStatusFromApi() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/debug/status`);
            if (!response.ok) {
                throw new Error(`Status request failed with ${response.status}`);
            }

            const status = await response.json();
            this.serverReachable = true;
            this.lastApiError = null;
            this.debugStatus = status;
            this.obsConnected = Boolean(status.connected);
            this.obsScenes = status.scenes || [];
            this.currentScene = status.currentScene || '';
            this.updateConnectionStatus();
            this.updateOBSStatus();
            this.renderDiagnostics();
        } catch (error) {
            console.error('Failed to refresh OBS status:', error);
            this.serverReachable = false;
            this.lastApiError = error.message;
            this.obsConnected = false;
            this.updateConnectionStatus();
            this.updateOBSStatus();
            this.renderDiagnostics();
        }
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
                this.wsConnected = true;
                if (message.obsScenes) {
                    this.obsScenes = message.obsScenes;
                    this.currentScene = message.currentScene;
                    this.updateOBSStatus();
                }
                this.updateConnectionStatus();
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
                this.updateConnectionStatus();
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

            if (event.results[last].isFinal) {
                this.executeCommand(transcript.toLowerCase());
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

    updateConnectionStatus() {
        const statusText = this.connectionStatus.querySelector('.status-text');
        let status = 'disconnected';
        let label = 'Disconnected';

        if (this.serverReachable && this.wsConnected) {
            status = 'connected';
            label = 'Connected';
        } else if (this.serverReachable) {
            status = 'connected';
            label = 'HTTP Only';
        }

        this.connectionStatus.className = 'status ' + status;
        statusText.textContent = label;
        this.voiceButton.disabled = !this.serverReachable;

        if (this.connectionDetails) {
            const transport = this.wsConnected ? 'WS+HTTP' : (this.serverReachable ? 'HTTP fallback' : 'offline');
            const obs = this.obsConnected ? 'OBS connected' : 'OBS not connected';
            this.connectionDetails.textContent = `Transport: ${transport} | ${obs}`;
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

    renderDiagnostics() {
        const backendStatus = document.getElementById('backend-status');
        const transportStatus = document.getElementById('transport-status');
        const wsClients = document.getElementById('ws-client-count');
        const lastError = document.getElementById('last-error');
        const statusDebug = document.getElementById('status-debug');

        if (backendStatus) {
            backendStatus.textContent = this.serverReachable ? 'ONLINE' : 'OFFLINE';
            backendStatus.style.color = this.serverReachable ? '#2ecc71' : '#e74c3c';
        }

        if (transportStatus) {
            transportStatus.textContent = this.wsConnected ? 'WS + HTTP' : (this.serverReachable ? 'HTTP ONLY' : 'OFFLINE');
            transportStatus.style.color = this.serverReachable ? '#2ecc71' : '#e74c3c';
        }

        if (wsClients) {
            wsClients.textContent = this.debugStatus?.websocketClients ?? '-';
        }

        const errorText = this.lastApiError || this.lastWsError || this.debugStatus?.lastObsError || this.debugStatus?.lastStateRefreshError || 'None';
        if (lastError) {
            lastError.textContent = errorText;
            lastError.style.color = errorText === 'None' ? '#2ecc71' : '#f39c12';
        }

        if (statusDebug) {
            const lines = [
                `HTTP API: ${this.serverReachable ? 'reachable' : 'unreachable'}`,
                `WebSocket 8090: ${this.wsConnected ? 'connected' : 'disconnected'}`,
                `OBS 4455: ${this.obsConnected ? 'connected' : 'not connected'}`,
                `OBS URL: ${this.debugStatus?.obsWebSocketUrl || 'unknown'}`,
                `Server PID: ${this.debugStatus?.pid || 'unknown'}`,
                `Uptime: ${this.debugStatus?.uptimeSeconds ?? 'unknown'}s`,
                `Last OBS error: ${this.debugStatus?.lastObsError || 'none'}`,
                `Last refresh error: ${this.debugStatus?.lastStateRefreshError || 'none'}`
            ];
            statusDebug.textContent = lines.join('\n');
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

    async executeCommand(command) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'voice_command',
                text: command
            }));
            this.addToHistory(command);
        } else {
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/command`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ command })
                });

                const result = await response.json();
                if (!response.ok || result.success === false) {
                    throw new Error(result.error || result.message || `Command failed with ${response.status}`);
                }

                this.result.textContent = result.message || 'Command executed';
                this.result.style.color = '#2ecc71';
                this.addToHistory(command);
                this.showNotification(`✅ ${result.message || 'Command executed'}`, 'success');
                this.refreshStatusFromApi();
            } catch (error) {
                console.error('HTTP command execution failed:', error);
                this.showNotification(error.message || 'Not connected to StreamVoice server!', 'error');
            }
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
