const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'css', 'style.css');
const appJsPath = path.join(__dirname, 'src', 'js', 'app.js');
const analyticsJsPath = path.join(__dirname, 'src', 'js', 'analytics.js');

// 1. Append CSS
const cssToAppend = `
/* ==========================================================================
   WOW-FACTOR ENHANCEMENTS
   ========================================================================== */

/* 1. Toast Notification System */
.toast-container {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  width: 100%;
  max-width: 420px;
  padding: 0 16px 80px;
  pointer-events: none;
}
.toast {
  background: rgba(15,22,17,0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-primary);
  font-size: 13.5px;
  line-height: 1.4;
  border-left: 3px solid;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
}
.toast.toast-visible {
  transform: translateY(0);
  opacity: 1;
}
.toast.toast-exit {
  transform: translateY(100%);
  opacity: 0;
}
.toast-success { border-left-color: var(--accent-mint); }
.toast-info { border-left-color: var(--accent-teal); }
.toast-warning { border-left-color: var(--accent-rose); }
.toast-neutral { border-left-color: var(--text-muted); }
.toast-icon { font-size: 20px; flex-shrink: 0; }
.toast-text { flex: 1; }
.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--accent-teal);
  border-radius: 0 0 12px 12px;
  animation: toast-progress-shrink linear forwards;
}
.toast-success .toast-progress { background: var(--accent-mint); }
.toast-warning .toast-progress { background: var(--accent-rose); }
.toast-neutral .toast-progress { background: var(--text-muted); }
@keyframes toast-progress-shrink { from { width: 100%; } to { width: 0; } }

/* 2. Emoji Quick Logger Row */
.emoji-quick-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px 8px 8px;
  margin-bottom: 4px;
}
.emoji-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  font-size: 24px;
  gap: 2px;
  animation: emoji-float 3s ease-in-out infinite;
}
.emoji-btn:nth-child(1) { animation-delay: 0s; }
.emoji-btn:nth-child(2) { animation-delay: 0.3s; }
.emoji-btn:nth-child(3) { animation-delay: 0.6s; }
.emoji-btn:nth-child(4) { animation-delay: 0.9s; }
.emoji-btn:nth-child(5) { animation-delay: 1.2s; }

.emoji-btn .emoji-label {
  font-size: 9px;
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.emoji-btn:hover {
  transform: scale(1.1) !important;
  border-color: var(--accent-lavender);
  animation-play-state: paused;
}
.emoji-btn:active {
  transform: scale(0.92) !important;
}
.emoji-btn.emoji-selected {
  border-color: var(--accent-teal);
  box-shadow: 0 0 20px rgba(255,209,102,0.35);
  transform: scale(1.15) !important;
  animation: emoji-bounce 0.5s ease;
}
@keyframes emoji-bounce { 
  0% { transform: scale(0.8); } 
  40% { transform: scale(1.25); } 
  70% { transform: scale(1.05); } 
  100% { transform: scale(1.15); } 
}
.emoji-btn::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--accent-teal) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.emoji-btn.emoji-selected::after { opacity: 0.4; }
@keyframes emoji-float { 
  0%, 100% { transform: translateY(0); } 
  50% { transform: translateY(-3px); } 
}

/* 3. Streak Counter */
.streak-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.streak-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255,209,102,0.15) 0%, rgba(255,139,148,0.1) 100%);
  border: 1px solid rgba(255,209,102,0.25);
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-teal);
}
.streak-flame {
  font-size: 18px;
  animation: flame-flicker 1s ease-in-out infinite alternate;
  display: inline-block;
}
@keyframes flame-flicker { 
  0% { transform: scale(1) rotate(-3deg); filter: brightness(1); } 
  50% { transform: scale(1.1) rotate(3deg); filter: brightness(1.3); } 
  100% { transform: scale(1.05) rotate(-2deg); filter: brightness(1.1); } 
}
.streak-number { font-weight: 700; font-size: 15px; }
.streak-label { font-size: 11px; color: rgba(255,255,255,0.7); font-weight: 400; }
.streak-milestone { animation: streak-shimmer 2s ease-in-out infinite; }
@keyframes streak-shimmer { 
  0%, 100% { box-shadow: 0 0 10px rgba(255,209,102,0.2); } 
  50% { box-shadow: 0 0 25px rgba(255,209,102,0.5); } 
}

/* 4. Confetti */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  overflow: hidden;
}
.confetti-piece {
  position: absolute;
  width: 8px;
  height: 8px;
  top: -10px;
  border-radius: 2px;
  animation: confetti-fall linear forwards;
}
@keyframes confetti-fall { 
  0% { transform: translateY(-10px) rotate(0deg); opacity: 1; } 
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } 
}

/* 5. Weather Banner */
.weather-banner {
  border-radius: var(--border-radius-md);
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-color);
}
.weather-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.12;
}
.weather-banner.weather-sunny::before { background: linear-gradient(135deg, #ffd166 0%, #ff8b94 50%, #ffd166 100%); background-size: 200% 200%; animation: weather-gradient-shift 4s ease infinite; }
.weather-banner.weather-rainy::before { background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%); background-size: 200% 200%; animation: weather-gradient-shift 4s ease infinite; }
.weather-banner.weather-cloudy::before { background: linear-gradient(135deg, #a8b5c8 0%, #7d8f9f 50%, #a8b5c8 100%); background-size: 200% 200%; animation: weather-gradient-shift 4s ease infinite; }
.weather-banner.weather-cold::before { background: linear-gradient(135deg, #74b9ff 0%, #a8e6cf 50%, #74b9ff 100%); background-size: 200% 200%; animation: weather-gradient-shift 4s ease infinite; }
@keyframes weather-gradient-shift { 
  0% { background-position: 0% 50%; } 
  50% { background-position: 100% 50%; } 
  100% { background-position: 0% 50%; } 
}
.weather-icon { font-size: 28px; z-index: 1; flex-shrink: 0; }
.weather-text { z-index: 1; flex: 1; }
.weather-text strong { display: block; font-size: 14px; margin-bottom: 2px; }
.weather-text small { color: var(--text-muted); font-size: 11.5px; }

/* 6. Smart Summary Card */
.smart-summary-card {
  border-radius: var(--border-radius-md);
  padding: 16px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  background: var(--bg-surface);
  border: 1px solid transparent;
}
.smart-summary-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--accent-lavender), var(--accent-teal), var(--accent-rose), var(--accent-lavender));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  animation: shimmer-rotate 4s linear infinite;
  background-size: 300% 300%;
}
@keyframes shimmer-rotate { 
  0% { background-position: 0% 50%; } 
  50% { background-position: 100% 50%; } 
  100% { background-position: 0% 50%; } 
}
.summary-icon { font-size: 22px; margin-right: 8px; vertical-align: middle; }
.summary-text { font-size: 13.5px; line-height: 1.6; color: var(--text-secondary); }
.summary-highlight { color: var(--accent-teal); font-weight: 600; }
.typewriter-line { opacity: 0; animation: typewriter-fade 0.5s ease forwards; }
@keyframes typewriter-fade { 
  from { opacity: 0; transform: translateY(4px); } 
  to { opacity: 1; transform: translateY(0); } 
}

/* 7. View Transitions & Micro-Animations */
.app-view {
  opacity: 0;
  transform: translateX(8px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  display: none;
}
.app-view.active {
  display: block;
  opacity: 1;
  transform: translateX(0);
}
.app-view.view-exit {
  opacity: 0;
  transform: translateX(-8px);
}
/* Stagger cards */
.app-view.active .card { opacity: 0; animation: card-stagger-in 0.4s ease forwards; }
.app-view.active .card:nth-child(1) { animation-delay: 0.05s; }
.app-view.active .card:nth-child(2) { animation-delay: 0.1s; }
.app-view.active .card:nth-child(3) { animation-delay: 0.15s; }
.app-view.active .card:nth-child(4) { animation-delay: 0.2s; }
.app-view.active .card:nth-child(5) { animation-delay: 0.25s; }
.app-view.active .card:nth-child(6) { animation-delay: 0.3s; }
@keyframes card-stagger-in { 
  from { opacity: 0; transform: translateY(12px); } 
  to { opacity: 1; transform: translateY(0); } 
}
/* Button interactions */
.btn { transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease; }
.btn:active { transform: scale(0.96); }
.btn-save-success { background: var(--accent-mint) !important; border-color: var(--accent-mint) !important; }
.custom-slider:active::-webkit-slider-thumb { box-shadow: 0 0 12px rgba(142,216,165,0.6); }

/* Quick fix for FontAwesome icon on print button */
#print-modal-btn .material-symbols-rounded { vertical-align: middle; }
`;

fs.appendFileSync(cssPath, cssToAppend);

// 2. Update Analytics
let analyticsContent = fs.readFileSync(analyticsJsPath, 'utf8');

const analyticsNewFunction = `

  /**
   * Generates a smart daily insight based on recent data
   * @param {Array} logs - Array of all logs
   * @returns {Object} { icon, text, type }
   */
  getDailyInsight(logs) {
    if (!logs || logs.length === 0) {
      return { icon: '👋', text: 'Welcome! Log your first day to start building your personal pattern library.', type: 'neutral' };
    }

    const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedLogs.slice(0, 3);
    
    // Check for consecutive high pain
    if (recent.length === 3 && recent.every(l => l.painLevel >= 7)) {
      return { icon: '⚠️', text: 'You\\'ve had 3 consecutive high-pain days. Consider strict rest today: 10min active / 30min rest. You\\'re doing great by tracking through this.', type: 'warning' };
    }

    // Check week best
    const weeklyBlocks = this.getWeeklyBlocks(logs);
    if (weeklyBlocks.length >= 2) {
      const currentWeek = this.getWeekDetails(weeklyBlocks[0]);
      let isBest = true;
      for (let i = 1; i < weeklyBlocks.length; i++) {
        if (this.getWeekDetails(weeklyBlocks[i]).avgPain <= currentWeek.avgPain) {
          isBest = false;
          break;
        }
      }
      if (isBest && currentWeek.avgPain > 0) {
        return { icon: '🎉', text: \`This is your best week in \${weeklyBlocks.length * 7} days! Average pain: \${currentWeek.avgPain.toFixed(1)}/10. Whatever you\\'re doing, keep it up!\`, type: 'celebration' };
      }
    }

    // Check pain trend
    if (sortedLogs.length >= 6) {
      const current3 = sortedLogs.slice(0, 3).reduce((sum, l) => sum + l.painLevel, 0) / 3;
      const prior3 = sortedLogs.slice(3, 6).reduce((sum, l) => sum + l.painLevel, 0) / 3;
      
      if (prior3 - current3 > 0.5) {
        return { icon: '📉', text: \`Your pain has been trending down over the last 3 days (avg \${prior3.toFixed(1)} → \${current3.toFixed(1)}). Great progress!\`, type: 'positive' };
      } else if (current3 - prior3 > 0.5) {
        return { icon: '📈', text: \`Pain has been creeping up (avg \${prior3.toFixed(1)} → \${current3.toFixed(1)}). Consider extra rest and pacing today.\`, type: 'warning' };
      }
    }

    // Check correlations
    const correlations = this.calculateCorrelations(logs);
    if (correlations.length > 0 && correlations[0].correlation > 0) {
      return { icon: '🧠', text: \`Pattern spotted: <span class="summary-highlight">\${correlations[0].tag}</span> is associated with \${Math.round(correlations[0].correlation)}% higher pain. Consider monitoring this trigger.\`, type: 'neutral' };
    }

    return { icon: '💜', text: 'Keep logging to build your personal pattern library. Every entry helps find your triggers.', type: 'neutral' };
  }
`;

// Insert the new function before the return object in FibroAnalytics
analyticsContent = analyticsContent.replace(/(\s*)(return\s*{\s*getBasicStats,)/, analyticsNewFunction + '$1$2\n    getDailyInsight,');
fs.writeFileSync(analyticsJsPath, analyticsContent);

// 3. Update app.js
let appContent = fs.readFileSync(appJsPath, 'utf8');

// Replace alerts with showToast
appContent = appContent.replace(/alert\(\`WhatsApp Phone Number saved: \${val \|\| 'None'}\`\);/, "showToast(`WhatsApp Phone Number saved: ${val || 'None'}`, 'success');");
appContent = appContent.replace(/alert\(alertMsg\);/, "showToast('SOS Crisis Logged! Widespread severe flare recorded.', 'warning');");
appContent = appContent.replace(/alert\("Symptoms successfully saved offline!"\);/, "showToast('Symptoms successfully saved offline!', 'success'); hapticFeedback('success');");
appContent = appContent.replace(/alert\("Perfect! HithaFlow notifications are now active."\);/, "showToast('Perfect! HithaFlow notifications are now active.', 'success');");
appContent = appContent.replace(/alert\("Please allow notifications to test the quick-log card."\);/, "showToast('Please allow notifications to test the quick-log card.', 'warning');");
appContent = appContent.replace(/alert\("Notification triggered! .*?"\);/g, "showToast('Notification triggered! (System notifications are blocked or unsupported on this browser.)', 'info');");

// WhatsApp polling interval from 15000 to 60000
appContent = appContent.replace(/setInterval\(syncWhatsAppLogs, 15000\);/, "setInterval(syncWhatsAppLogs, 60000);");

// Add Utilities to the end of app.js (before the last `});`)
const utilitiesCode = `

  // ==========================================
  // WOW-FACTOR UTILITIES & ENHANCEMENTS
  // ==========================================

  window.showToast = function(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = \`toast toast-\${type}\`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'warning') icon = 'warning';
    
    toast.innerHTML = \`
      <span class="material-symbols-rounded toast-icon">\${icon}</span>
      <span class="toast-text">\${message}</span>
      <div class="toast-progress" style="animation-duration: \${duration}ms"></div>
    \`;
    
    container.appendChild(toast);
    
    // Force reflow
    void toast.offsetWidth;
    toast.classList.add('toast-visible');
    
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  };

  window.hapticFeedback = function(pattern = 'light') {
    if (!navigator.vibrate) return;
    try {
      if (pattern === 'light') navigator.vibrate(10);
      else if (pattern === 'medium') navigator.vibrate(20);
      else if (pattern === 'heavy') navigator.vibrate(40);
      else if (pattern === 'success') navigator.vibrate([20, 30, 20]);
      else if (pattern === 'error') navigator.vibrate([50, 50, 50]);
    } catch(e) {}
  };

  function updateStreakCounter() {
    const container = document.getElementById('streak-container');
    const streakNumEl = document.getElementById('streak-number');
    const streakBadge = document.getElementById('streak-badge');
    if (!container || !appState.logs || appState.logs.length === 0) return;
    
    const sortedLogs = [...appState.logs].sort((a,b) => new Date(b.date) - new Date(a.date));
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0,0,0,0);
    
    // Check if logged today or yesterday to start streak
    const lastLogDate = new Date(sortedLogs[0].date);
    lastLogDate.setHours(0,0,0,0);
    
    const diffTime = Math.abs(currentDate - lastLogDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      container.style.display = 'none';
      return;
    }
    
    // Count consecutive days
    streak = 1;
    for (let i = 0; i < sortedLogs.length - 1; i++) {
      const curr = new Date(sortedLogs[i].date);
      const next = new Date(sortedLogs[i+1].date);
      curr.setHours(0,0,0,0);
      next.setHours(0,0,0,0);
      
      const diff = Math.floor((curr - next) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak++;
      else if (diff === 0) continue; // Same day log
      else break;
    }
    
    streakNumEl.textContent = streak;
    container.style.display = 'flex';
    
    // Milestone Celebration
    if ([7, 14, 30, 50, 100].includes(streak) && diffDays === 0) {
      streakBadge.classList.add('streak-milestone');
      // Show confetti if just logged today
      const now = new Date();
      if (now.getTime() - new Date(sortedLogs[0].timestamp || now).getTime() < 5000) {
        triggerConfetti();
      }
    } else {
      streakBadge.classList.remove('streak-milestone');
    }
  }

  function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    const colors = ['#ff8b94', '#ffd166', '#8ed8a5', '#06d6a0'];
    for (let i = 0; i < 50; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti-piece';
      conf.style.left = Math.random() * 100 + 'vw';
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.animationDuration = (Math.random() * 2 + 2) + 's';
      conf.style.animationDelay = (Math.random() * 1) + 's';
      container.appendChild(conf);
    }
    setTimeout(() => { container.innerHTML = ''; }, 4000);
  }

  function updateSmartSummary() {
    const card = document.getElementById('smart-summary-card');
    const iconEl = document.getElementById('summary-icon');
    const textEl = document.getElementById('summary-text');
    if (!card || !FibroAnalytics.getDailyInsight) return;
    
    const insight = FibroAnalytics.getDailyInsight(appState.logs);
    iconEl.textContent = insight.icon;
    textEl.innerHTML = \`<span class="typewriter-line">\${insight.text}</span>\`;
    card.style.display = 'block';
  }

  async function fetchWeatherContext() {
    const banner = document.getElementById('weather-banner');
    const iconEl = document.getElementById('weather-icon');
    const titleEl = document.getElementById('weather-title');
    const detailEl = document.getElementById('weather-detail');
    
    if (!navigator.geolocation) return;
    
    banner.style.display = 'flex';
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        // Open-Meteo is free and requires no API key
        const res = await fetch(\`https://api.open-meteo.com/v1/forecast?latitude=\${latitude}&longitude=\${longitude}&current_weather=true\`);
        const data = await res.json();
        
        const weatherCode = data.current_weather.weathercode;
        const temp = data.current_weather.temperature;
        
        let type = 'clear';
        let icon = '☀️';
        let text = 'Clear and sunny.';
        let detail = 'Enjoy the good weather today.';
        
        // Simple WMO weather code mapping
        if (weatherCode >= 1 && weatherCode <= 3) { type = 'cloudy'; icon = '☁️'; text = 'Cloudy / Overcast.'; detail = 'Barometric shifts might affect you.'; }
        if (weatherCode >= 45 && weatherCode <= 48) { type = 'cloudy'; icon = '🌫️'; text = 'Foggy conditions.'; detail = 'Keep warm and take it easy.'; }
        if (weatherCode >= 51 && weatherCode <= 67) { type = 'rainy'; icon = '🌧️'; text = 'Rainy today.'; detail = 'Many fibro warriors report increased pain on rainy days. Be gentle.'; }
        if (weatherCode >= 71 && weatherCode <= 77) { type = 'cold'; icon = '❄️'; text = 'Snow/Cold.'; detail = 'Cold snaps can cause muscle stiffness.'; }
        if (weatherCode >= 80) { type = 'rainy'; icon = '⛈️'; text = 'Showers / Storms.'; detail = 'Significant pressure drops. Expect potential flare-ups.'; }
        
        // Auto-tag weather
        appState.currentWeatherTag = type === 'rainy' || type === 'cold' ? 'Weather Shift' : null;
        
        iconEl.textContent = icon;
        titleEl.textContent = \`\${text} (\${temp}°C)\`;
        detailEl.textContent = detail;
        
        banner.className = \`weather-banner weather-\${type}\`;
      } catch (err) {
        banner.style.display = 'none';
      }
    }, () => {
      // Location denied or error
      banner.style.display = 'none';
    });
  }

  function initEmojiLogger() {
    const btns = document.querySelectorAll('.emoji-btn');
    if (!btns.length) return;
    
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        hapticFeedback('medium');
        
        // Visual selection
        btns.forEach(b => b.classList.remove('emoji-selected'));
        btn.classList.add('emoji-selected');
        
        // Update sliders
        const p = parseInt(btn.getAttribute('data-pain'));
        const f = parseInt(btn.getAttribute('data-fatigue'));
        const label = btn.getAttribute('data-label');
        
        document.getElementById('pain-slider').value = p;
        document.getElementById('fatigue-slider').value = f;
        
        // Trigger slider input events to update badges
        document.getElementById('pain-slider').dispatchEvent(new Event('input'));
        document.getElementById('fatigue-slider').dispatchEvent(new Event('input'));
        
        showToast(\`Logged \${btn.querySelector('span').textContent} \${label}! You've got this, Hitha.\`, 'success');
        
        // Auto-save
        setTimeout(() => {
          document.getElementById('save-daily-log').click();
        }, 600);
      });
    });
  }
`;

appContent = appContent.replace(/(\n}\);\n*)$/, utilitiesCode + '\n$1');

// Inject into initApp()
// Find initApp function and insert calls at the end before its closing brace
appContent = appContent.replace(/(function initApp\(\) \{[\s\S]*?)(\n  \}\n\n  \/\/ Programmatically)/, `$1
    
    // WOW-FACTOR INITIALIZATION
    updateStreakCounter();
    updateSmartSummary();
    fetchWeatherContext();
    initEmojiLogger();
    
    // Add haptic feedback to main buttons
    document.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('click', () => {
        if (!b.id.includes('save')) hapticFeedback('light');
      });
    });
$2`);

// Inject view transitions into navigateToView
appContent = appContent.replace(/(function navigateToView\(targetId\) \{[\s\S]*?)(views\.forEach\(v => \{[\s\S]*?\n      \}\n    \}\);)/, `$1// Apply exit animation first
    views.forEach(v => {
      if (v.classList.contains('active') && v.id !== targetId) {
        v.classList.add('view-exit');
        setTimeout(() => {
          v.classList.remove('active', 'view-exit');
        }, 200);
      }
    });

    // Enter animation after slight delay
    setTimeout(() => {
      views.forEach(v => {
        if (v.id === targetId) {
          v.classList.add('active');
        }
      });
      
      // Trigger view-specific re-renders
      if (targetId === 'view-insights') renderInsightsDashboard();
      else if (targetId === 'view-toolkit') updatePacingCalculator();
      else if (targetId === 'view-today') { updateStreakCounter(); updateSmartSummary(); }
    }, 200);
    
    // Removed old synchronous view toggling
    /* `);
appContent = appContent.replace(/(    \}\n  \}\n\n  \/\/ Router)/, `    */$1`);


// Update saveDailyLog to add weather tag
appContent = appContent.replace(/(const logEntry = \{)/, `if (appState.currentWeatherTag && !tags.includes(appState.currentWeatherTag)) {
      tags.push(appState.currentWeatherTag);
    }
    
    $1`);

// Update saveDailyLog success button morph
appContent = appContent.replace(/(const saveBtn = document\.getElementById\('save-daily-log'\);)/, `$1
    const originalContent = saveBtn.innerHTML;
    saveBtn.classList.add('btn-save-success');
    saveBtn.innerHTML = '<span class="material-symbols-rounded">check_circle</span><span>Saved!</span>';
    setTimeout(() => {
      saveBtn.classList.remove('btn-save-success');
      saveBtn.innerHTML = originalContent;
      // Refresh summaries
      updateStreakCounter();
      updateSmartSummary();
    }, 2000);`);


fs.writeFileSync(appJsPath, appContent);
console.log('Update script executed successfully');
