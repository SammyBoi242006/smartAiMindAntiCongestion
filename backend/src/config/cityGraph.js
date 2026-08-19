const nodes = [
  { id: "A", name: "Riverside Homes", lat: 12.9716, lng: 77.5946 },
  { id: "B", name: "Central Junction", lat: 12.9782, lng: 77.6011 },
  { id: "C", name: "Tech Park", lat: 12.9825, lng: 77.609 },
  { id: "D", name: "Metro Hub", lat: 12.9749, lng: 77.6153 },
  { id: "E", name: "Market Square", lat: 12.9667, lng: 77.6084 },
  { id: "F", name: "University Gate", lat: 12.9614, lng: 77.5997 },
  { id: "G", name: "Airport Link", lat: 12.9886, lng: 77.6197 },
  { id: "H", name: "Greenfield Station", lat: 12.9558, lng: 77.6142 },
  { id: "I", name: "Old Town", lat: 12.9691, lng: 77.5859 },
  { id: "J", name: "City Hospital", lat: 12.9852, lng: 77.5898 },
];

const segments = [
  { id: "S1", fromId: "A", toId: "B", mode: "road", baseSpeedKph: 42, capacity: 900 },
  { id: "S2", fromId: "B", toId: "C", mode: "road", baseSpeedKph: 36, capacity: 800 },
  { id: "S3", fromId: "C", toId: "D", mode: "bus", baseSpeedKph: 30, capacity: 500 },
  { id: "S4", fromId: "D", toId: "E", mode: "metro", baseSpeedKph: 48, capacity: 1100 },
  { id: "S5", fromId: "E", toId: "F", mode: "road", baseSpeedKph: 34, capacity: 700 },
  { id: "S6", fromId: "F", toId: "A", mode: "bus", baseSpeedKph: 28, capacity: 450 },
  { id: "S7", fromId: "B", toId: "D", mode: "metro", baseSpeedKph: 52, capacity: 1200 },
  { id: "S8", fromId: "B", toId: "E", mode: "road", baseSpeedKph: 40, capacity: 850 },
  { id: "S9", fromId: "C", toId: "G", mode: "road", baseSpeedKph: 55, capacity: 1000 },
  { id: "S10", fromId: "D", toId: "G", mode: "metro", baseSpeedKph: 58, capacity: 1300 },
  { id: "S11", fromId: "E", toId: "H", mode: "bus", baseSpeedKph: 26, capacity: 400 },
  { id: "S12", fromId: "F", toId: "H", mode: "road", baseSpeedKph: 32, capacity: 650 },
  { id: "S13", fromId: "A", toId: "I", mode: "road", baseSpeedKph: 38, capacity: 750 },
  { id: "S14", fromId: "I", toId: "J", mode: "bus", baseSpeedKph: 29, capacity: 450 },
  { id: "S15", fromId: "J", toId: "B", mode: "road", baseSpeedKph: 44, capacity: 900 },
  { id: "S16", fromId: "J", toId: "C", mode: "metro", baseSpeedKph: 50, capacity: 1100 },
  { id: "S17", fromId: "H", toId: "D", mode: "road", baseSpeedKph: 37, capacity: 700 },
  { id: "S18", fromId: "I", toId: "E", mode: "road", baseSpeedKph: 35, capacity: 720 },
];

module.exports = { nodes, segments };
