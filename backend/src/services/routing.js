const { nodes } = require("../config/cityGraph");
const { getSegments } = require("../store/dataStore");

function edgeCost(segment, mode) {
  const travelMinutes = 60 / Math.max(segment.speedKph, 5);
  const congestionMultiplier = 1 + segment.aci / 100;
  const ecoPenalty = mode === "eco" && segment.mode === "road" ? 4 : 0;
  return travelMinutes * congestionMultiplier + ecoPenalty;
}

function findRoute(fromId, toId, mode = "fastest") {
  if (!nodes.some((node) => node.id === fromId) || !nodes.some((node) => node.id === toId)) return null;
  if (fromId === toId) return { nodeIds: [fromId], segments: [], totalCost: 0, mode };

  const distances = new Map(nodes.map((node) => [node.id, Infinity]));
  const previous = new Map();
  const unvisited = new Set(nodes.map((node) => node.id));
  distances.set(fromId, 0);
  const segments = getSegments();

  while (unvisited.size) {
    const currentId = [...unvisited].reduce((best, nodeId) =>
      distances.get(nodeId) < distances.get(best) ? nodeId : best,
    );
    if (distances.get(currentId) === Infinity) break;
    unvisited.delete(currentId);
    if (currentId === toId) break;

    for (const segment of segments.filter((edge) => edge.fromId === currentId)) {
      if (!unvisited.has(segment.toId)) continue;
      const candidate = distances.get(currentId) + edgeCost(segment, mode);
      if (candidate < distances.get(segment.toId)) {
        distances.set(segment.toId, candidate);
        previous.set(segment.toId, { nodeId: currentId, segment });
      }
    }
  }

  if (!previous.has(toId)) return null;
  const routeSegments = [];
  const nodeIds = [toId];
  let cursor = toId;
  while (cursor !== fromId) {
    const step = previous.get(cursor);
    routeSegments.unshift(step.segment);
    cursor = step.nodeId;
    nodeIds.unshift(cursor);
  }

  return {
    mode,
    nodeIds,
    segments: routeSegments,
    totalCost: Number(distances.get(toId).toFixed(2)),
  };
}

module.exports = { edgeCost, findRoute };
