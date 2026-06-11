// Debug script to check coordinate deduplication
const HEX_RADIUS = 65;
const H_SPACING = Math.sqrt(3) * HEX_RADIUS;
const V_SPACING = 1.5 * HEX_RADIUS;

const ROW_CONFIG = [
  { rowY: -2, hexCount: 3, xOffsets: [-1, 0, 1] },
  { rowY: -1, hexCount: 4, xOffsets: [-1.5, -0.5, 0.5, 1.5] },
  { rowY: 0,  hexCount: 5, xOffsets: [-2, -1, 0, 1, 2] },
  { rowY: 1,  hexCount: 4, xOffsets: [-1.5, -0.5, 0.5, 1.5] },
  { rowY: 2,  hexCount: 3, xOffsets: [-1, 0, 1] }
];

function getHexPoints(cx: number, cy: number) {
  const points = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    points.push({
      x: cx + HEX_RADIUS * Math.cos(angleRad),
      y: cy + HEX_RADIUS * Math.sin(angleRad)
    });
  }
  return points;
}

const vertexSet = new Set<string>();
let tileId = 0;

ROW_CONFIG.forEach((row) => {
  const centerY = row.rowY * V_SPACING;
  row.xOffsets.forEach((xOffset) => {
    const centerX = xOffset * H_SPACING;
    const corners = getHexPoints(centerX, centerY);

    corners.forEach((corner) => {
      const key = `${Math.round(corner.x)},${Math.round(corner.y)}`;
      vertexSet.add(key);
    });

    tileId++;
  });
});

console.log(`Total unique vertex coordinates: ${vertexSet.size}`);
console.log(`Expected: 54`);
console.log(`\nSample vertex keys:`);
Array.from(vertexSet).slice(0, 10).forEach(k => console.log(`  ${k}`));
