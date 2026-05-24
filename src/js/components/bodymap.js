/**
 * FibroFlow Interactive Body Map Component (SVG)
 */
const FibroBodyMap = {
  selectedRegions: new Set(),

  // Core regions with basic SVG shapes mapped relative to viewbox
  regions: {
    front: [
      { id: 'head', name: 'Head/Face', path: 'M55,10 C50,10 42,16 42,26 C42,36 50,42 55,42 C60,42 68,36 68,26 C68,16 60,10 55,10 Z' },
      { id: 'neck', name: 'Neck (Front)', path: 'M49,42 L61,42 L59,52 L51,52 Z' },
      { id: 'leftShoulder', name: 'L Shoulder', path: 'M40,54 C32,56 26,60 26,64 L34,74 L42,66 Z' },
      { id: 'rightShoulder', name: 'R Shoulder', path: 'M70,54 C78,56 84,60 84,64 L76,74 L68,66 Z' },
      { id: 'chest', name: 'Chest', path: 'M43,53 L67,53 L65,78 L45,78 Z' },
      { id: 'abdomen', name: 'Abdomen', path: 'M45,78 L65,78 L62,105 L48,105 Z' },
      { id: 'leftArm', name: 'L Arm', path: 'M25,65 L15,105 C14,108 17,112 21,112 L28,75 Z' },
      { id: 'rightArm', name: 'R Arm', path: 'M85,65 L95,105 C96,108 93,112 89,112 L82,75 Z' },
      { id: 'hips', name: 'Hips/Pelvis', path: 'M45,106 L65,106 L72,122 L38,122 Z' },
      { id: 'leftLeg', name: 'L Leg', path: 'M38,123 L42,215 C42,218 48,218 48,215 L52,123 Z' },
      { id: 'rightLeg', name: 'R Leg', path: 'M72,123 L68,215 C68,218 62,218 62,215 L58,123 Z' }
    ],
    back: [
      { id: 'occiput', name: 'Occiput/Head (Back)', path: 'M55,10 C50,10 42,16 42,26 C42,36 50,42 55,42 C60,42 68,36 68,26 C68,16 60,10 55,10 Z' },
      { id: 'neckBack', name: 'Neck (Back)', path: 'M49,42 L61,42 L59,52 L51,52 Z' },
      { id: 'upperBack', name: 'Upper Back', path: 'M42,53 L68,53 L66,80 L44,80 Z' },
      { id: 'lowerBack', name: 'Lower Back', path: 'M44,80 L66,80 L63,105 L47,105 Z' },
      { id: 'gluteals', name: 'Gluteals/Hips', path: 'M45,106 L65,106 L72,125 L38,125 Z' },
      { id: 'leftShoulderBack', name: 'L Shoulder (Back)', path: 'M40,54 C32,56 26,60 26,64 L34,74 L42,66 Z' },
      { id: 'rightShoulderBack', name: 'R Shoulder (Back)', path: 'M70,54 C78,56 84,60 84,64 L76,74 L68,66 Z' },
      { id: 'leftArmBack', name: 'L Arm (Back)', path: 'M25,65 L15,105 C14,108 17,112 21,112 L28,75 Z' },
      { id: 'rightArmBack', name: 'R Arm (Back)', path: 'M85,65 L95,105 C96,108 93,112 89,112 L82,75 Z' },
      { id: 'leftLegBack', name: 'L Leg (Back)', path: 'M38,125 L42,215 C42,218 48,218 48,215 L52,125 Z' },
      { id: 'rightLegBack', name: 'R Leg (Back)', path: 'M72,125 L68,215 C68,218 62,218 62,215 L58,125 Z' }
    ]
  },

  init: function(mountId, onChangeCallback) {
    const mount = document.getElementById(mountId);
    if (!mount) return;

    this.onChange = onChangeCallback || (() => {});
    this.selectedRegions.clear();

    // Create the SVGs
    mount.innerHTML = `
      <div style="text-align: center;">
        <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 5px;">FRONT</span>
        <svg class="body-map-svg" viewBox="0 0 110 230">
          <defs>
            <linearGradient id="pain-grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ff758f" />
              <stop offset="100%" stop-color="#ff0040" />
            </linearGradient>
          </defs>
          ${this.regions.front.map(r => `
            <path id="region-front-${r.id}" class="map-region" d="${r.path}" data-region="${r.id}" title="${r.name}" />
          `).join('')}
        </svg>
      </div>
      
      <div style="text-align: center;">
        <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 5px;">BACK</span>
        <svg class="body-map-svg" viewBox="0 0 110 230">
          ${this.regions.back.map(r => `
            <path id="region-back-${r.id}" class="map-region" d="${r.path}" data-region="${r.id}" title="${r.name}" />
          `).join('')}
        </svg>
      </div>
    `;

    // Bind event listeners
    mount.querySelectorAll('.map-region').forEach(el => {
      el.addEventListener('click', (e) => {
        const regionId = e.target.getAttribute('data-region');
        this.toggleRegion(regionId);
      });
    });
  },

  toggleRegion: function(regionId) {
    if (this.selectedRegions.has(regionId)) {
      this.selectedRegions.delete(regionId);
    } else {
      this.selectedRegions.add(regionId);
    }

    this.updateVisuals();
    this.onChange(Array.from(this.selectedRegions));
  },

  updateVisuals: function() {
    // Front regions
    this.regions.front.forEach(r => {
      const el = document.getElementById(`region-front-${r.id}`);
      if (el) {
        if (this.selectedRegions.has(r.id)) {
          el.classList.add('active-pain');
        } else {
          el.classList.remove('active-pain');
        }
      }
    });

    // Back regions
    this.regions.back.forEach(r => {
      const el = document.getElementById(`region-back-${r.id}`);
      if (el) {
        if (this.selectedRegions.has(r.id)) {
          el.classList.add('active-pain');
        } else {
          el.classList.remove('active-pain');
        }
      }
    });
  },

  getSelectedRegions: function() {
    return Array.from(this.selectedRegions);
  },

  setSelectedRegions: function(regionsArray) {
    this.selectedRegions = new Set(regionsArray);
    this.updateVisuals();
  },

  clear: function() {
    this.selectedRegions.clear();
    this.updateVisuals();
    this.onChange([]);
  }
};
