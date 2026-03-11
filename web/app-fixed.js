// StreamVoice - Voice Control for OBS (Windows Fix Version)
class StreamVoice {
    constructor() {
        this.ws = null;
        this.recognition = null;
        this.isConnected = false;
        this.isListening = false;
        this.connectionAttempts = 0;

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
        this.connectionAttempts++;

        // Try different connection methods
        const wsUrls = [
            'ws://127.0.0.1:8090',     // IP address often works better on Windows
            'ws://localhost:8090',      // Standard localhost
            'ws://[::1]:8090'          // IPv6 localhost
        ];

        const wsUrl = wsUrls[this.connectionAttempts % wsUrls.length];

        console.log(`Attempting to connect to WebSocket at ${wsUrl} (attempt ${this.connectionAttempts})`);
        this.updateConnectionDetails(`Trying: ${wsUrl}`);

        try {
            this.ws = new WebSocket(wsUrl);

            // Set a connection timeout
            const connectionTimeout = setTimeout(() => {
                if (this.ws.readyState !== WebSocket.OPEN) {
                    console.error('Connection timeout - trying next URL');
                    this.ws.close();
                    if (this.connectionAttempts < 9) { // Try each URL 3 times
                        setTimeout(() => this.connectWebSocket(), 1000);
                    }
                }
            }, 5000);

            this.ws.onopen = () => {
                clearTimeout(connectionTimeout);
                this.isConnected = true;
                this.connectionAttempts = 0;
                this.updateConnectionStatus(true);
                this.updateConnectionDetails(`Connected via ${wsUrl}`);
                this.voiceButton.disabled = false;
                console.log(`Connected to StreamVoice server via ${wsUrl}`);

                // Force update the UI to show connected status
                setTimeout(() => {
                    this.updateConnectionStatus(true);
                    console.log('Connection status verified: CONNECTED');
                }, 100);
            };

            this.ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.handleServerMessage(message);
            };

            this.ws.onclose = () => {
                clearTimeout(connectionTimeout);
                this.isConnected = false;
                this.updateConnectionStatus(false);
                this.voiceButton.disabled = true;
                console.log('Disconnected from server');

                // Attempt to reconnect after 3 seconds
                if (this.connectionAttempts < 9) {
                    setTimeout(() => this.connectWebSocket(), 3000);
                } else {
                    this.updateConnectionDetails('Failed to connect - check firewall');
                    console.error('Failed to connect after multiple attempts. Check Windows Firewall or antivirus.');
                }
            };

            this.ws.onerror = (error) => {
                clearTimeout(connectionTimeout);
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);

                // Show more detailed error info
                console.error(`Connection failed to ${wsUrl}`);
                console.error('Possible fixes:');
                console.error('1. Check Windows Firewall - allow Node.js');
                console.error('2. Try disabling antivirus temporarily');
                console.error('3. Run Chrome as administrator');
                console.error('4. Check if port 8090 is blocked');
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.updateConnectionDetails('WebSocket creation failed');
            setTimeout(() => this.connectWebSocket(), 3000);
        }
    }

    updateConnectionDetails(details) {
        const detailsEl = document.getElementById('connection-details');
        if (detailsEl) {
            detailsEl.textContent = details;
        }
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
        if (!this.isConnected) {
            this.result.textContent = '✗ Not connected to server';
            this.result.className = 'result error';
            return;
        }

        this.ws.send(JSON.stringify({
            type: 'voice_command',
            text: text
        }));
    }

    handleServerMessage(message) {
        switch (message.type) {
            case 'connected':
                console.log('Server ready with', message.commands, 'commands');
                break;

            case 'command_recognized':
                this.result.textContent = '✓ Command recognized';
                this.result.className = 'result success';
                this.playSound('success');
                break;

            case 'command_executed':
                this.addToHistory(this.transcript.textContent, true);
                this.result.textContent = '✓ Command executed successfully';
                this.result.className = 'result success';
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
        if (connected) {
            statusEl.className = 'status connected';
            statusEl.querySelector('.status-text').textContent = 'Connected';
        } else {
            statusEl.className = 'status disconnected';
            statusEl.querySelector('.status-text').textContent = 'Disconnected';
        }
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
            // Try multiple REST API endpoints
            const urls = [
                'http://127.0.0.1:3030/commands',
                'http://localhost:3030/commands'
            ];

            let response;
            for (const url of urls) {
                try {
                    response = await fetch(url);
                    if (response.ok) break;
                } catch (e) {
                    console.error(`Failed to fetch from ${url}:`, e);
                }
            }

            if (!response || !response.ok) {
                console.error('Failed to load commands from all URLs');
                return;
            }

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
        // In production, we'd play actual sound files
        // For now, we'll use the Web Audio API for simple beeps
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
            // Audio might be blocked by browser
            console.log('Audio playback failed:', e);
        }
    }
}

// Initialize StreamVoice when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.streamVoice = new StreamVoice();
});