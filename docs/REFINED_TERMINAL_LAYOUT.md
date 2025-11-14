# KEKTECH TRADING TERMINAL - REFINED LAYOUT (Based on Screenshots)

**Created**: 2025-11-14
**Source**: Reference screenshots from crypto token tracker interfaces
**Status**: Final specification based on real examples

---

## 🎯 LAYOUT INSPIRATION ANALYSIS

### Screenshots Reference
1. **Trendig/GMGN Style** - Multi-panel with social tracker
2. **Token Pump Interface** - Card grid by lifecycle stage
3. **Clean 3-column design** - Visual cards with mini charts

### Key Design Elements Identified
- ✅ **Card-based layout** (not table-first)
- ✅ **Visual token/market icons** (avatars, images)
- ✅ **Mini charts embedded** in cards
- ✅ **3-column status segregation** (New → Active → Graduated)
- ✅ **Compact metrics** (%, volume, counts)
- ✅ **Social integration** (Twitter feed at bottom)
- ✅ **Filter tabs** at top
- ✅ **Dark theme optimized**

---

## 📐 FINAL 3-COLUMN LAYOUT SPECIFICATION

```
┌──────────────────────────────────────────────────────────────────────────┐
│ HEADER (h-16, sticky top)                                               │
│ 🎲 KEKTECH | [🔥 TRADING] [📊 PROPOSALS] [⚖️ RESOLUTIONS] | 🔍 | 👤    │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ FILTER BAR (h-12, bg-terminal-bg-secondary)                          │
│ [All Chains ▼] [Category: All ▼] [Sort: Volume ▼] [Time: 24h ▼]      │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────────┬───────────────────────┬──────────────────────────┐
│ LEFT COLUMN      │ CENTER COLUMN         │ RIGHT COLUMN             │
│ (w-96, 384px)    │ (flex-1, min-640px)   │ (w-96, 384px)            │
│                  │                       │                          │
│ 🔥 HOT MARKETS   │ ⚡ ACTIVE MARKETS     │ 💬 SOCIAL FEED           │
│ (or PROPOSED)    │ (MAIN FOCUS)          │ (or COMMENTS)            │
│                  │                       │                          │
│ ┌──────────────┐ │ ┌───────────────────┐ │ ┌──────────────────────┐ │
│ │ [IMG] Market │ │ │ [IMG] Featured    │ │ │ @user commented:     │ │
│ │ Question     │ │ │ Market            │ │ │ "I think YES be..."  │ │
│ │              │ │ │                   │ │ │ ❤️ 234  💬 45  5m    │ │
│ │ 65%  35%     │ │ │ 📊 Mini Chart     │ │ └──────────────────────┘ │
│ │ 🟢 🔴        │ │ │                   │ │                          │
│ │ $120K vol    │ │ │ 65% YES  35% NO   │ │ ┌──────────────────────┐ │
│ │ ⏰ 2d left   │ │ │ ▓▓▓▓▓▓▓░░░        │ │ │ @alice bet $500 YES  │ │
│ └──────────────┘ │ │                   │ │ │ on Bitcoin >$100k    │ │
│                  │ │ Vol: $450K        │ │ │ 12m ago              │ │
│ ┌──────────────┐ │ │ Liq: $180K        │ │ └──────────────────────┘ │
│ │ [IMG] ETH    │ │ │                   │ │                          │
│ │ >$5k by EOY? │ │ │ [PLACE BET]       │ │ ┌──────────────────────┐ │
│ │              │ │ └───────────────────┘ │ │ 🔔 New market created│ │
│ │ 42%  58%     │ │                       │ │ "Trump wins 2024?"   │ │
│ │ $45K vol     │ │ ┌───────────────────┐ │ │ 15m ago              │ │
│ └──────────────┘ │ │ [IMG] Market #2   │ │ └──────────────────────┘ │
│                  │ │ Title             │ │                          │
│ ┌──────────────┐ │ │ 51% 49%          │ │ 📊 STATS                 │
│ │ [IMG] Trump  │ │ │ $89K vol         │ │ ────────────────────     │
│ │ 2024?        │ │ └───────────────────┘ │ 🔥 24h Volume: $1.2M     │
│ │              │ │                       │ 📈 Active Markets: 42    │
│ │ 51%  49%     │ │ ┌───────────────────┐ │ 👥 Active Traders: 1.2K  │
│ │ +0.3%        │ │ │ [IMG] Market #3   │ │                          │
│ └──────────────┘ │ │ Title             │ │ 🏆 TOP TRADER            │
│                  │ │ 33% 67%          │ │ @whale +$45K (30d)       │
│ [Show 10 more]   │ │ $234K vol        │ │                          │
│                  │ └───────────────────┘ │ [View Leaderboard]       │
│                  │                       │                          │
│                  │ [Load More Markets]   │                          │
└──────────────────┴───────────────────────┴──────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ BOTTOM BAR (h-10, bg-terminal-bg-tertiary)                            │
│ 🐦 Twitter Tracker | 🔔 Notifications (3) | 📡 Live | 💰 $141.76       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎴 MARKET CARD DESIGN (Compact)

```tsx
<Card className="group hover:border-kek-green transition-all cursor-pointer">
  {/* Header */}
  <CardHeader className="pb-2">
    <div className="flex items-start gap-3">
      {/* Market Icon/Image */}
      <div className="relative">
        <img
          src={iconUrl}
          className="w-12 h-12 rounded-lg border-2 border-terminal-border"
        />
        {/* Status badge */}
        <Badge className="absolute -top-1 -right-1 text-xs">
          ACTIVE
        </Badge>
      </div>

      {/* Title + Creator */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm line-clamp-2">
          Will Bitcoin reach $100k by EOY?
        </h3>
        <p className="text-xs text-muted-foreground">
          @creator · 2d ago
        </p>
      </div>
    </div>
  </CardHeader>

  {/* Odds Display */}
  <CardContent className="pb-2">
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-terminal-green">YES 65%</span>
          <span className="text-terminal-red">NO 35%</span>
        </div>
        {/* Progress bar */}
        <div className="h-2 bg-terminal-bg-tertiary rounded-full overflow-hidden flex">
          <div className="bg-terminal-green" style={{width: '65%'}} />
          <div className="bg-terminal-red" style={{width: '35%'}} />
        </div>
      </div>
    </div>

    {/* Mini Chart (Optional for active markets) */}
    <div className="h-12 mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={miniChartData}>
          <Area
            dataKey="yes"
            stroke="var(--color-terminal-green)"
            fill="var(--color-terminal-green)"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>

    {/* Metrics */}
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div>
        <p className="text-muted-foreground">Volume</p>
        <p className="font-semibold tabular-nums">$120K</p>
      </div>
      <div>
        <p className="text-muted-foreground">Liquidity</p>
        <p className="font-semibold tabular-nums">$45K</p>
      </div>
      <div>
        <p className="text-muted-foreground">Bets</p>
        <p className="font-semibold tabular-nums">234</p>
      </div>
    </div>
  </CardContent>

  {/* Footer */}
  <CardFooter className="pt-2">
    <div className="flex items-center justify-between w-full text-xs">
      <span className="text-muted-foreground flex items-center gap-1">
        ⏰ 2d remaining
      </span>
      <Button size="sm" variant="outline" className="h-7">
        Bet Now →
      </Button>
    </div>
  </CardFooter>
</Card>
```

**Card Dimensions**:
- Width: Fills column (384px in sidebar, flexible in center)
- Height: ~220px (with mini chart) or ~180px (without)
- Padding: p-4
- Gap between cards: gap-3

---

## 🎨 COLOR CODING

### Market Status Colors
```tsx
// Badges
PROPOSED → bg-yellow-600 text-white
ACTIVE → bg-green-600 text-white
CLOSING → bg-orange-600 text-white
RESOLVING → bg-purple-600 text-white
FINALIZED → bg-gray-600 text-white

// Odds bars
YES → bg-terminal-green (#3fb950)
NO → bg-terminal-red (#f85149)

// Trend indicators
UP → text-terminal-green ↑
DOWN → text-terminal-red ↓
NEUTRAL → text-muted-foreground —
```

---

## 🔀 DYNAMIC TAB BEHAVIOR

### Tab 1: 🔥 TRADING (Default)

**LEFT**: Hot Markets
- Top 10 by volume (24h)
- Sorted by activity
- Compact cards

**CENTER**: Active Markets Grid
- Featured market (large) at top
- 2-column grid below (md:grid-cols-2)
- All active markets

**RIGHT**: Social Feed
- Recent comments
- Recent bets
- New market announcements
- Live stats widget

---

### Tab 2: 📊 PROPOSALS

**LEFT**: Proposal Categories
- By type (New Market, Rule Change, Parameter Update)
- By urgency
- Filter by status

**CENTER**: Proposal Details
- Full proposal card
- Voting interface
- Discussion threads
- Vote history

**RIGHT**: Community Votes
- Top voters
- Voting stats
- Recent votes
- Admin actions

---

### Tab 3: ⚖️ RESOLUTIONS

**LEFT**: Markets in Dispute
- Resolving markets
- Disputed outcomes
- Evidence submissions
- Filter by confidence level

**CENTER**: Resolution Panel
- Market evidence
- Community votes (Agree/Disagree)
- Vote distribution
- Admin override controls

**RIGHT**: Resolution Activity
- Recent votes
- Dispute comments
- Resolution timeline
- Admin decisions

---

## 📱 RESPONSIVE BEHAVIOR

### Desktop (≥1200px)
```
[384px Left] [━━━ Flex Center ━━━] [384px Right]
```

### Tablet (768-1199px)
```
[280px Left] [━━━ Flex Center + Right stacked ━━━]
```
- Right column moves below center
- Left sidebar becomes collapsible drawer

### Mobile (<768px)
```
[Single Column]
Bottom Nav: [Markets] [Feed] [Social]
```
- Full-screen views
- Tab navigation at bottom
- Swipe between sections

---

## 🎭 INTERACTION PATTERNS

### Card Interactions
```tsx
// Hover
className="group hover:border-kek-green hover:shadow-lg transition-all"

// Click
onClick={() => router.push(`/market/${address}`)}

// Quick Actions
<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100">
  <Button size="sm" variant="ghost">
    <Star className="h-4 w-4" /> {/* Watchlist */}
  </Button>
</div>
```

### Loading States
```tsx
// Skeleton cards while loading
{isLoading && (
  <Card className="animate-pulse">
    <div className="h-12 bg-terminal-bg-tertiary rounded" />
    <div className="h-24 bg-terminal-bg-tertiary rounded mt-2" />
  </Card>
)}
```

### Real-Time Updates
```tsx
// Smooth odds updates (WebSocket)
useEffect(() => {
  ws.onmessage = (event) => {
    const { marketAddress, yesOdds, noOdds } = JSON.parse(event.data)

    // Update specific card
    setMarkets(prev => prev.map(m =>
      m.address === marketAddress
        ? { ...m, yesOdds, noOdds }
        : m
    ))
  }
}, [])

// Animate percentage changes
<AnimatedNumber value={yesOdds} duration={500} />
```

---

## 🔧 COMPONENT HIERARCHY

```
TerminalLayout
├─ TerminalHeader
│  ├─ Logo
│  ├─ TabNavigation (Trading/Proposals/Resolutions)
│  ├─ SearchBar
│  └─ WalletButton
│
├─ FilterBar
│  ├─ ChainSelector
│  ├─ CategoryFilter
│  ├─ SortDropdown
│  └─ TimeRangeSelector
│
├─ ThreeColumnLayout
│  ├─ LeftColumn (Hot Markets)
│  │  ├─ SectionHeader
│  │  ├─ MarketCard[] (compact)
│  │  └─ ShowMoreButton
│  │
│  ├─ CenterColumn (Main Focus)
│  │  ├─ FeaturedMarketCard (large)
│  │  ├─ MarketGrid
│  │  │  └─ MarketCard[] (medium)
│  │  └─ LoadMoreButton
│  │
│  └─ RightColumn (Social)
│     ├─ CommentCard[]
│     ├─ ActivityCard[]
│     ├─ StatsWidget
│     └─ LeaderboardWidget
│
└─ BottomBar
   ├─ TwitterTracker
   ├─ NotificationBadge
   ├─ LiveIndicator
   └─ PortfolioValue
```

---

## 🎯 IMPLEMENTATION PRIORITY

### Week 1: Core Layout
- [ ] TerminalLayout with 3-column grid
- [ ] TerminalHeader with tab navigation
- [ ] FilterBar with dropdowns
- [ ] Empty state placeholders

### Week 2: Market Cards
- [ ] MarketCard component (3 sizes: compact, medium, large)
- [ ] Mini chart integration (Recharts)
- [ ] Card grid responsive
- [ ] Card interactions (hover, click)

### Week 3: Data Integration
- [ ] Connect to real market data
- [ ] WebSocket real-time updates
- [ ] Loading skeletons
- [ ] Error boundaries

### Week 4: Social Column
- [ ] CommentCard component
- [ ] ActivityFeed component
- [ ] StatsWidget
- [ ] LeaderboardWidget

### Week 5: Tab Switching
- [ ] Proposals view layout
- [ ] Resolutions view layout
- [ ] Smooth tab transitions
- [ ] Polish & animations

---

## 📋 SUCCESS CRITERIA

- [ ] All 3 columns visible on desktop (≥1200px)
- [ ] Tab switching changes content in all 3 columns
- [ ] Cards display real market data
- [ ] Mini charts show odds history
- [ ] WebSocket updates animate smoothly
- [ ] Mobile responsive (single column + bottom nav)
- [ ] Load time < 2s
- [ ] Lighthouse Performance ≥ 90

---

**This is your final specification based on real crypto trading interfaces! Ready to implement.** 🚀
