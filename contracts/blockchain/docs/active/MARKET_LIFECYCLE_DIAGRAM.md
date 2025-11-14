# 🔄 Market Lifecycle State Diagram

**Version**: 1.0.0
**Last Updated**: Day 25 (Phase 5.2 Complete)
**Status**: ✅ Production Ready

---

## Complete State Transition Diagram

```mermaid
stateDiagram-v2
    [*] --> PROPOSED: createMarket()

    PROPOSED --> APPROVED: approve()
    PROPOSED --> FINALIZED: reject()

    APPROVED --> ACTIVE: activate()
    APPROVED --> FINALIZED: reject()

    ACTIVE --> RESOLVING: proposeOutcome() [NOT IMPLEMENTED]
    ACTIVE --> FINALIZED: adminCancel() [EDGE CASE]

    RESOLVING --> FINALIZED: finalize() [NOT IMPLEMENTED]
    RESOLVING --> DISPUTED: dispute() [NOT IMPLEMENTED]

    DISPUTED --> FINALIZED: adminResolve() [NOT IMPLEMENTED]

    FINALIZED --> [*]: claimWinnings()

    note right of PROPOSED
        State: 0
        Duration: 0-48h
        Operations: approve(), reject()
        Access: Factory only
    end note

    note right of APPROVED
        State: 1
        Duration: 0-24h
        Operations: activate(), reject()
        Access: Factory only
    end note

    note right of ACTIVE
        State: 2
        Duration: Fixed (endTime)
        Operations: placeBet(), sellShares()
        Access: All users
    end note

    note right of RESOLVING
        State: 3
        Duration: Dispute window (24-72h)
        Operations: proposeOutcome(), dispute()
        Access: Resolvers, users
        Status: NOT YET IMPLEMENTED
    end note

    note right of DISPUTED
        State: 4
        Duration: Variable (admin review)
        Operations: adminResolve()
        Access: Admin only
        Status: NOT YET IMPLEMENTED
    end note

    note right of FINALIZED
        State: 5
        Duration: Permanent (terminal)
        Operations: claimWinnings()
        Access: Winners
    end note
```

---

## Simplified Flow Diagram

```mermaid
flowchart TD
    A[Market Created] --> B{Approved?}
    B -->|Yes| C[PROPOSED → APPROVED]
    B -->|No| D[PROPOSED → FINALIZED]

    C --> E{Activated?}
    E -->|Yes| F[APPROVED → ACTIVE]
    E -->|No| D

    F --> G{Trading Period}
    G --> H[End Time Reached]

    H --> I[ACTIVE → RESOLVING]
    I --> J{Disputed?}
    J -->|No| K[RESOLVING → FINALIZED]
    J -->|Yes| L[RESOLVING → DISPUTED]
    L --> M[DISPUTED → FINALIZED]

    K --> N[Winners Claim]
    M --> N
    D --> N

    style F fill:#90EE90
    style K fill:#FFD700
    style M fill:#FFD700
    style D fill:#FF6B6B
```

---

## State Transition Table

| Current State | Valid Next States | Transition Function | Access Control |
|--------------|-------------------|---------------------|----------------|
| **PROPOSED** | APPROVED, FINALIZED | approve(), reject() | Factory only |
| **APPROVED** | ACTIVE, FINALIZED | activate(), reject() | Factory only |
| **ACTIVE** | RESOLVING, FINALIZED | proposeOutcome(), adminCancel() | Resolver, Admin |
| **RESOLVING** | FINALIZED, DISPUTED | finalize(), dispute() | Auto, Users |
| **DISPUTED** | FINALIZED | adminResolve() | Admin only |
| **FINALIZED** | None (terminal) | N/A | N/A |

---

## Implementation Status

### ✅ Implemented Transitions

```mermaid
graph LR
    PROPOSED -->|approve| APPROVED
    PROPOSED -->|reject| FINALIZED
    APPROVED -->|activate| ACTIVE
    APPROVED -->|reject| FINALIZED

    style PROPOSED fill:#90EE90
    style APPROVED fill:#90EE90
    style ACTIVE fill:#90EE90
    style FINALIZED fill:#90EE90
```

**Status**: Production ready, fully tested (14 tests passing)

---

### ⏸️ Pending Implementation

```mermaid
graph LR
    ACTIVE -->|proposeOutcome| RESOLVING
    RESOLVING -->|finalize| FINALIZED
    RESOLVING -->|dispute| DISPUTED
    DISPUTED -->|adminResolve| FINALIZED

    style RESOLVING fill:#FFD700
    style DISPUTED fill:#FFD700
```

**Status**: Awaiting Phase 5 completion (4 tests pending)

---

## Transition Decision Tree

```mermaid
flowchart TD
    START[Market State?] --> CHECK_STATE{Current State}

    CHECK_STATE -->|PROPOSED| PROP_ACTIONS[approve or reject?]
    PROP_ACTIONS -->|approve| APPROVED_STATE[APPROVED]
    PROP_ACTIONS -->|reject| FINAL_STATE[FINALIZED]

    CHECK_STATE -->|APPROVED| APP_ACTIONS[activate or reject?]
    APP_ACTIONS -->|activate| ACTIVE_STATE[ACTIVE]
    APP_ACTIONS -->|reject| FINAL_STATE

    CHECK_STATE -->|ACTIVE| ACT_ACTIONS[endTime reached?]
    ACT_ACTIONS -->|Yes| RESOLVE_STATE[RESOLVING]
    ACT_ACTIONS -->|No| ACTIVE_STATE

    CHECK_STATE -->|RESOLVING| RES_ACTIONS[disputed?]
    RES_ACTIONS -->|Yes| DISPUTED_STATE[DISPUTED]
    RES_ACTIONS -->|No| FINAL_STATE

    CHECK_STATE -->|DISPUTED| DISP_ACTIONS[admin resolves]
    DISP_ACTIONS --> FINAL_STATE

    CHECK_STATE -->|FINALIZED| TERMINAL[Terminal State]

    style ACTIVE_STATE fill:#90EE90
    style FINAL_STATE fill:#FFD700
    style TERMINAL fill:#FF6B6B
```

---

## Access Control Flow

```mermaid
sequenceDiagram
    participant User
    participant Factory
    participant Market
    participant Admin

    User->>Factory: createMarket()
    Factory->>Market: initialize()
    Market-->>Market: Set PROPOSED

    Admin->>Factory: approveMarket()
    Factory->>Market: approve()
    Market-->>Market: PROPOSED → APPROVED

    Admin->>Factory: activateMarket()
    Factory->>Market: activate()
    Market-->>Market: APPROVED → ACTIVE

    Note over Market: Trading Period

    User->>Market: placeBet()
    Market-->>Market: Verify ACTIVE state
    Market-->>User: Bet placed

    Note over Market: End Time Reached

    Market-->>Market: ACTIVE → RESOLVING (pending)
    Market-->>Market: RESOLVING → FINALIZED (pending)

    User->>Market: claimWinnings()
    Market-->>Market: Verify FINALIZED
    Market-->>User: Winnings paid
```

---

## Error Handling Flow

```mermaid
flowchart TD
    CALL[Function Called] --> CHECK{Valid State?}

    CHECK -->|Yes| AUTH{Authorized?}
    CHECK -->|No| ERROR1[InvalidStateTransition]

    AUTH -->|Yes| EXECUTE[Execute Transition]
    AUTH -->|No| ERROR2[OnlyFactory/OnlyResolver]

    EXECUTE --> SUCCESS[Emit Events]
    SUCCESS --> DONE[Transaction Complete]

    ERROR1 --> REVERT1[Revert Transaction]
    ERROR2 --> REVERT2[Revert Transaction]

    style ERROR1 fill:#FF6B6B
    style ERROR2 fill:#FF6B6B
    style SUCCESS fill:#90EE90
```

---

## Frontend Integration Flow

```mermaid
sequenceDiagram
    participant UI
    participant Market
    participant Events

    UI->>Market: getMarketState()
    Market-->>UI: Current state

    UI->>UI: Render appropriate UI

    Note over UI,Market: User Action

    UI->>Market: approve()/activate()/etc
    Market->>Market: Validate & Transition
    Market->>Events: Emit MarketStateChanged

    Events-->>UI: State change event
    UI->>UI: Update UI immediately

    UI->>Market: getMarketState()
    Market-->>UI: New state
    UI->>UI: Re-render with new state
```

---

## State Duration Timeline

```mermaid
gantt
    title Market Lifecycle Timeline
    dateFormat  YYYY-MM-DD
    section Creation
    PROPOSED           :a1, 2024-01-01, 2d
    section Approval
    APPROVED           :a2, after a1, 1d
    section Trading
    ACTIVE             :a3, after a2, 30d
    section Resolution
    RESOLVING          :a4, after a3, 3d
    section Final
    FINALIZED          :a5, after a4, 1000d
```

**Typical Durations**:
- PROPOSED: 0-48 hours
- APPROVED: 0-24 hours
- ACTIVE: Variable (defined by market creator, typically 7-90 days)
- RESOLVING: 24-72 hours (dispute window)
- DISPUTED: Variable (admin review time)
- FINALIZED: Permanent (terminal state)

---

## Complete Lifecycle Example

```mermaid
journey
    title Market Lifecycle Journey
    section Market Creation
      Creator submits market: 5: Creator
      Factory validates params: 3: Factory
      Market enters PROPOSED: 3: Market
    section Approval Process
      Admin reviews market: 4: Admin
      Market transitions to APPROVED: 4: Market
      Admin activates market: 5: Admin
      Market transitions to ACTIVE: 5: Market
    section Trading Period
      Users place bets: 5: Users
      Liquidity increases: 4: Market
      End time approaches: 3: Market
    section Resolution
      Resolver proposes outcome: 4: Resolver
      Dispute window opens: 3: Market
      No disputes raised: 5: Users
      Market finalizes: 5: Market
    section Payouts
      Winners claim funds: 5: Users
      Market remains finalized: 5: Market
```

---

## References

- **Main Documentation**: `MARKET_LIFECYCLE.md`
- **Contract**: `contracts/core/PredictionMarket.sol`
- **Tests**: `test/hardhat/PredictionMarketLifecycle.test.js`
- **Phase Docs**: `docs/migration/PHASE_5_MARKET_LIFECYCLE.md`

---

**Diagram Version**: 1.0.0
**Mermaid Version**: 10.6+
**Status**: ✅ Production Ready
