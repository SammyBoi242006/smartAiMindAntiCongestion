const express = require("express");
const { nodes } = require("../config/cityGraph");
const { getHistory, getSegment, getSegments } = require("../store/dataStore");
const { predictSegment } = require("../services/predictor");
const { findRoute } = require("../services/routing");

const router = express.Router();

router.get("/locations", (_request, response) => response.json(nodes));
router.get("/segments", (_request, response) => response.json(getSegments()));

router.get("/segments/:id/history", (request, response) => {
  if (!getSegment(request.params.id)) return response.status(404).json({ error: "Segment not found" });
  return response.json(getHistory(request.params.id));
});

router.get("/segments/:id/predict", (request, response) => {
  const prediction = predictSegment(request.params.id);
  if (!prediction) return response.status(404).json({ error: "Segment not found" });
  return response.json({ segmentId: request.params.id, ...prediction });
});

router.get("/route", (request, response) => {
  const { from, to, mode = "fastest" } = request.query;
  if (!from || !to || !["fastest", "eco"].includes(mode)) {
    return response.status(400).json({ error: "from, to, and mode=fastest|eco are required" });
  }
  const route = findRoute(from, to, mode);
  if (!route) return response.status(404).json({ error: "No route found for the supplied locations" });
  return response.json(route);
});

module.exports = router;
