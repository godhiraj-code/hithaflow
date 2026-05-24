const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'css', 'style.css');
const appJsPath = path.join(__dirname, 'src', 'js', 'app.js');

// --- 1. UPDATE APP.JS ---
let appContent = fs.readFileSync(appJsPath, 'utf8');

// Remove fetchWeatherContext definition
appContent = appContent.replace(/async function fetchWeatherContext\(\) \{[\s\S]*?banner\.style\.display = 'none';\n    \}\);\n  \}/, '');

// Remove fetchWeatherContext call
appContent = appContent.replace(/fetchWeatherContext\(\);\n\s*/, '');

// Remove auto-tagging
appContent = appContent.replace(/if \(appState\.currentWeatherTag && !tags\.includes\(appState\.currentWeatherTag\)\) \{\n\s*tags\.push\(appState\.currentWeatherTag\);\n\s*\}\n\s*/, '');

// Add Fluid Nav Indicator logic inside navigateToView
const navIndicatorCode = `
    // Fluid Navigation Indicator Logic
    const indicator = document.getElementById('nav-indicator');
    if (indicator) {
      const activeBtn = document.querySelector('.app-nav .nav-item.active');
      if (activeBtn) {
        indicator.style.left = activeBtn.offsetLeft + 'px';
        indicator.style.width = activeBtn.offsetWidth + 'px';
      }
    }
`;
appContent = appContent.replace(/(navItems\.forEach\(item => \{[\s\S]*?\}\);\n)/, `$1${navIndicatorCode}`);

fs.writeFileSync(appJsPath, appContent);

// --- 2. UPDATE STYLE.CSS ---
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Remove weather banner CSS
cssContent = cssContent.replace(/\/\* 5\. Weather Banner \*\/[\s\S]*?\/\* 6\. Smart Summary Card \*\//, '/* 6. Smart Summary Card */');

// Apply Aurora Background to body
const auroraCSS = `
/* UI OVERHAUL: Aurora Background */
body {
  background: linear-gradient(-45deg, #070a08, #101613, #0a1014, #120e14);
  background-size: 400% 400%;
  animation: aurora-mesh 20s ease infinite;
}
@keyframes aurora-mesh {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;
// Insert right after body { margin:0; ... } block, or append it
cssContent += auroraCSS;

// Apply Soft UI / Claymorphism
const softUICSS = `
/* UI OVERHAUL: Soft UI / Claymorphism */
.card {
  background: rgba(22, 28, 24, 0.6) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
  box-shadow: 
    -8px -8px 16px rgba(255, 255, 255, 0.02),
    8px 8px 16px rgba(0, 0, 0, 0.4),
    inset 1px 1px 2px rgba(255, 255, 255, 0.05) !important;
  border-radius: 20px !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

.btn-primary, .btn-secondary, .btn-accent, .btn-danger, .emoji-btn {
  box-shadow: 
    -4px -4px 10px rgba(255, 255, 255, 0.03),
    4px 4px 10px rgba(0, 0, 0, 0.3),
    inset 1px 1px 1px rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px !important;
  border: none !important;
}
.emoji-btn { border-radius: 50% !important; }

.btn:active, .emoji-btn:active {
  box-shadow: 
    inset -2px -2px 5px rgba(255, 255, 255, 0.02),
    inset 4px 4px 10px rgba(0, 0, 0, 0.4) !important;
  transform: scale(0.95) !important;
}

.custom-input, .custom-textarea, .custom-select {
  background: rgba(10, 14, 12, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.02) !important;
  box-shadow: inset 4px 4px 8px rgba(0,0,0,0.4), inset -2px -2px 6px rgba(255,255,255,0.02) !important;
  border-radius: 12px !important;
}
`;
cssContent += softUICSS;

// Apply Fluid Navigation
const fluidNavCSS = `
/* UI OVERHAUL: Fluid Navigation Bar */
.app-nav {
  position: fixed;
  bottom: 0;
  width: 100%;
  max-width: 600px;
  background: rgba(15, 20, 18, 0.85);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  display: flex;
  justify-content: space-around;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 1000;
  border-top: 1px solid rgba(255,255,255,0.03);
  box-shadow: 0 -10px 30px rgba(0,0,0,0.3);
}
.nav-indicator {
  position: absolute;
  top: 4px;
  height: calc(100% - env(safe-area-inset-bottom) - 8px);
  background: rgba(142, 216, 165, 0.15); /* Sage green tint */
  border-radius: 16px;
  z-index: 0;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.app-nav .nav-item {
  position: relative;
  z-index: 1;
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  transition: color 0.3s ease;
}
.app-nav .nav-item.active {
  color: var(--accent-lavender); /* Sage green */
  transform: translateY(-2px);
}
.app-nav .nav-item.active .material-symbols-rounded {
  transform: scale(1.15);
  font-variation-settings: 'FILL' 1;
}
`;
cssContent += fluidNavCSS;

fs.writeFileSync(cssPath, cssContent);
console.log('Overhaul applied successfully.');
