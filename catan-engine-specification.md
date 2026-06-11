# Catan Engineering Specification & Context Document
## Custom Variant Architecture: Co-op ("Catan vs. The Horde") & 2v2 ("Alliance Mode")

This document serves as the comprehensive, production-ready specification and context payload for building a server-authoritative, turn-based online multiplayer board game engine based on Settlers of Catan. It outlines the architectural patterns, graph mechanics, explicit JSON schemas, and state transition rules required to implement two distinct variants: Co-op Mode and 2v2 Alliance Mode.

---

## 1. Architectural Overview & Graph Mechanics

To eliminate synchronization bugs and prevent client-side exploitation, the platform adheres to a strict **Server-Authoritative, State-Driven Architecture**. The frontend client functions as a deterministic rendering machine that interprets game state and fires structural actions back to the server.

### 1.1 The Catan Graph Model
A standard Catan board is an interconnected topology composed of three distinct geometric entities: **Tiles (Hexes)**, **Vertices (Corners)**, and **Edges (Borders)**. Treating this layout as a statically relational graph allows for fast, deterministic traversals (e.g., checking settlement placement validity or calculating the longest road) using standard index lookup maps.

1. **Tiles (Hexes) - Face Elements**: Represent resource-producing land. Each tile is connected to exactly **6 vertices** and **6 edges**.
2. **Vertices - Point Elements**: Represent intersection points where settlements and cities are constructed. Each vertex is adjacent to up to **3 tiles**, up to **3 edges**, and up to **3 neighboring vertices**.
3. **Edges - Line Elements**: Represent paths where roads are built. Each edge is connected to exactly **2 vertices** and up to **2 tiles**.

### 1.2 Coordinate System & Adjacency Mapping
To ensure cross-language interoperability between backend runtimes (e.g., Node.js/TypeScript) and database storage layers, the board configuration uses a **Fixed-ID Adjacency Map** rather than inline dynamic coordinate conversions.

- A standard board contains exactly **19 tiles (IDs 0–18)**, **54 vertices (IDs 0–53)**, and **72 edges (IDs 0–71)**.
- Every entity contains explicit arrays of connected IDs (`adjacentVertices`, `surroundingEdges`, etc.). This turns complex spatial lookups into simple O(1) array lookups.

### 1.3 State Mutation Constraints
The core game engine must be structured as a pure, deterministic state machine. State mutation occurs exclusively through transactional command objects (Actions). Given a current state `S` and an input action `A`, the state engine must execute synchronous validation rules and return a brand new state `S'` or throw an explicit validation exception. No asynchronous side-effects are permitted inside the core engine loop.

### 1.4 Networking & Turn Synchronization Paradigm
- **Network Protocol**: State mutations and user events travel over duplex **WebSockets** (via Socket.io or native WS).
- **State Sync**: Following a valid state transition, the full or delta-compressed state payload is broadcasted simultaneously to all active sockets within the room.
- **Deterministic Turn Management**: The server drives a phase-based state manager. For sequential turns, a timer handles automatic timeouts. For parallel/simultaneous phases (used in 2v2), the engine blocks state progression until all players assigned to the current active team flag their local turn state as `"READY"`.

---

## 2. Detailed Game Mode Specifications

### 2.1 Co-op Mode: "Catan vs. The Horde"
Co-op mode converts Catan from an individualistic race to a survival game where all human players share a unified victory condition and defend against an automated system entity ("The Horde").

#### 2.1.1 Mechanics & Turn Flow
1. **The Turn Structure**: A human player performs their standard turn (Roll, Distribute Resources, Trade, Build). At the conclusion of their turn, instead of handing off directly to the next player, the game transitions into the **Horde Phase**.
2. **The Horde Phase**: The server automatically rolls an Event Die or samples a deterministic deck of Threat Cards.
3. **Hex Blighting**: The Threat Card identifies a Target Hex number (e.g., based on tile numbers or specific coordinates). The server modifies that tile's state to `isBlighted = true`.
4. **Blight Penalty**: A blighted hex produces zero resources. If a dice roll matches a blighted hex, any settlements or cities surrounding that hex receive nothing.

#### 2.1.2 Win/Loss Logic & Math
- **Win Condition**: The human alliance wins collectively if they accomplish one of two targets configured at game start:
  - **Team Victory Points**: The combined total of all individual players' Victory Points reaches `>= 32` (in a 4-player setup).
  - **Mega Monument Construction**: Players collectively contribute resources to a centralized board structure requiring massive resource milestones (e.g., 10 Ore, 10 Brick, 10 Wood, 10 Grain).
- **Loss Condition**: The humans instantly lose if:
  - The total number of simultaneously blighted hexes reaches `>= 5`.
  - The global Threat Tracker reaches its maximum limit (Level 10) on the track due to unmitigated attacks.

#### 2.1.3 Collaborative Economy
- **The Guild Chest**: A shared resource repository array stored at the team level. Players can spend an action to deposit an item into the Guild Chest. Teammates can withdraw items during their turn phase. To maintain strategic friction, withdrawals are subject to a **2:1 tax rate** (e.g., pay 2 items from the chest to get 1 into your hand) unless the active player controls a specialized "Guild Port" vertex on the board.
- **Shared Visibility**: All players within a team have open-hand visibility. The server payload includes the resource lists of all teammates to facilitate collective strategic planning.

---

### 2.2 2v2 Mode: "Alliance Mode"
Alliance mode sets two teams of two human players against each other (Team A: Players 1 & 2 vs. Team B: Players 3 & 4) on an expanded or standard map layer, emphasizing coordinated builds and rapid tactical play.

#### 2.2.1 Simultaneous Team Turns
To maximize user engagement and reduce idle wait times, teammates act completely in parallel during their team's active window.

- **Turn Phase Sequence**: The engine transitions to Team A's turn phase. Both Player 1 and Player 2 are marked as `active: true`.
- **Resource Collection**: One dice roll is executed for the entire team. Both players collect resources concurrently from the resulting yields.
- **Parallel Building/Trading**: Both players can execute `BUILD_ROAD`, `BUILD_SETTLEMENT`, or `TRADE_BANK` actions simultaneously. The engine processes these incoming WebSocket frames sequentially as they hit the server thread, validating placement against the live state.
- **Turn Finalization**: The phase only ends when *both* Player 1 and Player 2 submit an `END_TURN` intent frame, setting their respective user status to `"READY"`.

#### 2.2.2 Synergy Rules
- **Immediate Co-Op Trading**: Teammates can pass resources to each other at a **1:1 exchange rate** instantly, with zero maritime or bank fees, provided it is their team's active turn phase.
- **Shared Port Leverage**: If Player 1 controls an Ore Port (2:1), Player 2 can route resource conversions through Player 1's port. This can be executed either automatically by the engine or manually by passing resources to Player 1 to run the bank trade.
- **Network Connectivity**: Teammates cannot construct settlements on vertices occupied or directly blocked by their partner's structures (adhering to the standard 2-space distance rule). However, a teammate's roads do not break the continuity of their partner's road network when calculating the **Longest Road** metric.

#### 2.2.3 Victory Conditions
- **Team Victory Target**: Individual victory metrics are suppressed. The game concludes the moment Team A or Team B hits an aggregate threshold of **20 Victory Points** across their paired infrastructure.

---

## 3. Production-Ready JSON Data Schema

The following unified JSON object represents a complete snapshot of a live match. This single, highly structured schema accommodates both game modes through specific configurable objects (`threatTracker`, `teams`, `gameMode`).

```json
{
  "gameId": "match-uuid-here",
  "gameMode": "COOP_HORDE | ALLIANCE_2V2",
  "phase": "SETUP | ROLL | ACTION | ROBBER_PLACEMENT | HORDE_PHASE | ENDED",
  "activeTeamId": "team-a",
  "turnNumber": 1,

  "dice": {
    "values": [3, 4],
    "total": 7,
    "rolled": true
  },

  "threatTracker": {
    "currentLevel": 2,
    "maxLevel": 10,
    "threatDeck": [],
    "activeThreats": []
  },

  "teams": {
    "team-a": {
      "id": "team-a",
      "playerIds": ["player-1", "player-2"],
      "victoryPoints": 0,
      "guildChest": {
        "WOOD": 0,
        "BRICK": 0,
        "ORE": 0,
        "GRAIN": 0,
        "WOOL": 0
      },
      "synchronization": {
        "player-1": { "isTurnEnded": false },
        "player-2": { "isTurnEnded": false }
      }
    },
    "team-b": {
      "id": "team-b",
      "playerIds": ["player-3", "player-4"],
      "victoryPoints": 0,
      "guildChest": {
        "WOOD": 0,
        "BRICK": 0,
        "ORE": 0,
        "GRAIN": 0,
        "WOOL": 0
      },
      "synchronization": {
        "player-3": { "isTurnEnded": false },
        "player-4": { "isTurnEnded": false }
      }
    }
  },

  "players": {
    "player-1": {
      "id": "player-1",
      "teamId": "team-a",
      "active": true,
      "resources": {
        "WOOD": 0,
        "BRICK": 0,
        "ORE": 0,
        "GRAIN": 0,
        "WOOL": 0
      },
      "infrastructureLeft": {
        "ROADS": 15,
        "SETTLEMENTS": 5,
        "CITIES": 4
      },
      "metrics": {
        "victoryPoints": 0,
        "longestRoadSegment": 0,
        "knightsPlayed": 0
      },
      "ports": []
    }
  },

  "board": {
    "tiles": [
      {
        "id": 0,
        "resourceType": "WOOD | BRICK | ORE | GRAIN | WOOL | DESERT",
        "diceNumber": 6,
        "isBlighted": false,
        "surroundingVertices": [0, 1, 2, 8, 9, 10],
        "surroundingEdges": [0, 1, 2, 9, 10, 11]
      }
    ],
    "vertices": [
      {
        "id": 0,
        "building": null,
        "ownerId": null,
        "port": null,
        "adjacentVertices": [1, 8],
        "adjacentEdges": [0, 9],
        "adjacentTiles": [0]
      }
    ],
    "edges": [
      {
        "id": 0,
        "roadOwnerId": null,
        "adjacentVertices": [0, 1],
        "adjacentTiles": [0]
      }
    ]
  }
}
```

---

## 4. State Transition API & Validation Rules

Every transactional operation payload hitting the server must be strictly verified against structural business rules before altering the global state object.

### 4.1 Action: `ROLL_DICE`

**Pre-conditions:**
- `gameState.phase` must equal `"ROLL"`.
- The requesting `playerId` must belong to the active `teamId`.
- In 2v2 Mode, if one teammate has already triggered the roll, subsequent roll actions from that team within the same round must be rejected.

**State Updates:**
- Generate two cryptographically secure pseudo-random integers between 1 and 6.
- Store values in `gameState.dice.values` and aggregate their sum in `gameState.dice.total`.
- Update `gameState.dice.rolled = true` and change `gameState.phase` to `"ACTION"`.

**Resource Distribution:**
Locate all board tiles where `tile.diceNumber == total` and `tile.isBlighted == false`. For each matching tile, iterate through its `surroundingVertices`. If a vertex contains a settlement or city, add the corresponding resource units directly to the owner's `player.resources` object.

**Robber Trigger:**
If the sum equals 7, change `gameState.phase` to `"ROBBER_PLACEMENT"`. In Co-op mode, if a 7 is rolled, automatically advance the global `threatTracker.currentLevel` by 1 instead of moving the traditional robber, or execute a threat draw event.

---

### 4.2 Action: `BUILD_ROAD`

**Pre-conditions:**
- `gameState.phase` must equal `"ACTION"`.
- The player must possess at least 1 Brick and 1 Wood in their resources block.
- `player.infrastructureLeft.ROADS` must be `>= 1`.
- Target `edgeId` must be open (`roadOwnerId == null`).

**Adjacency Check:**
The target edge must be directly connected to either a vertex containing a building owned by the player, or an adjacent edge containing a road owned by the player. In 2v2 Mode, this validation step extends to include roads or buildings owned by their assigned teammate.

**State Mutations:**
- Subtract 1 Brick and 1 Wood from `player.resources`.
- Set `edge.roadOwnerId` to the active `playerId`.
- Decrement `player.infrastructureLeft.ROADS` by 1.
- Execute a depth-first search (DFS) traversal across the edge graph to compute the player's updated longest continuous road length, updating `player.metrics.longestRoadSegment`.

---

### 4.3 Action: `CONSTRUCT_SETTLEMENT`

**Pre-conditions:**
- The player must possess 1 Brick, 1 Wood, 1 Grain, and 1 Wool.
- `player.infrastructureLeft.SETTLEMENTS` must be `>= 1`.
- Target `vertexId` must be completely vacant (`building == null`).

**The Distance Rule:**
Every vertex directly adjacent to the target vertex (found via `vertex.adjacentVertices`) must be completely empty. This constraint is absolute across both game modes and applies to all friendly, neutral, and adversarial pieces.

**Connectivity Check:**
The target vertex must be attached to at least one road owned by the placing player (except during the setup phase).

**State Mutations:**
- Deduct the required resources from the player's inventory.
- Set `vertex.building` to `"SETTLEMENT"` and assign `vertex.ownerId = playerId`.
- Decrement `player.infrastructureLeft.SETTLEMENTS` by 1.
- Increment the player's (and team's) collective victory points by 1.

---

### 4.4 Action: `ALLIANCE_TRADE_TEAMMATE` *(Exclusive to 2v2)*

**Pre-conditions:**
- `gameState.gameMode` must be `"ALLIANCE_2V2"`.
- `gameState.phase` must equal `"ACTION"`.
- The sending player and receiving player must share the same `teamId`.
- The sending player must possess the explicit quantities of resources defined in the outbound trade offer payload.

**State Mutations:**
- Atomically deduct the offered items from the sender's resource inventory and append them to the receiving teammate's inventory.
- This bypasses the traditional trade validation steps requiring double-sided confirmation flags, treating team exchanges as immediate inventory mutations.

---

## 5. Instructions for Claude (AI Helper Integration)

When pasting this specification file into Claude to generate code, initialize your engineering prompt with the following system directive:

```
You are an expert game systems engineer specializing in turn-based state machines and graph-theory board game engines. Use the provided Catan Engineering Specification & Context Document as your single source of truth.

When asked to implement state transitions, validations, or graph traversals:
- Ensure all code blocks strictly match the structural design of the provided JSON Data Schema.
- Implement graph operations (like checking the Catan distance rule or computing continuous roads) by explicitly looking up indices via the defined adjacency fields (adjacentVertices, surroundingEdges).
- Write clean, deterministic validation layers that reject invalid moves by throwing clear exceptions or structured error payloads.
- Keep state mutations free of external side-effects so that they can run reliably in a server-authoritative WebSocket context.
```
