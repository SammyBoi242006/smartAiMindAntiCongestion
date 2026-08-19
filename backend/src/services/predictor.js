const { getHistory, getSegment } = require("../store/dataStore");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function forecast(history, stepsAhead) {
  const points = history.slice(-30);
  if (!points.length) return 0;
  if (points.length === 1) return points[0].aci || 0;

  const count = points.length;
  const meanX = (count - 1) / 2;
  const meanY = points.reduce((sum, point) => sum + (point.aci || 0), 0) / count;
  let numerator = 0;
  let denominator = 0;
  points.forEach((point, index) => {
    const xOffset = index - meanX;
    numerator += xOffset * ((point.aci || 0) - meanY);
    denominator += xOffset * xOffset;
  });
  const slopePerTick = denominator ? numerator / denominator : 0;
  // Dampening keeps a 3-second simulator trend realistic at 15/30-minute horizons.
  return Math.round(clamp(points.at(-1).aci + slopePerTick * stepsAhead * 0.006, 0, 100));
}

function predictSegment(segmentId) {
  const segment = getSegment(segmentId);
  if (!segment) return null;
  const history = getHistory(segmentId);
  const latestAci = segment.aci || 0;
  if (history.length < 2) return { plus15: latestAci, plus30: latestAci };
  return {
    plus15: forecast(history, 300),
    plus30: forecast(history, 600),
  };
}

module.exports = { forecast, predictSegment };
