/**
 * AI Trading Playground - Voice Control System
 * Advanced voice recognition and natural language control
 */

class VoiceControl {
    constructor(playground) {
        this.playground = playground;
        this.isListening = false;
        this.isEnabled = false;
        this.recognition = null;
        this.synthesizer = null;
        this.currentSession = null;
        this.commands = new Map();
        this.contextualCommands = new Map();
        this.voiceSettings = {
            language: 'en-US',
            voice: 'default',
            rate: 1.0,
            pitch: 1.0,
            volume: 0.8
        };
        
        this.init();
    }

    init() {
        this.checkBrowserSupport();
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
        this.defineCommands();
        this.createVoiceControlPanel();
    }

    checkBrowserSupport() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            return false;
        }
        
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported in this browser');
            return false;
        }
        
        return true;
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.voiceSettings.language;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateVoiceStatus('Listening...');
            this.showListeningAnimation();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.updateVoiceStatus('Voice control ready');
            this.hideListeningAnimation();
            
            // Auto-restart if still enabled
            if (this.isEnabled) {
                setTimeout(() => this.startListening(), 1000);
            }
        };
        
        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.updateVoiceStatus('Error: ' + event.error);
        };
        
        this.recognition.onresult = (event) => {
            this.processVoiceInput(event);
        };
    }

    setupSpeechSynthesis() {
        this.synthesizer = window.speechSynthesis;
        
        // Load available voices
        this.synthesizer.onvoiceschanged = () => {
            this.updateVoiceOptions();
        };
    }

    defineCommands() {
        // Basic navigation commands
        this.commands.set('start trading', () => {
            document.getElementById('playBtn')?.click();
            this.speak('Starting trading simulation');
        });
        
        this.commands.set('stop trading', () => {
            document.getElementById('pauseBtn')?.click();
            this.speak('Trading paused');
        });
        
        this.commands.set('reset simulation', () => {
            document.getElementById('resetStatsBtn')?.click();
            this.speak('Simulation reset');
        });
        
        // Agent selection commands
        this.commands.set('select sma agent', () => {
            this.selectAgent('sma');
            this.speak('Simple Moving Average agent selected');
        });
        
        this.commands.set('select rsi agent', () => {
            this.selectAgent('rsi');
            this.speak('RSI agent selected');
        });
        
        this.commands.set('select ml agent', () => {
            this.selectAgent('ml');
            this.speak('Machine Learning agent selected');
        });
        
        this.commands.set('select custom agent', () => {
            this.selectAgent('custom');
            this.speak('Custom agent selected');
        });
        
        // Timeframe commands
        this.commands.set('change to one minute', () => {
            this.setTimeframe('1m');
            this.speak('Timeframe set to one minute');
        });
        
        this.commands.set('change to five minutes', () => {
            this.setTimeframe('5m');
            this.speak('Timeframe set to five minutes');
        });
        
        this.commands.set('change to one hour', () => {
            this.setTimeframe('1h');
            this.speak('Timeframe set to one hour');
        });
        
        this.commands.set('change to one day', () => {
            this.setTimeframe('1d');
            this.speak('Timeframe set to one day');
        });
        
        // Speed control
        this.commands.set('increase speed', () => {
            this.adjustSpeed(10);
        });
        
        this.commands.set('decrease speed', () => {
            this.adjustSpeed(-10);
        });
        
        this.commands.set('set speed to maximum', () => {
            this.setSpeed(100);
            this.speak('Speed set to maximum');
        });
        
        // Information queries
        this.commands.set('what is my portfolio value', () => {
            const value = document.getElementById('portfolioValue')?.textContent || 'unknown';
            this.speak(`Your portfolio value is ${value}`);
        });
        
        this.commands.set('what is my total return', () => {
            const returnValue = document.getElementById('totalReturn')?.textContent || 'unknown';
            this.speak(`Your total return is ${returnValue}`);
        });
        
        this.commands.set('how many trades have been executed', () => {
            const trades = document.getElementById('totalTrades')?.textContent || 'unknown';
            this.speak(`${trades} trades have been executed`);
        });
        
        this.commands.set('what is my win rate', () => {
            const winRate = document.getElementById('winRate')?.textContent || 'unknown';
            this.speak(`Your win rate is ${winRate}`);
        });
        
        // Tutorial and help
        this.commands.set('start tutorial', () => {
            if (window.tutorialSystem) {
                window.tutorialSystem.startTutorial('beginner');
                this.speak('Starting beginner tutorial');
            }
        });
        
        this.commands.set('open help', () => {
            if (window.helpSystem) {
                window.helpSystem.openHelp();
                this.speak('Opening help center');
            }
        });
        
        // Learning visualization
        this.commands.set('enable learning mode', () => {
            const toggle = document.getElementById('learningModeToggle');
            if (toggle && !toggle.checked) {
                toggle.click();
                this.speak('Learning mode enabled');
            }
        });
        
        this.commands.set('disable learning mode', () => {
            const toggle = document.getElementById('learningModeToggle');
            if (toggle && toggle.checked) {
                toggle.click();
                this.speak('Learning mode disabled');
            }
        });
        
        // Settings and preferences
        this.commands.set('open settings', () => {
            document.getElementById('settingsModal')?.style.setProperty('display', 'flex');
            this.speak('Settings opened');
        });
        
        this.commands.set('close settings', () => {
            document.getElementById('settingsModal')?.style.setProperty('display', 'none');
            this.speak('Settings closed');
        });
        
        // Meta commands
        this.commands.set('list voice commands', () => {
            this.listAvailableCommands();
        });
        
        this.commands.set('voice control help', () => {
            this.provideVoiceHelp();
        });
    }

    createVoiceControlPanel() {
        const voicePanel = document.createElement('div');
        voicePanel.className = 'voice-control-panel glass-effect';
        voicePanel.id = 'voiceControlPanel';
        voicePanel.innerHTML = `
            <div class="voice-header">
                <div class="voice-title">
                    <i class="fas fa-microphone" id="voiceMicIcon"></i>
                    <span>Voice Control</span>
                </div>
                <div class="voice-toggle">
                    <input type="checkbox" id="voiceToggle" class="voice-checkbox">
                    <label for="voiceToggle" class="voice-slider">
                        <span class="slider-text off">Off</span>
                        <span class="slider-text on">On</span>
                    </label>
                </div>
            </div>
            
            <div class="voice-content" id="voiceContent">
                <div class="voice-status">
                    <div class="status-indicator" id="voiceStatusIndicator"></div>
                    <span class="status-text" id="voiceStatusText">Voice control ready</span>
                </div>
                
                <div class="voice-visualization">
                    <div class="voice-wave" id="voiceWave">
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                    </div>
                </div>
                
                <div class="voice-transcript">
                    <div class="transcript-label">Last heard:</div>
                    <div class="transcript-text" id="transcriptText">Say "start trading" to begin</div>
                </div>
                
                <div class="voice-commands">
                    <div class="commands-label">Popular Commands:</div>
                    <div class="command-list">
                        <div class="command-item">"Start trading"</div>
                        <div class="command-item">"Select SMA agent"</div>
                        <div class="command-item">"What is my portfolio value?"</div>
                        <div class="command-item">"Enable learning mode"</div>
                    </div>
                </div>
                
                <div class="voice-settings-section">
                    <button class="voice-settings-btn" id="voiceSettingsBtn">
                        <i class="fas fa-cog"></i>
                        Voice Settings
                    </button>
                </div>
            </div>
            
            <!-- Voice Settings Modal -->
            <div class="voice-settings-modal" id="voiceSettingsModal" style="display: none;">
                <div class="voice-settings-content">
                    <h4>Voice Control Settings</h4>
                    
                    <div class="voice-setting-group">
                        <label>Language</label>
                        <select id="voiceLanguageSelect">
                            <option value="en-US">English (US)</option>
                            <option value="en-GB">English (UK)</option>
                            <option value="es-ES">Spanish</option>
                            <option value="fr-FR">French</option>
                            <option value="de-DE">German</option>
                            <option value="it-IT">Italian</option>
                            <option value="pt-BR">Portuguese (Brazil)</option>
                            <option value="ja-JP">Japanese</option>
                            <option value="ko-KR">Korean</option>
                            <option value="zh-CN">Chinese (Simplified)</option>
                        </select>
                    </div>
                    
                    <div class="voice-setting-group">
                        <label>Voice</label>
                        <select id="voiceSelect">
                            <option value="default">Default</option>
                        </select>
                    </div>
                    
                    <div class="voice-setting-group">
                        <label>Speech Rate</label>
                        <input type="range" min="0.5" max="2" step="0.1" value="1" id="voiceRateSlider">
                        <span class="voice-value-display" id="voiceRateValue">1.0x</span>
                    </div>
                    
                    <div class="voice-setting-group">
                        <label>Pitch</label>
                        <input type="range" min="0" max="2" step="0.1" value="1" id="voicePitchSlider">
                        <span class="voice-value-display" id="voicePitchValue">1.0</span>
                    </div>
                    
                    <div class="voice-setting-group">
                        <label>Volume</label>
                        <input type="range" min="0" max="1" step="0.1" value="0.8" id="voiceVolumeSlider">
                        <span class="voice-value-display" id="voiceVolumeValue">80%</span>
                    </div>
                    
                    <div class="voice-test-section">
                        <button class="voice-test-btn" id="voiceTestBtn">
                            <i class="fas fa-play"></i>
                            Test Voice
                        </button>
                    </div>
                    
                    <div class="voice-settings-actions">
                        <button class="voice-save-btn" onclick="voiceControl.saveVoiceSettings()">Save</button>
                        <button class="voice-cancel-btn" onclick="voiceControl.closeVoiceSettings()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Position it in the bottom right
        voicePanel.style.position = 'fixed';
        voicePanel.style.bottom = '20px';
        voicePanel.style.right = '20px';
        voicePanel.style.width = '300px';
        voicePanel.style.zIndex = '998';
        
        document.body.appendChild(voicePanel);
        this.setupVoiceEventListeners();
    }

    setupVoiceEventListeners() {
        const voiceToggle = document.getElementById('voiceToggle');
        voiceToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.enableVoiceControl();
            } else {
                this.disableVoiceControl();
            }
        });
        
        const voiceSettingsBtn = document.getElementById('voiceSettingsBtn');
        voiceSettingsBtn.addEventListener('click', () => {
            document.getElementById('voiceSettingsModal').style.display = 'flex';
        });
        
        // Voice settings sliders
        document.getElementById('voiceRateSlider').addEventListener('input', (e) => {
            document.getElementById('voiceRateValue').textContent = e.target.value + 'x';
        });
        
        document.getElementById('voicePitchSlider').addEventListener('input', (e) => {
            document.getElementById('voicePitchValue').textContent = e.target.value;
        });
        
        document.getElementById('voiceVolumeSlider').addEventListener('input', (e) => {
            document.getElementById('voiceVolumeValue').textContent = Math.round(e.target.value * 100) + '%';
        });
        
        document.getElementById('voiceTestBtn').addEventListener('click', () => {
            this.testVoice();
        });
    }

    enableVoiceControl() {
        if (!this.recognition) {
            alert('Voice control is not supported in your browser');
            return;
        }
        
        this.isEnabled = true;
        this.startListening();
        this.updateVoiceStatus('Voice control enabled');
        this.speak('Voice control activated. You can now control the trading playground with your voice.');
    }

    disableVoiceControl() {
        this.isEnabled = false;
        this.stopListening();
        this.updateVoiceStatus('Voice control disabled');
    }

    startListening() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Error starting voice recognition:', error);
            }
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    processVoiceInput(event) {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update transcript display
        const transcriptDisplay = finalTranscript || interimTranscript;
        document.getElementById('transcriptText').textContent = transcriptDisplay;
        
        if (finalTranscript) {
            this.executeVoiceCommand(finalTranscript.trim().toLowerCase());
        }
    }

    executeVoiceCommand(command) {
        console.log('Voice command received:', command);
        
        // Try exact matches first
        if (this.commands.has(command)) {
            this.commands.get(command)();
            return;
        }
        
        // Try fuzzy matching
        const matchedCommand = this.findBestMatch(command);
        if (matchedCommand) {
            this.commands.get(matchedCommand)();
            return;
        }
        
        // Try contextual commands
        const contextualMatch = this.findContextualMatch(command);
        if (contextualMatch) {
            contextualMatch();
            return;
        }
        
        // If no match found
        this.speak("I didn't understand that command. Say 'list voice commands' to hear available options.");
    }

    findBestMatch(command) {
        const commands = Array.from(this.commands.keys());
        let bestMatch = null;
        let bestScore = 0;
        
        commands.forEach(cmd => {
            const score = this.calculateSimilarity(command, cmd);
            if (score > bestScore && score > 0.7) { // 70% similarity threshold
                bestScore = score;
                bestMatch = cmd;
            }
        });
        
        return bestMatch;
    }

    calculateSimilarity(str1, str2) {
        const words1 = str1.split(' ');
        const words2 = str2.split(' ');
        
        let matches = 0;
        words1.forEach(word => {
            if (words2.some(w => w.includes(word) || word.includes(w))) {
                matches++;
            }
        });
        
        return matches / Math.max(words1.length, words2.length);
    }

    findContextualMatch(command) {
        // Handle natural language variations
        if (command.includes('portfolio') && command.includes('value')) {
            return () => {
                const value = document.getElementById('portfolioValue')?.textContent || 'unknown';
                this.speak(`Your portfolio value is ${value}`);
            };
        }
        
        if (command.includes('return') || command.includes('profit')) {
            return () => {
                const returnValue = document.getElementById('totalReturn')?.textContent || 'unknown';
                this.speak(`Your total return is ${returnValue}`);
            };
        }
        
        if (command.includes('speed') && command.includes('up')) {
            return () => this.adjustSpeed(10);
        }
        
        if (command.includes('speed') && command.includes('down')) {
            return () => this.adjustSpeed(-10);
        }
        
        if (command.includes('agent') && command.includes('sma')) {
            return () => {
                this.selectAgent('sma');
                this.speak('SMA agent selected');
            };
        }
        
        if (command.includes('agent') && command.includes('rsi')) {
            return () => {
                this.selectAgent('rsi');
                this.speak('RSI agent selected');
            };
        }
        
        return null;
    }

    // Helper methods for voice commands
    selectAgent(agentType) {
        const agentCard = document.querySelector(`[data-agent="${agentType}"]`);
        if (agentCard) {
            agentCard.click();
        }
    }

    setTimeframe(timeframe) {
        const timeframeBtn = document.querySelector(`[data-timeframe="${timeframe}"]`);
        if (timeframeBtn) {
            timeframeBtn.click();
        }
    }

    adjustSpeed(delta) {
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            const currentValue = parseInt(speedSlider.value);
            const newValue = Math.max(1, Math.min(100, currentValue + delta));
            speedSlider.value = newValue;
            speedSlider.dispatchEvent(new Event('input'));
            this.speak(`Speed adjusted to ${newValue}x`);
        }
    }

    setSpeed(value) {
        const speedSlider = document.getElementById('speedSlider');
        if (speedSlider) {
            speedSlider.value = value;
            speedSlider.dispatchEvent(new Event('input'));
        }
    }

    listAvailableCommands() {
        const commands = [
            'Start trading',
            'Stop trading', 
            'Select SMA agent',
            'Select RSI agent',
            'Change to one minute timeframe',
            'What is my portfolio value',
            'Enable learning mode',
            'Open settings',
            'Start tutorial'
        ];
        
        this.speak('Available voice commands include: ' + commands.join(', '));
    }

    provideVoiceHelp() {
        this.speak('You can control the trading playground with voice commands. Try saying "start trading", "select an agent", or "what is my portfolio value". For a full list, say "list voice commands".');
    }

    speak(text) {
        if (!this.synthesizer) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.voiceSettings.rate;
        utterance.pitch = this.voiceSettings.pitch;
        utterance.volume = this.voiceSettings.volume;
        utterance.lang = this.voiceSettings.language;
        
        // Set voice if selected
        if (this.voiceSettings.voice !== 'default') {
            const voices = this.synthesizer.getVoices();
            const selectedVoice = voices.find(voice => voice.name === this.voiceSettings.voice);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }
        
        this.synthesizer.speak(utterance);
    }

    updateVoiceStatus(status) {
        document.getElementById('voiceStatusText').textContent = status;
        
        const indicator = document.getElementById('voiceStatusIndicator');
        indicator.className = 'status-indicator';
        
        if (status.includes('Listening')) {
            indicator.classList.add('listening');
        } else if (status.includes('Error')) {
            indicator.classList.add('error');
        } else if (status.includes('enabled')) {
            indicator.classList.add('active');
        }
    }

    showListeningAnimation() {
        const wave = document.getElementById('voiceWave');
        if (wave) {
            wave.classList.add('active');
        }
        
        const micIcon = document.getElementById('voiceMicIcon');
        if (micIcon) {
            micIcon.classList.add('listening');
        }
    }

    hideListeningAnimation() {
        const wave = document.getElementById('voiceWave');
        if (wave) {
            wave.classList.remove('active');
        }
        
        const micIcon = document.getElementById('voiceMicIcon');
        if (micIcon) {
            micIcon.classList.remove('listening');
        }
    }

    updateVoiceOptions() {
        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect) return;
        
        const voices = this.synthesizer.getVoices();
        voiceSelect.innerHTML = '<option value="default">Default</option>';
        
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }

    testVoice() {
        this.speak('This is a test of the voice synthesis system. Voice control is working correctly.');
    }

    saveVoiceSettings() {
        this.voiceSettings.language = document.getElementById('voiceLanguageSelect').value;
        this.voiceSettings.voice = document.getElementById('voiceSelect').value;
        this.voiceSettings.rate = parseFloat(document.getElementById('voiceRateSlider').value);
        this.voiceSettings.pitch = parseFloat(document.getElementById('voicePitchSlider').value);
        this.voiceSettings.volume = parseFloat(document.getElementById('voiceVolumeSlider').value);
        
        // Update recognition language
        if (this.recognition) {
            this.recognition.lang = this.voiceSettings.language;
        }
        
        this.closeVoiceSettings();
        this.speak('Voice settings saved successfully');
    }

    closeVoiceSettings() {
        document.getElementById('voiceSettingsModal').style.display = 'none';
    }
}

// Export for use in main playground
window.VoiceControl = VoiceControl; 