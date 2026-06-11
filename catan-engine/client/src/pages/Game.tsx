import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import Board from '../components/board/Board';
import type { GameState } from '../types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
const socket = io(SERVER_URL);

const initialState: GameState = {
  gameId: 'example-game',
  gameMode: 'ALLIANCE_2V2',
  phase: 'SETUP',
  activeTeamId: 'team-a',
  activePlayerId: null,
  turnNumber: 1,
  dice: { values: null, total: null, rolled: false },
  setupState: null,
  developmentDeck: [],
  longestRoadOwner: null,
  largestArmyOwner: null,
  threatTracker: { currentLevel: 0, maxLevel: 10, threatDeck: [], activeThreats: [] },
  teams: {
    'team-a': {
      id: 'team-a',
      playerIds: ['player-1', 'player-2'],
      victoryPoints: 0,
      guildChest: { WOOD: 0, BRICK: 0, ORE: 0, GRAIN: 0, WOOL: 0 },
      synchronization: { 'player-1': { isTurnEnded: false }, 'player-2': { isTurnEnded: false } },
    },
    'team-b': {
      id: 'team-b',
      playerIds: ['player-3', 'player-4'],
      victoryPoints: 0,
      guildChest: { WOOD: 0, BRICK: 0, ORE: 0, GRAIN: 0, WOOL: 0 },
      synchronization: { 'player-3': { isTurnEnded: false }, 'player-4': { isTurnEnded: false } },
    },
  },
  players: {
    'player-1': {
      id: 'player-1',
      teamId: 'team-a',
      active: true,
      resources: { WOOD: 0, BRICK: 0, ORE: 0, GRAIN: 0, WOOL: 0, DESERT: 0 },
      developmentCards: [],
      playedDevCards: [],
      infrastructureLeft: { ROADS: 15, SETTLEMENTS: 5, CITIES: 4 },
      metrics: { victoryPoints: 0, longestRoadSegment: 0, knightsPlayed: 0 },
      ports: [],
    },
    'player-2': {
      id: 'player-2',
      teamId: 'team-a',
      active: true,
      resources: { WOOD: 0, BRICK: 0, ORE: 0, GRAIN: 0, WOOL: 0, DESERT: 0 },
      developmentCards: [],
      playedDevCards: [],
      infrastructureLeft: { ROADS: 15, SETTLEMENTS: 5, CITIES: 4 },
      metrics: { victoryPoints: 0, longestRoadSegment: 0, knightsPlayed: 0 },
      ports: [],
    },
  },
  board: { tiles: [], vertices: [], edges: [], robberTileId: null }, // Will be populated from server
};

export default function Game() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [roomCode, setRoomCode] = useState('ROOM01');
  const [connected, setConnected] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<'ALLIANCE_2V2' | 'COOP_HORDE'>('ALLIANCE_2V2');

  useEffect(() => {
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('game-started', (state: GameState) => {
      setGameState(state);
      setLog((prev) => [...prev, `Game started! Board generated with ${state.board.tiles.length} tiles`]);
    });
    socket.on('state-updated', (state: GameState) => setGameState(state));
    socket.on('validation-error', ({ message }: { message: string }) => setLog((prev) => [...prev, `❌ ${message}`]));
    socket.on('joined-room', ({ roomCode: code }: { roomCode: string }) => setLog((prev) => [...prev, `Joined room ${code}`]));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game-started');
      socket.off('state-updated');
      socket.off('validation-error');
      socket.off('joined-room');
    };
  }, []);

  const status = useMemo(() => {
    if (!connected) return 'Disconnected';
    return 'Connected';
  }, [connected]);

  const dispatch = (action: unknown) => {
    socket.emit('dispatch-action', { roomCode, action });
  };

  const handleStartGame = () => {
    const stateWithMode: GameState = {
      ...initialState,
      gameMode: selectedMode,
      threatTracker: {
        currentLevel: 0,
        maxLevel: 10,
        threatDeck: [],
        activeThreats: [],
        blightedTileCount: 0,
      },
    };
    socket.emit('start-game', { roomCode, gameState: stateWithMode });
  };

  return (
    <div className="card">
      <h1>CoopCatan Client</h1>
      <p>Status: <strong>{status}</strong></p>

      {/* Game Mode Selector */}
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Game Mode</h3>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              value="ALLIANCE_2V2"
              checked={selectedMode === 'ALLIANCE_2V2'}
              onChange={(e) => setSelectedMode(e.target.value as 'ALLIANCE_2V2')}
            />
            <span style={{ color: '#1e293b' }}>2v2 Alliance Mode</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="radio"
              value="COOP_HORDE"
              checked={selectedMode === 'COOP_HORDE'}
              onChange={(e) => setSelectedMode(e.target.value as 'COOP_HORDE')}
            />
            <span style={{ color: '#1e293b' }}>Co-op Horde Mode</span>
          </label>
        </div>
      </div>

      {/* Connection Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button type="button" onClick={() => socket.emit('join-room', { roomCode })}>Join Room</button>
        <button type="button" onClick={handleStartGame}>Start Game ({selectedMode === 'COOP_HORDE' ? 'Horde' : '2v2'})</button>
      </div>

      {/* Horde Mode Threat Tracker */}
      {gameState.gameMode === 'COOP_HORDE' && (
        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#fee', borderRadius: '8px', border: '2px solid #c33' }}>
          <h3 style={{ marginTop: 0, color: '#c33' }}>Threat Tracker</h3>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Threat Level: {gameState.threatTracker.currentLevel} / {gameState.threatTracker.maxLevel}</span>
              <span>Blighted Tiles: {gameState.threatTracker.blightedTileCount} / 5</span>
            </div>
            <div style={{ width: '100%', height: '24px', backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #c33' }}>
              <div
                style={{
                  width: `${(gameState.threatTracker.currentLevel / gameState.threatTracker.maxLevel) * 100}%`,
                  height: '100%',
                  backgroundColor: gameState.threatTracker.currentLevel >= 7 ? '#c33' : '#f93',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => dispatch({ type: 'EXECUTE_HORDE_PHASE' })}
              style={{ padding: '8px 16px', backgroundColor: '#c33', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Execute Horde Phase
            </button>
            <span style={{ fontSize: '12px', color: '#666' }}>Cards left: {gameState.threatTracker.threatDeck.length}</span>
          </div>

          {/* Active Threats */}
          {gameState.threatTracker.activeThreats.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <h4 style={{ marginBottom: '8px' }}>Active Threats:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {gameState.threatTracker.activeThreats.slice(-3).map((threat, idx) => (
                  <div key={idx} style={{ padding: '6px 12px', backgroundColor: '#fcc', borderRadius: '4px', fontSize: '13px' }}>
                    {threat.type === 'BLIGHT_TILE' && `Tile ${threat.targetTileId} Blighted`}
                    {threat.type === 'BARBARIAN_RAID' && 'Barbarian Raid!'}
                    {threat.type === 'RESOURCE_DROUGHT' && 'Resource Drought'}
                    {threat.type === 'ADVANCE_THREAT' && 'Threat Advanced'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <section>
        <Board gameState={gameState} dispatch={dispatch} />
      </section>
      <section style={{ marginTop: '24px' }}>
        <h2>Event log</h2>
        <div>{log.map((entry, index) => <div key={index}>{entry}</div>)}</div>
      </section>
    </div>
  );
}
