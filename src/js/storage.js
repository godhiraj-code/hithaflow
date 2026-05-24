/**
 * FibroFlow Offline-First LocalStorage Manager
 */
const FibroStorage = {
  KEYS: {
    LOGS: 'fibroflow_logs',
    SETTINGS: 'fibroflow_settings',
    CONTACTS: 'fibroflow_contacts',
    CUSTOM_TAGS: 'fibroflow_custom_tags'
  },

  // Save a single daily log
  saveLog: function(logEntry) {
    const logs = this.getLogs();
    
    // Check if there is already a log for this exact date (YYYY-MM-DD)
    const existingIndex = logs.findIndex(l => l.date === logEntry.date);
    if (existingIndex > -1) {
      logs[existingIndex] = { ...logs[existingIndex], ...logEntry };
    } else {
      logs.push(logEntry);
    }
    
    // Sort logs chronologically
    logs.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem(this.KEYS.LOGS, JSON.stringify(logs));
    return logs;
  },

  // Retrieve all logs
  getLogs: function() {
    const raw = localStorage.getItem(this.KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  },

  // Save app settings
  saveSettings: function(settings) {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(updated));
    return updated;
  },

  // Retrieve settings
  getSettings: function() {
    const raw = localStorage.getItem(this.KEYS.SETTINGS);
    const defaults = {
      lowCognitionMode: false,
      voiceEnabled: true,
      userName: "Hitha",
      theme: "dark"
    };
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  },

  // Get support contacts list
  getContacts: function() {
    const raw = localStorage.getItem(this.KEYS.CONTACTS);
    const defaults = [
      { id: "1", name: "Sarah (Sister)", phone: "555-019-2834", relation: "Sister" },
      { id: "2", name: "Dr. Chen (Rheumatologist)", phone: "555-014-9988", relation: "Doctor" }
    ];
    if (!raw) {
      localStorage.setItem(this.KEYS.CONTACTS, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(raw);
  },

  // Save support contacts list
  saveContacts: function(contacts) {
    localStorage.setItem(this.KEYS.CONTACTS, JSON.stringify(contacts));
  },

  // Get Custom tags
  getDailyState: function() {
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

  saveDailyState: function(state) {
    localStorage.setItem('fibroflow_daily_state', JSON.stringify(state));
  },

  getCustomTags: function() {
    const raw = localStorage.getItem(this.KEYS.CUSTOM_TAGS);
    return raw ? JSON.parse(raw) : ["Coffee Overdose", "Extreme Work"];
  },

  // Add a Custom tag
  saveCustomTag: function(tag) {
    const tags = this.getCustomTags();
    if (!tags.includes(tag)) {
      tags.push(tag);
      localStorage.setItem(this.KEYS.CUSTOM_TAGS, JSON.stringify(tags));
    }
    return tags;
  },

  // Clear all databases
  resetDatabase: function() {
    localStorage.removeItem(this.KEYS.LOGS);
    localStorage.removeItem(this.KEYS.SETTINGS);
    localStorage.removeItem(this.KEYS.CONTACTS);
    localStorage.removeItem(this.KEYS.CUSTOM_TAGS);
  },

  // Generate 30 Days of Clinical Demo Data
  generateMockData: function() {
    this.resetDatabase();
    
    const logs = [];
    const today = new Date();
    
    // We generate 30 days of data starting from 30 days ago
    for (let i = 30; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      
      // Let's create clinical correlations in our synthetic logs:
      // We will have 2 "good weeks" and 2 "bad weeks (flares)"
      // Let's divide it based on index:
      // Days 0-6: Good Week (lower pain, good sleep, activity)
      // Days 7-13: Bad Flare Week (bad sleep, weather damp, high pain)
      // Days 14-20: Good Week (active, low stress)
      // Days 21-27: Moderate Flare Week (barometric drop, high stress)
      // Days 28-30: Recovering days
      
      let painLevel, fatigueLevel, sleepHours, stressLevel;
      let tags = [];
      let painLocations = [];
      let notes = "";
      
      const isBadWeek1 = (i >= 17 && i <= 23); // Flare Week A
      const isBadWeek2 = (i >= 3 && i <= 9);   // Flare Week B
      
      if (isBadWeek1) {
        // Flare details: Weather drops, poor sleep, high stress
        painLevel = Math.floor(Math.random() * 3) + 7; // Pain 7-9
        fatigueLevel = Math.floor(Math.random() * 3) + 7; // Fatigue 7-9
        sleepHours = Math.floor(Math.random() * 3) + 4; // Sleep 4-6 hrs
        stressLevel = "High";
        tags = ["Restless Sleep", "Insomnia", "Rainy/Damp", "Barometric Drop", "Work Stress"];
        painLocations = ["shoulders", "upperBack", "lowerBack", "neck", "hips"];
        notes = "Major flare up. Woke up feeling like lead. Weather is cold and damp, neck and lower back are incredibly stiff.";
      } else if (isBadWeek2) {
        // Flare details: Work Stress, Social Burnout, Poor sleep
        painLevel = Math.floor(Math.random() * 3) + 6; // Pain 6-8
        fatigueLevel = Math.floor(Math.random() * 3) + 8; // Fatigue 8-10 (High exhaustion)
        sleepHours = Math.floor(Math.random() * 2) + 5; // Sleep 5-6 hrs
        stressLevel = "High";
        tags = ["Restless Sleep", "Social Burnout", "Work Stress", "Karen from HR"];
        painLocations = ["head", "neck", "shoulders", "leftArm", "rightArm"];
        notes = "Felt completely drained. Fibrofog is high. Hard to focus at work. Tapping out early today.";
      } else {
        // Good Week Details: Good sleep, gentle movement, low stress
        painLevel = Math.floor(Math.random() * 3) + 2; // Pain 2-4
        fatigueLevel = Math.floor(Math.random() * 3) + 2; // Fatigue 2-4
        sleepHours = Math.floor(Math.random() * 2) + 7.5; // Sleep 7.5-8.5 hrs
        stressLevel = "Low";
        tags = ["Slept Well", "Gentle Yoga", "Walked Outside", "Gardening Session"];
        // Pain is localized or absent
        if (painLevel > 2) {
          painLocations = [Math.random() > 0.5 ? "lowerBack" : "shoulders"];
        }
        notes = "Had a gentle walk in the morning. Woke up feeling rested. Managed some yoga, spacing my work breaks worked well.";
      }

      // Append standard tags
      if (sleepHours < 6) {
        if (!tags.includes("Restless Sleep")) tags.push("Restless Sleep");
      } else {
        if (!tags.includes("Slept Well")) tags.push("Slept Well");
      }

      logs.push({
        date: dateString,
        timestamp: d.getTime(),
        painLevel: painLevel,
        fatigueLevel: fatigueLevel,
        sleepHours: sleepHours,
        stressLevel: stressLevel,
        painLocations: painLocations,
        tags: tags,
        notes: notes,
        fiqrScore: Math.round((painLevel * 4.5) + (fatigueLevel * 3.5) + (sleepHours < 6 ? 15 : 4)) // Calculated FIQR score wrapper
      });
    }

    localStorage.setItem(this.KEYS.LOGS, JSON.stringify(logs));
    return logs;
  }
};
