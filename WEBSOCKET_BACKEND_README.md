# WebSocket Backend Specification for Wing It Wordle VS Mode

## Overview

The backend is a **WebSocket signaling and state management server** for multiplayer VS Mode games. Its primary responsibilities are:

- **Lobby management**: Generate unique lobby codes, manage player connections, auto-cleanup on disconnect
- **Match state authority**: Store and relay the authoritative match state (targets, guesses, results)
- **Message relay**: Forward all game messages between clients
- **Game flow coordination**: Enforce turn order and match progression

The **host generates round data locally** before the match starts (picks random targets and preselected guesses) and sends it to the backend, which stores it and relays it to the guest.

The **frontend retains** all game logic:
- Determining if a guess is correct given a target (stat comparisons)
- Displaying feedback (green/orange/gray)
- Computing round/match winners
- UI and user interaction
- Generating random targets and preselected players at match start

---

## WebSocket Connection

### Connection String
```
ws://localhost:8080
```
(Backend should be configurable; frontend will use environment variable or constant for the URL.)

### Authentication
None required. Connection is open to all; lobbies are secured by lobby code (3-digit code + opaque peerId, see below).

---

## Message Format

All messages are JSON objects sent over WebSocket. Every message has a `type` field that determines its structure.

### General Message Shape
```json
{
  "type": "message:type",
  "data": { /* message-specific payload */ }
}
```

---

## Lobby Management

### 1. Create Lobby
**Client → Server**
```json
{
  "type": "lobby:create",
  "data": {
    "nickname": "Player1"
  }
}
```

**Server → Client** (immediately after)
```json
{
  "type": "lobby:created",
  "data": {
    "lobbyCode": "123",
    "peerId": "unique-peer-id-string",
    "message": "Lobby ready. Share code 123"
  }
}
```

**Responsibility:**
- Backend generates a unique 3-digit `lobbyCode` (e.g., "123")
- Backend assigns a unique `peerId` for this connection
- Backend stores the lobby state: `{ code, hostPeerId, guestPeerId, hostNickname, guestNickname, state, roundStates }`
- No player limits; backend auto-assigns roles (first to connect = host, second = guest)

---

### 2. Join Lobby
**Client → Server**
```json
{
  "type": "lobby:join",
  "data": {
    "lobbyCode": "123",
    "nickname": "Player2"
  }
}
```

**Server → Host** (notify the waiting host)
```json
{
  "type": "opponent:joined",
  "data": {
    "opponentNickname": "Player2",
    "connectionState": "connected"
  }
}
```

**Server → Guest** (acknowledge)
```json
{
  "type": "lobby:joined",
  "data": {
    "peerId": "guest-peer-id",
    "connectionState": "connected"
  }
}
```

**Responsibility:**
- Backend validates that the lobby code exists and is waiting (not in-progress, not full)
- Backend rejects join if a match is already in progress
- Backend rejects join if a guest is already connected
- Backend links the guest connection to the lobby

---

### 3. Lobby State Sync
**Client → Server** (sent by client when joining or updating settings)
```json
{
  "type": "lobby:sync",
  "data": {
    "nickname": "Player1",
    "settings": {
      "matchMode": "round",
      "scoreMode": "time",
      "rounds": 3,
      "cooldownSeconds": 0,
      "timeLimitSeconds": 120,
      "randomizedPlayerCount": 0,
      "visibleStats": ["name", "debut", "canonWins", ...]
    }
  }
}
```

**Server → Other Player** (relay settings from host to guest)
```json
{
  "type": "lobby:sync",
  "data": {
    "nickname": "Player1",
    "settings": {
      "matchMode": "round",
      "scoreMode": "time",
      "rounds": 3,
      "cooldownSeconds": 0,
      "timeLimitSeconds": 120,
      "randomizedPlayerCount": 0,
      "visibleStats": ["name", "debut", "canonWins", ...]
    }
  }
}
```

**Responsibility:**
- Backend stores settings from host; ignores settings from guest
- Backend relays host settings to guest for display sync
- Backend does **not** validate settings (frontend handles normalization)

---

### 4. Lobby Update (Settings Change)
**Client → Server** (only host should send this)
```json
{
  "type": "lobby:update",
  "data": {
    "settings": {
      "rounds": 5,
      "cooldownSeconds": 2
    }
  }
}
```

**Server → Guest** (relay updated settings)
```json
{
  "type": "lobby:update",
  "data": {
    "settings": {
      "rounds": 5,
      "cooldownSeconds": 2
    }
  }
}
```

**Responsibility:**
- Backend merges updated settings into current lobby state
- Backend relays to guest

---

## Match Flow

### 5. Start Match
**Client → Server** (only host sends this)
```json
{
  "type": "game:start",
  "data": {
    "settings": {
      "matchMode": "round",
      "scoreMode": "time",
      "rounds": 3,
      "cooldownSeconds": 0,
      "timeLimitSeconds": 120,
      "randomizedPlayerCount": 1,
      "visibleStats": [...]
    },
    "rounds": [
      {
        "roundIndex": 0,
        "target": { "name": "TargetPlayer1", "debut": 1, "canonWins": 5, ... },
        "initialGuesses": ["Player5", "Player12"]
      },
      {
        "roundIndex": 1,
        "target": { "name": "TargetPlayer2", "debut": 3, "canonWins": 2, ... },
        "initialGuesses": ["Player8"]
      },
      ...
    ]
  }
}
```

**Server Response: Store and Relay to Guest**

Backend should:
1. Move lobby state from `waiting` → `game`
2. Store the provided round data (host has already picked targets and preselected players)
3. Send match start to guest with the exact same round data

**Server → Guest**
```json
{
  "type": "game:start",
  "data": {
    "rounds": [
      {
        "roundIndex": 0,
        "target": { "name": "TargetPlayer1", "debut": 1, ... },
        "initialGuesses": ["Player5", "Player12"]
      },
      {
        "roundIndex": 1,
        "target": { "name": "TargetPlayer2", "debut": 3, ... },
        "initialGuesses": ["Player8"]
      },
      ...
    ]
  }
}
```

**Responsibility:**
- Backend validates that the number of rounds matches `settings.rounds`
- Backend stores all round data in the active match
- Backend relays the exact same round data to the guest
- Backend moves to game state
- Backend does **not** pick random targets or preselected players; host does this locally

---

### 6. Submit Guess
**Client → Server**
```json
{
  "type": "game:guess",
  "data": {
    "roundIndex": 0,
    "guessName": "GuesserPlayer42"
  }
}
```

**Server → Both Clients** (relay the guess)
```json
{
  "type": "game:guess",
  "data": {
    "roundIndex": 0,
    "guessName": "GuesserPlayer42",
    "submittedBy": "host" // or "guest"
  }
}
```

**Responsibility:**
- Backend stores the guess in `roundStates[roundIndex].guesses`
- Backend relays to opponent
- Backend does **not** validate if the guess is a real player (frontend trusts frontend for this)
- Backend tracks `lastGuessAt` timestamp for cooldown calculation (optional, frontend can also do this)

---

### 7. Surrender Round
**Client → Server**
```json
{
  "type": "game:surrender",
  "data": {
    "roundIndex": 0
  }
}
```

**Server → Both Clients** (relay surrender)
```json
{
  "type": "game:surrender",
  "data": {
    "roundIndex": 0,
    "surrenderedBy": "host" // or "guest"
  }
}
```

**Responsibility:**
- Backend marks this player as surrendered in round state
- Backend relays to opponent

---

### 8. Complete Round (Submit Result)
**Client → Server** (each player sends their individual result)
```json
{
  "type": "game:complete",
  "data": {
    "roundIndex": 0,
    "result": {
      "guessCount": 5,
      "timeMs": 45000
    }
  }
}
```

**Server → Both Clients** (relay each completion)
```json
{
  "type": "game:complete",
  "data": {
    "roundIndex": 0,
    "submittedBy": "host", // or "guest"
    "result": {
      "guessCount": 5,
      "timeMs": 45000
    }
  }
}
```

**Responsibility:**
- Backend stores the result in `roundStates[roundIndex]`
- Backend relays to opponent
- Backend does **not** determine the winner; frontend does
- Backend does **not** validate the result (frontend determines validity)

---

### 9. Match Complete / Move to Results
**Client → Server** (either player can signal)
```json
{
  "type": "results:ready",
  "data": {
    "ready": true
  }
}
```

**Server → Both Clients** (relay ready state)
```json
{
  "type": "results:ready",
  "data": {
    "submittedBy": "host", // or "guest"
    "ready": true
  }
}
```

**Responsibility:**
- Backend stores the ready state
- Backend does **not** auto-transition; frontend decides when to go to results
- Backend relays ready state so both clients can see each other's status

---

### 10. Rematch (Play Again)
**Client → Server**
```json
{
  "type": "rematch:ready",
  "data": {
    "ready": true
  }
}
```

**Server → Both Clients** (relay)
```json
{
  "type": "rematch:ready",
  "data": {
    "submittedBy": "host",
    "ready": true
  }
}
```

If both players are ready:
**Server → Both Clients**
```json
{
  "type": "rematch:start",
  "data": {}
}
```

Frontend should then send a new `game:start` message to restart the match.

**Responsibility:**
- Backend stores ready state
- Backend does **not** auto-restart; frontend triggers new `game:start` when both are ready
- Backend can optionally auto-send `rematch:start` when both ready, but frontend will handle the new game start

---

### 11. Player Leaves (Disconnect)
**Client Disconnect (no explicit message needed)**

**Server → Remaining Client**
```json
{
  "type": "match:abandoned",
  "data": {
    "reason": "opponent:disconnected"
  }
}
```

**Responsibility:**
- Backend detects WebSocket close/error
- Backend sends `match:abandoned` to the other player
- Backend immediately cleans up the lobby (no reconnection support)
- Backend closes the remaining player's connection or returns them to lobby selection (frontend decides UI flow)
- Backend deletes all match data for this lobby

---

### 12. Explicit Leave
**Client → Server**
```json
{
  "type": "match:leave",
  "data": {}
}
```

**Server → Other Client** (notify opponent)
```json
{
  "type": "match:left",
  "data": {
    "reason": "opponent:left"
  }
}
```

**Responsibility:**
- Backend marks match as abandoned
- Backend notifies the other player
- Backend cleans up

---

## Data Structures

### Lobby State (Backend Storage)
```javascript
{
  code: "123",                         // 3-digit identifier
  hostPeerId: "unique-id-1",
  guestPeerId: "unique-id-2" || null, // null until guest joins
  hostNickname: "Player1",
  guestNickname: "Player2" || null,
  state: "waiting" | "game" | "results" | "abandoned", // current state
  settings: {
    matchMode: "round",                // only "round" for now
    scoreMode: "time" | "guesses",
    rounds: 3,
    cooldownSeconds: 0,
    timeLimitSeconds: 120,
    randomizedPlayerCount: 0,
    visibleStats: [...]
  },
  roundStates: [
    {
      roundIndex: 0,
      target: { /* full player object */ },
      initialGuesses: ["Player5", "Player12"], // names of preselected players
      hostGuesses: ["Guess1", "Guess2", ...],
      guestGuesses: ["Guess1", "Guess3", ...],
      hostResult: { guessCount: 5, timeMs: 45000 } || null,
      guestResult: { guessCount: 6, timeMs: 52000 } || null,
      hostSurrendered: false,
      guestSurrendered: false,
      hostReady: false,
      guestReady: false,
      winner: "host" | "guest" | "draw" | null, // computed by frontend, echoed back
      createdAt: timestamp,
      completedAt: timestamp || null
    }
  ],
  createdAt: timestamp,
  lastActivityAt: timestamp // for cleanup
}
```

### Round State Detail
```javascript
{
  roundIndex: 0,
  target: { /* full player object from playerList */ },
  initialGuesses: ["PreSelectedPlayer1", "PreSelectedPlayer2"],
  hostGuesses: ["Guess1", "Guess2", "Guess3"],
  guestGuesses: ["Guess1", "Guess2"],
  hostResult: { guessCount: 3, timeMs: 45000 },
  guestResult: null, // not submitted yet
  hostSurrendered: false,
  guestSurrendered: false,
  hostReady: false,
  guestReady: false,
  winner: null,
  startedAt: timestamp,
  completedAt: timestamp || null
}
```

---

## Backend Responsibilities Summary

✅ **Backend Should:**
- Generate and manage unique 3-digit lobby codes
- Store authoritative lobby and match state
- Coordinate player connections
- Relay all messages between players
- Track timestamps (round start, guess submission, completion)
- Auto-cleanup lobbies on player disconnect
- Enforce state transitions (waiting → game → results)
- Validate that incoming round data matches expected structure (no data corruption)

❌ **Backend Should NOT:**
- Determine if a guess is correct (frontend logic)
- Compute stat comparisons (frontend logic)
- Determine round/match winners (frontend logic, but frontend can echo back for confirmation)
- Validate player names against a master list (trust frontend)
- Store persistent match history (ephemeral only)
- Store or manage a player database (host generates targets locally)
- Enforce game rules (e.g., time limits, guess limits) — frontend enforces, backend just relays
- Pick random targets or preselected players (host does this locally)

---

## Frontend Responsibilities Summary

✅ **Frontend Should:**
- Determine if a guess is correct given a target (all stat comparison logic)
- Display feedback colors (green/orange/gray)
- Compute round winners
- Compute match winners
- Show UI based on game state
- Enforce cooldown timers (if `scoreMode === 'time'`)
- Enforce round time limits (if `scoreMode === 'guesses'`)
- Validate guess input before sending
- Manage game flow (when to send results, when to move to next round, etc.)
- **Generate random targets and preselected players locally before match start**
- **Host: Pick targets and initial guesses, then send them to backend in `game:start`**

---

## Error Handling

### Generic Error Response
**Server → Client** (on any error)
```json
{
  "type": "error",
  "data": {
    "message": "Lobby code not found",
    "errorCode": "LOBBY_NOT_FOUND"
  }
}
```

**Common Error Codes:**
- `LOBBY_NOT_FOUND`: Lobby code does not exist
- `LOBBY_FULL`: Lobby already has 2 players
- `MATCH_IN_PROGRESS`: Cannot join a lobby that is already in a game
- `INVALID_LOBBY_CODE`: Code format is wrong
- `UNAUTHORIZED`: Message sent by non-host when only host should send it
- `INVALID_STATE`: Action not allowed in current state

---

## Auto-Cleanup & Timeouts

### Idle Lobby Cleanup
- If a lobby is in `waiting` state and has no activity for **30 minutes**, backend should delete it
- If only one player is connected (other disconnected), immediately delete the lobby

### Match Abandonment
- If a player disconnects during `game` or `results`, immediately mark match as abandoned and notify the other player
- Clean up all match data after abandonment

---

## Example Flow: Complete Game

```
1. Client A creates lobby
   → Server generates code "123" and assigns hostPeerId
   → Server sends lobby:created with code and peerId

2. Client B joins "123"
   → Server validates code exists
   → Server assigns guestPeerId
   → Server sends opponent:joined to Client A
   → Server sends lobby:joined to Client B

3. Client A sends settings (lobby:sync)
   → Server stores settings
   → Server relays to Client B

4. Client A (host) generates targets and preselected players locally
   → Uses settings.rounds to know how many rounds to generate
   → Uses settings.randomizedPlayerCount to pick preselected players per round
   → Builds a rounds array with targets and initialGuesses

5. Client A sends game:start with rounds array
   → Server validates round count matches settings.rounds
   → Server stores all round data
   → Server sends game:start to Client B with the same round data

6. Client A guesses "Player5" (round 0)
   → Client B guesses "Player10" (round 0)
   → Each client sends game:guess
   → Server relays each guess to both clients

7. Both clients submit results (game:complete)
   → Client A: { guessCount: 3 }
   → Client B: { guessCount: 5 }
   → Server relays results
   → Frontend determines winner

8. Both send results:ready
   → Server relays ready states
   → Frontend waits for both to be ready

9. Client A or B sends rematch:ready
   → If both ready, Server sends rematch:start
   → Frontend (host) generates new targets locally
   → Frontend sends new game:start

10. Player disconnects
    → Server detects close
    → Server sends match:abandoned to other player
    → Server deletes lobby
```

---

## Configuration

The backend should accept environment variables or config:

```
WEBSOCKET_PORT=8080
WEBSOCKET_HOST=0.0.0.0
IDLE_LOBBY_CLEANUP_MINUTES=30
LOG_LEVEL=info
```

---

## Notes for Implementation

- Use a simple in-memory store for lobbies (no database needed; ephemeral)
- Use a rate limiter or cooldown to prevent spam from a single connection
- Validate message structure (required fields, data types) before processing
- Use UUIDs or secure random IDs for `peerId`
- Use cryptographically secure random for lobby codes (though 3-digit is low security; consider 4–6 digits if desired)
- Handle WebSocket disconnects gracefully (try-catch on sends, detect close events)
- Keep connections alive with periodic pings or handle ping/pong frames
- Do not assume message order (use timestamps where needed)
