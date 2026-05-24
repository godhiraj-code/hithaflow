/**
 * FibroFlow Trigger Intelligence & Correlation Analytics Engine
 */
const FibroAnalytics = {

  getDailyInsight: function(logs) {
    if (!logs || logs.length === 0) return { icon: '👋', text: 'Welcome! Log your first day to start building your personal pattern library.', type: 'neutral' };
    const recent = logs.slice(-3);
    if (recent.length === 3 && recent.every(l => l.painLevel >= 7)) {
      return { icon: '⚠️', text: "You've had 3 consecutive high-pain days. Consider strict rest today: 10min active / 30min rest.", type: 'warning' };
    }
    return { icon: '💜', text: 'Keep logging to build your personal pattern library. Every entry helps find your triggers.', type: 'neutral' };
  },

  // Calculate standard stats (Pain, Fatigue, Sleep) and trends
  getBasicStats: function(logs) {
    if (!logs || logs.length === 0) {
      return {
        avgPain: '--',
        avgFatigue: '--',
        avgSleep: '--',
        painTrend: { direction: 'flat', text: 'Stable' },
        fatigueTrend: { direction: 'flat', text: 'Stable' }
      };
    }

    const totalDays = logs.length;
    const avgPain = (logs.reduce((acc, curr) => acc + curr.painLevel, 0) / totalDays).toFixed(1);
    const avgFatigue = (logs.reduce((acc, curr) => acc + curr.fatigueLevel, 0) / totalDays).toFixed(1);

    const sleepLogs = logs.filter(l => l.sleepHours !== undefined);
    const avgSleep = sleepLogs.length > 0
      ? (sleepLogs.reduce((acc, curr) => acc + curr.sleepHours, 0) / sleepLogs.length).toFixed(1)
      : 'N/A';

    // Calculate trends (comparing past 7 days to the 7 days before that)
    let painTrend = { direction: 'flat', text: 'Stable' };
    let fatigueTrend = { direction: 'flat', text: 'Stable' };

    if (logs.length >= 14) {
      const recent7 = logs.slice(-7);
      const previous7 = logs.slice(-14, -7);

      const recentPainAvg = recent7.reduce((acc, curr) => acc + curr.painLevel, 0) / 7;
      const previousPainAvg = previous7.reduce((acc, curr) => acc + curr.painLevel, 0) / 7;
      const painDiff = recentPainAvg - previousPainAvg;

      if (painDiff > 0.5) {
        painTrend = { direction: 'up', text: `Up ${Math.round(painDiff * 10)}% this week` };
      } else if (painDiff < -0.5) {
        painTrend = { direction: 'down', text: `Down ${Math.round(Math.abs(painDiff) * 10)}% this week` };
      }

      const recentFatigueAvg = recent7.reduce((acc, curr) => acc + curr.fatigueLevel, 0) / 7;
      const previousFatigueAvg = previous7.reduce((acc, curr) => acc + curr.fatigueLevel, 0) / 7;
      const fatigueDiff = recentFatigueAvg - previousFatigueAvg;

      if (fatigueDiff > 0.5) {
        fatigueTrend = { direction: 'up', text: `Up ${Math.round(fatigueDiff * 10)}% this week` };
      } else if (fatigueDiff < -0.5) {
        fatigueTrend = { direction: 'down', text: `Down ${Math.round(Math.abs(fatigueDiff) * 10)}% this week` };
      }
    }

    return { avgPain, avgFatigue, avgSleep, painTrend, fatigueTrend };
  },

  // Calculates triggers correlations (Pain levels vs Tags)
  calculateCorrelations: function(logs) {
    if (!logs || logs.length < 5) return [];

    const tagStats = {};

    // Gather pain numbers for when a tag is present vs absent
    logs.forEach(log => {
      if (!log.tags) return;
      log.tags.forEach(tag => {
        if (!tagStats[tag]) {
          tagStats[tag] = { count: 0, painSum: 0, dates: [] };
        }
        tagStats[tag].count++;
        tagStats[tag].painSum += log.painLevel;
        tagStats[tag].dates.push(log.date);
      });
    });

    const correlations = [];
    const overallPainSum = logs.reduce((acc, curr) => acc + curr.painLevel, 0);
    const overallPainAvg = overallPainSum / logs.length;

    Object.entries(tagStats).forEach(([tag, stat]) => {
      // Only draw conclusions if logged at least 3 times
      if (stat.count < 3) return;

      const avgPainWithTag = stat.painSum / stat.count;
      
      // Calculate pain when tag was absent
      const absentLogs = logs.filter(l => !l.tags || !l.tags.includes(tag));
      if (absentLogs.length < 3) return;

      const avgPainWithoutTag = absentLogs.reduce((acc, curr) => acc + curr.painLevel, 0) / absentLogs.length;
      const diff = avgPainWithTag - avgPainWithoutTag;
      const percentageDiff = Math.round((diff / (avgPainWithoutTag || 1)) * 100);

      if (diff > 0.8) {
        correlations.push({
          tag: tag,
          type: 'negative', // triggers high pain
          strength: percentageDiff,
          message: `Your pain was <strong>${percentageDiff}% higher</strong> on days with <strong>"${tag}"</strong>`
        });
      } else if (diff < -0.8) {
        correlations.push({
          tag: tag,
          type: 'positive', // buffers/reduces pain
          strength: Math.abs(percentageDiff),
          message: `You logged <strong>${Math.abs(percentageDiff)}% lower pain</strong> on days with <strong>"${tag}"</strong>`
        });
      }
    });

    // Sort negative correlations (highest pain triggers) first
    return correlations.sort((a, b) => b.strength - a.strength);
  },

  // Split logs into weekly blocks for the dropdown selector
  getWeeklyBlocks: function(logs) {
    if (!logs || logs.length < 7) return [];
    
    // Sort logs chronologically descending
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    const weeks = [];
    
    for (let i = 0; i < sorted.length; i += 7) {
      const block = sorted.slice(i, i + 7);
      if (block.length < 4) continue; // Skip incomplete weeks

      const start = block[block.length - 1].date;
      const end = block[0].date;
      
      const avgPain = (block.reduce((acc, curr) => acc + curr.painLevel, 0) / block.length).toFixed(1);
      
      weeks.push({
        id: start,
        label: `Week of ${start} to ${end} (Avg Pain: ${avgPain})`,
        logs: block
      });
    }
    return weeks;
  },

  // Calculate detailed summary for a specific week
  getWeekDetails: function(weekLogs) {
    const total = weekLogs.length;
    const avgPain = (weekLogs.reduce((acc, curr) => acc + curr.painLevel, 0) / total).toFixed(1);
    const avgFatigue = (weekLogs.reduce((acc, curr) => acc + curr.fatigueLevel, 0) / total).toFixed(1);
    const avgSleep = (weekLogs.reduce((acc, curr) => acc + curr.sleepHours, 0) / total).toFixed(1);

    // Count stress levels
    const highStressDays = weekLogs.filter(l => l.stressLevel === 'High' || l.tags.includes('Work Stress')).length;

    // Gather unique positive / negative tags
    const activeTags = new Set();
    weekLogs.forEach(l => l.tags.forEach(t => activeTags.add(t)));

    return {
      avgPain,
      avgFatigue,
      avgSleep,
      highStressDays,
      activeTags: Array.from(activeTags)
    };
  },

  // Predictive Flare Warning Logic
  predictFlare: function(logs) {
    if (!logs || logs.length < 3) {
      return {
        warningActive: false,
        message: "Keep tracking to enable predictive warnings."
      };
    }

    // Look at the last 2 logs
    const recent = logs.slice(-2);
    const lastLog = recent[1];
    const prevLog = recent[0];

    if (!lastLog) return { warningActive: false };

    // Indicators of flare patterns:
    // 1. Poor sleep duration (< 6.0 hrs) or tag "Restless Sleep"
    // 2. Barometric pressure changes or "Pressure Drop" weather
    // 3. Worsening fatigue trend (+2.0 points)
    const hasPoorSleep = lastLog.sleepHours < 6.0 || lastLog.tags.includes('Restless Sleep') || lastLog.tags.includes('Insomnia');
    const hasWeatherShift = lastLog.tags.includes('Barometric Drop') || lastLog.tags.includes('Rainy/Damp');
    const fatigueWorsening = (lastLog.fatigueLevel - prevLog.fatigueLevel) >= 2;
    const hasHighStress = lastLog.tags.includes('Work Stress') || lastLog.tags.includes('Social Burnout');

    let riskFactors = 0;
    const details = [];

    if (hasPoorSleep) {
      riskFactors++;
      details.push("sleep disruption");
    }
    if (hasWeatherShift) {
      riskFactors++;
      details.push("barometric pressure drop");
    }
    if (fatigueWorsening) {
      riskFactors++;
      details.push("increasing fatigue trend");
    }
    if (hasHighStress) {
      riskFactors++;
      details.push("elevated stress loads");
    }

    if (riskFactors >= 2 && lastLog.painLevel < 7) {
      return {
        warningActive: true,
        riskLevel: riskFactors >= 3 ? 'High' : 'Moderate',
        message: `<strong>Pacing Advisory:</strong> Pattern shows ${details.join(' + ')}. There is a elevated risk of a pain flare-up in the next 24-48 hours. Suggest limiting continuous physical blocks to 20 mins followed by rest.`
      };
    }

    return {
      warningActive: false,
      message: "No current indicators. Keep pacing your energy reserves gently."
    };
  },

  // Generate a contextual daily insight based on log patterns
  getDailyInsight: function(logs) {
    // (a) No logs at all
    if (!logs || logs.length === 0) {
      return {
        icon: '👋',
        text: 'Welcome! Log your first day to start building your personal pattern library.',
        type: 'neutral'
      };
    }

    // Sort logs chronologically (oldest first)
    const sorted = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));

    // (b) Last 3 days all have pain >= 7
    if (sorted.length >= 3) {
      const last3 = sorted.slice(-3);
      const allHighPain = last3.every(l => l.painLevel >= 7);
      if (allHighPain) {
        return {
          icon: '⚠️',
          text: `You've had 3 consecutive high-pain days. Consider strict rest today: 10min active / 30min rest. You're doing great by tracking through this.`,
          type: 'warning'
        };
      }
    }

    // (c) Check if current week avg is the best (lowest) across all weeks
    if (sorted.length >= 7) {
      const weekSize = 7;
      const fullWeeks = Math.floor(sorted.length / weekSize);

      if (fullWeeks >= 2) {
        const currentWeekLogs = sorted.slice(-weekSize);
        const currentWeekAvg = currentWeekLogs.reduce((sum, l) => sum + l.painLevel, 0) / weekSize;

        let isBestWeek = true;
        for (let i = 0; i < fullWeeks - 1; i++) {
          const start = i * weekSize;
          const block = sorted.slice(start, start + weekSize);
          const blockAvg = block.reduce((sum, l) => sum + l.painLevel, 0) / weekSize;
          if (blockAvg <= currentWeekAvg) {
            isBestWeek = false;
            break;
          }
        }

        if (isBestWeek) {
          const totalDays = sorted.length;
          return {
            icon: '🎉',
            text: `This is your best week in ${totalDays} days! Average pain: ${currentWeekAvg.toFixed(1)}/10. Whatever you're doing, keep it up!`,
            type: 'celebration'
          };
        }
      }
    }

    // (d) & (e) Pain trend: last 3 days vs prior 3 days
    if (sorted.length >= 6) {
      const recent3 = sorted.slice(-3);
      const prior3 = sorted.slice(-6, -3);
      const recentAvg = recent3.reduce((sum, l) => sum + l.painLevel, 0) / 3;
      const priorAvg = prior3.reduce((sum, l) => sum + l.painLevel, 0) / 3;
      const diff = recentAvg - priorAvg;

      if (diff < -0.5) {
        return {
          icon: '📉',
          text: `Your pain has been trending down over the last 3 days (avg ${priorAvg.toFixed(1)} → ${recentAvg.toFixed(1)}). Great progress!`,
          type: 'positive'
        };
      }

      if (diff > 0.5) {
        return {
          icon: '📈',
          text: `Pain has been creeping up (avg ${priorAvg.toFixed(1)} → ${recentAvg.toFixed(1)}). Consider extra rest and pacing today.`,
          type: 'warning'
        };
      }
    }

    // (f) Tag correlations — find tag with highest positive correlation to high pain
    if (sorted.length >= 5) {
      const highPainDays = sorted.filter(l => l.painLevel >= 7);
      if (highPainDays.length >= 2) {
        const tagCounts = {};
        highPainDays.forEach(l => {
          if (!l.tags) return;
          l.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        });

        let bestTag = null;
        let bestPct = 0;
        Object.entries(tagCounts).forEach(([tag, count]) => {
          const pct = Math.round((count / highPainDays.length) * 100);
          if (pct > 30 && pct > bestPct) {
            bestPct = pct;
            bestTag = tag;
          }
        });

        if (bestTag) {
          return {
            icon: '🧠',
            text: `Pattern spotted: "${bestTag}" appears on ${bestPct}% of your high-pain days. Consider monitoring this trigger.`,
            type: 'neutral'
          };
        }
      }
    }

    // (g) Default
    return {
      icon: '💜',
      text: 'Keep logging to build your personal pattern library. Every entry helps find your triggers.',
      type: 'neutral'
    };
  }
};
