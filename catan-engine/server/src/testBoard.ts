import { generateBoard } from './boardGenerator';

// Generate and inspect the board
const board = generateBoard();

console.log('=== CATAN BOARD GENERATION COMPLETE ===\n');

console.log(`📊 Board Statistics:`);
console.log(`  Tiles: ${board.tiles.length} (expected: 19)`);
console.log(`  Vertices: ${board.vertices.length} (expected: 54)`);
console.log(`  Edges: ${board.edges.length} (expected: 72)\n`);

console.log(`🎲 Tile Configuration (ID | Resource | Dice | Vertices | Edges):`);
board.tiles.forEach((tile) => {
  const diceStr = tile.diceNumber !== null ? tile.diceNumber.toString().padStart(2) : '--';
  console.log(
    `  Tile ${tile.id.toString().padStart(2)}: ${tile.resourceType.padEnd(6)} | ${diceStr} | ` +
    `V[${tile.surroundingVertices.length}] E[${tile.surroundingEdges.length}]`
  );
});

console.log(`\n🔗 Vertex Adjacency Sample (first 5 vertices):`);
board.vertices.slice(0, 5).forEach((vertex) => {
  console.log(
    `  V${vertex.id.toString().padStart(2)}: ` +
    `adjV[${vertex.adjacentVertices.join(',')}] ` +
    `adjE[${vertex.adjacentEdges.join(',')}] ` +
    `tiles[${vertex.adjacentTiles.join(',')}]`
  );
});

console.log(`\n🛣️  Edge Adjacency Sample (first 5 edges):`);
board.edges.slice(0, 5).forEach((edge) => {
  console.log(
    `  E${edge.id.toString().padStart(2)}: ` +
    `vertices[${edge.adjacentVertices.join(',')}] ` +
    `tiles[${edge.adjacentTiles.join(',')}]`
  );
});

console.log(`\n✅ Board generation successful!`);
console.log(`   All adjacency relationships computed.`);
console.log(`   Ready to use with game engine.\n`);
