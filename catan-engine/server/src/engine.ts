import { EngineAction, GameState, TeamState, ResourceType } from './types';

export function applyAction(state: GameState, action: EngineAction): GameState {
  switch (action.type) {
    case 'ROLL_DICE':
      return rollDice(state);

    case 'BUILD_ROAD':
      return buildRoad(state, action.payload.playerId, action.payload.edgeId);

    case 'CONSTRUCT_SETTLEMENT':
      return constructSettlement(state, action.payload.playerId, action.payload.vertexId);

    case 'UPGRADE_CITY':
      return upgradeCity(state, action.payload.playerId, action.payload.vertexId);

    case 'BANK_TRADE':
      return bankTrade(state, action.payload);

    case 'ALLIANCE_TRADE_TEAMMATE':
      return tradeTeammate(state, action.payload);

    case 'GUILD_DEPOSIT':
      return guildDeposit(state, action.payload);

    case 'GUILD_WITHDRAW':
      return guildWithdraw(state, action.payload);

    case 'BUY_DEVELOPMENT_CARD':
      return buyDevelopmentCard(state, action.payload.playerId);

    case 'PLAY_KNIGHT':
      return playKnight(state, action.payload.playerId, action.payload.targetTileId, action.payload.victimId);

    case 'PLAY_ROAD_BUILDING':
      return playRoadBuilding(state, action.payload.playerId, action.payload.edgeIds);

    case 'PLAY_YEAR_OF_PLENTY':
      return playYearOfPlenty(state, action.payload.playerId, action.payload.resources);

    case 'PLAY_MONOPOLY':
      return playMonopoly(state, action.payload.playerId, action.payload.resource);

    case 'PLACE_ROBBER':
      return placeRobber(state, action.payload.playerId, action.payload.tileId, action.payload.victimId);

    case 'DISCARD_RESOURCES':
      return discardResources(state, action.payload.playerId, action.payload.resources);

    case 'EXECUTE_HORDE_PHASE':
      return executeHordePhase(state);

    case 'END_TURN':
      return endTurn(state, action.payload.playerId);

    default:
      return state;
  }
}

function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

// Helper: Advance to next player in setup phase
function advanceSetupTurn(state: GameState, playerId: string): GameState {
  if (!state.setupState) return state;

  const setup = state.setupState;

  // Mark road as placed to complete this player's turn
  const updatedPlacements = {
    ...setup.placementsThisRound,
    [playerId]: {
      settlement: true,
      road: true
    }
  };

  // Check if all players have completed this round
  const allPlayersComplete = setup.turnOrder.every(
    pid => updatedPlacements[pid].settlement && updatedPlacements[pid].road
  );

  if (allPlayersComplete) {
    // Move to next round or end setup
    if (setup.round === 1) {
      // Start round 2 in reverse order
      const reverseTurnOrder = [...setup.turnOrder].reverse();
      return {
        ...state,
        setupState: {
          round: 2,
          turnOrder: reverseTurnOrder,
          currentPlayerIndex: 0,
          placementsThisRound: reverseTurnOrder.reduce((acc, pid) => {
            acc[pid] = { settlement: false, road: false };
            return acc;
          }, {} as Record<string, { settlement: boolean; road: boolean }>)
        },
        activePlayerId: reverseTurnOrder[0]
      };
    } else {
      // Setup complete! Move to ROLL phase
      return {
        ...state,
        phase: 'ROLL',
        setupState: null,
        activePlayerId: setup.turnOrder[0] // First player from original order starts
      };
    }
  }

  // Move to next player in current round
  const nextIndex = setup.currentPlayerIndex + 1;
  const nextPlayerId = setup.turnOrder[nextIndex];

  return {
    ...state,
    setupState: {
      ...setup,
      currentPlayerIndex: nextIndex,
      placementsThisRound: updatedPlacements
    },
    activePlayerId: nextPlayerId
  };
}

function rollDice(state: GameState): GameState {
  // Phase validation
  if (state.phase !== 'ROLL') {
    throw new Error('Dice may only be rolled during the ROLL phase.');
  }

  const values: [number, number] = [rollDie(), rollDie()];
  const total = values[0] + values[1];

  // Handle robber trigger (7)
  if (total === 7) {
    if (state.gameMode === 'COOP_HORDE') {
      // In co-op mode, advance threat tracker
      return {
        ...state,
        dice: { values, total, rolled: true },
        phase: 'HORDE_PHASE',
        threatTracker: {
          ...state.threatTracker,
          currentLevel: Math.min(state.threatTracker.currentLevel + 1, state.threatTracker.maxLevel),
        },
      };
    } else {
      // In 2v2 mode, move to robber placement
      return {
        ...state,
        dice: { values, total, rolled: true },
        phase: 'ROBBER_PLACEMENT',
      };
    }
  }

  // Distribute resources based on dice roll
  const updatedPlayers = { ...state.players };

  // Find all tiles matching the dice number
  for (const tile of state.board.tiles) {
    if (tile.diceNumber === total && !tile.isBlighted) {
      // Iterate through vertices surrounding this tile
      for (const vertexId of tile.surroundingVertices) {
        const vertex = state.board.vertices.find((v) => v.id === vertexId);
        if (!vertex || !vertex.building || !vertex.ownerId) continue;

        const owner = updatedPlayers[vertex.ownerId];
        if (!owner) continue;

        // Calculate resource yield
        const resourceType = tile.resourceType;
        if (resourceType === 'DESERT') continue;

        const amount = vertex.building === 'CITY' ? 2 : 1;

        updatedPlayers[vertex.ownerId] = {
          ...owner,
          resources: {
            ...owner.resources,
            [resourceType]: owner.resources[resourceType] + amount,
          },
        };
      }
    }
  }

  return {
    ...state,
    dice: { values, total, rolled: true },
    phase: 'ACTION',
    players: updatedPlayers,
  };
}

function buildRoad(state: GameState, playerId: string, edgeId: number): GameState {
  // Phase validation
  if (state.phase !== 'ACTION' && state.phase !== 'SETUP') {
    throw new Error('Roads can only be built during ACTION or SETUP phase.');
  }

  const edge = state.board.edges.find((item) => item.id === edgeId);
  if (!edge) {
    throw new Error('Edge not found.');
  }
  if (edge.roadOwnerId) {
    throw new Error('Road already exists on that edge.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Resource validation (skip during SETUP)
  if (state.phase !== 'SETUP') {
    if (player.resources.WOOD < 1 || player.resources.BRICK < 1) {
      throw new Error('Insufficient resources. Need 1 Wood and 1 Brick.');
    }
  }

  if (player.infrastructureLeft.ROADS <= 0) {
    throw new Error('No roads left to build.');
  }

  // Setup phase validation
  if (state.phase === 'SETUP') {
    if (!state.setupState) {
      throw new Error('Setup state not initialized.');
    }
    if (state.activePlayerId !== playerId) {
      throw new Error('Not your turn.');
    }
    const currentPlacement = state.setupState.placementsThisRound[playerId];
    if (!currentPlacement.settlement) {
      throw new Error('Must place settlement before road.');
    }
    if (currentPlacement.road) {
      throw new Error('Already placed road this round.');
    }
    // Road must connect to the settlement just placed this round
    const recentSettlement = state.board.vertices.find(v =>
      v.ownerId === playerId &&
      v.adjacentEdges.includes(edgeId)
    );
    if (!recentSettlement) {
      throw new Error('Road must connect to your settlement.');
    }
  }

  // Adjacency validation: edge must connect to existing road or building (except SETUP)
  if (state.phase !== 'SETUP') {
    const isConnected = checkRoadConnectivity(state, playerId, edgeId);
    if (!isConnected) {
      throw new Error('Road must connect to an existing road or building you own.');
    }
  }

  // Deduct resources
  const updatedResources =
    state.phase === 'SETUP'
      ? player.resources
      : {
          ...player.resources,
          WOOD: player.resources.WOOD - 1,
          BRICK: player.resources.BRICK - 1,
        };

  // Build new state
  let newState: GameState = {
    ...state,
    board: {
      ...state.board,
      edges: state.board.edges.map((item) =>
        item.id === edgeId ? { ...item, roadOwnerId: playerId } : item,
      ),
    },
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        resources: updatedResources,
        infrastructureLeft: {
          ...player.infrastructureLeft,
          ROADS: player.infrastructureLeft.ROADS - 1,
        },
      },
    },
  };

  // Calculate longest road
  const longestRoad = calculateLongestRoad(newState, playerId);
  newState.players[playerId].metrics.longestRoadSegment = longestRoad;

  // Handle setup phase turn progression
  if (state.phase === 'SETUP' && state.setupState) {
    newState = advanceSetupTurn(newState, playerId);
  }

  return newState;
}

function constructSettlement(state: GameState, playerId: string, vertexId: number): GameState {
  // Phase validation
  if (state.phase !== 'ACTION' && state.phase !== 'SETUP') {
    throw new Error('Settlements can only be built during ACTION or SETUP phase.');
  }

  const vertex = state.board.vertices.find((item) => item.id === vertexId);
  if (!vertex) {
    throw new Error('Vertex not found.');
  }
  if (vertex.building) {
    throw new Error('Vertex is already occupied.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Setup phase validation
  if (state.phase === 'SETUP') {
    if (!state.setupState) {
      throw new Error('Setup state not initialized.');
    }
    if (state.activePlayerId !== playerId) {
      throw new Error('Not your turn.');
    }
    const currentPlacement = state.setupState.placementsThisRound[playerId];
    if (currentPlacement.settlement) {
      throw new Error('Already placed settlement this round.');
    }
  }

  // Resource validation (skip during SETUP)
  if (state.phase !== 'SETUP') {
    if (
      player.resources.WOOD < 1 ||
      player.resources.BRICK < 1 ||
      player.resources.GRAIN < 1 ||
      player.resources.WOOL < 1
    ) {
      throw new Error('Insufficient resources. Need 1 Wood, 1 Brick, 1 Grain, and 1 Wool.');
    }
  }

  if (player.infrastructureLeft.SETTLEMENTS <= 0) {
    throw new Error('No settlements left to construct.');
  }

  // Distance rule: all adjacent vertices must be empty
  for (const adjVertexId of vertex.adjacentVertices) {
    const adjVertex = state.board.vertices.find((v) => v.id === adjVertexId);
    if (adjVertex && adjVertex.building) {
      throw new Error('Distance rule violated: adjacent vertex has a building.');
    }
  }

  // Connectivity check: must connect to owned road (except during SETUP)
  if (state.phase !== 'SETUP') {
    const hasConnectingRoad = vertex.adjacentEdges.some((edgeId) => {
      const edge = state.board.edges.find((e) => e.id === edgeId);
      if (!edge) return false;

      // In 2v2, teammate roads count
      if (state.gameMode === 'ALLIANCE_2V2') {
        return edge.roadOwnerId && state.players[edge.roadOwnerId]?.teamId === player.teamId;
      }
      return edge.roadOwnerId === playerId;
    });

    if (!hasConnectingRoad) {
      throw new Error('Settlement must connect to one of your roads.');
    }
  }

  // Deduct resources
  const updatedResources =
    state.phase === 'SETUP'
      ? player.resources
      : {
          ...player.resources,
          WOOD: player.resources.WOOD - 1,
          BRICK: player.resources.BRICK - 1,
          GRAIN: player.resources.GRAIN - 1,
          WOOL: player.resources.WOOL - 1,
        };

  // Handle setup state progression and resource distribution
  let setupStateUpdate = state.setupState;
  let playerResources = updatedResources;

  if (state.phase === 'SETUP' && state.setupState) {
    // Mark settlement as placed
    setupStateUpdate = {
      ...state.setupState,
      placementsThisRound: {
        ...state.setupState.placementsThisRound,
        [playerId]: {
          ...state.setupState.placementsThisRound[playerId],
          settlement: true
        }
      }
    };

    // In round 2, grant starting resources from adjacent tiles
    if (state.setupState.round === 2) {
      const startingResources = { ...playerResources };
      for (const tileId of vertex.adjacentTiles) {
        const tile = state.board.tiles.find(t => t.id === tileId);
        if (tile && tile.resourceType !== 'DESERT') {
          startingResources[tile.resourceType] += 1;
        }
      }
      playerResources = startingResources;
    }
  }

  // Update victory points
  const updatedPlayer = {
    ...player,
    resources: playerResources,
    infrastructureLeft: {
      ...player.infrastructureLeft,
      SETTLEMENTS: player.infrastructureLeft.SETTLEMENTS - 1,
    },
    metrics: {
      ...player.metrics,
      victoryPoints: player.metrics.victoryPoints + 1,
    },
  };

  const team = state.teams[player.teamId];
  const updatedTeam = {
    ...team,
    victoryPoints: team.victoryPoints + 1,
  };

  return {
    ...state,
    board: {
      ...state.board,
      vertices: state.board.vertices.map((item) =>
        item.id === vertexId ? { ...item, building: 'SETTLEMENT', ownerId: playerId } : item,
      ),
    },
    players: {
      ...state.players,
      [playerId]: updatedPlayer,
    },
    teams: {
      ...state.teams,
      [team.id]: updatedTeam,
    },
    setupState: setupStateUpdate,
  };
}

function upgradeCity(state: GameState, playerId: string, vertexId: number): GameState {
  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Cities can only be upgraded during ACTION phase.');
  }

  const vertex = state.board.vertices.find((item) => item.id === vertexId);
  if (!vertex || vertex.ownerId !== playerId) {
    throw new Error('Invalid city upgrade target.');
  }
  if (vertex.building !== 'SETTLEMENT') {
    throw new Error('Only settlements may be upgraded to cities.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Resource validation: 3 Ore + 2 Grain
  if (player.resources.ORE < 3 || player.resources.GRAIN < 2) {
    throw new Error('Insufficient resources. Need 3 Ore and 2 Grain.');
  }

  if (player.infrastructureLeft.CITIES <= 0) {
    throw new Error('No cities left to build.');
  }

  // Update player with resources deducted and victory points added
  const updatedPlayer = {
    ...player,
    resources: {
      ...player.resources,
      ORE: player.resources.ORE - 3,
      GRAIN: player.resources.GRAIN - 2,
    },
    infrastructureLeft: {
      ...player.infrastructureLeft,
      CITIES: player.infrastructureLeft.CITIES - 1,
      SETTLEMENTS: player.infrastructureLeft.SETTLEMENTS + 1,
    },
    metrics: {
      ...player.metrics,
      victoryPoints: player.metrics.victoryPoints + 1, // Cities worth 2, settlements worth 1, net +1
    },
  };

  const team = state.teams[player.teamId];
  const updatedTeam = {
    ...team,
    victoryPoints: team.victoryPoints + 1,
  };

  return {
    ...state,
    board: {
      ...state.board,
      vertices: state.board.vertices.map((item) =>
        item.id === vertexId ? { ...item, building: 'CITY' } : item,
      ),
    },
    players: {
      ...state.players,
      [playerId]: updatedPlayer,
    },
    teams: {
      ...state.teams,
      [team.id]: updatedTeam,
    },
  };
}

function bankTrade(state: GameState, payload: any): GameState {
  if (!payload || !('playerId' in payload)) {
    return state;
  }

  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Bank trades can only occur during ACTION phase.');
  }

  const { playerId, give, giveAmount, receive, receiveAmount } = payload as {
    playerId: string;
    give: ResourceType;
    giveAmount: number;
    receive: ResourceType;
    receiveAmount: number;
  };

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Validate desert resources cannot be traded
  if (give === 'DESERT' || receive === 'DESERT') {
    throw new Error('Cannot trade DESERT resources.');
  }

  // Validate player has enough resources to give
  if (player.resources[give] < giveAmount) {
    throw new Error(`Insufficient ${give} resources for trade.`);
  }

  // Calculate trade rate based on ports
  let requiredRate = 4; // Default 4:1

  // Check for 3:1 generic port
  if (player.ports.includes('3:1')) {
    requiredRate = 3;
  }

  // Check for 2:1 specific resource port
  const specificPort = `${give}:2`;
  if (player.ports.includes(specificPort)) {
    requiredRate = 2;
  }

  // Validate trade ratio
  if (receiveAmount !== 1 || giveAmount !== requiredRate) {
    throw new Error(`Invalid trade ratio. You must trade ${requiredRate}:1 for ${give}.`);
  }

  // Execute the trade
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        resources: {
          ...player.resources,
          [give]: player.resources[give] - giveAmount,
          [receive]: player.resources[receive] + receiveAmount,
        },
      },
    },
  };
}

function tradeTeammate(state: GameState, payload: any): GameState {
  if (!payload || !('fromId' in payload)) {
    return state;
  }

  // Game mode validation
  if (state.gameMode !== 'ALLIANCE_2V2') {
    throw new Error('Teammate trading is only available in ALLIANCE_2V2 mode.');
  }

  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Trades can only occur during ACTION phase.');
  }

  const { fromId, toId, resource, amount } = payload as { fromId: string; toId: string; resource: ResourceType; amount: number };
  const from = state.players[fromId];
  const to = state.players[toId];

  if (!from || !to) {
    throw new Error('Invalid trade participants.');
  }

  // Team validation: must be on same team
  if (from.teamId !== to.teamId) {
    throw new Error('Can only trade with teammates on the same team.');
  }

  // Active team validation
  if (from.teamId !== state.activeTeamId) {
    throw new Error('Can only trade during your team\'s turn.');
  }

  if (from.resources[resource] < amount) {
    throw new Error('Insufficient resources for teammate trade.');
  }

  return {
    ...state,
    players: {
      ...state.players,
      [fromId]: {
        ...from,
        resources: {
          ...from.resources,
          [resource]: from.resources[resource] - amount,
        },
      },
      [toId]: {
        ...to,
        resources: {
          ...to.resources,
          [resource]: to.resources[resource] + amount,
        },
      },
    },
  };
}

function guildDeposit(state: GameState, payload: any): GameState {
  if (!payload || !('playerId' in payload)) {
    return state;
  }
  const { playerId, resource, amount } = payload as { playerId: string; resource: Exclude<ResourceType, 'DESERT'>; amount: number };
  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }
  if (player.resources[resource] < amount) {
    throw new Error('Insufficient resources to deposit.');
  }
  const team = state.teams[player.teamId];
  if (!team) {
    throw new Error('Team not found.');
  }
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        resources: {
          ...player.resources,
          [resource]: player.resources[resource] - amount,
        },
      },
    },
    teams: {
      ...state.teams,
      [team.id]: {
        ...team,
        guildChest: {
          ...team.guildChest,
          [resource]: team.guildChest[resource] + amount,
        },
      },
    },
  };
}

function guildWithdraw(state: GameState, payload: any): GameState {
  if (!payload || !('playerId' in payload)) {
    return state;
  }

  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Guild withdrawals can only occur during ACTION phase.');
  }

  const { playerId, resource, amount } = payload as { playerId: string; resource: Exclude<ResourceType, 'DESERT'>; amount: number };
  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  const team = state.teams[player.teamId];
  if (!team) {
    throw new Error('Team not found.');
  }

  // Check if player has a Guild Port (bypasses 2:1 tax)
  const hasGuildPort = player.ports.includes('GUILD');

  // Calculate required amount from chest (2:1 tax unless player has Guild Port)
  const requiredAmount = hasGuildPort ? amount : amount * 2;

  if (team.guildChest[resource] < requiredAmount) {
    throw new Error(
      hasGuildPort
        ? 'Guild chest has insufficient resources.'
        : 'Guild chest has insufficient resources (2:1 tax applies without Guild Port).'
    );
  }

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        resources: {
          ...player.resources,
          [resource]: player.resources[resource] + amount,
        },
      },
    },
    teams: {
      ...state.teams,
      [team.id]: {
        ...team,
        guildChest: {
          ...team.guildChest,
          [resource]: team.guildChest[resource] - requiredAmount,
        },
      },
    },
  };
}

function buyDevelopmentCard(state: GameState, playerId: string): GameState {
  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Development cards can only be bought during ACTION phase.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Resource validation: 1 Ore + 1 Grain + 1 Wool
  if (player.resources.ORE < 1 || player.resources.GRAIN < 1 || player.resources.WOOL < 1) {
    throw new Error('Insufficient resources. Need 1 Ore, 1 Grain, and 1 Wool.');
  }

  // Check if development deck has cards remaining
  if (state.developmentDeck.length === 0) {
    throw new Error('No development cards remaining in deck.');
  }

  // Draw top card from deck
  const drawnCard = state.developmentDeck[0];
  const remainingDeck = state.developmentDeck.slice(1);

  return {
    ...state,
    developmentDeck: remainingDeck,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        resources: {
          ...player.resources,
          ORE: player.resources.ORE - 1,
          GRAIN: player.resources.GRAIN - 1,
          WOOL: player.resources.WOOL - 1,
        },
        developmentCards: [...player.developmentCards, drawnCard],
      },
    },
  };
}

function playKnight(state: GameState, playerId: string, targetTileId: number, victimId?: string): GameState {
  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Knights can only be played during ACTION phase.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Check player has a Knight card
  const knightIndex = player.developmentCards.indexOf('KNIGHT');
  if (knightIndex === -1) {
    throw new Error('No Knight card available to play.');
  }

  // Remove Knight from hand and add to played cards
  const updatedDevCards = [...player.developmentCards];
  updatedDevCards.splice(knightIndex, 1);
  const updatedPlayedCards: typeof player.playedDevCards = [...player.playedDevCards, 'KNIGHT' as const];

  // Update knights played count
  const knightsPlayed = player.metrics.knightsPlayed + 1;

  // Place robber and steal (using placeRobber logic)
  let newState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        developmentCards: updatedDevCards,
        playedDevCards: updatedPlayedCards,
        metrics: {
          ...player.metrics,
          knightsPlayed,
        },
      },
    },
  };

  // Update Largest Army
  newState = updateLargestArmy(newState);

  // Move robber and steal
  newState = placeRobber(newState, playerId, targetTileId, victimId);

  return newState;
}

function playRoadBuilding(state: GameState, playerId: string, edgeIds: [number, number]): GameState {
  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Road Building can only be played during ACTION phase.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Check player has Road Building card
  const cardIndex = player.developmentCards.indexOf('ROAD_BUILDING');
  if (cardIndex === -1) {
    throw new Error('No Road Building card available to play.');
  }

  // Check player has enough roads
  if (player.infrastructureLeft.ROADS < 2) {
    throw new Error('Insufficient roads available to build.');
  }

  // Remove card from hand
  const updatedDevCards = [...player.developmentCards];
  updatedDevCards.splice(cardIndex, 1);
  const updatedPlayedCards: typeof player.playedDevCards = [...player.playedDevCards, 'ROAD_BUILDING' as const];

  let newState: GameState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        developmentCards: updatedDevCards,
        playedDevCards: updatedPlayedCards,
      },
    },
  };

  // Build first road (free, so temporarily set phase to SETUP to bypass resource check)
  const originalPhase = newState.phase;
  newState.phase = 'SETUP';
  newState = buildRoad(newState, playerId, edgeIds[0]);
  newState.phase = originalPhase;

  // Build second road (free)
  newState.phase = 'SETUP';
  newState = buildRoad(newState, playerId, edgeIds[1]);
  newState.phase = originalPhase;

  return newState;
}

function playYearOfPlenty(state: GameState, playerId: string, resources: [ResourceType, ResourceType]): GameState {
  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Year of Plenty can only be played during ACTION phase.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Check player has Year of Plenty card
  const cardIndex = player.developmentCards.indexOf('YEAR_OF_PLENTY');
  if (cardIndex === -1) {
    throw new Error('No Year of Plenty card available to play.');
  }

  // Validate resources are not DESERT
  if (resources[0] === 'DESERT' || resources[1] === 'DESERT') {
    throw new Error('Cannot receive DESERT resources.');
  }

  // Remove card from hand
  const updatedDevCards = [...player.developmentCards];
  updatedDevCards.splice(cardIndex, 1);
  const updatedPlayedCards: typeof player.playedDevCards = [...player.playedDevCards, 'YEAR_OF_PLENTY' as const];

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        developmentCards: updatedDevCards,
        playedDevCards: updatedPlayedCards,
        resources: {
          ...player.resources,
          [resources[0]]: player.resources[resources[0]] + 1,
          [resources[1]]: player.resources[resources[1]] + 1,
        },
      },
    },
  };
}

function playMonopoly(state: GameState, playerId: string, resource: ResourceType): GameState {
  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Monopoly can only be played during ACTION phase.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Check player has Monopoly card
  const cardIndex = player.developmentCards.indexOf('MONOPOLY');
  if (cardIndex === -1) {
    throw new Error('No Monopoly card available to play.');
  }

  // Validate resource is not DESERT
  if (resource === 'DESERT') {
    throw new Error('Cannot monopolize DESERT resources.');
  }

  // Remove card from hand
  const updatedDevCards = [...player.developmentCards];
  updatedDevCards.splice(cardIndex, 1);
  const updatedPlayedCards: typeof player.playedDevCards = [...player.playedDevCards, 'MONOPOLY' as const];

  // Collect all of that resource from other players
  let totalCollected = 0;
  const updatedPlayers = { ...state.players };

  for (const otherPlayerId in updatedPlayers) {
    if (otherPlayerId !== playerId) {
      const otherPlayer = updatedPlayers[otherPlayerId];
      const amount = otherPlayer.resources[resource];
      totalCollected += amount;

      updatedPlayers[otherPlayerId] = {
        ...otherPlayer,
        resources: {
          ...otherPlayer.resources,
          [resource]: 0,
        },
      };
    }
  }

  // Give all collected resources to the player who played Monopoly
  updatedPlayers[playerId] = {
    ...player,
    developmentCards: updatedDevCards,
    playedDevCards: updatedPlayedCards,
    resources: {
      ...player.resources,
      [resource]: player.resources[resource] + totalCollected,
    },
  };

  return {
    ...state,
    players: updatedPlayers,
  };
}

function placeRobber(state: GameState, playerId: string, tileId: number, victimId?: string): GameState {
  const tile = state.board.tiles.find((t) => t.id === tileId);
  if (!tile) {
    throw new Error('Invalid tile.');
  }

  // Cannot place robber on same tile
  if (state.board.robberTileId === tileId) {
    throw new Error('Robber is already on that tile.');
  }

  // If victim specified, steal a random resource
  let updatedPlayers = { ...state.players };
  if (victimId) {
    const victim = state.players[victimId];
    const player = state.players[playerId];

    if (!victim || !player) {
      throw new Error('Invalid victim or player.');
    }

    // Check victim has at least one building adjacent to target tile
    const hasAdjacentBuilding = tile.surroundingVertices.some((vertexId) => {
      const vertex = state.board.vertices.find((v) => v.id === vertexId);
      return vertex && vertex.ownerId === victimId && vertex.building;
    });

    if (!hasAdjacentBuilding) {
      throw new Error('Victim has no buildings adjacent to robber tile.');
    }

    // Get all resources victim has
    const victimResources: ResourceType[] = [];
    for (const resourceType in victim.resources) {
      const count = victim.resources[resourceType as ResourceType];
      for (let i = 0; i < count; i++) {
        victimResources.push(resourceType as ResourceType);
      }
    }

    // Steal random resource if victim has any
    if (victimResources.length > 0) {
      const randomIndex = Math.floor(Math.random() * victimResources.length);
      const stolenResource = victimResources[randomIndex];

      updatedPlayers = {
        ...updatedPlayers,
        [victimId]: {
          ...victim,
          resources: {
            ...victim.resources,
            [stolenResource]: victim.resources[stolenResource] - 1,
          },
        },
        [playerId]: {
          ...player,
          resources: {
            ...player.resources,
            [stolenResource]: player.resources[stolenResource] + 1,
          },
        },
      };
    }
  }

  return {
    ...state,
    board: {
      ...state.board,
      robberTileId: tileId,
    },
    players: updatedPlayers,
    phase: 'ACTION', // Return to ACTION phase after robber placement
  };
}

function discardResources(state: GameState, playerId: string, resources: Partial<Record<ResourceType, number>>): GameState {
  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  // Calculate total resources to discard
  let totalDiscard = 0;
  for (const resource in resources) {
    totalDiscard += resources[resource as ResourceType] || 0;
  }

  // Calculate total resources player has
  const totalResources = Object.values(player.resources).reduce((sum, count) => sum + count, 0);

  // Must discard half (rounded down)
  const requiredDiscard = Math.floor(totalResources / 2);

  if (totalDiscard !== requiredDiscard) {
    throw new Error(`Must discard exactly ${requiredDiscard} resources.`);
  }

  // Validate player has the resources to discard
  const updatedResources = { ...player.resources };
  for (const resource in resources) {
    const amount = resources[resource as ResourceType] || 0;
    if (updatedResources[resource as ResourceType] < amount) {
      throw new Error(`Insufficient ${resource} to discard.`);
    }
    updatedResources[resource as ResourceType] -= amount;
  }

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        resources: updatedResources,
      },
    },
  };
}

function updateLargestArmy(state: GameState): GameState {
  // Find player with most knights (minimum 3)
  let maxKnights = 2; // Must have at least 3 to claim
  let newLargestArmyOwner: string | null = state.largestArmyOwner;

  for (const playerId in state.players) {
    const player = state.players[playerId];
    if (player.metrics.knightsPlayed > maxKnights) {
      maxKnights = player.metrics.knightsPlayed;
      newLargestArmyOwner = playerId;
    }
  }

  if (newLargestArmyOwner !== state.largestArmyOwner) {
    // Update victory points: remove from old owner, add to new owner
    const updatedPlayers = { ...state.players };
    const updatedTeams = { ...state.teams };

    if (state.largestArmyOwner) {
      const oldOwner = updatedPlayers[state.largestArmyOwner];
      const oldTeam = updatedTeams[oldOwner.teamId];
      updatedPlayers[state.largestArmyOwner] = {
        ...oldOwner,
        metrics: {
          ...oldOwner.metrics,
          victoryPoints: oldOwner.metrics.victoryPoints - 2,
        },
      };
      updatedTeams[oldOwner.teamId] = {
        ...oldTeam,
        victoryPoints: oldTeam.victoryPoints - 2,
      };
    }

    if (newLargestArmyOwner) {
      const newOwner = updatedPlayers[newLargestArmyOwner];
      const newTeam = updatedTeams[newOwner.teamId];
      updatedPlayers[newLargestArmyOwner] = {
        ...newOwner,
        metrics: {
          ...newOwner.metrics,
          victoryPoints: newOwner.metrics.victoryPoints + 2,
        },
      };
      updatedTeams[newOwner.teamId] = {
        ...newTeam,
        victoryPoints: newTeam.victoryPoints + 2,
      };
    }

    return {
      ...state,
      largestArmyOwner: newLargestArmyOwner,
      players: updatedPlayers,
      teams: updatedTeams,
    };
  }

  return state;
}

function checkWinCondition(state: GameState): GameState {
  // Check if any team has reached 10 victory points
  for (const teamId in state.teams) {
    const team = state.teams[teamId];
    if (team.victoryPoints >= 10) {
      return {
        ...state,
        phase: 'ENDED',
      };
    }
  }
  return state;
}

function executeHordePhase(state: GameState): GameState {
  // Only execute in co-op horde mode
  if (state.gameMode !== 'COOP_HORDE') {
    throw new Error('Horde phase only available in COOP_HORDE mode.');
  }

  // Check if threat deck is empty
  if (state.threatTracker.threatDeck.length === 0) {
    throw new Error('Threat deck is empty.');
  }

  // Draw the top threat card
  const drawnCard = state.threatTracker.threatDeck[0];
  const remainingDeck = state.threatTracker.threatDeck.slice(1);

  let newState: GameState = {
    ...state,
    threatTracker: {
      ...state.threatTracker,
      threatDeck: remainingDeck,
      activeThreats: [...state.threatTracker.activeThreats, drawnCard],
    },
  };

  // Execute threat card effect
  switch (drawnCard.type) {
    case 'BLIGHT_TILE':
      newState = blightTile(newState, drawnCard.targetTileId!);
      break;

    case 'BARBARIAN_RAID':
      newState = barbarianRaid(newState, drawnCard.severity || 1);
      break;

    case 'RESOURCE_DROUGHT':
      newState = resourceDrought(newState);
      break;

    case 'ADVANCE_THREAT':
      newState = advanceThreat(newState);
      break;
  }

  // Check horde loss conditions
  newState = checkHordeLossConditions(newState);

  // Return to normal turn flow (next player)
  newState.phase = 'ROLL';

  return newState;
}

function blightTile(state: GameState, tileId: number): GameState {
  const tile = state.board.tiles.find(t => t.id === tileId);
  if (!tile) {
    throw new Error('Invalid tile ID.');
  }

  // If already blighted, skip
  if (tile.isBlighted) {
    return state;
  }

  const updatedTiles = state.board.tiles.map(t =>
    t.id === tileId ? { ...t, isBlighted: true } : t
  );

  return {
    ...state,
    board: {
      ...state.board,
      tiles: updatedTiles,
    },
    threatTracker: {
      ...state.threatTracker,
      blightedTileCount: state.threatTracker.blightedTileCount + 1,
    },
  };
}

function barbarianRaid(state: GameState, severity: number): GameState {
  // Barbarian raids force players to discard resources
  // Each player with > 7 cards must discard severity% of their resources
  const updatedPlayers = { ...state.players };

  for (const playerId in updatedPlayers) {
    const player = updatedPlayers[playerId];
    const totalResources = Object.values(player.resources).reduce((sum, count) => sum + count, 0);

    if (totalResources > 7) {
      // Discard severity resources randomly
      const discardCount = Math.min(severity, totalResources);
      const updatedResources = { ...player.resources };

      for (let i = 0; i < discardCount; i++) {
        // Pick a random resource type that has count > 0
        const availableResources = Object.keys(updatedResources).filter(
          r => updatedResources[r as keyof typeof updatedResources] > 0
        );
        if (availableResources.length > 0) {
          const randomResource = availableResources[
            Math.floor(Math.random() * availableResources.length)
          ] as keyof typeof updatedResources;
          updatedResources[randomResource]--;
        }
      }

      updatedPlayers[playerId] = {
        ...player,
        resources: updatedResources,
      };
    }
  }

  return {
    ...state,
    players: updatedPlayers,
  };
}

function resourceDrought(state: GameState): GameState {
  // Resource drought: all players lose 1 random resource
  const updatedPlayers = { ...state.players };

  for (const playerId in updatedPlayers) {
    const player = updatedPlayers[playerId];
    const totalResources = Object.values(player.resources).reduce((sum, count) => sum + count, 0);

    if (totalResources > 0) {
      const updatedResources = { ...player.resources };

      // Pick a random resource type that has count > 0
      const availableResources = Object.keys(updatedResources).filter(
        r => updatedResources[r as keyof typeof updatedResources] > 0
      );
      if (availableResources.length > 0) {
        const randomResource = availableResources[
          Math.floor(Math.random() * availableResources.length)
        ] as keyof typeof updatedResources;
        updatedResources[randomResource]--;
      }

      updatedPlayers[playerId] = {
        ...player,
        resources: updatedResources,
      };
    }
  }

  return {
    ...state,
    players: updatedPlayers,
  };
}

function advanceThreat(state: GameState): GameState {
  // Advance the threat tracker
  const newLevel = Math.min(state.threatTracker.currentLevel + 1, state.threatTracker.maxLevel);

  return {
    ...state,
    threatTracker: {
      ...state.threatTracker,
      currentLevel: newLevel,
    },
  };
}

function checkHordeLossConditions(state: GameState): GameState {
  // Loss condition 1: Too many blighted tiles (>= 5)
  if (state.threatTracker.blightedTileCount >= 5) {
    return {
      ...state,
      phase: 'ENDED',
    };
  }

  // Loss condition 2: Threat tracker reaches max level
  if (state.threatTracker.currentLevel >= state.threatTracker.maxLevel) {
    return {
      ...state,
      phase: 'ENDED',
    };
  }

  return state;
}

function updateLongestRoad(state: GameState): GameState {
  // Find player/team with longest road (minimum 5)
  let maxRoadLength = 4; // Must have at least 5 to claim
  let newLongestRoadOwner: string | null = state.longestRoadOwner;

  for (const playerId in state.players) {
    const player = state.players[playerId];
    if (player.metrics.longestRoadSegment > maxRoadLength) {
      maxRoadLength = player.metrics.longestRoadSegment;
      newLongestRoadOwner = playerId;
    }
  }

  if (newLongestRoadOwner !== state.longestRoadOwner) {
    // Update victory points: remove from old owner, add to new owner
    const updatedPlayers = { ...state.players };
    const updatedTeams = { ...state.teams };

    if (state.longestRoadOwner) {
      const oldOwner = updatedPlayers[state.longestRoadOwner];
      const oldTeam = updatedTeams[oldOwner.teamId];
      updatedPlayers[state.longestRoadOwner] = {
        ...oldOwner,
        metrics: {
          ...oldOwner.metrics,
          victoryPoints: oldOwner.metrics.victoryPoints - 2,
        },
      };
      updatedTeams[oldOwner.teamId] = {
        ...oldTeam,
        victoryPoints: oldTeam.victoryPoints - 2,
      };
    }

    if (newLongestRoadOwner) {
      const newOwner = updatedPlayers[newLongestRoadOwner];
      const newTeam = updatedTeams[newOwner.teamId];
      updatedPlayers[newLongestRoadOwner] = {
        ...newOwner,
        metrics: {
          ...newOwner.metrics,
          victoryPoints: newOwner.metrics.victoryPoints + 2,
        },
      };
      updatedTeams[newOwner.teamId] = {
        ...newTeam,
        victoryPoints: newTeam.victoryPoints + 2,
      };
    }

    return {
      ...state,
      longestRoadOwner: newLongestRoadOwner,
      players: updatedPlayers,
      teams: updatedTeams,
    };
  }

  return state;
}

function endTurn(state: GameState, playerId: string): GameState {
  // Phase validation
  if (state.phase !== 'ACTION') {
    throw new Error('Can only end turn during ACTION phase.');
  }

  const player = state.players[playerId];
  if (!player) {
    throw new Error('Player not found.');
  }

  if (state.activePlayerId !== playerId) {
    throw new Error('Not your turn to end.');
  }

  // Get all player IDs in turn order
  const allPlayerIds = Object.keys(state.players);
  const currentIndex = allPlayerIds.indexOf(playerId);
  const nextIndex = (currentIndex + 1) % allPlayerIds.length;
  const nextPlayerId = allPlayerIds[nextIndex];

  // Update team synchronization
  const team = state.teams[player.teamId];
  const updatedTeam = {
    ...team,
    synchronization: {
      ...team.synchronization,
      [playerId]: { isTurnEnded: true },
    },
  };

  // Reset dice for next turn
  let newState: GameState = {
    ...state,
    phase: 'ROLL', // Next player must roll dice
    activePlayerId: nextPlayerId,
    turnNumber: nextIndex === 0 ? state.turnNumber + 1 : state.turnNumber, // Increment when we loop back to first player
    dice: { values: null, total: null, rolled: false },
    teams: {
      ...state.teams,
      [team.id]: updatedTeam,
    },
  };

  // Reset synchronization when cycling to next team
  const nextPlayer = state.players[nextPlayerId];
  if (nextPlayer && nextPlayer.teamId !== player.teamId) {
    // Moving to different team - reset previous team's synchronization
    newState.teams[team.id] = {
      ...updatedTeam,
      synchronization: Object.keys(updatedTeam.synchronization).reduce((acc, pid) => {
        acc[pid] = { isTurnEnded: false };
        return acc;
      }, {} as Record<string, { isTurnEnded: boolean }>)
    };
    newState.activeTeamId = nextPlayer.teamId;
  }

  // Update longest road at end of turn
  newState = updateLongestRoad(newState);

  // Check win condition
  newState = checkWinCondition(newState);

  return newState;
}

// Graph traversal helper: Check if a road can connect to existing infrastructure
function checkRoadConnectivity(state: GameState, playerId: string, edgeId: number): boolean {
  const edge = state.board.edges.find((e) => e.id === edgeId);
  if (!edge) return false;

  const player = state.players[playerId];
  const teamId = player.teamId;

  // Check both vertices of the edge
  for (const vertexId of edge.adjacentVertices) {
    const vertex = state.board.vertices.find((v) => v.id === vertexId);
    if (!vertex) continue;

    // In 2v2 mode, check for teammate buildings too
    if (state.gameMode === 'ALLIANCE_2V2') {
      if (vertex.ownerId && state.players[vertex.ownerId]?.teamId === teamId) {
        return true;
      }
    } else {
      // Co-op or own building only
      if (vertex.ownerId === playerId) {
        return true;
      }
    }

    // Check adjacent edges for existing roads
    for (const adjEdgeId of vertex.adjacentEdges) {
      const adjEdge = state.board.edges.find((e) => e.id === adjEdgeId);
      if (!adjEdge) continue;

      if (state.gameMode === 'ALLIANCE_2V2') {
        if (adjEdge.roadOwnerId && state.players[adjEdge.roadOwnerId]?.teamId === teamId) {
          return true;
        }
      } else {
        if (adjEdge.roadOwnerId === playerId) {
          return true;
        }
      }
    }
  }

  return false;
}

// Graph traversal: Calculate longest continuous road using DFS
function calculateLongestRoad(state: GameState, playerId: string): number {
  const player = state.players[playerId];
  const teamId = player.teamId;
  const visited = new Set<number>();
  let maxLength = 0;

  // Get all edges owned by player (or team in 2v2)
  const ownedEdges = state.board.edges.filter((edge) => {
    if (state.gameMode === 'ALLIANCE_2V2') {
      return edge.roadOwnerId && state.players[edge.roadOwnerId]?.teamId === teamId;
    }
    return edge.roadOwnerId === playerId;
  });

  // DFS from each edge
  for (const startEdge of ownedEdges) {
    visited.clear();
    const length = dfsRoad(state, startEdge.id, visited, playerId);
    maxLength = Math.max(maxLength, length);
  }

  return maxLength;
}

function dfsRoad(state: GameState, edgeId: number, visited: Set<number>, playerId: string): number {
  if (visited.has(edgeId)) return 0;
  visited.add(edgeId);

  const edge = state.board.edges.find((e) => e.id === edgeId);
  if (!edge) return 1;

  const player = state.players[playerId];
  const teamId = player.teamId;

  let maxPath = 0;

  // Explore from both vertices
  for (const vertexId of edge.adjacentVertices) {
    const vertex = state.board.vertices.find((v) => v.id === vertexId);
    if (!vertex) continue;

    // Check if vertex blocks continuation (enemy settlement)
    if (vertex.building && vertex.ownerId && vertex.ownerId !== playerId) {
      const ownerPlayer = state.players[vertex.ownerId];
      if (state.gameMode !== 'ALLIANCE_2V2' || !ownerPlayer || ownerPlayer.teamId !== teamId) {
        continue;
      }
    }

    // Explore adjacent edges
    for (const adjEdgeId of vertex.adjacentEdges) {
      if (adjEdgeId === edgeId || visited.has(adjEdgeId)) continue;

      const adjEdge = state.board.edges.find((e) => e.id === adjEdgeId);
      if (!adjEdge) continue;

      // Check ownership
      const isOwned =
        state.gameMode === 'ALLIANCE_2V2'
          ? adjEdge.roadOwnerId && state.players[adjEdge.roadOwnerId]?.teamId === teamId
          : adjEdge.roadOwnerId === playerId;

      if (isOwned) {
        const pathLength = dfsRoad(state, adjEdgeId, visited, playerId);
        maxPath = Math.max(maxPath, pathLength);
      }
    }
  }

  return 1 + maxPath;
}
