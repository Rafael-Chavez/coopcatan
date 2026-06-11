import React, { useState, useEffect } from 'react';
import type { GameState } from '../types';

// --- GEOMETRY CONFIGURATION ---
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

const RESOURCE_COLORS: Record<string, { fill: string; hover: string }> = {
  WOOD: { fill: '#065f46', hover: '#047857' },
  BRICK: { fill: '#c2410c', hover: '#ea580c' },
  ORE: { fill: '#64748b', hover: '#94a3b8' },
  GRAIN: { fill: '#f59e0b', hover: '#fbbf24' },
  WOOL: { fill: '#84cc16', hover: '#a3e635' },
  DESERT: { fill: '#a8a29e', hover: '#d6d3d1' }
};

interface BoardProps {
  gameState: GameState;
  dispatch: (action: any) => void;
}

// Helper: Calculate hex corner positions
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

export default function Board({ gameState, dispatch }: BoardProps) {
  const [selectedElement, setSelectedElement] = useState<string>("Click vertices/edges to build");
  const [viewingPlayerId, setViewingPlayerId] = useState<string>('player-1');
  const [showTradeModal, setShowTradeModal] = useState<boolean>(false);
  const [tradeGive, setTradeGive] = useState<'WOOD' | 'BRICK' | 'ORE' | 'GRAIN' | 'WOOL'>('WOOD');
  const [tradeReceive, setTradeReceive] = useState<'WOOD' | 'BRICK' | 'ORE' | 'GRAIN' | 'WOOL'>('BRICK');
  const [producingTiles, setProducingTiles] = useState<Set<number>>(new Set());

  // Highlight producing tiles after dice roll
  useEffect(() => {
    if (gameState.dice.rolled && gameState.dice.total) {
      const producing = new Set<number>();
      gameState.board.tiles.forEach((tile: any) => {
        if (tile.diceNumber === gameState.dice.total && !tile.isBlighted) {
          producing.add(tile.id);
        }
      });
      setProducingTiles(producing);

      // Clear highlights after 3 seconds
      const timer = setTimeout(() => {
        setProducingTiles(new Set());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [gameState.dice.rolled, gameState.dice.total, gameState.board.tiles]);

  // Get tile positions for rendering (matches server geometry)
  const tilePositions = React.useMemo(() => {
    const positions: Array<{ id: number; centerX: number; centerY: number }> = [];
    let tileId = 0;
    ROW_CONFIG.forEach((row) => {
      const centerY = row.rowY * V_SPACING;
      row.xOffsets.forEach((xOffset) => {
        positions.push({
          id: tileId++,
          centerX: xOffset * H_SPACING,
          centerY
        });
      });
    });
    return positions;
  }, []);

  // Get vertex positions from board data
  const vertexPositions = React.useMemo(() => {
    if (gameState.board.tiles.length === 0) return new Map();

    const positions = new Map<number, { x: number; y: number }>();

    gameState.board.tiles.forEach((tile) => {
      const tilePos = tilePositions.find(p => p.id === tile.id);
      if (!tilePos) return;

      const corners = getHexPoints(tilePos.centerX, tilePos.centerY);
      tile.surroundingVertices.forEach((vertexId: number, idx: number) => {
        if (!positions.has(vertexId)) {
          positions.set(vertexId, corners[idx]);
        }
      });
    });

    return positions;
  }, [gameState.board.tiles, tilePositions]);

  // Calculate valid build locations for current player
  const validLocations = React.useMemo(() => {
    const playerId = viewingPlayerId;
    const player = gameState.players[playerId];
    if (!player) return { vertices: new Set<number>(), edges: new Set<number>() };

    const validVertices = new Set<number>();
    const validEdges = new Set<number>();

    // During SETUP phase
    if (gameState.phase === 'SETUP' && gameState.setupState && gameState.activePlayerId === playerId) {
      const placement = gameState.setupState.placementsThisRound[playerId];

      if (!placement.settlement) {
        // Can place settlement anywhere that follows distance rule
        gameState.board.vertices.forEach(vertex => {
          if (vertex.building) return; // Already occupied

          // Check distance rule (no adjacent settlements)
          const hasAdjacentBuilding = vertex.adjacentVertices.some(adjId => {
            const adjVertex = gameState.board.vertices.find(v => v.id === adjId);
            return adjVertex && adjVertex.building;
          });

          if (!hasAdjacentBuilding) {
            validVertices.add(vertex.id);
          }
        });
      } else if (!placement.road) {
        // Must place road adjacent to most recent settlement
        const recentSettlement = gameState.board.vertices.find(v =>
          v.ownerId === playerId && v.building === 'SETTLEMENT'
        );
        if (recentSettlement) {
          recentSettlement.adjacentEdges.forEach(edgeId => {
            const edge = gameState.board.edges.find(e => e.id === edgeId);
            if (edge && !edge.roadOwnerId) {
              validEdges.add(edgeId);
            }
          });
        }
      }
    }

    // During ACTION phase (simplified - could add resource checking)
    if (gameState.phase === 'ACTION' && gameState.activePlayerId === playerId) {
      // Valid vertices: connect to owned road + distance rule
      gameState.board.vertices.forEach(vertex => {
        if (vertex.building) return;

        // Distance rule
        const hasAdjacentBuilding = vertex.adjacentVertices.some(adjId => {
          const adjVertex = gameState.board.vertices.find(v => v.id === adjId);
          return adjVertex && adjVertex.building;
        });
        if (hasAdjacentBuilding) return;

        // Must connect to owned road
        const hasConnectingRoad = vertex.adjacentEdges.some(edgeId => {
          const edge = gameState.board.edges.find(e => e.id === edgeId);
          return edge && edge.roadOwnerId === playerId;
        });

        if (hasConnectingRoad) {
          validVertices.add(vertex.id);
        }
      });

      // Valid edges: connect to owned infrastructure
      gameState.board.edges.forEach(edge => {
        if (edge.roadOwnerId) return; // Already has road

        // Check if either vertex connects to player's infrastructure
        const connects = edge.adjacentVertices.some(vertexId => {
          const vertex = gameState.board.vertices.find(v => v.id === vertexId);
          if (!vertex) return false;

          // Owned building
          if (vertex.ownerId === playerId) return true;

          // Adjacent owned road
          return vertex.adjacentEdges.some(adjEdgeId => {
            const adjEdge = gameState.board.edges.find(e => e.id === adjEdgeId);
            return adjEdge && adjEdge.roadOwnerId === playerId;
          });
        });

        if (connects) {
          validEdges.add(edge.id);
        }
      });
    }

    return { vertices: validVertices, edges: validEdges };
  }, [gameState, viewingPlayerId]);

  // --- INTERACTION LOGIC handlers ---
  const handleEdgeClick = (edgeId: number) => {
    setSelectedElement(`Building road on edge ${edgeId}...`);
    dispatch({
      type: 'BUILD_ROAD',
      payload: { playerId: viewingPlayerId, edgeId }
    });
  };

  const handleVertexClick = (vertexId: number) => {
    setSelectedElement(`Building settlement on vertex ${vertexId}...`);
    dispatch({
      type: 'CONSTRUCT_SETTLEMENT',
      payload: { playerId: viewingPlayerId, vertexId }
    });
  };

  const handleRollDice = () => {
    setSelectedElement('Rolling dice...');
    dispatch({ type: 'ROLL_DICE' });
  };

  const handleEndTurn = () => {
    setSelectedElement('Ending turn...');
    dispatch({
      type: 'END_TURN',
      payload: { playerId: viewingPlayerId }
    });
  };

  const handleBankTrade = () => {
    const viewingPlayer = gameState.players[viewingPlayerId];
    if (!viewingPlayer) return;

    // Calculate trade rate
    let rate = 4;
    if (viewingPlayer.ports.includes('3:1')) rate = 3;
    if (viewingPlayer.ports.includes(`${tradeGive}:2`)) rate = 2;

    setSelectedElement(`Trading ${rate} ${tradeGive} for 1 ${tradeReceive}...`);
    dispatch({
      type: 'BANK_TRADE',
      payload: {
        playerId: viewingPlayerId,
        give: tradeGive,
        giveAmount: rate,
        receive: tradeReceive,
        receiveAmount: 1
      }
    });
    setShowTradeModal(false);
  };

  // Show placeholder if board not loaded
  if (gameState.board.tiles.length === 0) {
    return (
      <div style={{ padding: '18px', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '16px' }}>
        <h2>Waiting for board...</h2>
        <p>Click "Start Game" to generate the board</p>
      </div>
    );
  }

  // Get current player data
  const currentPlayer = gameState.activePlayerId ? gameState.players[gameState.activePlayerId] : null;
  const viewingPlayer = gameState.players[viewingPlayerId];

  // Determine setup phase info
  const setupInfo = gameState.setupState
    ? `Round ${gameState.setupState.round} - ${gameState.activePlayerId}'s turn`
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-6 text-white font-sans selection:bg-indigo-500/30">

      {/* Player Perspective Switcher */}
      <div className="mb-4 w-full max-w-4xl">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-bold text-slate-400">Viewing as:</span>
            {Object.keys(gameState.players).map(playerId => (
              <button
                key={playerId}
                onClick={() => setViewingPlayerId(playerId)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  viewingPlayerId === playerId
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {playerId}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Game Status Panel */}
      <div className="mb-6 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Turn & Phase Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-400 mb-2">Game Status</h3>
          <div className="space-y-1">
            <p className="text-lg font-bold text-indigo-400">Phase: {gameState.phase}</p>
            {setupInfo && <p className="text-sm text-amber-400">{setupInfo}</p>}
            {currentPlayer && (
              <p className="text-sm text-slate-300">
                Active: <span className="text-indigo-300 font-semibold">{currentPlayer.id}</span>
              </p>
            )}
          </div>
        </div>

        {/* Player Resources */}
        {viewingPlayer && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 mb-2">Your Resources</h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-emerald-900/30 px-2 py-1 rounded border border-emerald-700/50">
                <span className="text-emerald-300">🌲 {viewingPlayer.resources.WOOD}</span>
              </div>
              <div className="bg-red-900/30 px-2 py-1 rounded border border-red-700/50">
                <span className="text-red-300">🧱 {viewingPlayer.resources.BRICK}</span>
              </div>
              <div className="bg-slate-700/30 px-2 py-1 rounded border border-slate-600/50">
                <span className="text-slate-300">⛏️ {viewingPlayer.resources.ORE}</span>
              </div>
              <div className="bg-yellow-900/30 px-2 py-1 rounded border border-yellow-700/50">
                <span className="text-yellow-300">🌾 {viewingPlayer.resources.GRAIN}</span>
              </div>
              <div className="bg-lime-900/30 px-2 py-1 rounded border border-lime-700/50">
                <span className="text-lime-300">🐑 {viewingPlayer.resources.WOOL}</span>
              </div>
            </div>
          </div>
        )}

        {/* Victory Points & Stats */}
        {viewingPlayer && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 mb-2">Stats</h3>
            <div className="space-y-1 text-sm">
              <p className="text-amber-400">🏆 VP: <span className="font-bold">{viewingPlayer.metrics.victoryPoints}</span></p>
              <p className="text-indigo-300">🛤️ Longest Road: {viewingPlayer.metrics.longestRoadSegment}</p>
              <p className="text-slate-400 text-xs">
                Roads: {15 - viewingPlayer.infrastructureLeft.ROADS}/15 |
                Settlements: {5 - viewingPlayer.infrastructureLeft.SETTLEMENTS}/5
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Feedback */}
      <div className="mb-4 text-center max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl">
        <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-sm font-mono text-indigo-300">
          {selectedElement}
        </div>
      </div>

      {/* Phase-Aware Action Buttons */}
      {gameState.activePlayerId === viewingPlayerId && (
        <div className="mb-4 w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-400 mb-3 text-center">Actions</h3>

            {/* Dice Display */}
            {gameState.dice.rolled && (
              <div className="mb-4 flex justify-center gap-3">
                <div className="bg-white rounded-lg p-3 shadow-lg w-12 h-12 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{gameState.dice.values?.[0]}</span>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-lg w-12 h-12 flex items-center justify-center">
                  <span className="text-2xl font-bold text-slate-900">{gameState.dice.values?.[1]}</span>
                </div>
                <div className="bg-indigo-600 rounded-lg p-3 shadow-lg w-12 h-12 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{gameState.dice.total}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {gameState.phase === 'ROLL' && (
                <button
                  onClick={handleRollDice}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                >
                  🎲 Roll Dice
                </button>
              )}

              {gameState.phase === 'ACTION' && (
                <>
                  <button
                    onClick={() => setShowTradeModal(true)}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                  >
                    💱 Trade with Bank
                  </button>
                  <button
                    onClick={handleEndTurn}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
                  >
                    ✓ End Turn
                  </button>
                </>
              )}

              {gameState.phase === 'SETUP' && (
                <div className="text-center text-sm text-amber-400 py-2">
                  {gameState.setupState?.placementsThisRound['player-1']?.settlement
                    ? '👉 Place road adjacent to settlement'
                    : '👉 Place settlement on vertex'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {showTradeModal && gameState.activePlayerId === viewingPlayerId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowTradeModal(false)}>
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Bank Trade</h2>

            {/* Calculate trade rate */}
            {(() => {
              const player = gameState.players[viewingPlayerId];
              if (!player) return null;

              let rate = 4;
              if (player.ports.includes('3:1')) rate = 3;
              if (player.ports.includes(`${tradeGive}:2`)) rate = 2;

              const hasEnough = player.resources[tradeGive] >= rate;

              return (
                <>
                  <div className="mb-6">
                    <p className="text-center text-slate-300 mb-2">Your trade rate: <span className="text-amber-400 font-bold">{rate}:1</span></p>
                    {player.ports.length > 0 && (
                      <p className="text-center text-xs text-slate-500">Active ports: {player.ports.join(', ')}</p>
                    )}
                  </div>

                  {/* Give Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-slate-400 mb-2">Give ({rate} required)</label>
                    <select
                      value={tradeGive}
                      onChange={(e) => setTradeGive(e.target.value as any)}
                      className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="WOOD">🌲 Wood ({player.resources.WOOD})</option>
                      <option value="BRICK">🧱 Brick ({player.resources.BRICK})</option>
                      <option value="ORE">⛏️ Ore ({player.resources.ORE})</option>
                      <option value="GRAIN">🌾 Grain ({player.resources.GRAIN})</option>
                      <option value="WOOL">🐑 Wool ({player.resources.WOOL})</option>
                    </select>
                  </div>

                  {/* Receive Section */}
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-400 mb-2">Receive (1)</label>
                    <select
                      value={tradeReceive}
                      onChange={(e) => setTradeReceive(e.target.value as any)}
                      className="w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="WOOD">🌲 Wood ({player.resources.WOOD})</option>
                      <option value="BRICK">🧱 Brick ({player.resources.BRICK})</option>
                      <option value="ORE">⛏️ Ore ({player.resources.ORE})</option>
                      <option value="GRAIN">🌾 Grain ({player.resources.GRAIN})</option>
                      <option value="WOOL">🐑 Wool ({player.resources.WOOL})</option>
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowTradeModal(false)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBankTrade}
                      disabled={!hasEnough || tradeGive === tradeReceive}
                      className={`flex-1 font-bold py-3 px-6 rounded-lg transition ${
                        hasEnough && tradeGive !== tradeReceive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      Trade
                    </button>
                  </div>

                  {!hasEnough && (
                    <p className="text-center text-red-400 text-sm mt-3">Not enough {tradeGive}</p>
                  )}
                  {tradeGive === tradeReceive && (
                    <p className="text-center text-amber-400 text-sm mt-3">Select different resources</p>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* RENDER VIEWPORT MAPPER */}
      <div className="w-full max-w-3xl aspect-square bg-slate-900/40 border border-slate-800/80 shadow-2xl rounded-2xl flex items-center justify-center overflow-hidden p-4">
        <svg
          viewBox="-320 -300 640 600"
          className="w-full h-full overflow-visible select-none"
        >
          {/* SVG Pattern Definitions */}
          <defs>
            <pattern id="blight-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <line x1="0" y1="0" x2="20" y2="20" stroke="#dc2626" strokeWidth="2" opacity="0.6" />
              <line x1="20" y1="0" x2="0" y2="20" stroke="#dc2626" strokeWidth="2" opacity="0.6" />
            </pattern>
          </defs>

          {/* ================= LAYER 1: POLYGON TILES ================= */}
          <g id="tiles-layer">
            {gameState.board.tiles.map((tile: any) => {
              const tilePos = tilePositions.find(p => p.id === tile.id);
              if (!tilePos) return null;

              const corners = getHexPoints(tilePos.centerX, tilePos.centerY);
              const pointsString = corners.map(p => `${p.x},${p.y}`).join(' ');
              const colors = RESOURCE_COLORS[tile.resourceType] || RESOURCE_COLORS.DESERT;
              const isProducing = producingTiles.has(tile.id);

              return (
                <g key={`tile-group-${tile.id}`}>
                  <polygon
                    points={pointsString}
                    fill={tile.isBlighted ? '#1a1a1a' : colors.fill}
                    stroke={tile.isBlighted ? '#ef4444' : '#1e293b'}
                    strokeWidth={tile.isBlighted ? "5" : "3"}
                    className="transition-all duration-150"
                    opacity={tile.isBlighted ? 0.5 : 1}
                  />
                  {/* Blight overlay */}
                  {tile.isBlighted && (
                    <>
                      <polygon
                        points={pointsString}
                        fill="url(#blight-pattern)"
                        opacity="0.4"
                        className="pointer-events-none"
                      />
                      <text
                        x={tilePos.centerX}
                        y={tilePos.centerY - 15}
                        fill="#ef4444"
                        className="font-bold text-[24px] pointer-events-none"
                        textAnchor="middle"
                        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.9))' }}
                      >
                        ☠
                      </text>
                    </>
                  )}
                  {/* Production highlight */}
                  {isProducing && !tile.isBlighted && (
                    <polygon
                      points={pointsString}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="6"
                      opacity="0.8"
                      className="animate-pulse pointer-events-none"
                      style={{ filter: 'drop-shadow(0 0 12px #fbbf24)' }}
                    />
                  )}
                  {/* Dice number */}
                  {tile.diceNumber && (
                    <text
                      x={tilePos.centerX}
                      y={tilePos.centerY + 4}
                      fill="white"
                      className="font-bold font-mono text-[14px] pointer-events-none"
                      textAnchor="middle"
                      style={{
                        filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.9))',
                        textDecoration: tile.isBlighted ? 'line-through' : 'none'
                      }}
                    >
                      {tile.diceNumber}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* ================= LAYER 2: INTERCONNECTED EDGES ================= */}
          <g id="edges-layer">
            {gameState.board.edges.map((edge: any) => {
              const v1Pos = vertexPositions.get(edge.adjacentVertices[0]);
              const v2Pos = vertexPositions.get(edge.adjacentVertices[1]);
              if (!v1Pos || !v2Pos) return null;

              const hasRoad = edge.roadOwnerId !== null;
              const isValid = validLocations.edges.has(edge.id);

              return (
                <g key={`edge-group-${edge.id}`}>
                  {/* Visual road line */}
                  {hasRoad && (
                    <line
                      x1={v1Pos.x} y1={v1Pos.y} x2={v2Pos.x} y2={v2Pos.y}
                      stroke="#6366f1"
                      strokeWidth="5"
                      className="pointer-events-none"
                      style={{ filter: 'drop-shadow(0 0 4px #6366f1)' }}
                    />
                  )}
                  {/* Valid location highlight */}
                  {isValid && !hasRoad && (
                    <line
                      x1={v1Pos.x} y1={v1Pos.y} x2={v2Pos.x} y2={v2Pos.y}
                      stroke="#22c55e"
                      strokeWidth="4"
                      opacity="0.6"
                      className="pointer-events-none animate-pulse"
                      style={{ filter: 'drop-shadow(0 0 6px #22c55e)' }}
                    />
                  )}
                  {/* Clickable target */}
                  <line
                    x1={v1Pos.x} y1={v1Pos.y} x2={v2Pos.x} y2={v2Pos.y}
                    stroke="transparent"
                    strokeWidth="14"
                    className={`cursor-pointer transition-colors ${isValid ? 'hover:stroke-green-400/30' : 'hover:stroke-white/15'}`}
                    onClick={() => handleEdgeClick(edge.id)}
                  />
                </g>
              );
            })}
          </g>

          {/* ================= LAYER 3: INTERSECTION VERTICES ================= */}
          <g id="vertices-layer">
            {gameState.board.vertices.map((vertex: any) => {
              const pos = vertexPositions.get(vertex.id);
              if (!pos) return null;

              const isValid = validLocations.vertices.has(vertex.id);

              return (
                <g key={`vertex-group-${vertex.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Valid location highlight (pulsing ring) */}
                  {isValid && !vertex.building && (
                    <circle
                      r={10}
                      fill="#22c55e"
                      opacity="0.3"
                      className="animate-pulse"
                      style={{ filter: 'drop-shadow(0 0 8px #22c55e)' }}
                    />
                  )}
                  {/* Clickable target */}
                  <circle
                    r={9}
                    fill="transparent"
                    stroke="transparent"
                    className={`cursor-pointer transition-all ${isValid ? 'hover:fill-green-400/50 hover:stroke-green-300' : 'hover:fill-indigo-400/40 hover:stroke-indigo-300'}`}
                    onClick={() => handleVertexClick(vertex.id)}
                  />
                  {/* Settlement */}
                  {vertex.building === 'SETTLEMENT' && (
                    <rect
                      x={-6} y={-6}
                      width={12} height={12}
                      rx={1.5}
                      fill="#818cf8"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}
                  {/* City */}
                  {vertex.building === 'CITY' && (
                    <circle
                      r={8}
                      fill="#f59e0b"
                      stroke="white"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <p className="mt-4 text-xs text-slate-500 tracking-wide">
        Click edges to build roads | Click vertices to build settlements
      </p>
    </div>
  );
}
