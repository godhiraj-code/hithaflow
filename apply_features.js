const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'css', 'style.css');
const appJsPath = path.join(__dirname, 'src', 'js', 'app.js');
const storageJsPath = path.join(__dirname, 'src', 'js', 'storage.js');
const htmlPath = path.join(__dirname, 'index.html');

// --- 1. UPDATE STORAGE.JS ---
let storageContent = fs.readFileSync(storageJsPath, 'utf8');

// Add getDailyState and saveDailyState
const dailyStateCode = `
  getDailyState() {
    try {
      const state = JSON.parse(localStorage.getItem('fibroflow_daily_state'));
      const today = new Date().toISOString().slice(0,10);
      if (state && state.date === today) return state;
      // Reset if new day
      return { date: today, spoonsSpent: 0, morningMeds: false, nightMeds: false };
    } catch(e) {
      return { date: new Date().toISOString().slice(0,10), spoonsSpent: 0, morningMeds: false, nightMeds: false };
    }
  },
  saveDailyState(state) {
    localStorage.setItem('fibroflow_daily_state', JSON.stringify(state));
  },
`;

if (!storageContent.includes('getDailyState')) {
  storageContent = storageContent.replace(/getCustomTags\(\) \{/, dailyStateCode + '\n  getCustomTags() {');
  fs.writeFileSync(storageJsPath, storageContent);
}

// --- 2. UPDATE INDEX.HTML ---
let htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Add html2pdf
if (!htmlContent.includes('html2pdf.bundle.min.js')) {
  htmlContent = htmlContent.replace(/<\/head>/, `  <!-- HTML2PDF -->\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>\n</head>`);
}

// Add Spoon Jar, Survival Kit, Med Tracker
const newTodayCards = `
      <!-- Spoon Theory Budgeting -->
      <div class="card spoon-jar-card">
        <div class="card-header">
          <h3>Daily Energy Budget</h3>
          <span class="badge" id="spoons-count-badge">24 / 24</span>
        </div>
        <div class="spoon-jar" id="spoon-jar">
          <!-- Spoons injected by JS -->
        </div>
        <div class="spoon-actions">
          <button class="btn btn-secondary btn-sm" onclick="spendSpoons(1)">Shower (-1)</button>
          <button class="btn btn-secondary btn-sm" onclick="spendSpoons(2)">Errands (-2)</button>
          <button class="btn btn-secondary btn-sm" onclick="spendSpoons(4)">Work (-4)</button>
        </div>
      </div>

      <!-- Medication Tracker -->
      <div class="card med-tracker-card">
        <h3>Daily Medications</h3>
        <div class="med-toggles">
          <label class="custom-checkbox-container">
            <input type="checkbox" id="med-morning">
            <span class="checkmark"></span>
            Morning Meds
          </label>
          <label class="custom-checkbox-container">
            <input type="checkbox" id="med-night">
            <span class="checkmark"></span>
            Night Meds
          </label>
        </div>
      </div>

      <!-- Flare-Up Survival Kit -->
      <div class="card survival-kit-card" id="survival-kit" style="display:none;">
        <div class="survival-header">
          <span class="material-symbols-rounded text-bad">emergency</span>
          <h3>Flare-Up Action Plan</h3>
        </div>
        <p class="description">Your pain is high. Please prioritize these steps right now:</p>
        <ul class="survival-list">
          <li>Take prescribed breakthrough medication.</li>
          <li>Drink 16oz of water immediately.</li>
          <li>Find a quiet, dark space and lie down.</li>
          <li>Use a heating pad or ice pack on pain centers.</li>
          <li>Cancel non-essential tasks for the rest of the day.</li>
        </ul>
      </div>
`;

if (!htmlContent.includes('spoon-jar-card')) {
  htmlContent = htmlContent.replace(/(<!-- Quick Pain Level Logger -->)/, newTodayCards + '\n      $1');
}

// Add PDF Export button
if (!htmlContent.includes('export-pdf-btn')) {
  htmlContent = htmlContent.replace(/(<h2>Your Insights & Patterns<\/h2>)/, `$1\n        <button id="export-pdf-btn" class="btn btn-text btn-sm"><span class="material-symbols-rounded">picture_as_pdf</span> Export Report</button>`);
}

// Add Spoons Setting
if (!htmlContent.includes('max-spoons-input')) {
  htmlContent = htmlContent.replace(/(<div class="setting-item">\s*<div class="setting-label">\s*<span class="material-symbols-rounded">phone_iphone<\/span>)/, `<div class="setting-item">
          <div class="setting-label">
            <span class="material-symbols-rounded">restaurant</span>
            <div>
              <strong>Daily Spoons</strong>
              <small>Default energy units (e.g. 24 spoons = 24 hrs)</small>
            </div>
          </div>
          <div class="setting-action">
            <input type="number" id="max-spoons-input" class="custom-input" style="width: 70px" min="1" max="100" value="24">
            <button id="save-spoons-btn" class="btn btn-secondary">Save</button>
          </div>
        </div>
        $1`);
}

fs.writeFileSync(htmlPath, htmlContent);

// --- 3. UPDATE STYLE.CSS ---
let cssContent = fs.readFileSync(cssPath, 'utf8');

const newCSS = `
/* UI OVERHAUL: Spoon Theory */
.spoon-jar-card .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.spoon-jar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; min-height: 40px; }
.spoon-icon {
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(255,209,102,0.4));
  transition: all 0.3s ease;
}
.spoon-icon.spent {
  opacity: 0.2;
  filter: grayscale(1);
  transform: scale(0.9);
}
.spoon-actions { display: flex; gap: 8px; flex-wrap: wrap; }

/* UI OVERHAUL: Med Tracker */
.med-tracker-card { margin-bottom: 16px; }
.med-toggles { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.custom-checkbox-container {
  display: flex; align-items: center; gap: 12px; font-size: 14px; cursor: pointer; user-select: none;
  background: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 12px; transition: background 0.2s;
}
.custom-checkbox-container:active { transform: scale(0.98); }
.custom-checkbox-container input { display: none; }
.checkmark {
  width: 24px; height: 24px; border-radius: 8px; border: 2px solid rgba(255,255,255,0.2);
  display: flex; justify-content: center; align-items: center; transition: all 0.2s;
  box-shadow: inset 2px 2px 5px rgba(0,0,0,0.3); background: rgba(0,0,0,0.2);
}
.custom-checkbox-container input:checked ~ .checkmark {
  background: var(--accent-lavender); border-color: var(--accent-lavender);
}
.custom-checkbox-container input:checked ~ .checkmark::after {
  content: '✓'; color: #000; font-weight: bold; font-size: 14px;
}

/* UI OVERHAUL: Survival Kit */
.survival-kit-card {
  border: 1px solid rgba(255, 139, 148, 0.4) !important;
  background: rgba(40, 15, 20, 0.6) !important;
  box-shadow: 0 0 20px rgba(255, 139, 148, 0.15) !important;
  margin-bottom: 16px;
}
.survival-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.survival-header .material-symbols-rounded { font-size: 28px; animation: pulse-alert 2s infinite; }
@keyframes pulse-alert { 0% { opacity: 0.8; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.8; transform: scale(1); } }
.survival-list { margin-top: 12px; padding-left: 20px; font-size: 14px; color: var(--text-secondary); }
.survival-list li { margin-bottom: 6px; }

/* UI OVERHAUL: PDF Export Print Rules */
@media print {
  body { background: #fff !important; color: #000 !important; }
  .app-nav, .view-header button, .demo-banner { display: none !important; }
  .card { background: #fff !important; border: 1px solid #ccc !important; box-shadow: none !important; color: #000 !important; page-break-inside: avoid; }
  h2, h3, h4, p { color: #000 !important; }
  .sparkline-svg { stroke: #000 !important; }
}
`;

if (!cssContent.includes('.spoon-jar')) {
  cssContent += newCSS;
  fs.writeFileSync(cssPath, cssContent);
}

// --- 4. UPDATE APP.JS ---
let appContent = fs.readFileSync(appJsPath, 'utf8');

const jsInject = `
  // --- NEW FEATURE GLOBALS ---
  let dailyState = { date: '', spoonsSpent: 0, morningMeds: false, nightMeds: false };

  function initNewFeatures() {
    dailyState = FibroStorage.getDailyState();
    
    // Spoons Setup
    appState.settings.maxSpoons = appState.settings.maxSpoons || 24;
    renderSpoons();
    
    // Meds Setup
    const medMorning = document.getElementById('med-morning');
    const medNight = document.getElementById('med-night');
    if (medMorning) {
      medMorning.checked = dailyState.morningMeds;
      medMorning.addEventListener('change', (e) => {
        dailyState.morningMeds = e.target.checked;
        FibroStorage.saveDailyState(dailyState);
        hapticFeedback('light');
        if (e.target.checked) triggerConfettiSmall();
      });
    }
    if (medNight) {
      medNight.checked = dailyState.nightMeds;
      medNight.addEventListener('change', (e) => {
        dailyState.nightMeds = e.target.checked;
        FibroStorage.saveDailyState(dailyState);
        hapticFeedback('light');
        if (e.target.checked) triggerConfettiSmall();
      });
    }
    
    // Settings Spoons
    const maxSpoonsInput = document.getElementById('max-spoons-input');
    if (maxSpoonsInput) {
      maxSpoonsInput.value = appState.settings.maxSpoons;
      document.getElementById('save-spoons-btn').addEventListener('click', () => {
        appState.settings.maxSpoons = parseInt(maxSpoonsInput.value, 10);
        FibroStorage.saveSettings(appState.settings);
        showToast('Daily spoons updated!', 'success');
        renderSpoons();
      });
    }
    
    // PDF Export
    const pdfBtn = document.getElementById('export-pdf-btn');
    if (pdfBtn) {
      pdfBtn.addEventListener('click', exportPDF);
    }
    
    // Survival Kit Listener
    const painSlider = document.getElementById('pain-slider');
    if (painSlider) {
      painSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        const kit = document.getElementById('survival-kit');
        if (val >= 8) {
          if (kit.style.display !== 'block') {
            kit.style.display = 'block';
            hapticFeedback('error');
          }
        } else {
          kit.style.display = 'none';
        }
      });
    }
  }

  function triggerConfettiSmall() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
      const conf = document.createElement('div');
      conf.className = 'confetti-piece';
      conf.style.left = (Math.random() * 50 + 25) + 'vw';
      conf.style.backgroundColor = ['#8ed8a5', '#06d6a0', '#ffd166'][Math.floor(Math.random() * 3)];
      conf.style.animationDuration = (Math.random() * 1 + 1) + 's';
      container.appendChild(conf);
    }
  }

  window.spendSpoons = function(amount) {
    const max = appState.settings.maxSpoons;
    if (dailyState.spoonsSpent >= max) {
      showToast('You are out of spoons! Please rest.', 'warning');
      hapticFeedback('error');
      return;
    }
    
    dailyState.spoonsSpent += amount;
    if (dailyState.spoonsSpent > max) dailyState.spoonsSpent = max;
    FibroStorage.saveDailyState(dailyState);
    renderSpoons();
    hapticFeedback('medium');
    
    if (dailyState.spoonsSpent >= max) {
      showToast('Spoon budget depleted. Time to aggressively pace.', 'warning');
    }
  };

  function renderSpoons() {
    const jar = document.getElementById('spoon-jar');
    const badge = document.getElementById('spoons-count-badge');
    if (!jar) return;
    
    const max = appState.settings.maxSpoons;
    const spent = dailyState.spoonsSpent;
    const remaining = max - spent;
    
    badge.textContent = \`\${remaining} / \${max}\`;
    jar.innerHTML = '';
    
    for (let i = 0; i < max; i++) {
      const sp = document.createElement('span');
      sp.className = 'spoon-icon' + (i >= remaining ? ' spent' : '');
      sp.textContent = '🥄';
      jar.appendChild(sp);
    }
  }

  function exportPDF() {
    showToast('Generating Doctor Report PDF...', 'info');
    const element = document.getElementById('view-insights');
    
    // Check if html2pdf is loaded
    if (typeof html2pdf === 'undefined') {
      showToast('PDF Engine not loaded yet. Try again.', 'error');
      return;
    }

    // Temporary hide the download button
    document.getElementById('export-pdf-btn').style.display = 'none';

    var opt = {
      margin:       10,
      filename:     'HithaFlow_Insights_Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      document.getElementById('export-pdf-btn').style.display = 'inline-flex';
      showToast('Report Downloaded!', 'success');
    });
  }
`;

if (!appContent.includes('initNewFeatures()')) {
  // Inject globals and functions before DOMContentLoaded end
  appContent = appContent.replace(/(\}\);\n*)$/, jsInject + '\n$1');
  
  // Call initNewFeatures() inside initApp()
  appContent = appContent.replace(/(initEmojiLogger\(\);)/, `$1\n    initNewFeatures();`);
  
  fs.writeFileSync(appJsPath, appContent);
}

console.log('Features applied successfully');
