/**
 * FibroFlow Clinical Report & FHIR Exporter
 */
const FibroDoctorReport = {
  
  // Generates HTML content for printing / viewing
  generateHTML: function(logs) {
    if (!logs || logs.length === 0) {
      return `
        <div class="clinical-report-container" style="color:#000;">
          <h3>No Symptom Records Found</h3>
          <p>Please log symptoms or load demo data to view a summary report.</p>
        </div>
      `;
    }

    // Calculations
    const totalDays = logs.length;
    const avgPain = (logs.reduce((acc, curr) => acc + curr.painLevel, 0) / totalDays).toFixed(1);
    const avgFatigue = (logs.reduce((acc, curr) => acc + curr.fatigueLevel, 0) / totalDays).toFixed(1);
    
    let avgSleep = 0;
    let sleepLogsCount = 0;
    logs.forEach(l => {
      if (l.sleepHours) {
        avgSleep += l.sleepHours;
        sleepLogsCount++;
      }
    });
    avgSleep = sleepLogsCount > 0 ? (avgSleep / sleepLogsCount).toFixed(1) : "N/A";

    // Most common locations
    const locationsMap = {};
    logs.forEach(l => {
      if (l.painLocations) {
        l.painLocations.forEach(loc => {
          locationsMap[loc] = (locationsMap[loc] || 0) + 1;
        });
      }
    });
    const sortedLocations = Object.entries(locationsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => `${this.formatRegionName(entry[0])} (logged ${entry[1]} times)`)
      .join(', ');

    // Most common triggers
    const triggersMap = {};
    logs.forEach(l => {
      if (l.tags) {
        l.tags.forEach(t => {
          triggersMap[t] = (triggersMap[t] || 0) + 1;
        });
      }
    });
    const sortedTriggers = Object.entries(triggersMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => `${entry[0]} (${entry[1]} days)`)
      .join(', ');

    // Recent 7 entries for tabular view
    const recentLogs = logs.slice(-7).reverse();

    return `
      <div class="clinical-report-container">
        <div class="clinical-meta-header">
          <h2>HITHAFLOW CLINICAL HEALTH REPORT</h2>
          <div class="clinical-meta-grid">
            <div><strong>Patient Name:</strong> Patient self-report</div>
            <div><strong>Date Generated:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Reporting Interval:</strong> Past ${totalDays} Days</div>
            <div><strong>Data Source:</strong> Client-side LocalStorage (FHIR compatible)</div>
          </div>
        </div>

        <div class="clinical-summary-box">
          <h3>Symptom Averages & Diagnostics</h3>
          <p style="margin-top: 6px;">
            <strong>Mean Pain Intensity (0-10 NRS):</strong> <span class="clinical-badge" style="background:#fecdd3;color:#9f1239;">${avgPain} / 10</span><br>
            <strong>Mean Fatigue Severity (FSS-derived):</strong> <span class="clinical-badge" style="background:#fef08a;color:#854d0e;">${avgFatigue} / 10</span><br>
            <strong>Mean Sleep Duration:</strong> <span class="clinical-badge" style="background:#ccfbf1;color:#115e59;">${avgSleep} hours/night</span>
          </p>
          <p style="margin-top: 10px; font-size:13px; color:#555;">
            <strong>Primary Pain Zones:</strong> ${sortedLocations || 'None logged'}<br>
            <strong>Top Correlated Triggers:</strong> ${sortedTriggers || 'None logged'}
          </p>
        </div>

        <h3>Recent Symptoms Stream (Past 7 Logs)</h3>
        <table class="clinical-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Pain (NRS)</th>
              <th>Fatigue (0-10)</th>
              <th>Pain Locations</th>
              <th>Triggers / Context</th>
            </tr>
          </thead>
          <tbody>
            ${recentLogs.map(l => `
              <tr>
                <td><strong>${l.date}</strong></td>
                <td><span style="font-weight:600; color:${l.painLevel >= 7 ? '#dc2626' : l.painLevel >= 4 ? '#d97706' : '#059669'}">${l.painLevel}</span>/10</td>
                <td>${l.fatigueLevel}/10</td>
                <td>${l.painLocations ? l.painLocations.map(this.formatRegionName).join(', ') : 'None'}</td>
                <td>${l.tags ? l.tags.join(', ') : 'None'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top:24px; font-size:11px; color:#666; border-top:1px solid #e5e7eb; padding-top:12px; text-align:center;">
          Generated with HithaFlow Companion. Clinicians may integrate this data via the FHIR JSON output in Settings.
        </div>
      </div>
    `;
  },

  // Helper to make region keys readable
  formatRegionName: function(regionId) {
    const names = {
      head: 'Head',
      occiput: 'Occiput (Back of Head)',
      neck: 'Neck (Front)',
      neckBack: 'Neck (Back)',
      leftShoulder: 'Left Shoulder',
      rightShoulder: 'Right Shoulder',
      leftShoulderBack: 'Left Shoulder (Back)',
      rightShoulderBack: 'Right Shoulder (Back)',
      upperBack: 'Upper Back',
      lowerBack: 'Lower Back',
      chest: 'Chest',
      abdomen: 'Abdomen',
      hips: 'Hips',
      gluteals: 'Gluteals',
      leftArm: 'Left Arm',
      rightArm: 'Right Arm',
      leftLeg: 'Left Leg',
      rightLeg: 'Right Leg'
    };
    return names[regionId] || regionId;
  },

  // Generates FHIR-compliant Observation bundle JSON
  generateFHIR: function(logs) {
    if (!logs || logs.length === 0) return JSON.stringify({ resourceType: "Bundle", type: "collection", entry: [] }, null, 2);

    const fhirEntries = [];

    logs.forEach((log, index) => {
      const dateTime = new Date(log.date).toISOString();

      // Pain Observation (LOINC 45434-8)
      fhirEntries.push({
        fullUrl: `urn:uuid:pain-obs-${index}`,
        resource: {
          resourceType: "Observation",
          status: "final",
          category: [{
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "vital-signs",
              display: "Vital Signs"
            }]
          }],
          code: {
            coding: [{
              system: "http://loinc.org",
              code: "45434-8",
              display: "Pain severity - 0-10 numerical rating scale"
            }],
            text: "Self-reported pain intensity"
          },
          subject: {
            display: "Anonymous HithaFlow Patient"
          },
          effectiveDateTime: dateTime,
          valueQuantity: {
            value: log.painLevel,
            unit: "NRS",
            system: "http://unitsofmeasure.org",
            code: "{score}"
          },
          bodySite: {
            coding: log.painLocations ? log.painLocations.map(loc => ({
              system: "http://snomed.info/sct",
              code: this.getSNOMEDCode(loc),
              display: this.formatRegionName(loc)
            })) : []
          }
        }
      });

      // Fatigue Observation (LOINC 71007-9)
      fhirEntries.push({
        fullUrl: `urn:uuid:fatigue-obs-${index}`,
        resource: {
          resourceType: "Observation",
          status: "final",
          code: {
            coding: [{
              system: "http://loinc.org",
              code: "71007-9",
              display: "Fatigue Severity Scale"
            }],
            text: "Self-reported fatigue severity"
          },
          subject: {
            display: "Anonymous HithaFlow Patient"
          },
          effectiveDateTime: dateTime,
          valueQuantity: {
            value: log.fatigueLevel,
            unit: "score",
            system: "http://unitsofmeasure.org",
            code: "{score}"
          }
        }
      });
    });

    const bundle = {
      resourceType: "Bundle",
      id: "hithaflow-symptoms-bundle",
      type: "collection",
      timestamp: new Date().toISOString(),
      entry: fhirEntries
    };

    return JSON.stringify(bundle, null, 2);
  },

  // Mock SNOMED mapping for anatomical targets
  getSNOMEDCode: function(regionId) {
    const codes = {
      head: "69536005",
      neck: "45048000",
      neckBack: "39937001",
      leftShoulder: "20970007",
      rightShoulder: "20970007",
      upperBack: "51336005",
      lowerBack: "82242001",
      chest: "43799004",
      hips: "29830006",
      leftArm: "40983000",
      rightArm: "40983000",
      leftLeg: "30021007",
      rightLeg: "30021007"
    };
    return codes[regionId] || "385294005"; // Default "Human body structure" SNOMED code
  }
};
