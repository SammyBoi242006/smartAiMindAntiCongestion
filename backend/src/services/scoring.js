function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * AI Congestion Index: 55% lost speed, 35% occupancy, and up to 10 points for an incident.
 */
function computeACI(segment) {
  const speedDeficit = clamp(1 - segment.speedKph / segment.baseSpeedKph, 0, 1);
  const occupancy = clamp(segment.occupancyRatio, 0, 1);
  const incidentBump = clamp(Number(segment.incidentImpact) || 0, 0, 10);
  return Math.round(clamp(speedDeficit * 55 + occupancy * 35 + incidentBump, 0, 100));
}

module.exports = { computeACI };
