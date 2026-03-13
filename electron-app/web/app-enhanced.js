class StreamVoiceEnhanced {
    constructor() {
        this.ws = null;
        this.recognition = null;
        this.isListening = false;
        this.obsConnected = false;
        this.obsScenes = [];
        this.currentScene = '';
        this.commandCategories = {};
        this.apiBaseUrl = this.detectApiBaseUrl();
        this.hasDesktopBridge = Boolean(window.electronAPI?.desktopGetStatus);
        this.speechState = null;
        this.currentMicLevel = 0;
        this.statusPollInterval = null;
        this.serverReachable = false;
        this.wsConnected = false;
        this.lastApiError = null;
        this.lastWsError = null;
        this.debugStatus = null;
        this.healthStatus = null;
        this.wsReconnectTimer = null;

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
        if (!this.hasDesktopBridge) {
            this.connectWebSocket();
        }
        this.loadAppVersion();
        this.startStatusPolling();
        this.setupSpeechRecognition();
        this.setupEventListeners();
        this.loadCommandCategories();
        this.bindSpeechState();
    }

    detectApiBaseUrl() {
        if (window.location?.origin && /^https?:/i.test(window.location.origin)) {
            return window.location.origin;
        }

        return 'http://127.0.0.1:3030';
    }

    async loadAppVersion() {
        const version = await window.electronAPI?.getVersion?.().catch(() => null);
        if (!version) {
            return;
        }

        const appVersion = document.getElementById('app-version');
        const footerVersion = document.getElementById('footer-version');

        if (appVersion) {
            appVersion.textContent = version;
        }

        if (footerVersion) {
            footerVersion.textContent = `v${version}`;
        }
    }

    connectWebSocket() {
        const wsUrl = `ws://${new URL(this.apiBaseUrl).hostname}:8090`;
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
            clearTimeout(this.wsReconnectTimer);
            this.wsReconnectTimer = setTimeout(() => this.connectWebSocket(), 3000);
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
        this.refreshHealthStatus();
        this.statusPollInterval = setInterval(() => {
            this.refreshStatusFromApi();
            this.refreshHealthStatus();
        }, 3000);
    }

    async refreshHealthStatus() {
        if (this.hasDesktopBridge) {
            this.healthStatus = await window.electronAPI.desktopGetHealth();
            this.renderHealthStatus();
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/health`);
            if (!response.ok) {
                throw new Error(`Health request failed with ${response.status}`);
            }

            this.healthStatus = await response.json();
            this.renderHealthStatus();
        } catch (error) {
            console.error('Failed to refresh health status:', error);
        }
    }

    async refreshStatusFromApi() {
        if (this.hasDesktopBridge) {
            const status = await window.electronAPI.desktopGetStatus();
            this.serverReachable = true;
            this.lastApiError = status.lastError || null;
            this.debugStatus = {
                connected: status.connected,
                obsWebSocketUrl: status.url,
                lastObsError: status.lastError,
                uptimeSeconds: null,
                pid: null,
                websocketClients: 0
            };
            this.obsConnected = Boolean(status.connected);
            this.updateConnectionStatus();
            this.updateOBSStatus();
            this.renderDiagnostics();
            return;
        }

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
        if (this.hasDesktopBridge && window.electronAPI?.speechGetState) {
            this.updateSubsystemHealth('speech', 'available');
            this.checkMicrophonePermission();
            window.electronAPI.speechGetState().then((state) => {
                this.speechState = state;
            }).catch(() => {});
            return;
        }

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showNotification('❌ Speech recognition not supported. Please use Chrome.', 'error');
            this.voiceButton.disabled = true;
            this.updateSubsystemHealth('speech', 'unavailable');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        // Speech is available
        this.updateSubsystemHealth('speech', 'available');

        // Check microphone permissions
        this.checkMicrophonePermission();

        this.recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript;

            this.transcript.textContent = transcript;
            this.transcript.style.color = event.results[last].isFinal ? '#fff' : '#95a5a6';

            if (event.results[last].isFinal) {
                this.executeCommand(transcript.toLowerCase(), 'voice');
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
                this.executeCommand(`mic volume ${Math.round(percent * 100)} percent`, 'slider');
            });
        }

        if (desktopVolume) {
            desktopVolume.addEventListener('change', (e) => {
                const percent = e.target.value / 100;
                this.executeCommand(`desktop volume ${Math.round(percent * 100)} percent`, 'slider');
            });
        }
    }

    startListening() {
        if (!this.isListening && this.hasDesktopBridge && window.electronAPI?.speechStartPushToTalk) {
            this.isListening = true;
            this.voiceButton.classList.add('listening');
            this.voiceFeedback.classList.remove('hidden');
            this.transcript.textContent = 'Listening...';
            this.transcript.style.color = '#95a5a6';
            this.result.textContent = '';
            window.electronAPI.speechStartPushToTalk().catch((error) => {
                this.handleCommandError(error, { source: 'voice', command: 'push-to-talk' });
            });
        } else if (!this.isListening && this.recognition) {
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
        if (this.isListening && this.hasDesktopBridge && window.electronAPI?.speechStopPushToTalk) {
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            this.voiceFeedback.classList.add('hidden');
            this.transcript.textContent = 'Transcribing...';
            this.transcript.style.color = '#95a5a6';
            window.electronAPI.speechStopPushToTalk().catch((error) => {
                this.handleCommandError(error, { source: 'voice', command: 'push-to-talk' });
            });
        } else if (this.isListening) {
            this.isListening = false;
            this.voiceButton.classList.remove('listening');
            this.voiceFeedback.classList.add('hidden');

            if (this.recognition) {
                this.recognition.stop();
            }
        }
    }

    bindSpeechState() {
        if (!this.hasDesktopBridge || !window.electronAPI?.onSpeechStateUpdated) {
            return;
        }

        window.electronAPI.onSpeechStateUpdated((state) => {
            this.speechState = state;
            this.updateMicLevelDisplay(state.inputLevel || 0, state.selectedMicLabel || 'System Default Microphone');
            if (state.status === 'recording') {
                this.transcript.textContent = 'Listening...';
                this.transcript.style.color = '#95a5a6';
            } else if (state.status === 'transcribing') {
                this.transcript.textContent = 'Transcribing...';
                this.transcript.style.color = '#95a5a6';
                if (state.lastAudioPath) {
                    this.result.textContent = `Captured ${Math.round((state.lastAudioDurationMs || 0) / 1000)}s of audio for Whisper`;
                    this.result.style.color = '#f39c12';
                }
            } else if (state.status === 'ready' && state.transcript) {
                this.transcript.textContent = `Recognized: "${state.transcript}"`;
                this.transcript.style.color = '#2ecc71';
                if (state.lastCommandMessage) {
                    this.result.textContent = state.lastCommandMessage;
                    this.result.style.color = state.lastCommandStatus === 'error' ? '#e74c3c' : '#2ecc71';
                } else {
                    this.result.textContent = 'Transcript ready';
                    this.result.style.color = '#2ecc71';
                }
            } else if (state.status === 'error') {
                this.result.textContent = `Speech error: ${state.lastError}`;
                this.result.style.color = '#e74c3c';
            }
        });
    }

    updateMicLevelDisplay(level = 0, label = 'System Default Microphone') {
        const bar = document.getElementById('mic-level-bar');
        const levelLabel = document.getElementById('mic-level-label');
        const activeMicLabel = document.getElementById('active-mic-label');
        const safeLevel = Math.max(0, Math.min(1, Number(level || 0)));

        if (bar) {
            bar.style.width = `${Math.round(safeLevel * 100)}%`;
        }

        if (levelLabel) {
            levelLabel.textContent = safeLevel > 0.02
                ? `${Math.round(safeLevel * 100)}% signal`
                : 'No signal';
        }

        if (activeMicLabel) {
            activeMicLabel.textContent = `Active Mic: ${label || 'System Default Microphone'}`;
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
                `Speech Provider: ${this.speechState?.provider || 'unknown'}`,
                `Speech Model: ${this.speechState?.model || 'unknown'} (${this.speechState?.modelStatus || 'unknown'})`,
                `Selected Mic: ${this.speechState?.selectedMicLabel || 'System Default Microphone'}`,
                `Mic Input Level: ${Math.round((this.speechState?.inputLevel || 0) * 100)}%`,
                `Server PID: ${this.debugStatus?.pid || 'unknown'}`,
                `Uptime: ${this.debugStatus?.uptimeSeconds ?? 'unknown'}s`,
                `Last OBS error: ${this.debugStatus?.lastObsError || 'none'}`,
                `Last speech error: ${this.speechState?.lastError || 'none'}`,
                `Last refresh error: ${this.debugStatus?.lastStateRefreshError || 'none'}`
            ];
            statusDebug.textContent = lines.join('\n');
        }
    }

    renderHealthStatus() {
        if (!this.healthStatus || !this.healthStatus.subsystems) return;

        const health = this.healthStatus.subsystems;

        // Update individual subsystem statuses in UI
        const getStatusColor = (status) => {
            switch (status) {
                case 'healthy':
                case 'connected':
                case 'available':
                    return '#2ecc71';
                case 'degraded':
                case 'connecting':
                    return '#f39c12';
                case 'failed':
                case 'disconnected':
                case 'error':
                case 'unavailable':
                    return '#e74c3c';
                default:
                    return '#95a5a6';
            }
        };

        // Update microphone status if element exists
        const micStatus = document.getElementById('mic-status');
        if (micStatus && health.microphone) {
            micStatus.textContent = health.microphone.status.toUpperCase();
            micStatus.style.color = getStatusColor(health.microphone.status);
        }

        this.updateMicLevelDisplay(
            health.microphone?.inputLevel ?? this.speechState?.inputLevel ?? 0,
            health.microphone?.selectedMicLabel || this.speechState?.selectedMicLabel || 'System Default Microphone'
        );

        // Update speech engine status if element exists
        const speechStatus = document.getElementById('speech-status');
        if (speechStatus && health.speech) {
            speechStatus.textContent = health.speech.status.toUpperCase();
            speechStatus.style.color = getStatusColor(health.speech.status);
        }

        // Update detailed connection status
        if (this.connectionDetails) {
            const parts = [];

            if (health.backend?.httpApi?.status === 'healthy') {
                parts.push('HTTP API: ✓');
            } else {
                parts.push('HTTP API: ✗');
            }

            if (health.backend?.webSocket?.status === 'healthy') {
                parts.push(`WS: ✓ (${health.backend.webSocket.clients} clients)`);
            } else {
                parts.push('WS: ✗');
            }

            if (health.obs?.status === 'connected') {
                parts.push('OBS: ✓');
            } else {
                parts.push(`OBS: ${health.obs?.status || 'unknown'}`);
            }

            this.connectionDetails.textContent = parts.join(' | ');
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
        if (this.hasDesktopBridge) {
            this.displayCommandCategories({
                scenes: ['switch to gameplay', 'switch to starting', 'switch to break'],
                recording: ['start recording'],
                streaming: ['start streaming'],
                audio: ['mute mic', 'unmute mic'],
                macros: ['stream starting setup', 'stream ending setup', 'emergency mute', 'raid mode', 'subscriber celebration'],
                other: ['take screenshot']
            });
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/commands`);
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
                chip.onclick = () => this.executeCommand(command, 'button');
                commandsDiv.appendChild(chip);
            });

            categoryDiv.appendChild(commandsDiv);
            container.appendChild(categoryDiv);
        }
    }

    async checkMicrophonePermission() {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // Try to get microphone access
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                // Success - we have microphone access
                stream.getTracks().forEach(track => track.stop()); // Stop the stream
                this.updateSubsystemHealth('microphone', 'available');
            } else {
                this.updateSubsystemHealth('microphone', 'unavailable');
            }
        } catch (error) {
            console.error('Microphone permission error:', error);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                this.updateSubsystemHealth('microphone', 'permission_denied');
                this.showNotification('🎤 Microphone permission needed for voice control', 'error');
            } else {
                this.updateSubsystemHealth('microphone', 'unavailable');
            }
        }
    }

    updateSubsystemHealth(subsystem, status) {
        // Send status update to server if WebSocket is connected
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'update_health',
                subsystem: subsystem,
                status: status
            }));
        }

        if (this.hasDesktopBridge && window.electronAPI?.desktopUpdateSubsystemHealth) {
            window.electronAPI.desktopUpdateSubsystemHealth({
                subsystem,
                status
            }).catch(() => {});
        }

        // Update local UI immediately
        if (subsystem === 'microphone') {
            const micStatus = document.getElementById('mic-status');
            if (micStatus) {
                micStatus.textContent = status.toUpperCase().replace('_', ' ');
                micStatus.style.color = this.getHealthStatusColor(status);
            }
        } else if (subsystem === 'speech') {
            const speechStatus = document.getElementById('speech-status');
            if (speechStatus) {
                speechStatus.textContent = status.toUpperCase();
                speechStatus.style.color = this.getHealthStatusColor(status);
            }
        }
    }

    getHealthStatusColor(status) {
        switch (status) {
            case 'available':
            case 'healthy':
            case 'connected':
                return '#2ecc71';
            case 'permission_denied':
            case 'degraded':
                return '#f39c12';
            case 'unavailable':
            case 'failed':
            case 'disconnected':
            case 'error':
                return '#e74c3c';
            default:
                return '#95a5a6';
        }
    }

    async executeCommand(command, source = 'unknown') {
        // Unified command dispatcher - all commands go through here
        const commandData = {
            command: command,
            source: source, // 'voice', 'button', 'macro', 'direct'
            timestamp: Date.now()
        };

        // Log command to history immediately
        this.addToHistory(command);
        this.logCommandActivity(commandData);

        // Show immediate feedback
        if (source === 'voice') {
            this.transcript.textContent = `Recognized: "${command}"`;
            this.transcript.style.color = '#2ecc71';
        }

        try {
            let result;

            if (this.hasDesktopBridge && window.electronAPI?.desktopExecuteCommand) {
                result = await window.electronAPI.desktopExecuteCommand(commandData.command);
                if (!result.success) {
                    throw new Error(result.error || result.message || 'Command failed');
                }
            } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                // Try WebSocket first if available
                result = await this.executeViaWebSocket(commandData);
            } else {
                // Fall back to HTTP
                result = await this.executeViaHTTP(commandData);
            }

            // Handle result uniformly
            this.handleCommandResult(result, commandData);

            return result;
        } catch (error) {
            // Handle errors uniformly
            this.handleCommandError(error, commandData);
            throw error;
        }
    }

    async executeViaWebSocket(commandData) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Command timeout'));
            }, 5000);

            const messageHandler = (event) => {
                const message = JSON.parse(event.data);

                if (message.type === 'command_executed' || message.type === 'command_failed') {
                    clearTimeout(timeout);
                    this.ws.removeEventListener('message', messageHandler);

                    if (message.type === 'command_executed') {
                        resolve({
                            success: message.success,
                            message: message.message
                        });
                    } else {
                        reject(new Error(message.error || 'Command failed'));
                    }
                }
            };

            this.ws.addEventListener('message', messageHandler);

            this.ws.send(JSON.stringify({
                type: 'voice_command',
                text: commandData.command,
                source: commandData.source
            }));
        });
    }

    async executeViaHTTP(commandData) {
        const response = await fetch(`${this.apiBaseUrl}/api/command`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                command: commandData.command,
                source: commandData.source
            })
        });

        const result = await response.json();

        if (!response.ok || result.success === false) {
            throw new Error(result.error || result.message || `Command failed with ${response.status}`);
        }

        return result;
    }

    handleCommandResult(result, commandData) {
        // Update UI with result
        this.result.textContent = result.message || 'Command executed';
        this.result.style.color = '#2ecc71';

        // Show notification
        this.showNotification(`✅ ${result.message || 'Command executed'}`, 'success');

        // Update command log with result
        if (this.commandHistory && this.commandHistory.length > 0) {
            const lastCommand = this.commandHistory[this.commandHistory.length - 1];
            lastCommand.result = 'success';
            lastCommand.message = result.message;
        }

        // Refresh status after successful command
        this.refreshStatusFromApi();
        this.updateDiagnosticsPanel();
    }

    handleCommandError(error, commandData) {
        // Update UI with error
        this.result.textContent = `Error: ${error.message}`;
        this.result.style.color = '#e74c3c';

        // Show notification
        this.showNotification(`❌ ${error.message}`, 'error');

        // Update command log with error
        if (this.commandHistory && this.commandHistory.length > 0) {
            const lastCommand = this.commandHistory[this.commandHistory.length - 1];
            lastCommand.result = 'error';
            lastCommand.error = error.message;
        }

        console.error('Command execution failed:', error);
        this.updateDiagnosticsPanel();
    }

    logCommandActivity(commandData) {
        // Initialize command history if needed
        if (!this.commandHistory) {
            this.commandHistory = [];
        }

        // Add to command history
        this.commandHistory.push({
            timestamp: commandData.timestamp,
            source: commandData.source,
            input: commandData.command,
            action: commandData.command,
            result: 'pending'
        });

        // Keep only last 50 commands
        if (this.commandHistory.length > 50) {
            this.commandHistory = this.commandHistory.slice(-50);
        }

        // Update diagnostics panel if visible
        this.updateDiagnosticsPanel();
    }

    updateDiagnosticsPanel() {
        // Update diagnostics panel if visible
        const diagnosticsPanel = document.getElementById('diagnosticsPanel');
        if (diagnosticsPanel && diagnosticsPanel.style.display !== 'none') {
            this.renderHealthStatus();
            this.renderCommandActivity();
        }
    }

    renderCommandActivity() {
        const commandList = document.getElementById('diagnostic-command-list');
        if (!commandList || !this.commandHistory) return;

        commandList.innerHTML = '';
        const recentCommands = this.commandHistory.slice(-10).reverse();

        recentCommands.forEach(cmd => {
            const li = document.createElement('li');
            const timestamp = new Date(cmd.timestamp).toLocaleTimeString();
            const statusIcon = cmd.result === 'success' ? '✅' :
                             cmd.result === 'error' ? '❌' : '⏳';

            li.innerHTML = `
                <span style="color: #666;">${timestamp}</span>
                <span style="color: #9b59b6;">[${cmd.source}]</span>
                ${cmd.input}
                ${statusIcon}
            `;
            li.style.marginBottom = '5px';
            commandList.appendChild(li);
        });
    }

    generateDiagnosticReport() {
        const now = new Date().toISOString();
        const subsystems = this.healthStatus?.subsystems || {};
        const appHealth = this.healthStatus?.app || subsystems.app || {};
        const backendHealth = this.healthStatus?.backend || subsystems.backend || {};
        const obsHealth = this.healthStatus?.obs || subsystems.obs || {};
        const speechHealth = this.healthStatus?.speech || subsystems.speech || {};
        const micHealth = this.healthStatus?.microphone || subsystems.microphone || {};
        const uptime = appHealth.startTime
            ? Math.floor((Date.now() - appHealth.startTime) / 1000)
            : 'unknown';

        let report = `StreamVoice Diagnostic Report
Generated: ${now}
Version: ${appHealth.version || 'unknown'}
Uptime: ${uptime} seconds

=== SYSTEM HEALTH ===
Overall Status: ${this.healthStatus?.status || this.healthStatus?.overall || 'unknown'}

=== SUBSYSTEMS ===
`;

        // App status
        const app = appHealth;
        report += `\nApp Runtime:
  Status: ${app.status || 'unknown'}
  PID: ${app.pid || 'unknown'}
  Last Error: ${app.lastError || 'none'}
`;

        // Backend status
        const backend = backendHealth;
        report += `\nBackend Service:
  Status: ${backend.status || 'unknown'}
`;

        // HTTP API
        const httpApi = backend.httpApi || {};
        report += `\nHTTP API:
  Status: ${httpApi.status || 'unknown'}
  Port: ${httpApi.port || 'unknown'}
  Last Error: ${httpApi.lastError || 'none'}
`;

        // WebSocket
        const ws = backend.webSocket || {};
        report += `\nWebSocket Transport:
  Status: ${ws.status || 'unknown'}
  Port: ${ws.port || 'unknown'}
  Connected Clients: ${ws.clients || 0}
  Last Error: ${ws.lastError || 'none'}
`;

        // OBS
        const obs = obsHealth;
        report += `\nOBS Connection:
  Status: ${obs.status || 'unknown'}
  URL: ${obs.url || 'unknown'}
  Connected: ${obs.connected ? 'Yes' : 'No'}
  Reconnect Attempts: ${obs.reconnectAttempts || 0}
  Last Successful Connection: ${obs.lastSuccessfulConnection || 'never'}
  Last Error: ${obs.lastError || 'none'}
`;

        // Speech
        const speech = speechHealth;
        report += `\nSpeech Recognition:
  Status: ${speech.status || 'unknown'}
  Engine: ${speech.engine || 'unknown'}
  Supported: ${speech.supported !== null ? (speech.supported ? 'Yes' : 'No') : 'unknown'}
  Model: ${this.speechState?.model || speech.model || 'unknown'}
  Model Status: ${this.speechState?.modelStatus || speech.modelStatus || 'unknown'}
  Selected Mic: ${this.speechState?.selectedMicLabel || speech.selectedMicLabel || 'System Default Microphone'}
  Input Level: ${Math.round((this.speechState?.inputLevel || speech.inputLevel || 0) * 100)}%
  Last Transcript: ${this.speechState?.transcript || 'none'}
  Last Error: ${this.speechState?.lastError || speech.lastError || 'none'}
`;

        // Microphone
        const mic = micHealth;
        report += `\nMicrophone:
  Status: ${mic.status || 'unknown'}
  Selected Device: ${mic.selectedMicLabel || this.speechState?.selectedMicLabel || 'System Default Microphone'}
  Input Level: ${Math.round((mic.inputLevel ?? this.speechState?.inputLevel ?? 0) * 100)}%
  Last Error: ${mic.lastError || 'none'}
`;

        // Recent commands from history
        report += `\n=== RECENT COMMAND ACTIVITY ===\n`;
        const historyItems = this.historyList?.children || [];
        if (historyItems.length > 0) {
            for (let i = 0; i < Math.min(10, historyItems.length); i++) {
                const item = historyItems[i];
                const time = item.querySelector('.time')?.textContent || '';
                const command = item.querySelector('.command')?.textContent || '';
                report += `${i + 1}. [${time}] ${command}\n`;
            }
        } else {
            report += 'No recent commands\n';
        }

        // Connection details
        report += `\n=== CONNECTION DETAILS ===
Server URL: ${this.apiBaseUrl}
WebSocket URL: ws://127.0.0.1:8090
Server Reachable: ${this.serverReachable ? 'Yes' : 'No'}
WebSocket Connected: ${this.wsConnected ? 'Yes' : 'No'}
OBS Connected: ${this.obsConnected ? 'Yes' : 'No'}
`;

        // Errors
        report += `\n=== RECENT ERRORS ===
Last API Error: ${this.lastApiError || 'none'}
Last WebSocket Error: ${this.lastWsError || 'none'}
`;

        // Environment
        const connectionType = this.hasDesktopBridge
            ? 'Desktop IPC'
            : (this.wsConnected ? 'WebSocket' : (this.serverReachable ? 'HTTP Fallback' : 'Disconnected'));
        report += `\n=== ENVIRONMENT ===
Platform: ${navigator.platform}
User Agent: ${navigator.userAgent}
Connection Type: ${connectionType}
`;

        return report;
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
