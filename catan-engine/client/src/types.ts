export type ResourceType = 'WOOD' | 'BRICK' | 'ORE' | 'GRAIN' | 'WOOL' | 'DESERT';

export type DevelopmentCardType =
  | 'KNIGHT'
  | 'VICTORY_POINT'
  | 'ROAD_BUILDING'
  | 'YEAR_OF_PLENTY'
  | 'MONOPOLY';

export type ThreatCardType =
  | 'BLIGHT_TILE'
  | 'BARBARIAN_RAID'
  | 'RESOURCE_DROUGHT'
  | 'ADVANCE_THREAT';

export interface ThreatCard {
  type: ThreatCardType;
  targetTileId?: number;
  targetDiceNumber?: number;
  severity?: number;
}

export type EngineAction =
  | { type: 'ROLL_DICE' }
  | { type: 'BUILD_ROAD'; payload: { playerId: string; edgeId: number } }
  | { type: 'CONSTRUCT_SETTLEMENT'; payload: { playerId: string; vertexId: number } }
  | { type: 'UPGRADE_CITY'; payload: { playerId: string; vertexId: number } }
  | { type: 'BUY_DEVELOPMENT_CARD'; payload: { playerId: string } }
  | { type: 'PLAY_KNIGHT'; payload: { playerId: string; targetTileId: number; victimId?: string } }
  | { type: 'PLAY_ROAD_BUILDING'; payload: { playerId: string; edgeIds: [number, number] } }
  | { type: 'PLAY_YEAR_OF_PLENTY'; payload: { playerId: string; resources: [ResourceType, ResourceType] } }
  | { type: 'PLAY_MONOPOLY'; payload: { playerId: string; resource: ResourceType } }
  | { type: 'PLACE_ROBBER'; payload: { playerId: string; tileId: number; victimId?: string } }
  | { type: 'DISCARD_RESOURCES'; payload: { playerId: string; resources: Partial<Record<ResourceType, number>> } }
  | { type: 'BANK_TRADE'; payload: { playerId: string; give: ResourceType; giveAmount: number; receive: ResourceType; receiveAmount: number } }
  | { type: 'ALLIANCE_TRADE_TEAMMATE'; payload: { fromId: string; toId: string; resource: ResourceType; amount: number } }
  | { type: 'GUILD_DEPOSIT'; payload: { playerId: string; resource: ResourceType; amount: number } }
  | { type: 'GUILD_WITHDRAW'; payload: { playerId: string; resource: ResourceType; amount: number } }
  | { type: 'EXECUTE_HORDE_PHASE' }
  | { type: 'END_TURN'; payload: { playerId: string } };

export interface Tile {
  id: number;
  resourceType: ResourceType;
  diceNumber: number | null;
  isBlighted: boolean;
  surroundingVertices: number[];
  surroundingEdges: number[];
}

export interface Vertex {
  id: number;
  building: 'SETTLEMENT' | 'CITY' | null;
  ownerId: string | null;
  port: string | null;
  adjacentVertices: number[];
  adjacentEdges: number[];
  adjacentTiles: number[];
}

export interface Edge {
  id: number;
  roadOwnerId: string | null;
  adjacentVertices: [number, number];
  adjacentTiles: number[];
}

export interface DiceState {
  values: [number, number] | null;
  total: number | null;
  rolled: boolean;
}

export interface PlayerState {
  id: string;
  teamId: string;
  active: boolean;
  resources: Record<ResourceType, number>;
  developmentCards: DevelopmentCardType[];
  playedDevCards: DevelopmentCardType[];
  infrastructureLeft: {
    ROADS: number;
    SETTLEMENTS: number;
    CITIES: number;
  };
  metrics: {
    victoryPoints: number;
    longestRoadSegment: number;
    knightsPlayed: number;
  };
  ports: string[];
}

export interface TeamState {
  id: string;
  playerIds: string[];
  victoryPoints: number;
  guildChest: Record<Exclude<ResourceType, 'DESERT'>, number>;
  synchronization: Record<string, { isTurnEnded: boolean }>;
}

export interface BoardState {
  tiles: Tile[];
  vertices: Vertex[];
  edges: Edge[];
  robberTileId: number | null;
}

export interface SetupState {
  round: number; // 1 = forward placement, 2 = reverse placement
  turnOrder: string[]; // Player IDs in turn order
  currentPlayerIndex: number;
  placementsThisRound: Record<string, { settlement: boolean; road: boolean }>;
}

export interface GameState {
  gameId: string;
  gameMode: 'COOP_HORDE' | 'ALLIANCE_2V2';
  phase: 'SETUP' | 'ROLL' | 'ACTION' | 'ROBBER_PLACEMENT' | 'HORDE_PHASE' | 'ENDED';
  activeTeamId: string;
  activePlayerId: string | null; // Current player taking their turn
  turnNumber: number;
  dice: DiceState;
  setupState: SetupState | null; // Only exists during SETUP phase
  developmentDeck: DevelopmentCardType[];
  longestRoadOwner: string | null;
  largestArmyOwner: string | null;
  threatTracker: {
    currentLevel: number;
    maxLevel: number;
    threatDeck: ThreatCard[];
    activeThreats: ThreatCard[];
    blightedTileCount: number;
  };
  teams: Record<string, TeamState>;
  players: Record<string, PlayerState>;
  board: BoardState;
}
