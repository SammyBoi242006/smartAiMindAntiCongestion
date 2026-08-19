const { segments } = require("../config/cityGraph");

const HISTORY_LIMIT = 200;
const segmentState = new Map();
const histories = new Map();

for (const segment of segments) {
  const initialState = {
    ...segment,
    speedKph: segment.baseSpeedKph,
    occupancyRatio: 0.32,
    incidentImpact: 0,
    aci: 11,
    updatedAt: new Date().toISOString(),
  };
  segmentState.set(segment.id, initialState);
  histories.set(segment.id, []);
}

function updateSegment(segmentId, patch) {
  const current = segmentState.get(segmentId);
  if (!current) throw new Error(`Unknown segment: ${segmentId}`);

  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  segmentState.set(segmentId, next);
  const history = histories.get(segmentId);
  history.push({
    timestamp: next.updatedAt,
    speedKph: next.speedKph,
    occupancyRatio: next.occupancyRatio,
    aci: next.aci,
  });
  if (history.length > HISTORY_LIMIT) history.splice(0, history.length - HISTORY_LIMIT);
  return next;
}

function getSegment(segmentId) {
  return segmentState.get(segmentId);
}

function getSegments() {
  return [...segmentState.values()];
}

function getHistory(segmentId) {
  return histories.get(segmentId) || [];
}

module.exports = { HISTORY_LIMIT, updateSegment, getSegment, getSegments, getHistory };
