// Audio System untuk HP - FIX VOLUME MAX
class AudioSystem {
    constructor() {
        this.audioElements = [];
        this.volume = 1.0;
        this.isPlaying = false;
        this.audioUrls = [
            'music.mp3',
            'https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3',
            'https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-alarm-905.mp3'
        ];
        this.currentAudioIndex = 0;
        
        // Pre-create audio elements
        this.createAudioElements();
    }
    
    createAudioElements() {
        for (let i = 0; i < 3; i++) {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.loop = true;
            audio.volume = 1.0;
            
            // Force HTML5 audio attributes
            audio.setAttribute('playsinline', '');
            audio.setAttribute('webkit-playsinline', '');
            audio.muted = false;
            
            this.audioElements.push(audio);
        }
    }
    
    // User interaction required untuk unlock audio di HP
    unlockAudio() {
        // Create silent audio untuk unlock
        const silentAudio = new Audio();
        silentAudio.volume = 0.001;
        
        // Play dan langsung pause
        silentAudio.play().then(() => {
            silentAudio.pause();
            silentAudio.currentTime = 0;
            console.log('[AUDIO] Audio context unlocked for mobile');
        }).catch(e => {
            console.log('[AUDIO] Silent unlock failed:', e);
        });
        
        // Juga coba dengan click event
        document.addEventListener('touchstart', this.forceUnlock.bind(this), { once: true });
        document.addEventListener('click', this.forceUnlock.bind(this), { once: true });
    }
    
    forceUnlock() {
        // Force play semua audio elements
        this.audioElements.forEach((audio, index) => {
            if (audio.src) {
                audio.play().catch(e => {
                    console.log(`[AUDIO] Element ${index} play failed:`, e);
                });
            }
        });
    }
    
    // Main play function dengan FALLBACK SYSTEM
    async playEmergencyAudio() {
        this.isPlaying = true;
        
        // Strategy 1: Coba semua URL sampai ada yang work
        for (let url of this.audioUrls) {
            const success = await this.tryPlayUrl(url);
            if (success) break;
        }
        
        // Strategy 2: Kalo semua gagal, create oscillator (synthetic audio)
        if (!this.isPlaying) {
            this.createFallbackAudio();
        }
        
        // Strategy 3: Tambah audio layers untuk pastikan ada yang bunyi
        setTimeout(() => this.addBackupAudio(), 1000);
        
        return this.isPlaying;
    }
    
    async tryPlayUrl(url) {
        return new Promise((resolve) => {
            const audio = this.audioElements[this.currentAudioIndex];
            
            // Cek kalo audio sudah loaded
            if (audio.src !== url) {
                audio.src = url;
            }
            
            // Set volume MAX
            audio.volume = 1.0;
            audio.muted = false;
            
            // Play dengan timeout
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`[AUDIO] Playing: ${url}`);
                    this.currentAudioIndex = (this.currentAudioIndex + 1) % this.audioElements.length;
                    resolve(true);
                }).catch(error => {
                    console.log(`[AUDIO] Failed: ${url}`, error);
                    
                    // Fallback: Coba dengan user gesture simulation
                    this.simulateUserGesture(audio);
                    resolve(false);
                });
            } else {
                resolve(false);
            }
        });
    }
    
    simulateUserGesture(audio) {
        // Trick: Create fake user interaction
        const playButton = document.createElement('button');
        playButton.style.display = 'none';
        document.body.appendChild(playButton);
        
        playButton.addEventListener('click', () => {
            audio.play().catch(e => console.log('Still failed:', e));
        });
        
        // Trigger click programmatically
        playButton.click();
        setTimeout(() => document.body.removeChild(playButton), 1000);
    }
    
    createFallbackAudio() {
        // Create Web Audio API oscillator sebagai fallback
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const context = new AudioContext();
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                
                // Set alarm sound
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(800, context.currentTime);
                oscillator.frequency.setValueAtTime(1000, context.currentTime + 0.5);
                
                // Max volume
                gainNode.gain.setValueAtTime(1.0, context.currentTime);
                
                oscillator.start();
                
                // Simpan reference
                this.fallbackAudio = { context, oscillator, gainNode };
                
                console.log('[AUDIO] Fallback oscillator activated');
                return true;
            }
        } catch (e) {
            console.log('[AUDIO] Web Audio API failed:', e);
        }
        
        return false;
    }
    
    addBackupAudio() {
        // Tambah HTML5 audio backup
        const backupAudio = new Audio();
        backupAudio.src = this.audioUrls[0];
        backupAudio.volume = 1.0;
        backupAudio.loop = true;
        
        // Coba play dengan delay
        setTimeout(() => {
            backupAudio.play().catch(e => {
                // Last resort: create invisible iframe dengan autoplay
                this.createAutoplayIframe();
            });
        }, 500);
        
        this.backupAudio = backupAudio;
    }
    
    createAutoplayIframe() {
        // Trick: iframe dengan autoplay attribute
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.sandbox = 'allow-scripts allow-same-origin';
        iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Audio Player</title>
            </head>
            <body>
                <audio autoplay loop controls style="display:none">
                    <source src="${this.audioUrls[0]}" type="audio/mpeg">
                </audio>
                <script>
                    document.querySelector('audio').volume = 1.0;
                    document.querySelector('audio').play().catch(e => {
                        // Auto-click untuk bypass restriction
                        document.body.click();
                    });
                    document.body.addEventListener('click', () => {
                        document.querySelector('audio').play();
                    });
                <\/script>
            </body>
            </html>
        `;
        
        document.body.appendChild(iframe);
        this.iframeAudio = iframe;
    }
    
    stopAllAudio() {
        this.isPlaying = false;
        
        // Stop semua audio elements
        this.audioElements.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        // Stop fallback audio
        if (this.fallbackAudio) {
            this.fallbackAudio.oscillator.stop();
            this.fallbackAudio.context.close();
        }
        
        // Stop backup audio
        if (this.backupAudio) {
            this.backupAudio.pause();
            this.backupAudio.currentTime = 0;
        }
        
        // Remove iframe
        if (this.iframeAudio && this.iframeAudio.parentNode) {
            document.body.removeChild(this.iframeAudio);
        }
    }
    
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        
        // Apply ke semua audio elements
        this.audioElements.forEach(audio => {
            audio.volume = this.volume;
        });
        
        // Apply ke fallback audio
        if (this.fallbackAudio) {
            this.fallbackAudio.gainNode.gain.setValueAtTime(this.volume, this.fallbackAudio.context.currentTime);
        }
    }
}

// Global Variables dengan AudioSystem baru
let selectedMethod = 'crash';
let isExploitActive = false;
let vibrationInterval = null;
let audioSystem = null;

// DOM Elements
const startBtn = document.getElementById('startBtn');
const mainContainer = document.getElementById('mainContainer');
const exploitOverlay = document.getElementById('exploitOverlay');
const vibrationOverlay = document.getElementById('vibrationOverlay');
const logContent = document.getElementById('logContent');
const exploitLog = document.getElementById('exploitLog');
const targetInfo = document.getElementById('targetInfo');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const countdownTimer = document.getElementById('countdownTimer');
const exploitSubtitle = document.getElementById('exploitSubtitle');

// Initialize AudioSystem
function initAudioSystem() {
    if (!audioSystem) {
        audioSystem = new AudioSystem();
        
        // Unlock audio saat page load
        setTimeout(() => {
            audioSystem.unlockAudio();
        }, 1000);
        
        // Juga unlock saat user interact
        document.addEventListener('touchstart', () => audioSystem.unlockAudio(), { once: true });
        document.addEventListener('click', () => audioSystem.unlockAudio(), { once: true });
        
        addLog('[AUDIO] Audio system initialized with mobile fix', 'system');
    }
}

// Method Cards Selection
const methodCards = document.querySelectorAll('.method-card');
methodCards.forEach(card => {
    card.addEventListener('click', () => {
        methodCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedMethod = card.dataset.method;
        addLog(`[SYSTEM] Method selected: ${selectedMethod.toUpperCase()}`, 'system');
    });
});

// Set current time in footer
function updateTime() {
    const now = new Date();
    const timeStr = now.toUTCString().split(' ')[4];
    document.getElementById('currentTime').textContent = `${timeStr} UTC`;
}
setInterval(updateTime, 1000);
updateTime();

// Add log entry
function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Add exploit log entry
function addExploitLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    exploitLog.appendChild(logEntry);
    exploitLog.scrollTop = exploitLog.scrollHeight;
}

// Vibration simulation (enhanced for mobile)
function startVibration() {
    let intensity = 0;
    vibrationInterval = setInterval(() => {
        intensity += 0.1;
        if (intensity > 1) intensity = 1;
        
        // Visual vibration effect
        vibrationOverlay.style.opacity = intensity * 0.3;
        vibrationOverlay.style.animation = `vibrate ${0.1 / intensity}s infinite`;
        
        // Try to trigger device vibration API
        if (navigator.vibrate) {
            // Pattern: vibrate for 200ms, pause for 100ms
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        
        // Shake screen effect
        const shakeX = (Math.random() * 6 - 3) * intensity;
        const shakeY = (Math.random() * 6 - 3) * intensity;
        exploitOverlay.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        
        // Juga shake elements inside
        const elements = exploitOverlay.querySelectorAll('.exploit-title, .countdown-timer');
        elements.forEach(el => {
            el.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
        });
    }, 100);
}

// Stop vibration
function stopVibration() {
    clearInterval(vibrationInterval);
    vibrationOverlay.style.opacity = '0';
    vibrationOverlay.style.animation = 'none';
    if (navigator.vibrate) {
        navigator.vibrate(0);
    }
    exploitOverlay.style.transform = 'translate(0, 0)';
    
    // Reset semua elements
    const elements = exploitOverlay.querySelectorAll('*');
    elements.forEach(el => {
        el.style.transform = '';
    });
}

// Start exploit dengan audio fix
startBtn.addEventListener('click', async () => {
    if (isExploitActive) return;
    
    const targetNumber = document.getElementById('targetNumber').value.trim();
    const targetName = document.getElementById('targetName').value.trim();
    
    if (!targetNumber || targetNumber.length < 5) {
        addLog('[ERROR] Please enter a valid phone number!', 'error');
        
        // Coba trigger audio untuk test
        if (audioSystem) {
            audioSystem.unlockAudio();
        }
        return;
    }
    
    isExploitActive = true;
    
    // Initialize audio system kalo belum
    if (!audioSystem) {
        initAudioSystem();
    }
    
    // Switch to exploit overlay
    mainContainer.style.display = 'none';
    exploitOverlay.style.display = 'block';
    
    // Request fullscreen untuk mobile
    requestFullscreen();
    
    // Disable browser navigation
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
        window.history.pushState(null, null, window.location.href);
    };
    
    // Prevent default behaviors
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('touchmove', e => {
        if (isExploitActive) e.preventDefault();
    }, { passive: false });
    
    // Update target info
    targetInfo.innerHTML = `
        <div><strong>TARGET:</strong> ${targetName || 'Unknown'} (${targetNumber})</div>
        <div><strong>METHOD:</strong> ${selectedMethod.toUpperCase()}</div>
        <div><strong>STATUS:</strong> <span style="color:#ff0000">EXPLOIT ACTIVE</span></div>
        <div><strong>AUDIO:</strong> <span style="color:#ff0000">MAX VOLUME ACTIVATED</span></div>
    `;
    
    // Start exploit sequence
    await startExploitSequence(targetNumber, targetName);
});

// Fullscreen request untuk mobile
function requestFullscreen() {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { // Safari
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullScreen) { // Firefox
        elem.mozRequestFullScreen();
    }
}

// Exit fullscreen
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
        document.msExitFullscreen();
    }
}

// Exploit sequence dengan audio garansi work
async function startExploitSequence(number, name) {
    let progress = 0;
    let timeLeft = 30;
    
    // Method-specific settings
    const methodSettings = {
        crash: { time: 25, subtitle: 'CRASHING WHATSAPP & DEVICE...' },
        infinity: { time: 40, subtitle: 'INFINITE NOTIFICATION LOOP...' },
        restart: { time: 35, subtitle: 'FORCING DEVICE RESTART...' },
        invisible: { time: 30, subtitle: 'ACTIVATING STEALTH MODE...' },
        reset: { time: 45, subtitle: 'FACTORY RESET INITIATED...' }
    };
    
    const settings = methodSettings[selectedMethod] || methodSettings.crash;
    timeLeft = settings.time;
    exploitSubtitle.textContent = settings.subtitle;
    
    // Initial logs
    addExploitLog('[SYSTEM] WhatsApp Bug Exploit v8.5.2 ACTIVATED', 'system');
    addExploitLog('[TARGET] Acquired: ' + number + (name ? ' (' + name + ')' : ''), 'info');
    addExploitLog('[METHOD] ' + selectedMethod.toUpperCase() + ' exploit selected', 'warning');
    addExploitLog('[SECURITY] Bypassing WhatsApp encryption...', 'system');
    
    // **CRITICAL: Start audio FIRST sebelum vibration (garansi work di HP)**
    addExploitLog('[AUDIO] Activating EMERGENCY ALARM SYSTEM...', 'warning');
    
    // Audio akan play dengan garansi
    const audioStarted = await audioSystem.playEmergencyAudio();
    
    if (audioStarted) {
        addExploitLog('[AUDIO] MAX VOLUME ALARM ACTIVATED SUCCESSFULLY!', 'error');
        
        // Force volume to absolute maximum
        setTimeout(() => {
            audioSystem.setVolume(1.0);
            addExploitLog('[AUDIO] Volume set to 100% MAXIMUM', 'error');
        }, 500);
    } else {
        addExploitLog('[AUDIO] Using fallback audio system...', 'warning');
    }
    
    // Start vibration setelah audio
    setTimeout(() => {
        startVibration();
        addExploitLog('[EFFECT] Device vibration ACTIVATED', 'error');
    }, 800);
    
    // Progress simulation
    const progressInterval = setInterval(() => {
        timeLeft--;
        
        // Update countdown
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update progress
        progress = ((settings.time - timeLeft) / settings.time) * 100;
        progressBar.style.width = progress + '%';
        
        // Add log entries at certain intervals
        if (timeLeft === 25) {
            addExploitLog('[NETWORK] Connecting to WhatsApp servers...', 'system');
            progressText.textContent = 'CONNECTING TO SERVERS...';
        } else if (timeLeft === 20) {
            addExploitLog('[EXPLOIT] Injecting malicious payload: 0x7F3A1C...', 'warning');
            progressText.textContent = 'INJECTING PAYLOAD...';
        } else if (timeLeft === 15) {
            addExploitLog('[BYTECODE] Modifying application binaries...', 'warning');
            progressText.textContent = 'MODIFYING BINARIES...';
            
            // Audio volume boost
            if (audioSystem) {
                audioSystem.setVolume(1.0);
            }
        } else if (timeLeft === 10) {
            addExploitLog('[SYSTEM] Bypassing security protocols...', 'error');
            progressText.textContent = 'BYPASSING SECURITY...';
        } else if (timeLeft === 5) {
            addExploitLog('[STATUS] Exploit 90% complete...', 'success');
            progressText.textContent = 'FINALIZING EXPLOIT...';
        } else if (timeLeft === 3) {
            addExploitLog('[WARNING] Target device compromised!', 'error');
            addExploitLog('[AUDIO] Sustaining maximum volume...', 'warning');
        }
        
        // Exploit complete
        if (timeLeft <= 0) {
            clearInterval(progressInterval);
            
            // Final updates
            progressBar.style.width = '100%';
            progressText.textContent = 'EXPLOIT SUCCESSFUL!';
            countdownTimer.textContent = '00:00';
            countdownTimer.style.color = '#00ff00';
            
            // Final logs
            addExploitLog('[SUCCESS] WhatsApp exploit completed successfully!', 'success');
            addExploitLog('[IMPACT] Target device has been compromised', 'error');
            addExploitLog('[ACTION] All requested modifications applied', 'success');
            
            // Stop vibration setelah 5 detik
            setTimeout(() => {
                stopVibration();
                addExploitLog('[SYSTEM] Vibration stopped', 'info');
            }, 5000);
            
            // Audio tetap lanjut (bisa 30 detik lagi)
            setTimeout(() => {
                if (audioSystem) {
                    audioSystem.stopAllAudio();
                    addExploitLog('[AUDIO] Emergency alarm deactivated', 'info');
                }
            }, 30000);
            
            // Show completion message
            exploitSubtitle.textContent = 'EXPLOIT COMPLETED SUCCESSFULLY!';
            exploitSubtitle.style.color = '#00ff00';
            
            // Enable exit setelah selesai
            setTimeout(() => {
                isExploitActive = false;
                addExploitLog('[INFO] You may now close this window', 'info');
                addExploitLog('[INFO] Press ESC to exit fullscreen', 'info');
            }, 5000);
        }
    }, 1000);
}

// Emergency exit (for testing)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (isExploitActive) {
            if (confirm('FORCE STOP EXPLOIT? This may cause errors.')) {
                stopVibration();
                if (audioSystem) {
                    audioSystem.stopAllAudio();
                }
                exitFullscreen();
                exploitOverlay.style.display = 'none';
                mainContainer.style.display = 'block';
                isExploitActive = false;
                addLog('[SYSTEM] Exploit force stopped by user', 'warning');
            }
            e.preventDefault();
        } else {
            exitFullscreen();
        }
    }
});

// Touch emergency stop (triple tap)
let tapCount = 0;
let lastTap = 0;
document.addEventListener('touchstart', (e) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
        tapCount++;
    } else {
        tapCount = 1;
    }
    
    lastTap = currentTime;
    
    if (tapCount === 3 && isExploitActive) {
        stopVibration();
        if (audioSystem) {
            audioSystem.stopAllAudio();
        }
        exitFullscreen();
        exploitOverlay.style.display = 'none';
        mainContainer.style.display = 'block';
        isExploitActive = false;
        addLog('[SYSTEM] Exploit stopped by triple tap', 'warning');
        tapCount = 0;
    }
});

// Initialize audio system saat page load
window.addEventListener('load', () => {
    initAudioSystem();
    
    // Auto unlock audio dengan click simulation
    setTimeout(() => {
        if (audioSystem) {
            audioSystem.unlockAudio();
        }
        
        // Simulate click untuk unlock audio context
        const unlockBtn = document.createElement('button');
        unlockBtn.style.position = 'fixed';
        unlockBtn.style.top = '10px';
        unlockBtn.style.left = '10px';
        unlockBtn.style.width = '10px';
        unlockBtn.style.height = '10px';
        unlockBtn.style.opacity = '0.001';
        unlockBtn.style.zIndex = '99999';
        unlockBtn.textContent = '';
        document.body.appendChild(unlockBtn);
        
        // Auto-click untuk unlock audio
        setTimeout(() => {
            unlockBtn.click();
            setTimeout(() => {
                if (unlockBtn.parentNode) {
                    document.body.removeChild(unlockBtn);
                }
            }, 1000);
        }, 500);
    }, 1500);
});

// Initial log
addLog('[SYSTEM] WhatsApp Bug Exploit Center loaded successfully', 'system');
addLog('[SECURITY] Anonymous connection established', 'success');
addLog('[AUDIO] Mobile volume fix activated', 'success');
addLog('[INFO] Select target and method to begin', 'info');
