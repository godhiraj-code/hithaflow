/**
 * FibroFlow Tactile Pain Distraction Game (Calm Pop)
 */
const FibroDistraction = {
  canvasEl: null,
  scoreEl: null,
  startBtn: null,
  score: 0,
  gameInterval: null,
  activeBubbles: [],
  audioCtx: null,

  init: function(canvasId, scoreId, startBtnId) {
    this.canvasEl = document.getElementById(canvasId);
    this.scoreEl = document.getElementById(scoreId);
    this.startBtn = document.getElementById(startBtnId);

    if (!this.startBtn) return;

    this.startBtn.addEventListener('click', () => {
      this.startGame();
    });
  },

  initAudio: function() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playPopSound: function() {
    this.initAudio();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();

      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      // Soothing water bubble pluck sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, this.audioCtx.currentTime + 0.08);

      gainNode.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.08);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.09);
    } catch (e) {
      console.warn("AudioContext playback blocked/error", e);
    }
  },

  startGame: function() {
    this.score = 0;
    this.scoreEl.textContent = this.score;
    this.canvasEl.innerHTML = ''; // Clear start button
    this.activeBubbles = [];
    this.initAudio();

    // Spawn bubbles periodically
    this.gameInterval = setInterval(() => {
      if (this.activeBubbles.length < 8) {
        this.spawnBubble();
      }
    }, 800);
  },

  stopGame: function() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  },

  spawnBubble: function() {
    const bubble = document.createElement('button');
    bubble.className = 'bubble';
    
    // Choose calming pastel colors
    const colors = [
      'rgba(100, 223, 223, 0.45)', // teal
      'rgba(179, 157, 250, 0.45)', // lavender
      'rgba(244, 172, 183, 0.45)', // soft rose
      'rgba(137, 252, 243, 0.45)'  // ice blue
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const size = Math.floor(Math.random() * 20) + 40; // 40px to 60px
    const left = Math.floor(Math.random() * (this.canvasEl.clientWidth - size - 10)) + 5;
    
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}px`;
    bubble.style.backgroundColor = color;
    bubble.style.border = `1.5px solid ${color.replace('0.45', '0.8')}`;
    bubble.style.boxShadow = `0 4px 15px ${color.replace('0.45', '0.2')}`;
    
    // Speed variations
    const duration = Math.floor(Math.random() * 3) + 3; // 3s to 6s
    bubble.style.animationDuration = `${duration}s`;

    // Click to Pop
    bubble.addEventListener('click', () => {
      this.playPopSound();
      this.popBubble(bubble);
    });

    // Remove when animation finishes
    bubble.addEventListener('animationend', () => {
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
        this.activeBubbles = this.activeBubbles.filter(b => b !== bubble);
      }
    });

    this.canvasEl.appendChild(bubble);
    this.activeBubbles.push(bubble);
  },

  popBubble: function(bubble) {
    this.score++;
    this.scoreEl.textContent = this.score;

    // Popping particle effect in CSS
    bubble.style.transform = 'scale(1.4)';
    bubble.style.opacity = '0';
    bubble.style.pointerEvents = 'none';

    setTimeout(() => {
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
      }
      this.activeBubbles = this.activeBubbles.filter(b => b !== bubble);
    }, 150);
  }
};
