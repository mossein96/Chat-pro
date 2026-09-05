// ============================================================
//  app.js  –  Full-featured Chat Pro with TTS, Settings, Attach
// ============================================================

(function() {
  "use strict";

  // ---------- DOM refs ----------
  const chat = document.getElementById('chat');
  const input = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendButton');
  const fileInput = document.getElementById('fileInput');
  const filePreview = document.getElementById('filePreview');
  const fileName = document.getElementById('fileName');
  const attachBtn = document.querySelector('.attach-button') || document.getElementById('attachButton');

  // ---------- State ----------
  let selectedFile = null;
  let isSending = false;
  let currentAbortController = null;   // for quick reply

  // Speech synthesis
  let speechSynth = window.speechSynthesis;

  // ---------- Settings ----------
  const settings = {
    autoSpeak: false,
    rate: 1.0,
    pitch: 1.0,
    theme: 'dark',          // 'dark' or 'light'
    sound: false,
    autoSend: false,
  };

  // ---------- Load / Save settings ----------
  function loadSettings() {
    try {
      const saved = localStorage.getItem('chatProSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(settings, parsed);
      }
    } catch (_) {}
    applySettings();
  }

  function saveSettings() {
    try {
      localStorage.setItem('chatProSettings', JSON.stringify(settings));
    } catch (_) {}
  }

  function applySettings() {
    // Theme
    document.body.classList.toggle('light', settings.theme === 'light');

    // Auto-speak toggle (if we have the button)
    const speakerBtn = document.getElementById('globalSpeakerBtn');
    if (speakerBtn) {
      speakerBtn.classList.toggle('active', settings.autoSpeak);
    }

    // Update UI toggles if they exist
    const toggles = {
      autoSpeakToggle: settings.autoSpeak,
      themeToggle: settings.theme === 'light',
      soundToggle: settings.sound,
      autoSendToggle: settings.autoSend,
    };
    for (const [id, val] of Object.entries(toggles)) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('active', val);
    }

    // Sliders
    const rateSlider = document.getElementById('speechRate');
    const pitchSlider = document.getElementById('speechPitch');
    if (rateSlider) rateSlider.value = settings.rate;
    if (pitchSlider) pitchSlider.value = settings.pitch;
    updateRateDisplay();
    updatePitchDisplay();
  }

  // ---------- UI creation (if elements missing) ----------
  function ensureUIElements() {
    // 1. Header actions (speaker + settings)
    const header = document.querySelector('header');
    if (header && !document.getElementById('headerActions')) {
      const actions = document.createElement('div');
      actions.id = 'headerActions';
      actions.className = 'header-actions';
      actions.innerHTML = `
        <button id="globalSpeakerBtn" class="speaker-btn" title="Auto‑speak replies">🔊</button>
        <button id="settingsToggle" title="Settings">⚙️</button>
      `;
      header.appendChild(actions);
    }

    // 2. Settings modal (if not present)
    if (!document.getElementById('settingsOverlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'settingsOverlay';
      overlay.className = 'settings-overlay';
      overlay.innerHTML = `
        <div class="settings-modal">
          <h2>
            ⚙️ Settings
            <button class="close-settings" id="closeSettingsBtn">✕</button>
          </h2>
          <div class="setting-group">
            <label>
              <span>🔊 Auto‑speak replies</span>
              <span class="toggle" id="autoSpeakToggle"></span>
            </label>
            <div class="desc">Automatically read assistant messages aloud</div>
          </div>
          <div class="setting-group">
            <label>⏱️ Speed</label>
            <input type="range" id="speechRate" min="0.5" max="2.0" step="0.1" value="1.0" />
            <div class="range-values">
              <span>Slow</span>
              <span id="rateDisplay">1.0×</span>
              <span>Fast</span>
            </div>
          </div>
          <div class="setting-group">
            <label>🎵 Pitch</label>
            <input type="range" id="speechPitch" min="0.5" max="1.5" step="0.1" value="1.0" />
            <div class="range-values">
              <span>Low</span>
              <span id="pitchDisplay">1.0</span>
              <span>High</span>
            </div>
          </div>
          <div class="setting-group">
            <label>
              <span>🌓 Dark / Light theme</span>
              <span class="toggle" id="themeToggle"></span>
            </label>
            <div class="desc">Switch between dark and light mode</div>
          </div>
          <div class="setting-group">
            <label>
              <span>🔔 Notification sounds</span>
              <span class="toggle" id="soundToggle"></span>
            </label>
            <div class="desc">Play a sound when a new message arrives</div>
          </div>
          <div class="setting-group">
            <label>
              <span>📎 Auto‑send attachments</span>
              <span class="toggle" id="autoSendToggle"></span>
            </label>
            <div class="desc">Automatically send message when you attach a file</div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    // 3. Add CSS for the new elements (if not already in index)
    if (!document.getElementById('appjs-styles')) {
      const style = document.createElement('style');
      style.id = 'appjs-styles';
      style.textContent = `
        .header-actions { display: flex; gap: 12px; align-items: center; }
        .header-actions button { background: transparent; border: none; color: var(--text, white); font-size: 26px; cursor: pointer; padding: 6px 8px; border-radius: 12px; transition: background 0.2s; line-height: 1; }
        .header-actions button:hover { background: var(--surface2, #2a2a2a); }
        .header-actions .speaker-btn.active { color: #4caf50; }
        .settings-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 1000; align-items: center; justify-content: center; padding: 20px; }
        .settings-overlay.open { display: flex; }
        .settings-modal { background: var(--surface, #1e1e1e); max-width: 480px; width: 100%; border-radius: 28px; padding: 32px 28px 28px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 1px solid var(--border, #3a3a3a); max-height: 90vh; overflow-y: auto; animation: fadeSlide 0.3s ease; color: var(--text, white); }
        .settings-modal h2 { font-size: 24px; font-weight: 600; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }
        .settings-modal .close-settings { margin-left: auto; background: transparent; border: none; font-size: 28px; color: var(--text-muted, #aaa); cursor: pointer; padding: 0 6px; }
        .settings-modal .close-settings:hover { color: var(--text, white); }
        .setting-group { margin-bottom: 22px; }
        .setting-group label { display: flex; align-items: center; justify-content: space-between; font-size: 16px; cursor: pointer; gap: 12px; }
        .setting-group .desc { color: var(--text-muted, #aaa); font-size: 14px; margin-top: 4px; }
        .setting-group input[type="range"] { width: 100%; margin: 6px 0 2px; accent-color: #4caf50; }
        .setting-group .range-values { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted, #aaa); }
        .toggle { position: relative; width: 48px; height: 26px; background: var(--border, #3a3a3a); border-radius: 30px; transition: background 0.3s; flex-shrink: 0; cursor: pointer; }
        .toggle.active { background: #4caf50; }
        .toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.3s; }
        .toggle.active::after { transform: translateX(22px); }
        .message .speak-msg-btn { background: transparent; border: none; color: var(--text-muted, #aaa); font-size: 18px; cursor: pointer; margin-left: 12px; padding: 0 4px; vertical-align: middle; transition: color 0.2s; }
        .message .speak-msg-btn:hover { color: #4caf50; }
        body.light { --bg: #f5f5f5; --surface: #ffffff; --surface2: #e8e8e8; --border: #cccccc; --text: #111111; --text-muted: #555555; --assistant-msg: #e0e0e0; --shadow: 0 8px 20px rgba(0,0,0,0.1); }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `;
      document.head.appendChild(style);
    }
  }

  // ---------- Message functions ----------
  function addMessage(text, type) {
    const msg = document.createElement('div');
    msg.className = `message ${type}`;

    if (type === 'assistant') {
      // Assistant message: text + speak button
      const span = document.createElement('span');
      span.textContent = text;
      const speakBtn = document.createElement('button');
      speakBtn.className = 'speak-msg-btn';
      speakBtn.textContent = '🔊';
      speakBtn.title = 'Speak this message';
      speakBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        speakText(text);
      });
      msg.appendChild(span);
      msg.appendChild(speakBtn);
    } else {
      // User message: plain text
      msg.textContent = text;
    }

    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;

    // Auto-speak if enabled
    if (type === 'assistant' && settings.autoSpeak && text) {
      speakText(text);
    }

    // Notification sound if enabled
    if (type === 'assistant' && settings.sound) {
      playNotificationSound();
    }

    return msg;
  }

  // ---------- Speech synthesis ----------
  function speakText(text) {
    if (!window.speechSynthesis) return;
    if (speechSynth.speaking) speechSynth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.lang = 'en-US';
    speechSynth.speak(utterance);
  }

  // ---------- Notification sound ----------
  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (_) {}
  }

  // ---------- File handling ----------
  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Please choose under 10 MB.');
      event.target.value = '';
      return;
    }
    selectedFile = file;
    fileName.textContent = `📎 ${file.name}`;
    filePreview.style.display = 'flex';

    if (settings.autoSend && input.value.trim() !== '') {
      sendMessage();
    } else if (settings.autoSend) {
      input.focus();
    }
  }

  function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // ---------- Send message (with AbortController) ----------
  async function sendMessage() {
    const message = input.value.trim();
    if (!message && !selectedFile) return;
    if (isSending) {
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
    }

    // Build user display
    let userDisplay = message;
    if (selectedFile) {
      userDisplay += (userDisplay ? '\n\n' : '') + `📎 Attached: ${selectedFile.name}`;
    }
    addMessage(userDisplay, 'user');

    const fileToSend = selectedFile;
    const msgToSend = message;

    input.value = '';
    removeFile();

    setControlsDisabled(true);
    sendBtn.textContent = '...';
    isSending = true;

    const controller = new AbortController();
    currentAbortController = controller;
    const signal = controller.signal;

    // Thinking message
    const thinking = document.createElement('div');
    thinking.className = 'message assistant';
    thinking.textContent = 'Chat Pro is thinking... 🤖';
    chat.appendChild(thinking);
    chat.scrollTop = chat.scrollHeight;

    try {
      let fileData = null;
      if (fileToSend) {
        const base64 = await fileToBase64(fileToSend);
        fileData = { name: fileToSend.name, type: fileToSend.type, data: base64 };
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgToSend, file: fileData }),
        signal,
      });

      if (thinking.parentNode) thinking.remove();

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      const reply = data.reply || 'Sorry, I could not generate a reply.';
      addMessage(reply, 'assistant');

    } catch (error) {
      if (error.name === 'AbortError') {
        // silently ignore – new request is on its way
        if (thinking.parentNode) thinking.remove();
      } else {
        if (thinking.parentNode) thinking.remove();
        addMessage(`⚠️ Error: ${error.message || 'Something went wrong'}`, 'assistant');
      }
    } finally {
      isSending = false;
      currentAbortController = null;
      setControlsDisabled(false);
      sendBtn.textContent = 'Send';
      input.focus();
    }
  }

  function setControlsDisabled(disabled) {
    input.disabled = disabled;
    sendBtn.disabled = disabled;
    if (attachBtn) attachBtn.disabled = disabled;
  }

  // ---------- Settings UI events ----------
  function setupSettingsUI() {
    // Toggle clicks
    const toggleMap = {
      autoSpeakToggle: 'autoSpeak',
      themeToggle: 'theme',
      soundToggle: 'sound',
      autoSendToggle: 'autoSend',
    };
    for (const [elId, key] of Object.entries(toggleMap)) {
      const el = document.getElementById(elId);
      if (el) {
        el.addEventListener('click', function(e) {
          e.stopPropagation();
          if (key === 'theme') {
            settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
            document.body.classList.toggle('light', settings.theme === 'light');
            this.classList.toggle('active', settings.theme === 'light');
          } else {
            settings[key] = !settings[key];
            this.classList.toggle('active', settings[key]);
            if (key === 'autoSpeak') {
              const speakerBtn = document.getElementById('globalSpeakerBtn');
              if (speakerBtn) speakerBtn.classList.toggle('active', settings.autoSpeak);
              if (!settings.autoSpeak && speechSynth.speaking) speechSynth.cancel();
            }
          }
          saveSettings();
        });
      }
    }

    // Sliders
    const rateSlider = document.getElementById('speechRate');
    const pitchSlider = document.getElementById('speechPitch');
    if (rateSlider) {
      rateSlider.addEventListener('input', function() {
        settings.rate = parseFloat(this.value);
        document.getElementById('rateDisplay').textContent = this.value + '×';
        saveSettings();
      });
    }
    if (pitchSlider) {
      pitchSlider.addEventListener('input', function() {
        settings.pitch = parseFloat(this.value);
        document.getElementById('pitchDisplay').textContent = this.value;
        saveSettings();
      });
    }

    // Open/close settings
    const settingsToggle = document.getElementById('settingsToggle');
    const overlay = document.getElementById('settingsOverlay');
    const closeBtn = document.getElementById('closeSettingsBtn');
    if (settingsToggle && overlay) {
      settingsToggle.addEventListener('click', () => overlay.classList.add('open'));
      if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
      overlay.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
      });
    }

    // Global speaker button toggle
    const speakerBtn = document.getElementById('globalSpeakerBtn');
    if (speakerBtn) {
      speakerBtn.addEventListener('click', function() {
        settings.autoSpeak = !settings.autoSpeak;
        this.classList.toggle('active', settings.autoSpeak);
        const toggleEl = document.getElementById('autoSpeakToggle');
        if (toggleEl) toggleEl.classList.toggle('active', settings.autoSpeak);
        if (!settings.autoSpeak && speechSynth.speaking) speechSynth.cancel();
        saveSettings();
      });
    }
  }

  // ---------- Helpers for display ----------
  function updateRateDisplay() {
    const el = document.getElementById('rateDisplay');
    if (el) el.textContent = settings.rate + '×';
  }
  function updatePitchDisplay() {
    const el = document.getElementById('pitchDisplay');
    if (el) el.textContent = settings.pitch;
  }

  // ---------- Initialize ----------
  document.addEventListener('DOMContentLoaded', function() {
    // Ensure all UI elements exist
    ensureUIElements();

    // Load saved settings
    loadSettings();

    // Setup event listeners for settings
    setupSettingsUI();

    // Attach file input listener
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }

    // Remove file button
    const removeBtn = document.querySelector('.remove-file');
    if (removeBtn) {
      removeBtn.addEventListener('click', removeFile);
    }

    // Send button
    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    // Enter key
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Attach button trigger
    if (attachBtn) {
      attachBtn.addEventListener('click', function() {
        if (fileInput) fileInput.click();
      });
    }
  });

})();
