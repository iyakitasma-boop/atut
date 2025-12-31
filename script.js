// Audio URL - Alarm darurat (ganti dengan URL audio kamu atau simpan file music.mp3)
const AUDIO_URL = 'music.mp3'; // Pastikan file music.mp3 ada di folder yang sama

// Global Variables
let selectedMethod = 'crash';
let isExploitActive = false;
let vibrationInterval = null;
let audioElement = null;

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

// Vibration simulation
function startVibration() {
    let intensity = 0;
    vibrationInterval = setInterval(() => {
        intensity += 0.1;
        if (intensity > 1) intensity = 1;
        
        // Visual vibration effect
        vibrationOverlay.style.opacity = intensity * 0.3;
        vibrationOverlay.style.animation = `vibrate ${0.1 / intensity}s infinite`;
        
        // Try to trigger device vibration if supported
        if (navigator.vibrate) {
            navigator.vibrate(100 * intensity);
        }
        
        // Shake screen
        exploitOverlay.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
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
}

// Play audio at maximum volume
function playEmergencyAudio() {
    audioElement = document.getElementById('bugAudio');
    
    // Set audio source
    if (!audioElement.src || audioElement.src.includes('music.mp3')) {
        audioElement.src = AUDIO_URL;
    }
    
    // Force volume to maximum
    audioElement.volume = 1.0;
    
    // Play audio
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log('Audio play failed:', error);
            // Fallback: create new audio element and play
            const newAudio = new Audio(AUDIO_URL);
            newAudio.volume = 1.0;
            newAudio.loop = true;
            newAudio.play();
        });
    }
    
    addExploitLog('[AUDIO] Emergency alarm activated at MAXIMUM volume', 'warning');
}

// Start exploit
startBtn.addEventListener('click', () => {
    if (isExploitActive) return;
    
    const targetNumber = document.getElementById('targetNumber').value.trim();
    const targetName = document.getElementById('targetName').value.trim();
    
    if (!targetNumber || targetNumber.length < 5) {
        addLog('[ERROR] Please enter a valid phone number!', 'error');
        return;
    }
    
    isExploitActive = true;
    
    // Switch to exploit overlay
    mainContainer.style.display = 'none';
    exploitOverlay.style.display = 'block';
    
    // Disable browser navigation
    window.history.pushState(null, null, window.location.href);
    window.onpopstate = function() {
        window.history.pushState(null, null, window.location.href);
    };
    
    // Prevent right click
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Prevent touch scrolling
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    
    // Update target info
    targetInfo.innerHTML = `
        <div><strong>TARGET:</strong> ${targetName || 'Unknown'} (${targetNumber})</div>
        <div><strong>METHOD:</strong> ${selectedMethod.toUpperCase()}</div>
        <div><strong>STATUS:</strong> <span style="color:#ff0000">EXPLOIT ACTIVE</span></div>
    `;
    
    // Start exploit sequence
    startExploitSequence(targetNumber, targetName);
});

// Exploit sequence
function startExploitSequence(number, name) {
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
    
    // Start audio and vibration (immediately at full volume)
    playEmergencyAudio();
    setTimeout(() => {
        startVibration();
        addExploitLog('[EFFECT] Device vibration & max volume audio ACTIVATED', 'error');
    }, 1000);
    
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
        } else if (timeLeft === 10) {
            addExploitLog('[SYSTEM] Bypassing security protocols...', 'error');
            progressText.textContent = 'BYPASSING SECURITY...';
        } else if (timeLeft === 5) {
            addExploitLog('[STATUS] Exploit 90% complete...', 'success');
            progressText.textContent = 'FINALIZING EXPLOIT...';
        } else if (timeLeft === 3) {
            addExploitLog('[WARNING] Target device compromised!', 'error');
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
            
            // Stop vibration after completion
            setTimeout(() => {
                stopVibration();
                addExploitLog('[SYSTEM] Vibration stopped', 'info');
            }, 5000);
            
            // Show completion message
            exploitSubtitle.textContent = 'EXPLOIT COMPLETED SUCCESSFULLY!';
            exploitSubtitle.style.color = '#00ff00';
            
            // Add restart hint
            setTimeout(() => {
                addExploitLog('[INFO] You may now close this window', 'info');
            }, 2000);
        }
    }, 1000);
}

// Emergency exit (for testing)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isExploitActive) {
        if (confirm('FORCE STOP EXPLOIT? This may cause errors.')) {
            stopVibration();
            if (audioElement) {
                audioElement.pause();
                audioElement.currentTime = 0;
            }
            exploitOverlay.style.display = 'none';
            mainContainer.style.display = 'block';
            isExploitActive = false;
            addLog('[SYSTEM] Exploit force stopped by user', 'warning');
        }
        e.preventDefault();
    }
});

// Initial log
addLog('[SYSTEM] WhatsApp Bug Exploit Center loaded successfully', 'system');
addLog('[SECURITY] Anonymous connection established', 'success');
addLog('[INFO] Select target and method to begin', 'info');