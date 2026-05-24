/**
 * FibroFlow Core Application Coordinator
 */
document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let appState = {
    selectedTags: new Set(),
    selectedPainLocations: [],
    logs: [],
    settings: {},
    contacts: [],
    customTags: []
  };
  let dailyState = { date: '', spoonsSpent: 0, morningMeds: false, nightMeds: false };

  // 1. INITIALIZATION & ROUTING
  function initApp() {
    // Load database resources
    appState.logs = FibroStorage.getLogs();
    appState.settings = FibroStorage.getSettings();
    appState.contacts = FibroStorage.getContacts();
    appState.customTags = FibroStorage.getCustomTags();

    // Set greeting dynamically
    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) {
      greetingEl.textContent = `Hello, ${appState.settings.userName || 'Hitha'}`;
    }

    // Check accessibility layout settings (adaptive logic override)
    checkAdaptiveAccessibility();

    // Initialize Body Map Component
    FibroBodyMap.init('body-map-mount', (locations) => {
      appState.selectedPainLocations = locations;
    });

    // Bind clear map button
    const clearMapBtn = document.getElementById('clear-body-map');
    if (clearMapBtn) {
      clearMapBtn.addEventListener('click', () => {
        FibroBodyMap.clear();
      });
    }

    // Setup interactive routing listeners
    initRouter();
    
    // Setup slider badges
    initSliders();

    // Render components
    renderCustomTags();
    renderContactsList();
    renderInsightsDashboard();

    // Setup crisis SOS hold button
    initCrisisBtn();

    // Setup voice log triggers
    initVoiceLogger();

    // Setup print summary modal
    initDoctorSummary();
    
    // Bind main action button
    document.getElementById('save-daily-log').addEventListener('click', saveDailyLog);
    
    // WOW-FACTOR INITIALIZATION
    updateStreakCounter();
    updateSmartSummary();
    initEmojiLogger();
    initNewFeatures();
    
    // Add haptic feedback to main buttons
    document.querySelectorAll('.btn').forEach(b => {
      b.addEventListener('click', () => {
        if (!b.id.includes('save')) hapticFeedback('light');
      });
    });

  }

  // Programmatically transition tabs
  function navigateToView(targetId) {
    const navItems = document.querySelectorAll('.app-nav .nav-item');
    const views = document.querySelectorAll('.app-view');

    // Update nav items
    navItems.forEach(item => {
      if (item.getAttribute('data-target') === targetId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Fluid Navigation Indicator Logic
    const indicator = document.getElementById('nav-indicator');
    if (indicator) {
      const activeBtn = document.querySelector('.app-nav .nav-item.active');
      if (activeBtn) {
        indicator.style.left = activeBtn.offsetLeft + 'px';
        indicator.style.width = activeBtn.offsetWidth + 'px';
      }
    }

    // Update views with animations
    // Apply exit animation first
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
      if (targetId === 'view-insights') {
        renderInsightsDashboard();
      } else if (targetId === 'view-toolkit') {
        updatePacingCalculator();
      } else if (targetId === 'view-today') {
        updateStreakCounter();
        updateSmartSummary();
      }
    }, 200);
  }

  // Router for bottom tabs navigation
  function initRouter() {
    const navItems = document.querySelectorAll('.app-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.getAttribute('data-target');
        navigateToView(targetId);
      });
    });

    // Tag button click listeners
    const customTagsContainer = document.getElementById('custom-tags');
    if (customTagsContainer) {
      customTagsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tag')) {
          const tagVal = e.target.getAttribute('data-tag');
          e.target.classList.toggle('selected');
          
          if (appState.selectedTags.has(tagVal)) {
            appState.selectedTags.delete(tagVal);
          } else {
            appState.selectedTags.add(tagVal);
          }
        }
      });
    }

    // Add Custom Tag button bindings
    document.getElementById('add-tag-btn').addEventListener('click', addNewTag);
    document.getElementById('new-tag-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addNewTag();
    });

    // Add Custom Contacts bindings
    document.getElementById('save-contact-btn').addEventListener('click', saveNewContact);

    // Settings low cognition checkbox binding
    const accessibilityCheckbox = document.getElementById('toggle-low-cognition');
    accessibilityCheckbox.checked = appState.settings.lowCognitionMode;
    accessibilityCheckbox.addEventListener('change', (e) => {
      appState.settings.lowCognitionMode = e.target.checked;
      FibroStorage.saveSettings(appState.settings);
      toggleLowCognitionMode(e.target.checked);
    });

    // WhatsApp Phone Number binding
    const waPhoneInput = document.getElementById('wa-phone-number');
    const waPhoneSaveBtn = document.getElementById('btn-save-wa-phone');
    if (waPhoneInput && waPhoneSaveBtn) {
      waPhoneInput.value = appState.settings.waPhoneNumber || '';
      waPhoneSaveBtn.addEventListener('click', () => {
        const val = waPhoneInput.value.trim();
        appState.settings.waPhoneNumber = val;
        FibroStorage.saveSettings(appState.settings);
        showToast(`WhatsApp Phone Number saved: ${val || 'None'}`, 'success');
        if (val) {
          syncWhatsAppLogs();
        }
      });
    }

    // Settings Load Demo Data
    const loadDemoSettingsBtn = document.getElementById('load-demo-settings-btn');
    if (loadDemoSettingsBtn) {
      loadDemoSettingsBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to load 30 days of mock clinical data? This will overwrite your current settings and history.")) {
          appState.logs = FibroStorage.generateMockData();
          appState.customTags = FibroStorage.getCustomTags();
          renderCustomTags();
          navigateToView('view-insights');
        }
      });
    }

    // Settings Reset bindings
    document.getElementById('reset-database-btn').addEventListener('click', () => {
      if (confirm("Are you sure you want to delete all local logging data? This cannot be undone.")) {
        FibroStorage.resetDatabase();
        location.reload();
      }
    });

    // Template copy helpers
    document.querySelectorAll('.copy-tpl').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const text = document.getElementById(targetId).textContent;
        navigator.clipboard.writeText(text).then(() => {
          const original = btn.innerHTML;
          btn.innerHTML = `<span class="material-symbols-rounded" style="color:var(--accent-teal)">done</span>`;
          setTimeout(() => btn.innerHTML = original, 1500);
        });
      });
    });

    // Initialize Lock screen notifications and WhatsApp Bot
    initNotificationsAndWhatsApp();
  }

  // 2. SLIDERS CONTROLLER
  function initSliders() {
    const painSlider = document.getElementById('pain-slider');
    const painBadge = document.getElementById('pain-badge');
    const fatigueSlider = document.getElementById('fatigue-slider');
    const fatigueBadge = document.getElementById('fatigue-badge');

    const painLabels = ["None", "Minimal", "Mild", "Naggish", "Moderate", "Distracting", "Severe", "Very Severe", "Intense", "Excruciating", "Unbearable"];
    const fatigueLabels = ["Energetic", "Very Mild", "Mild", "Manageable", "Weary", "Fatigued", "Heavy Fatigue", "Very Heavy", "Exhausted", "Utterly Drained", "Severe Burnout"];

    function updatePainBadge(val) {
      painBadge.textContent = `${val} - ${painLabels[val]}`;
      // Visually adapt colors depending on slider value (safe green -> yellow -> critical rose)
      if (val >= 7) {
        painBadge.style.color = 'var(--accent-rose)';
        painBadge.style.background = 'rgba(255, 117, 143, 0.15)';
      } else if (val >= 4) {
        painBadge.style.color = '#f59e0b';
        painBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      } else {
        painBadge.style.color = 'var(--accent-teal)';
        painBadge.style.background = 'rgba(100, 223, 223, 0.15)';
      }
    }

    function updateFatigueBadge(val) {
      fatigueBadge.textContent = `${val} - ${fatigueLabels[val]}`;
      if (val >= 7) {
        fatigueBadge.style.color = 'var(--accent-rose)';
        fatigueBadge.style.background = 'rgba(255, 117, 143, 0.15)';
      } else if (val >= 4) {
        fatigueBadge.style.color = '#f59e0b';
        fatigueBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      } else {
        fatigueBadge.style.color = 'var(--accent-teal)';
        fatigueBadge.style.background = 'rgba(100, 223, 223, 0.15)';
      }
    }

    painSlider.addEventListener('input', (e) => updatePainBadge(e.target.value));
    fatigueSlider.addEventListener('input', (e) => updateFatigueBadge(e.target.value));

    // Seed defaults
    updatePainBadge(painSlider.value);
    updateFatigueBadge(fatigueSlider.value);
  }

  // 3. VOICE LOGGING SUPPORT (Web Speech API)
  function initVoiceLogger() {
    const voiceBtn = document.getElementById('voice-log-btn');
    const voiceStatus = document.getElementById('voice-status');
    const notesArea = document.getElementById('log-notes');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      voiceBtn.style.display = 'none';
      voiceStatus.textContent = "Voice logging not supported on this browser (use Chrome/Safari).";
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let isRecording = false;

    voiceBtn.addEventListener('click', () => {
      if (isRecording) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });

    recognition.onstart = () => {
      isRecording = true;
      voiceBtn.classList.add('recording');
      voiceBtn.querySelector('span:nth-child(2)').textContent = "Listening... Speak now";
      voiceStatus.textContent = "Say pain spots (e.g., neck, shoulders) or triggers (e.g., poor sleep, rainy).";
    };

    recognition.onerror = (e) => {
      console.error(e);
      stopRecording();
    };

    recognition.onend = () => {
      stopRecording();
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) {
        notesArea.value = notesArea.value 
          ? notesArea.value + ' ' + transcript 
          : transcript;
        
        // Empathetic NLP parser: automatically scan transcript for triggers / locations
        parseVoiceSymptoms(transcript);
      }
    };

    function stopRecording() {
      isRecording = false;
      voiceBtn.classList.remove('recording');
      voiceBtn.querySelector('span:nth-child(2)').textContent = "Tap to log with voice (No typing)";
      voiceStatus.textContent = "Voice log appended. You can tap again to record more.";
    }

    function parseVoiceSymptoms(text) {
      const clean = text.toLowerCase();
      
      // Keywords for body map
      const bodyMapKeywords = {
        head: ['head', 'headache', 'migraine', 'face'],
        occiput: ['head', 'headache', 'migraine', 'face'],
        neck: ['neck', 'cervical', 'throat'],
        neckBack: ['neck', 'cervical', 'throat'],
        leftShoulder: ['left shoulder', 'left collarbone'],
        leftShoulderBack: ['left shoulder', 'left collarbone'],
        rightShoulder: ['right shoulder', 'right collarbone'],
        rightShoulderBack: ['right shoulder', 'right collarbone'],
        chest: ['chest', 'sternum', 'ribs'],
        abdomen: ['stomach', 'abdomen', 'tummy', 'belly'],
        leftArm: ['left arm', 'left elbow', 'left wrist', 'left hand'],
        leftArmBack: ['left arm', 'left elbow', 'left wrist', 'left hand'],
        rightArm: ['right arm', 'right elbow', 'right wrist', 'right hand'],
        rightArmBack: ['right arm', 'right elbow', 'right wrist', 'right hand'],
        hips: ['hip', 'pelvis', 'groin'],
        gluteals: ['butt', 'gluteals', 'tailbone'],
        leftLeg: ['left leg', 'left knee', 'left ankle', 'left foot'],
        leftLegBack: ['left leg', 'left knee', 'left ankle', 'left foot'],
        rightLeg: ['right leg', 'right knee', 'right ankle', 'right foot'],
        rightLegBack: ['right leg', 'right knee', 'right ankle', 'right foot'],
        upperBack: ['upper back', 'thoracic'],
        lowerBack: ['lower back', 'lumbar', 'spine stiffness']
      };

      for (const [regionId, words] of Object.entries(bodyMapKeywords)) {
        if (words.some(word => clean.includes(word))) {
          FibroBodyMap.toggleRegion(regionId);
        }
      }

      // Keywords for tags selection
      const tagsKeywords = {
        'Restless Sleep': ['restless sleep', 'poor sleep', 'tossed and turned', 'bad sleep', 'didn\'t sleep well'],
        'Insomnia': ['insomnia', 'can\'t sleep', 'could not sleep', 'awake all night'],
        'Slept Well': ['slept well', 'rested', 'deep sleep', 'woke up refreshed'],
        'Rainy/Damp': ['rainy', 'raining', 'damp', 'humid', 'stormy'],
        'Cold Flare': ['cold front', 'chilly', 'freezing', 'cold weather'],
        'Barometric Drop': ['pressure drop', 'barometric', 'weather change'],
        'Gentle Yoga': ['yoga', 'stretching', 'gentle yoga', 'mild exercise'],
        'Walked Outside': ['walked', 'walking', 'fresh air', 'outside stroll'],
        'Work Stress': ['work stress', 'stressed at work', 'busy day', 'deadlines', 'boss'],
        'Social Burnout': ['socially tired', 'social burnout', 'drained from talking', 'peopled out']
      };

      for (const [tagVal, words] of Object.entries(tagsKeywords)) {
        if (words.some(word => clean.includes(word))) {
          if (!appState.customTags.includes(tagVal)) {
            appState.customTags = FibroStorage.saveCustomTag(tagVal);
            renderCustomTags();
          }
          const tagBtn = document.querySelector(`.tag[data-tag="${tagVal}"]`);
          if (tagBtn && !tagBtn.classList.contains('selected')) {
            tagBtn.classList.add('selected');
            appState.selectedTags.add(tagVal);
          }
        }
      }
    }
  }

  // 4. PERSISTENT FLOATING CRISIS BUTTON (3-second hold)
  function initCrisisBtn() {
    const crisisBtn = document.getElementById('btn-crisis');
    const progressCircle = document.querySelector('.progress-ring__circle');
    
    let holdTimer = null;
    let holdCount = 0;
    const holdDurationNeeded = 3000; // 3 seconds
    const intervalMs = 50;
    const circumference = 2 * Math.PI * 32; // Radius is 32

    progressCircle.style.strokeDasharray = circumference;
    progressCircle.style.strokeDashoffset = circumference;

    function startHolding(e) {
      e.preventDefault();
      holdCount = 0;
      
      // Real-time ticking hold interval
      holdTimer = setInterval(() => {
        holdCount += intervalMs;
        const pct = Math.min(holdCount / holdDurationNeeded, 1);
        const offset = circumference - (pct * circumference);
        progressCircle.style.strokeDashoffset = offset;

        if (holdCount >= holdDurationNeeded) {
          triggerCrisisSOS();
          endHolding();
        }
      }, intervalMs);
    }

    function endHolding() {
      if (holdTimer) {
        clearInterval(holdTimer);
        holdTimer = null;
      }
      progressCircle.style.strokeDashoffset = circumference; // reset ring
    }

    crisisBtn.addEventListener('mousedown', startHolding);
    crisisBtn.addEventListener('touchstart', startHolding);
    
    window.addEventListener('mouseup', endHolding);
    window.addEventListener('touchend', endHolding);
  }

  function triggerCrisisSOS() {
    // 1. Log severe symptoms immediately
    const today = new Date().toISOString().split('T')[0];
    const crisisLog = {
      date: today,
      timestamp: Date.now(),
      painLevel: 9,
      fatigueLevel: 9,
      painLocations: ["head", "neckBack", "upperBack", "lowerBack", "hips"],
      tags: ["Restless Sleep", "Barometric Drop", "Social Burnout"],
      notes: "CRISIS SOS MODE TRIGGERED. Widespread flare logged automatically via emergency button hold."
    };

    appState.logs = FibroStorage.saveLog(crisisLog);
    
    // 2. Alert Contacts Visual Popup
    let alertMsg = "SOS Crisis Logged! Widespread severe flare recorded.\n\n";
    if (appState.contacts.length > 0) {
      const primaryContact = appState.contacts[0];
      alertMsg += `Dispatched notification to: ${primaryContact.name} (${primaryContact.phone})\n`;
      alertMsg += `Message: "Having a severe flare, need assistance."`;
    } else {
      alertMsg += "Add support contacts under the Support tab to auto-message them next time.";
    }
    
    showToast('SOS Crisis Logged! Widespread severe flare recorded.', 'warning');

    // 3. Force route to support page and prompt resources
    document.querySelector('.nav-item[data-target="view-emergency"]').click();

    // 4. Force Low-Cognition Layout immediately because user is in crisis
    appState.settings.lowCognitionMode = true;
    FibroStorage.saveSettings(appState.settings);
    document.getElementById('toggle-low-cognition').checked = true;
    toggleLowCognitionMode(true);
    
    // Refresh Dashboards
    renderInsightsDashboard();
  }

  // 5. CUSTOM TAG LOGIC
  function renderCustomTags() {
    const mount = document.getElementById('custom-tags');
    mount.innerHTML = '';

    appState.customTags.forEach(tag => {
      const isSelected = appState.selectedTags.has(tag);
      const tagBtn = document.createElement('button');
      tagBtn.className = `tag ${isSelected ? 'selected' : ''}`;
      tagBtn.setAttribute('data-tag', tag);
      tagBtn.textContent = tag;
      mount.appendChild(tagBtn);
    });
  }

  function addNewTag() {
    const input = document.getElementById('new-tag-input');
    const tagText = input.value.trim();

    if (tagText) {
      appState.customTags = FibroStorage.saveCustomTag(tagText);
      input.value = '';
      renderCustomTags();
    }
  }

  // 6. CONTACTS LIST LOGIC
  function renderContactsList() {
    const mount = document.getElementById('contacts-list-mount');
    if (!mount) return;
    mount.innerHTML = '';

    appState.contacts.forEach(c => {
      const card = document.createElement('div');
      card.className = 'contact-item';
      card.innerHTML = `
        <div class="contact-item-meta">
          <h5>${c.name} (${c.relation})</h5>
          <p>${c.phone}</p>
        </div>
        <div class="contact-item-actions">
          <a href="tel:${c.phone}" class="btn btn-secondary btn-icon-only">
            <span class="material-symbols-rounded">call</span>
          </a>
          <button class="btn btn-danger btn-icon-only delete-contact" data-id="${c.id}">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      `;

      // Bind delete handler
      card.querySelector('.delete-contact').addEventListener('click', () => {
        appState.contacts = appState.contacts.filter(item => item.id !== c.id);
        FibroStorage.saveContacts(appState.contacts);
        renderContactsList();
      });

      mount.appendChild(card);
    });
  }

  function saveNewContact() {
    const nameInput = document.getElementById('contact-name');
    const phoneInput = document.getElementById('contact-phone');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    if (name && phone) {
      const newContact = {
        id: Date.now().toString(),
        name: name,
        phone: phone,
        relation: "Family"
      };

      appState.contacts.push(newContact);
      FibroStorage.saveContacts(appState.contacts);
      
      nameInput.value = '';
      phoneInput.value = '';
      
      renderContactsList();
    }
  }

  // 7. SAVE LOG EVENT HANDLER
  function saveDailyLog() {
    const painSlider = document.getElementById('pain-slider');
    const fatigueSlider = document.getElementById('fatigue-slider');
    const notesArea = document.getElementById('log-notes');

    const today = new Date().toISOString().split('T')[0];

    const logEntry = {
      date: today,
      timestamp: Date.now(),
      painLevel: parseInt(painSlider.value),
      fatigueLevel: parseInt(fatigueSlider.value),
      painLocations: appState.selectedPainLocations,
      tags: Array.from(appState.selectedTags),
      notes: notesArea.value.trim(),
      sleepHours: parseInt(painSlider.value) >= 5 ? 5.5 : 7.5 // inferred values if sleep tag selected or standard defaults
    };

    // Save
    appState.logs = FibroStorage.saveLog(logEntry);
    showToast('Symptoms successfully saved offline!', 'success'); hapticFeedback('success');

    // Clean inputs
    notesArea.value = '';
    appState.selectedTags.clear();
    document.querySelectorAll('.tag').forEach(t => t.classList.remove('selected'));
    FibroBodyMap.clear();

    // Check adaptive logic immediately (3+ days severe pain => trigger low-cognition mode)
    checkAdaptiveAccessibility();

    // Refresh dashboards
    renderInsightsDashboard();
  }

  // Check historical records for Adaptive mode
  function checkAdaptiveAccessibility() {
    if (appState.settings.lowCognitionMode) {
      toggleLowCognitionMode(true);
      return;
    }

    const logs = appState.logs;
    if (logs.length >= 3) {
      const past3Logs = logs.slice(-3);
      const isSevereStreak = past3Logs.every(l => l.painLevel >= 7);
      
      if (isSevereStreak) {
        toggleLowCognitionMode(true);
        // Toast message info
        const statusText = document.querySelector('.status-text');
        return;
      }
    }
    toggleLowCognitionMode(false);
  }

  function toggleLowCognitionMode(active) {
    if (active) {
      document.body.classList.add('low-cognition');
      document.getElementById('toggle-low-cognition').checked = true;
    } else {
      document.body.classList.remove('low-cognition');
      document.getElementById('toggle-low-cognition').checked = false;
    }
  }

  // 8. INSIGHTS DASHBOARD RENDERER
  function renderInsightsDashboard() {
    const demoBanner = document.getElementById('demo-banner');
    const loadDemoBtn = document.getElementById('load-demo-btn');
    const avgPainVal = document.getElementById('avg-pain-val');
    const avgFatigueVal = document.getElementById('avg-fatigue-val');
    const painTrendIndicator = document.getElementById('pain-trend');
    const fatigueTrendIndicator = document.getElementById('fatigue-trend');
    const correlationsContainer = document.getElementById('correlations-container');
    const warningCard = document.getElementById('predictive-warning-card');
    const warningText = document.getElementById('predictive-warning-text');

    const logs = appState.logs;

    // Toggle demo banner visibility
    if (logs.length > 0) {
      demoBanner.style.display = 'none';
    } else {
      demoBanner.style.display = 'flex';
      loadDemoBtn.onclick = () => {
        appState.logs = FibroStorage.generateMockData();
        appState.customTags = FibroStorage.getCustomTags();
        renderCustomTags();
        navigateToView('view-insights');
      };
    }

    // Averages and trends
    const stats = FibroAnalytics.getBasicStats(logs);
    avgPainVal.textContent = stats.avgPain;
    avgFatigueVal.textContent = stats.avgFatigue;

    // Pain Trend Visuals
    if (stats.painTrend.direction === 'up') {
      painTrendIndicator.className = 'trend-indicator text-bad';
      painTrendIndicator.innerHTML = `<span class="material-symbols-rounded">trending_up</span> ${stats.painTrend.text}`;
    } else if (stats.painTrend.direction === 'down') {
      painTrendIndicator.className = 'trend-indicator text-good';
      painTrendIndicator.innerHTML = `<span class="material-symbols-rounded">trending_down</span> ${stats.painTrend.text}`;
    } else {
      painTrendIndicator.className = 'trend-indicator';
      painTrendIndicator.innerHTML = `<span class="material-symbols-rounded">trending_flat</span> Stable`;
    }

    // Fatigue Trend Visuals
    if (stats.fatigueTrend.direction === 'up') {
      fatigueTrendIndicator.className = 'trend-indicator text-bad';
      fatigueTrendIndicator.innerHTML = `<span class="material-symbols-rounded">trending_up</span> ${stats.fatigueTrend.text}`;
    } else if (stats.fatigueTrend.direction === 'down') {
      fatigueTrendIndicator.className = 'trend-indicator text-good';
      fatigueTrendIndicator.innerHTML = `<span class="material-symbols-rounded">trending_down</span> ${stats.fatigueTrend.text}`;
    } else {
      fatigueTrendIndicator.className = 'trend-indicator';
      fatigueTrendIndicator.innerHTML = `<span class="material-symbols-rounded">trending_flat</span> Stable`;
    }

    // Flare Predictions
    const prediction = FibroAnalytics.predictFlare(logs);
    if (prediction.warningActive) {
      warningCard.className = "card card-warning";
      warningText.innerHTML = prediction.message;
    } else {
      warningCard.className = "card card-warning hidden";
    }

    // Trigger Correlation reports
    const correlations = FibroAnalytics.calculateCorrelations(logs);
    if (correlations.length > 0) {
      correlationsContainer.innerHTML = correlations.map(c => `
        <div class="correlation-item" style="border-left-color: ${c.type === 'negative' ? 'var(--accent-rose)' : 'var(--accent-teal)'}">
          <span class="material-symbols-rounded correlation-icon" style="color: ${c.type === 'negative' ? 'var(--accent-rose)' : 'var(--accent-teal)'}">
            ${c.type === 'negative' ? 'warning' : 'volunteer_activism'}
          </span>
          <div>${c.message}</div>
        </div>
      `).join('');
    } else {
      correlationsContainer.innerHTML = `<p class="info-empty-state" style="font-size:13px;color:var(--text-secondary)">Log at least 3 occurrences of custom triggers to calculate correlation reports.</p>`;
    }

    // Render visual charts
    renderTriggerDonutChart(logs);
    renderSparklineBars(logs);
    renderPainHeatmap(logs);

    // Compare Weeks rendering
    renderWeekComparisons();
  }

  // ---------- TRIGGER DONUT CHART ----------
  function renderTriggerDonutChart(logs) {
    const svg = document.getElementById('trigger-donut-svg');
    const legend = document.getElementById('trigger-donut-legend');
    const totalLabel = document.getElementById('donut-total-count');
    const chartCard = document.getElementById('trigger-chart-card');

    if (!logs || logs.length === 0) {
      chartCard.style.display = 'none';
      return;
    }
    chartCard.style.display = '';

    // Count tag occurrences
    const tagCounts = {};
    logs.forEach(log => {
      if (!log.tags) return;
      log.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by frequency descending, take top 8
    const sorted = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (sorted.length === 0) {
      chartCard.style.display = 'none';
      return;
    }

    const total = sorted.reduce((acc, [, v]) => acc + v, 0);
    totalLabel.textContent = total;

    const colors = [
      '#6ee7b7', '#fbbf24', '#f87171', '#a78bfa',
      '#38bdf8', '#fb923c', '#e879f9', '#34d399'
    ];

    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

    svg.innerHTML = '';
    legend.innerHTML = '';

    sorted.forEach(([tag, count], i) => {
      const pct = count / total;
      const dash = circumference * pct;
      const gap = circumference - dash;
      const color = colors[i % colors.length];

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '50');
      circle.setAttribute('cy', '50');
      circle.setAttribute('r', String(radius));
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', color);
      circle.setAttribute('stroke-width', '8');
      circle.setAttribute('stroke-dasharray', `${dash} ${gap}`);
      circle.setAttribute('stroke-dashoffset', String(-offset));
      circle.setAttribute('stroke-linecap', 'round');
      svg.appendChild(circle);

      offset += dash;

      // Legend item
      legend.innerHTML += `
        <div class="legend-item">
          <div class="legend-label-group">
            <span class="legend-dot" style="background:${color}"></span>
            <span>${tag}</span>
          </div>
          <span class="legend-val">${count} (${Math.round(pct * 100)}%)</span>
        </div>`;
    });
  }

  // ---------- SPARKLINE BAR CHART ----------
  function renderSparklineBars(logs) {
    const mount = document.getElementById('sparkline-bars-mount');
    const card = document.getElementById('sparkline-chart-card');

    if (!logs || logs.length === 0) {
      card.style.display = 'none';
      return;
    }
    card.style.display = '';

    const maxVal = 10; // Pain/Fatigue scale is 0-10
    const barMaxHeight = 100; // px

    mount.innerHTML = logs.map(log => {
      const painH = Math.round((log.painLevel / maxVal) * barMaxHeight);
      const fatigueH = Math.round((log.fatigueLevel / maxVal) * barMaxHeight);
      const dateLabel = log.date.slice(5); // "MM-DD"

      return `
        <div class="spark-day" title="${log.date}\nPain: ${log.painLevel}/10\nFatigue: ${log.fatigueLevel}/10">
          <div class="spark-bar pain-bar" style="height:${painH}px"></div>
          <div class="spark-bar fatigue-bar" style="height:${fatigueH}px"></div>
          <span class="spark-date-label">${dateLabel}</span>
        </div>`;
    }).join('');
  }

  // ---------- PAIN LOCATION HEATMAP ----------
  function renderPainHeatmap(logs) {
    const mount = document.getElementById('pain-heatmap-mount');
    const card = document.getElementById('pain-location-chart-card');

    if (!logs || logs.length === 0) {
      card.style.display = 'none';
      return;
    }
    card.style.display = '';

    const friendlyNames = {
      head: 'Head', occiput: 'Head (Back)', neck: 'Neck', neckBack: 'Neck (Back)',
      leftShoulder: 'Left Shoulder', rightShoulder: 'Right Shoulder',
      upperBack: 'Upper Back', lowerBack: 'Lower Back',
      chest: 'Chest', abdomen: 'Abdomen',
      leftArm: 'Left Arm', rightArm: 'Right Arm',
      leftArmBack: 'Left Arm (Back)', rightArmBack: 'Right Arm (Back)',
      hips: 'Hips', gluteals: 'Gluteals',
      leftLeg: 'Left Leg', rightLeg: 'Right Leg',
      leftLegBack: 'Left Leg (Back)', rightLegBack: 'Right Leg (Back)',
      shoulders: 'Shoulders'
    };

    // Count location occurrences
    const locCounts = {};
    logs.forEach(log => {
      if (!log.painLocations) return;
      log.painLocations.forEach(loc => {
        const name = friendlyNames[loc] || loc;
        locCounts[name] = (locCounts[name] || 0) + 1;
      });
    });

    const sorted = Object.entries(locCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) {
      card.style.display = 'none';
      return;
    }

    const maxCount = sorted[0][1];

    mount.innerHTML = sorted.map(([name, count]) => {
      const pct = Math.round((count / maxCount) * 100);
      return `
        <div class="heatmap-row">
          <span class="heatmap-label">${name}</span>
          <div class="heatmap-track">
            <div class="heatmap-fill" style="width:${pct}%"></div>
          </div>
          <span class="heatmap-count">${count}d</span>
        </div>`;
    }).join('');
  }

  // 9. COMPARE TIMELINES RENDERER
  function renderWeekComparisons() {
    const goodSelect = document.getElementById('good-week-select');
    const badSelect = document.getElementById('bad-week-select');
    const mount = document.getElementById('comparison-timeline-mount');

    const weeklyBlocks = FibroAnalytics.getWeeklyBlocks(appState.logs);

    if (weeklyBlocks.length < 2) {
      mount.innerHTML = `<p style="font-size: 13px; color:var(--text-secondary);">Load logs or wait for 14 days of entries to activate side-by-side timelines.</p>`;
      return;
    }

    // Populate dropdowns if empty
    if (goodSelect.options.length === 0) {
      weeklyBlocks.forEach((w, idx) => {
        const optGood = new Option(w.label, w.id);
        const optBad = new Option(w.label, w.id);
        goodSelect.add(optGood);
        badSelect.add(optBad);
      });

      // Default selection (A good week vs bad flare week)
      goodSelect.selectedIndex = weeklyBlocks.length - 1; // oldest week (simulated good)
      badSelect.selectedIndex = 0; // newest week (simulated flare)
    }

    function updateComparisonDetails() {
      const goodId = goodSelect.value;
      const badId = badSelect.value;

      const goodBlock = weeklyBlocks.find(w => w.id === goodId);
      const badBlock = weeklyBlocks.find(w => w.id === badId);

      if (!goodBlock || !badBlock) return;

      const goodStats = FibroAnalytics.getWeekDetails(goodBlock.logs);
      const badStats = FibroAnalytics.getWeekDetails(badBlock.logs);

      mount.innerHTML = `
        <div class="comp-row">
          <div class="comp-metric">Average Pain</div>
          <div class="comp-values">
            <div class="comp-val-block good">${goodStats.avgPain}/10</div>
            <div class="comp-val-block bad">${badStats.avgPain}/10</div>
          </div>
        </div>

        <div class="comp-row">
          <div class="comp-metric">Average Fatigue</div>
          <div class="comp-values">
            <div class="comp-val-block good">${goodStats.avgFatigue}/10</div>
            <div class="comp-val-block bad">${badStats.avgFatigue}/10</div>
          </div>
        </div>

        <div class="comp-row">
          <div class="comp-metric">Sleep Average</div>
          <div class="comp-values">
            <div class="comp-val-block good">${goodStats.avgSleep} hrs</div>
            <div class="comp-val-block bad">${badStats.avgSleep} hrs</div>
          </div>
        </div>

        <div class="comp-row">
          <div class="comp-metric">High Stress Days</div>
          <div class="comp-values">
            <div class="comp-val-block good">${goodStats.highStressDays} days</div>
            <div class="comp-val-block bad">${badStats.highStressDays} days</div>
          </div>
        </div>

        <div class="comp-row">
          <div class="comp-metric">Trigger Elements</div>
          <div class="comp-values">
            <div class="comp-val-block good" style="font-size:11px; text-align:left; color:#f1edf7">
              ${goodStats.activeTags.filter(t => !['Restless Sleep', 'Work Stress', 'Insomnia'].includes(t)).slice(0,3).join(', ') || 'Yoga, Outdoors'}
            </div>
            <div class="comp-val-block bad" style="font-size:11px; text-align:left; color:#f1edf7">
              ${badStats.activeTags.filter(t => ['Restless Sleep', 'Work Stress', 'Insomnia', 'Barometric Drop', 'Rainy/Damp'].includes(t)).join(', ') || 'Insomnia, Stress'}
            </div>
          </div>
        </div>
      `;
    }

    goodSelect.onchange = updateComparisonDetails;
    badSelect.onchange = updateComparisonDetails;
    
    updateComparisonDetails();
  }

  // 10. PACING SUGGESTION CALCULATOR
  function updatePacingCalculator() {
    const recTitle = document.getElementById('pacing-recommendation-title');
    const recRatio = document.getElementById('pacing-ratio');
    const recAdvice = document.getElementById('pacing-advice');

    const logs = appState.logs;
    if (logs.length < 3) {
      recTitle.textContent = "Keep tracking symptoms";
      recRatio.textContent = "Requires 3 logged days";
      recAdvice.textContent = "We analyze the past 3 days to customize your movement thresholds.";
      return;
    }

    const past3 = logs.slice(-3);
    const avgPain = past3.reduce((acc, curr) => acc + curr.painLevel, 0) / 3;
    const avgFatigue = past3.reduce((acc, curr) => acc + curr.fatigueLevel, 0) / 3;

    if (avgPain >= 7.0 || avgFatigue >= 7.5) {
      recTitle.textContent = "Strict Rest Day Suggested";
      recRatio.textContent = "15-min Active / 30-min Rest";
      recAdvice.textContent = "Your central nervous system is highly sensitized. Minimize cognitive load, use warm heat wraps, and limit activity blocks.";
    } else if (avgPain >= 4.0 || avgFatigue >= 4.5) {
      recTitle.textContent = "Paced Moderate Day Suggested";
      recRatio.textContent = "25-min Active / 15-min Rest";
      recAdvice.textContent = "Perform lightweight tasks. Use timers to force breaks before pain intensifies. Avoid push-crash cycles.";
    } else {
      recTitle.textContent = "Gentle Expansion Suggested";
      recRatio.textContent = "45-min Active / 10-min Rest";
      recAdvice.textContent = "Good baseline. Gentle stretching and light outdoor walks can help keep muscles loose. Rest between chores.";
    }
  }

  // 11. DOCTOR CLINICAL REPORT PRINTING VIEWS
  function initDoctorSummary() {
    const reportBtn = document.getElementById('export-report-btn');
    const fhirBtn = document.getElementById('export-fhir-btn');
    
    const fhirContainer = document.getElementById('fhir-export-mount');
    const fhirOutput = document.getElementById('fhir-json-output');
    const closeFhirBtn = document.getElementById('close-fhir-btn');

    const modal = document.getElementById('doctor-report-modal');
    const modalBody = document.getElementById('doctor-report-body-mount');
    const printBtn = document.getElementById('print-modal-btn');
    const closeBtn = document.getElementById('close-modal-btn');

    reportBtn.addEventListener('click', () => {
      const htmlReport = FibroDoctorReport.generateHTML(appState.logs);
      modalBody.innerHTML = htmlReport;
      modal.classList.remove('hidden');
    });

    printBtn.addEventListener('click', () => {
      window.print();
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    fhirBtn.addEventListener('click', () => {
      const fhirJson = FibroDoctorReport.generateFHIR(appState.logs);
      fhirOutput.value = fhirJson;
      fhirContainer.classList.remove('hidden');
    });

    closeFhirBtn.addEventListener('click', () => {
      fhirContainer.classList.add('hidden');
    });
  }

  // ---------- OFFLINE NOTIFICATIONS QUEUE SYNC ----------
  function syncOfflineLogs() {
    if (!('indexedDB' in window)) return;
    
    const request = indexedDB.open('HithaFlowOfflineDB', 1);
    request.onsuccess = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline_logs')) return;
      
      const transaction = db.transaction('offline_logs', 'readwrite');
      const store = transaction.objectStore('offline_logs');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        const offlineLogs = getAllRequest.data || getAllRequest.result || [];
        if (offlineLogs.length === 0) return;
        
        offlineLogs.forEach(entry => {
          const cleanEntry = {
            date: entry.date,
            painLevel: entry.painLevel,
            fatigueLevel: entry.fatigueLevel,
            mood: entry.mood,
            painLocations: entry.painLocations || [],
            tags: entry.tags || [],
            notes: entry.notes || ""
          };
          FibroStorage.saveLog(cleanEntry);
        });
        
        // Clear IndexedDB store
        store.clear();
        
        // Refresh app state and dashboard
        appState.logs = FibroStorage.getLogs();
        renderInsightsDashboard();
      };
    };
  }

  // ---------- LOCK-SCREEN NOTIFICATIONS & WHATSAPP INTEGRATION ----------
  function initNotificationsAndWhatsApp() {
    // 1. Setup notification permissions
    const btnEnable = document.getElementById('btn-enable-notifications');
    const btnTest = document.getElementById('btn-test-notification');
    const statusText = document.getElementById('notification-status-text');

    if (btnEnable && btnTest && statusText) {
      const updateStatus = () => {
        if (!('Notification' in window)) {
          statusText.textContent = "Notifications are not supported in this browser.";
          btnEnable.disabled = true;
          btnTest.disabled = true;
          return;
        }
        if (Notification.permission === 'granted') {
          statusText.textContent = "Status: Reminders allowed. Lock-screen quick logging is ready.";
          statusText.className = "status-indicator text-good mt-2";
          btnEnable.textContent = "Reminders Enabled";
          btnEnable.classList.remove('btn-secondary');
          btnEnable.classList.add('btn-primary');
        } else if (Notification.permission === 'denied') {
          statusText.textContent = "Status: Notifications blocked. Please enable them in browser settings.";
          statusText.className = "status-indicator text-bad mt-2";
        } else {
          statusText.textContent = "Status: Permissions pending. Tap 'Enable Reminders' to activate.";
          statusText.className = "status-indicator text-muted mt-2";
        }
      };

      btnEnable.addEventListener('click', () => {
        Notification.requestPermission().then(permission => {
          updateStatus();
          if (permission === 'granted') {
            showToast('Perfect! HithaFlow notifications are now active.', 'success');
          }
        });
      });

      btnTest.addEventListener('click', () => {
        if (Notification.permission !== 'granted') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              showQuickLogNotification();
            } else {
              showToast('Please allow notifications to test the quick-log card.', 'warning');
            }
          });
        } else {
          showQuickLogNotification();
        }
      });

      updateStatus();
    }

    function showQuickLogNotification() {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('HithaFlow Daily Check-in', {
          body: 'How are you pacing today, Hitha? Tap to log:',
          icon: 'src/assets/icon-192.png',
          tag: 'hithaflow-quick-log',
          actions: [
            { action: 'log-low', title: '🟢 2: Low' },
            { action: 'log-mid', title: '🟡 5: Mid' },
            { action: 'log-high', title: '🔴 8: High' }
          ],
          requireInteraction: true
        }).catch(err => {
          console.warn("Service Worker notification failed, falling back to standard notification:", err);
          try {
            new Notification('HithaFlow Daily Check-in', {
              body: 'How are you pacing today, Hitha?',
              icon: 'src/assets/icon-192.png',
              tag: 'hithaflow-quick-log'
            });
          } catch (e) {
            console.error("Standard notification failed:", e);
            showToast('Notification triggered! (System notifications are blocked or unsupported on this browser.)', 'info');
          }
        });
      }).catch(err => {
        console.warn("Service worker not ready for notifications, trying standard:", err);
        try {
          new Notification('HithaFlow Daily Check-in', {
            body: 'How are you pacing today, Hitha?',
            icon: 'src/assets/icon-192.png',
            tag: 'hithaflow-quick-log'
          });
        } catch (e) {
          showToast('Notification triggered! (System notifications are blocked or unsupported on this browser.)', 'info');
        }
      });
    }

    // 2. Setup WhatsApp Bot simulator & webhook config
    const waWebhookUrl = document.getElementById('wa-webhook-url');
    const btnCopyWebhook = document.getElementById('btn-copy-wa-webhook');
    const btnToggleSim = document.getElementById('btn-toggle-wa-simulator');
    const simPanel = document.getElementById('wa-simulator-panel');

    if (waWebhookUrl) {
      const baseUrl = window.location.origin;
      waWebhookUrl.value = `${baseUrl}/api/whatsapp`;
    }

    if (btnCopyWebhook && waWebhookUrl) {
      btnCopyWebhook.addEventListener('click', () => {
        navigator.clipboard.writeText(waWebhookUrl.value).then(() => {
          const original = btnCopyWebhook.innerHTML;
          btnCopyWebhook.innerHTML = `<span class="material-symbols-rounded" style="color:var(--accent-teal)">done</span>`;
          setTimeout(() => btnCopyWebhook.innerHTML = original, 1500);
        });
      });
    }

    if (btnToggleSim && simPanel) {
      btnToggleSim.addEventListener('click', () => {
        const isHidden = simPanel.classList.contains('hidden');
        if (isHidden) {
          simPanel.classList.remove('hidden');
          btnToggleSim.textContent = "Close Simulator";
        } else {
          simPanel.classList.add('hidden');
          btnToggleSim.textContent = "Open Simulator";
        }
      });
    }

    const simSendBtn = document.getElementById('wa-sim-send-btn');
    const simInput = document.getElementById('wa-sim-input');
    const simMessages = document.getElementById('wa-sim-messages');

    if (simSendBtn && simInput && simMessages) {
      const sendMockMessage = () => {
        const text = simInput.value.trim();
        if (!text) return;

        // Append user message
        const userMsg = document.createElement('div');
        userMsg.className = 'wa-msg wa-user';
        userMsg.setAttribute('style', 'background:var(--accent-teal); color:#000; padding:6px 10px; border-radius:8px; align-self:flex-end; max-width:85%; font-size:12.5px; margin-left:auto;');
        userMsg.textContent = text;
        simMessages.appendChild(userMsg);

        simInput.value = '';
        simMessages.scrollTop = simMessages.scrollHeight;

        // Process message via NLP parser after a brief mock lag delay
        setTimeout(() => {
          const parsedLog = parseNaturalLanguageLog(text);
          FibroStorage.saveLog(parsedLog);

          appState.logs = FibroStorage.getLogs();
          renderInsightsDashboard();

          // Append Bot reply
          const botMsg = document.createElement('div');
          botMsg.className = 'wa-msg wa-bot';
          botMsg.setAttribute('style', 'background:rgba(255,255,255,0.06); padding:6px 10px; border-radius:8px; align-self:flex-start; max-width:85%; font-size:12.5px; border-left: 3px solid var(--accent-teal);');
          
          let tagSnippet = parsedLog.tags.length > 0 ? `Tags identified: [${parsedLog.tags.join(', ')}].` : '';
          botMsg.innerHTML = `🌟 <strong>HithaFlow Bot:</strong> Logged pain severity <strong>${parsedLog.painLevel}/10</strong>. ${tagSnippet} <br/><em>"${parsedLog.notes}"</em>`;
          simMessages.appendChild(botMsg);
          simMessages.scrollTop = simMessages.scrollHeight;
        }, 800);
      };

      simSendBtn.addEventListener('click', sendMockMessage);
      simInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMockMessage();
      });
    }
  }

  // ---------- NLP MESSAGING PARSER ----------
  function parseNaturalLanguageLog(text) {
    const numMatch = text.match(/\b([0-9]|10)\b/);
    const painLevel = numMatch ? parseInt(numMatch[1], 10) : 5;

    const customTags = FibroStorage.getCustomTags();
    const matchedTags = [];
    customTags.forEach(tag => {
      if (text.toLowerCase().includes(tag.toLowerCase())) {
        matchedTags.push(tag);
      }
    });

    let notes = text.replace(/\b([0-9]|10)\b/, '').trim();
    notes = notes.replace(/^[\s,]+/, '').replace(/[\s,]+$/, '');

    const fatigueLevel = Math.min(10, Math.max(0, painLevel + (Math.random() > 0.5 ? 1 : -1)));

    return {
      date: new Date().toISOString().slice(0, 10),
      painLevel,
      fatigueLevel,
      mood: painLevel >= 7 ? "Anxious" : (painLevel <= 3 ? "Joyful" : "Neutral"),
      painLocations: [],
      tags: matchedTags.length > 0 ? matchedTags : ["Logged via WhatsApp"],
      notes: notes || "Logged ambiently via SMS/WhatsApp Bot."
    };
  }

  // ---------- WHATSAPP SYNC ----------
  function syncWhatsAppLogs() {
    const phone = appState.settings.waPhoneNumber;
    if (!phone) return;

    fetch(`/api/whatsapp?phone=${encodeURIComponent(phone)}`)
      .then(res => {
        if (!res.ok) throw new Error("Sync failed");
        return res.json();
      })
      .then(data => {
        if (data.logs && data.logs.length > 0) {
          data.logs.forEach(log => {
            const parsedLog = parseNaturalLanguageLog(log.rawText || `${log.painLevel}, ${log.notes}`);
            parsedLog.date = log.date;
            FibroStorage.saveLog(parsedLog);
          });
          appState.logs = FibroStorage.getLogs();
          renderInsightsDashboard();
          console.log(`Synced ${data.logs.length} logs from WhatsApp.`);
        }
      })
      .catch(err => {
        console.warn("Unable to sync with WhatsApp webhook (requires live Vercel KV database):", err.message);
      });
  }

  // Trigger main setup
  initApp();
  syncOfflineLogs();
  syncWhatsAppLogs();

  // Poll for new WhatsApp logs in the background every 15 seconds
  setInterval(syncWhatsAppLogs, 60000);

  // Listen to Service Worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SYNC_OFFLINE_LOGS') {
        syncOfflineLogs();
      }
    });
  }

  // Load secondary component modules
  FibroBreathing.init('breathing-balloon', 'breathing-instruction', 'btn-toggle-breathing');
  FibroDistraction.init('game-canvas', 'pop-score', 'start-game-btn');

  // ==========================================
  // WOW-FACTOR UTILITIES & ENHANCEMENTS
  // ==========================================

  window.showToast = function(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'warning') icon = 'warning';
    
    toast.innerHTML = `
      <span class="material-symbols-rounded toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;
    
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
    textEl.innerHTML = `<span class="typewriter-line">${insight.text}</span>`;
    card.style.display = 'block';
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
        
        showToast(`Logged ${btn.querySelector('span').textContent} ${label}! You've got this, Hitha.`, 'success');
        
        // Auto-save
        setTimeout(() => {
          document.getElementById('save-daily-log').click();
        }, 600);
      });
    });
  }



  // --- NEW FEATURE GLOBALS ---
  
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
    
    badge.textContent = `${remaining} / ${max}`;
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

});
