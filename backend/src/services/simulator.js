const { getSegments, updateSegment } = require("../store/dataStore");
const { computeACI } = require("./scoring");

const TICK_MS = 3000;
let tickNumber = 0;
let timer;
const logTicks = process.env.LOG_SIMULATOR_TICKS === "true";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function simulateTick() {
  tickNumber += 1;
  const liveSegments = getSegments().map((segment, index) => {
    const phase = tickNumber / 5 + index * 0.78;
    const rushWave = (Math.sin(phase) + 1) / 2;
    const localWave = (Math.sin(phase * 0.43 + index) + 1) / 2;
    const modePressure = segment.mode === "road" ? 0.22 : segment.mode === "bus" ? 0.14 : 0.08;
    const targetOccupancy = 0.22 + modePressure + rushWave * 0.3 + localWave * 0.12;
    const occupancyRatio = clamp(
      segment.occupancyRatio + (targetOccupancy - segment.occupancyRatio) * 0.34 + (Math.random() - 0.5) * 0.035,
      0.08,
      0.98,
    );
    const congestionDrag = occupancyRatio * (segment.mode === "road" ? 0.7 : segment.mode === "bus" ? 0.53 : 0.3);
    const targetSpeed = segment.baseSpeedKph * (1 - congestionDrag);
    const speedKph = clamp(
      segment.speedKph + (targetSpeed - segment.speedKph) * 0.42 + (Math.random() - 0.5) * 2,
      Math.max(5, segment.baseSpeedKph * 0.14),
      segment.baseSpeedKph * 1.05,
    );
    const nextReading = {
      speedKph: Number(speedKph.toFixed(1)),
      occupancyRatio: Number(occupancyRatio.toFixed(2)),
    };
    return updateSegment(segment.id, { ...nextReading, aci: computeACI({ ...segment, ...nextReading }) });
  });

  if (logTicks) {
    console.log(`Simulator tick ${tickNumber}: ${liveSegments.length} segments updated`);
  }
  return liveSegments;
}

function startSimulator(onTick) {
  if (timer) return timer;
  const runTick = () => {
    const snapshot = simulateTick();
    if (onTick) onTick(snapshot);
  };
  runTick();
  timer = setInterval(runTick, TICK_MS);
  return timer;
}

function stopSimulator() {
  clearInterval(timer);
  timer = undefined;
}

module.exports = { TICK_MS, simulateTick, startSimulator, stopSimulator };
