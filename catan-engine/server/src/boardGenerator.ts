import { BoardState, ResourceType, Tile, Vertex, Edge } from './types';

// Hex geometry constants (must match Board.tsx)
const HEX_RADIUS = 65;
const H_SPACING = Math.sqrt(3) * HEX_RADIUS;
const V_SPACING = 1.5 * HEX_RADIUS;

// Classic Catan row structure (must match Board.tsx exactly)
const ROW_CONFIG = [
  { rowY: -2, hexCount: 3, xOffsets: [-1, 0, 1] },       // Row 0: Tiles 0, 1, 2
  { rowY: -1, hexCount: 4, xOffsets: [-1.5, -0.5, 0.5, 1.5] }, // Row 1: Tiles 3, 4, 5, 6
  { rowY: 0,  hexCount: 5, xOffsets: [-2, -1, 0, 1, 2] }, // Row 2: Tiles 7, 8, 9, 10, 11
  { rowY: 1,  hexCount: 4, xOffsets: [-1.5, -0.5, 0.5, 1.5] }, // Row 3: Tiles 12, 13, 14, 15
  { rowY: 2,  hexCount: 3, xOffsets: [-1, 0, 1] }        // Row 4: Tiles 16, 17, 18
];

// Standard Catan resource distribution (randomizable later)
const TILE_RESOURCES: ResourceType[] = [
  'WOOD', 'WOOL', 'GRAIN',           // Row 0 (tiles 0-2)
  'BRICK', 'ORE', 'WOOD', 'GRAIN',   // Row 1 (tiles 3-6)
  'DESERT', 'WOOD', 'ORE', 'GRAIN', 'WOOL', // Row 2 (tiles 7-11)
  'BRICK', 'WOOL', 'WOOL', 'GRAIN',  // Row 3 (tiles 12-15)
  'ORE', 'BRICK', 'WOOD'             // Row 4 (tiles 16-18)
];

// Standard Catan dice number distribution (skip desert at index 7)
const TILE_DICE_NUMBERS: (number | null)[] = [
  10, 2, 9,          // Row 0
  12, 6, 4, 10,      // Row 1
  null, 3, 11, 4, 8, // Row 2 (null = desert)
  8, 3, 6, 5,        // Row 3
  5, 9, 11           // Row 4
];

interface TilePosition {
  id: number;
  centerX: number;
  centerY: number;
  resourceType: ResourceType;
  diceNumber: number | null;
}

interface VertexPosition {
  x: number;
  y: number;
}

// Calculate hex corner positions
function getHexPoints(cx: number, cy: number): VertexPosition[] {
  const points: VertexPosition[] = [];
  for (let i = 0; i < 6; i++) {
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    points.push({
      x: cx + HEX_RADIUS * Math.cos(angleRad),
      y: cy + HEX_RADIUS * Math.sin(angleRad)
    });
  }
  return points;
}

// Generate tile positions
function generateTilePositions(): TilePosition[] {
  const tiles: TilePosition[] = [];
  let tileId = 0;

  ROW_CONFIG.forEach((row) => {
    const centerY = row.rowY * V_SPACING;
    row.xOffsets.forEach((xOffset) => {
      tiles.push({
        id: tileId,
        centerX: xOffset * H_SPACING,
        centerY,
        resourceType: TILE_RESOURCES[tileId],
        diceNumber: TILE_DICE_NUMBERS[tileId]
      });
      tileId++;
    });
  });

  return tiles;
}

// Create coordinate key for deduplication (matches Board.tsx exactly)
function coordKey(x: number, y: number): string {
  return `${Math.round(x)},${Math.round(y)}`;
}

/**
 * Generates a complete Catan board with all adjacency relationships
 * This matches the exact geometry used in Board.tsx
 */
export function generateBoard(): BoardState {
  const tilePositions = generateTilePositions();

  // Build vertex and edge maps using coordinate-based deduplication
  const verticesMap = new Map<string, { id: number; x: number; y: number; adjacentTiles: number[] }>();
  const edgesMap = new Map<string, { id: number; v1Key: string; v2Key: string; adjacentTiles: number[] }>();

  let vertexIdCounter = 0;
  let edgeIdCounter = 0;

  // First pass: Create all vertices and edges
  tilePositions.forEach((tile) => {
    const corners = getHexPoints(tile.centerX, tile.centerY);
    const tileVertexKeys: string[] = [];

    // Register vertices
    corners.forEach((corner) => {
      const key = coordKey(corner.x, corner.y);
      tileVertexKeys.push(key);

      if (!verticesMap.has(key)) {
        verticesMap.set(key, {
          id: vertexIdCounter++,
          x: corner.x,
          y: corner.y,
          adjacentTiles: []
        });
      }

      // Add this tile to the vertex's adjacent tiles
      verticesMap.get(key)!.adjacentTiles.push(tile.id);
    });

    // Register edges
    for (let i = 0; i < 6; i++) {
      const v1Key = tileVertexKeys[i];
      const v2Key = tileVertexKeys[(i + 1) % 6];
      const edgeKey = [v1Key, v2Key].sort().join('|');

      if (!edgesMap.has(edgeKey)) {
        edgesMap.set(edgeKey, {
          id: edgeIdCounter++,
          v1Key,
          v2Key,
          adjacentTiles: []
        });
      }

      // Add this tile to the edge's adjacent tiles
      edgesMap.get(edgeKey)!.adjacentTiles.push(tile.id);
    }
  });

  // Second pass: Build adjacency relationships for vertices
  const verticesArray = Array.from(verticesMap.entries()).map(([key, data]) => ({ key, ...data }));
  const edgesArray = Array.from(edgesMap.values());

  // Build final vertex objects with adjacency data
  const vertices: Vertex[] = verticesArray.map((vertex) => {
    // Find adjacent vertices (vertices that share an edge)
    const adjacentVertices: number[] = [];
    const adjacentEdges: number[] = [];

    edgesArray.forEach((edge) => {
      if (edge.v1Key === vertex.key) {
        const otherVertex = verticesArray.find(v => v.key === edge.v2Key);
        if (otherVertex) adjacentVertices.push(otherVertex.id);
        adjacentEdges.push(edge.id);
      } else if (edge.v2Key === vertex.key) {
        const otherVertex = verticesArray.find(v => v.key === edge.v1Key);
        if (otherVertex) adjacentVertices.push(otherVertex.id);
        adjacentEdges.push(edge.id);
      }
    });

    return {
      id: vertex.id,
      building: null,
      ownerId: null,
      port: null,
      adjacentVertices,
      adjacentEdges,
      adjacentTiles: vertex.adjacentTiles
    };
  });

  // Build final edge objects
  const edges: Edge[] = edgesArray.map((edge) => {
    const v1 = verticesArray.find(v => v.key === edge.v1Key)!;
    const v2 = verticesArray.find(v => v.key === edge.v2Key)!;

    return {
      id: edge.id,
      roadOwnerId: null,
      adjacentVertices: [v1.id, v2.id] as [number, number],
      adjacentTiles: edge.adjacentTiles
    };
  });

  // Build final tile objects with adjacency data
  const tiles: Tile[] = tilePositions.map((tile) => {
    const corners = getHexPoints(tile.centerX, tile.centerY);

    // Get vertex IDs for this tile
    const surroundingVertices = corners.map((corner) => {
      const key = coordKey(corner.x, corner.y);
      return verticesArray.find(v => v.key === key)!.id;
    });

    // Get edge IDs for this tile
    const surroundingEdges: number[] = [];
    for (let i = 0; i < 6; i++) {
      const v1Key = coordKey(corners[i].x, corners[i].y);
      const v2Key = coordKey(corners[(i + 1) % 6].x, corners[(i + 1) % 6].y);
      const edgeKey = [v1Key, v2Key].sort().join('|');
      const edge = edgesArray.find(e =>
        [e.v1Key, e.v2Key].sort().join('|') === edgeKey
      );
      if (edge) surroundingEdges.push(edge.id);
    }

    return {
      id: tile.id,
      resourceType: tile.resourceType,
      diceNumber: tile.diceNumber,
      isBlighted: false,
      surroundingVertices,
      surroundingEdges
    };
  });

  // Find desert tile for initial robber placement
  const desertTile = tiles.find(t => t.resourceType === 'DESERT');
  const robberTileId = desertTile ? desertTile.id : null;

  return {
    tiles,
    vertices,
    edges,
    robberTileId
  };
}
