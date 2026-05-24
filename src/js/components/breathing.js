/**
 * FibroFlow Calming Breathing Pacer Component
 */
const FibroBreathing = {
  balloonEl: null,
  instructionEl: null,
  toggleBtn: null,
  timerId: null,
  isRunning: false,
  phaseIndex: 0,
  
  // 4-4-4-4 Box Breathing Cycle configuration
  phases: [
    { name: 'inhale', text: 'Breathe In... expansion', duration: 4000 },
    { name: 'hold', text: 'Hold... feel the calm', duration: 4000 },
    { name: 'exhale', text: 'Breathe Out... release pain', duration: 4000 },
    { name: 'hold', text: 'Pause... empty mind', duration: 4000 }
  ],

  init: function(balloonId, instructionId, toggleBtnId) {
    this.balloonEl = document.getElementById(balloonId);
    this.instructionEl = document.getElementById(instructionId);
    this.toggleBtn = document.getElementById(toggleBtnId);

    if (!this.toggleBtn) return;

    this.toggleBtn.addEventListener('click', () => {
      if (this.isRunning) {
        this.stop();
      } else {
        this.start();
      }
    });
  },

  start: function() {
    this.isRunning = true;
    this.phaseIndex = 0;
    this.toggleBtn.textContent = "Stop Session";
    this.toggleBtn.classList.remove('btn-primary');
    this.toggleBtn.classList.add('btn-secondary');
    this.runCycle();
  },

  stop: function() {
    this.isRunning = false;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    
    // Reset visual balloon classes
    if (this.balloonEl) {
      this.balloonEl.className = "breathing-circle-inner";
    }
    if (this.instructionEl) {
      this.instructionEl.textContent = 'Tap "Start" to align breathing';
    }
    if (this.toggleBtn) {
      this.toggleBtn.textContent = "Start Breathing";
      this.toggleBtn.classList.remove('btn-secondary');
      this.toggleBtn.classList.add('btn-primary');
    }
  },

  runCycle: function() {
    if (!this.isRunning) return;

    const currentPhase = this.phases[this.phaseIndex];
    
    // Update text
    this.instructionEl.textContent = currentPhase.text;
    
    // Update balloon animation class
    this.balloonEl.className = "breathing-circle-inner " + currentPhase.name;

    // Schedule next phase
    this.timerId = setTimeout(() => {
      this.phaseIndex = (this.phaseIndex + 1) % this.phases.length;
      this.runCycle();
    }, currentPhase.duration);
  }
};
