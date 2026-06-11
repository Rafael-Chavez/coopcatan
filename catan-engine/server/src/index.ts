import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { applyAction } from './engine';
import { GameState, DevelopmentCardType, ThreatCard } from './types';
import { generateBoard } from './boardGenerator';

// Create development card deck (25 cards total)
function createDevelopmentDeck(): DevelopmentCardType[] {
  const deck: DevelopmentCardType[] = [
    ...Array(14).fill('KNIGHT'),
    ...Array(5).fill('VICTORY_POINT'),
    ...Array(2).fill('ROAD_BUILDING'),
    ...Array(2).fill('YEAR_OF_PLENTY'),
    ...Array(2).fill('MONOPOLY')
  ] as DevelopmentCardType[];

  // Shuffle deck using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Create threat card deck for horde mode
function createThreatDeck(tileIds: number[]): ThreatCard[] {
  const deck: ThreatCard[] = [];

  // Add blight cards for each tile (excluding desert)
  for (const tileId of tileIds) {
    deck.push({ type: 'BLIGHT_TILE', targetTileId: tileId });
  }

  // Add barbarian raid cards (more severe)
  for (let i = 0; i < 6; i++) {
    deck.push({ type: 'BARBARIAN_RAID', severity: 1 });
  }

  // Add resource drought cards
  for (let i = 0; i < 4; i++) {
    deck.push({ type: 'RESOURCE_DROUGHT', severity: 1 });
  }

  // Add threat advancement cards
  for (let i = 0; i < 5; i++) {
    deck.push({ type: 'ADVANCE_THREAT' });
  }

  // Shuffle deck using Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: '*' },
});

const port = process.env.PORT ? Number(process.env.PORT) : 3001;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const games: Record<string, GameState> = {};

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomCode }: { roomCode: string }) => {
    socket.join(roomCode);
    socket.emit('joined-room', { roomCode });
  });

  socket.on('start-game', ({ roomCode, gameState }: { roomCode: string; gameState: GameState }) => {
    // Generate the board and merge it with the provided game state
    const board = generateBoard();

    // Initialize turn order (all player IDs)
    const turnOrder = Object.keys(gameState.players);

    // Initialize setup state
    const setupState = {
      round: 1, // Round 1 = forward order, Round 2 = reverse order
      turnOrder,
      currentPlayerIndex: 0,
      placementsThisRound: turnOrder.reduce((acc, playerId) => {
        acc[playerId] = { settlement: false, road: false };
        return acc;
      }, {} as Record<string, { settlement: boolean; road: boolean }>)
    };

    const developmentDeck = createDevelopmentDeck();

    // Create threat deck for horde mode (use non-desert tile IDs)
    const nonDesertTileIds = board.tiles
      .filter(t => t.resourceType !== 'DESERT')
      .map(t => t.id);
    const threatDeck = gameState.gameMode === 'COOP_HORDE'
      ? createThreatDeck(nonDesertTileIds)
      : [];

    const completeGameState: GameState = {
      ...gameState,
      board,
      phase: 'SETUP',
      activePlayerId: turnOrder[0], // First player goes first
      setupState,
      developmentDeck,
      longestRoadOwner: null,
      largestArmyOwner: null,
      threatTracker: {
        ...gameState.threatTracker,
        threatDeck,
        blightedTileCount: 0
      }
    };

    games[roomCode] = completeGameState;
    io.in(roomCode).emit('game-started', completeGameState);
  });

  socket.on('dispatch-action', ({ roomCode, action }: { roomCode: string; action: unknown }) => {
    const game = games[roomCode];
    if (!game) {
      socket.emit('error', { message: 'Game not found.' });
      return;
    }
    try {
      const nextGame = applyAction(game, action as any);
      games[roomCode] = nextGame;
      io.in(roomCode).emit('state-updated', nextGame);
    } catch (error) {
      socket.emit('validation-error', { message: (error as Error).message });
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
